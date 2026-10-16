import io
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
import numpy as np
import pandas as pd

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.schemas.weather import (
    WeatherRecord,
    WeatherFilterParams,
    PaginatedWeatherResponse,
    WeatherSummaryResponse,
    MetricSummary,
)
from backend.app.schemas.anomaly import (
    AnomalyRecord,
    PaginatedAnomalyResponse,
    AnomalyAnalyticsResponse,
    AnomalyScoreBucket,
)


class WeatherService:
    def __init__(self):
        self._df: Optional[pd.DataFrame] = None
        self._clean_df: Optional[pd.DataFrame] = None
        self._live_records: List[Dict[str, Any]] = []
        self.load_data()

    def load_data(self):
        """Loads and pre-processes predictions and clean datasets."""
        try:
            if settings.PREDICTIONS_PATH.exists():
                df = pd.read_csv(settings.PREDICTIONS_PATH)
                df["time"] = pd.to_datetime(df["time"])
                df = df.sort_values("time").reset_index(drop=True)
                
                # Standardize status label to 'Potential Anomaly' and 'Normal'
                df["status"] = df["prediction"].map({
                    1: "Normal",
                    -1: "Potential Anomaly"
                })

                # Compute severity for anomalies
                def calc_severity(row):
                    if row["prediction"] == 1:
                        return "Normal"
                    score = row["anomaly_score"]
                    if score < -0.05:
                        return "Severe"
                    elif score < -0.02:
                        return "Moderate"
                    else:
                        return "Mild"

                df["severity"] = df.apply(calc_severity, axis=1)
                self._df = df
                logger.info(f"Loaded {len(df)} prediction records from {settings.PREDICTIONS_PATH}")
            else:
                logger.warning(f"Prediction file not found at {settings.PREDICTIONS_PATH}")

            if settings.CLEAN_DATA_PATH.exists():
                clean_df = pd.read_csv(settings.CLEAN_DATA_PATH)
                clean_df["time"] = pd.to_datetime(clean_df["time"])
                self._clean_df = clean_df
                logger.info(f"Loaded {len(clean_df)} clean historical records.")
        except Exception as e:
            logger.error(f"Error loading weather datasets: {e}")

    @property
    def df(self) -> pd.DataFrame:
        if self._df is None:
            self.load_data()
        if self._df is None:
            raise RuntimeError("Weather prediction dataset is not available.")
        return self._df

    def ingest_live_record(
        self,
        time_str: str,
        temp: float,
        rhum: float,
        temp_change: float,
        humidity_change: float,
        hour: int,
        month: int,
        prediction: int,
        anomaly_score: float,
        status: str,
        location: str = "Live Feed",
    ) -> Dict[str, Any]:
        """Dynamically ingests a live weather reading and model prediction into the dataset."""
        dt = pd.to_datetime(time_str)

        # Severity
        if prediction == 1:
            severity = "Normal"
        elif anomaly_score < -0.05:
            severity = "Severe"
        elif anomaly_score < -0.02:
            severity = "Moderate"
        else:
            severity = "Mild"

        new_row = {
            "time": dt,
            "temp": temp,
            "rhum": rhum,
            "temp_change": temp_change,
            "humidity_change": humidity_change,
            "hour": hour,
            "month": month,
            "prediction": prediction,
            "anomaly_score": anomaly_score,
            "status": status,
            "severity": severity,
            "station": 2956,
            "location": location,
        }

        self._live_records.append(new_row)
        new_row_df = pd.DataFrame([new_row])

        # Prepend so the latest live reading appears at the top of recent queries
        self._df = pd.concat([new_row_df, self._df], ignore_index=True)
        logger.info(f"Dynamically ingested live record for {location} at {time_str} (Score: {anomaly_score:.4f}, Status: {status})")

        return {
            "total_records": len(self._df),
            "live_records_count": len(self._live_records),
            "ingested_record": {
                "time": str(dt),
                "location": location,
                "temp": temp,
                "rhum": rhum,
                "temp_change": temp_change,
                "humidity_change": humidity_change,
                "status": status,
                "anomaly_score": anomaly_score,
                "severity": severity,
            }
        }

    def clear_live_records(self) -> int:
        """Resets the dataset back to purely historical records."""
        cleared_count = len(self._live_records)
        self._live_records = []
        self.load_data()
        logger.info(f"Cleared {cleared_count} live records from active dataset.")
        return cleared_count

    @property
    def live_count(self) -> int:
        return len(self._live_records)

    def _filter_dataframe(
        self,
        df: pd.DataFrame,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        status: Optional[str] = None,
        min_temp: Optional[float] = None,
        max_temp: Optional[float] = None,
        search: Optional[str] = None,
    ) -> pd.DataFrame:
        filtered = df.copy()

        if start_date:
            try:
                start_dt = pd.to_datetime(start_date)
                filtered = filtered[filtered["time"] >= start_dt]
            except Exception:
                pass

        if end_date:
            try:
                end_dt = pd.to_datetime(end_date)
                # include whole day if date without time
                if " " not in end_date and "T" not in end_date:
                    end_dt = end_dt + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)
                filtered = filtered[filtered["time"] <= end_dt]
            except Exception:
                pass

        if status and status.lower() not in ["all", ""]:
            target_status = status.strip().lower()
            if target_status in ["anomaly", "potential anomaly"]:
                filtered = filtered[filtered["prediction"] == -1]
            elif target_status in ["normal"]:
                filtered = filtered[filtered["prediction"] == 1]

        if min_temp is not None:
            filtered = filtered[filtered["temp"] >= min_temp]

        if max_temp is not None:
            filtered = filtered[filtered["temp"] <= max_temp]

        if search:
            search_str = search.strip().lower()
            # Match date substring or status
            mask = (
                filtered["time"].astype(str).str.lower().str.contains(search_str)
                | filtered["status"].str.lower().str.contains(search_str)
            )
            filtered = filtered[mask]

        return filtered

    def get_summary(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> WeatherSummaryResponse:
        filtered = self._filter_dataframe(self.df, start_date=start_date, end_date=end_date)
        total = len(filtered)
        if total == 0:
            empty_metric = MetricSummary(count=0, missing_count=0)
            return WeatherSummaryResponse(
                total_records=0,
                normal_count=0,
                anomaly_count=0,
                anomaly_percentage=0.0,
                earliest_timestamp=None,
                latest_timestamp=None,
                temperature_summary=empty_metric,
                humidity_summary=empty_metric,
                data_freshness=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            )

        normal_count = int((filtered["prediction"] == 1).sum())
        anomaly_count = int((filtered["prediction"] == -1).sum())
        anomaly_pct = round((anomaly_count / total) * 100, 2) if total > 0 else 0.0

        temp_series = filtered["temp"].dropna()
        temp_summary = MetricSummary(
            min=round(float(temp_series.min()), 2) if not temp_series.empty else None,
            max=round(float(temp_series.max()), 2) if not temp_series.empty else None,
            mean=round(float(temp_series.mean()), 2) if not temp_series.empty else None,
            median=round(float(temp_series.median()), 2) if not temp_series.empty else None,
            std=round(float(temp_series.std()), 2) if not temp_series.empty else None,
            count=len(temp_series),
            missing_count=int(filtered["temp"].isna().sum()),
        )

        rhum_series = filtered["rhum"].dropna()
        rhum_summary = MetricSummary(
            min=round(float(rhum_series.min()), 2) if not rhum_series.empty else None,
            max=round(float(rhum_series.max()), 2) if not rhum_series.empty else None,
            mean=round(float(rhum_series.mean()), 2) if not rhum_series.empty else None,
            median=round(float(rhum_series.median()), 2) if not rhum_series.empty else None,
            std=round(float(rhum_series.std()), 2) if not rhum_series.empty else None,
            count=len(rhum_series),
            missing_count=int(filtered["rhum"].isna().sum()),
        )

        earliest = str(filtered["time"].min())
        latest = str(filtered["time"].max())

        return WeatherSummaryResponse(
            total_records=total,
            normal_count=normal_count,
            anomaly_count=anomaly_count,
            anomaly_percentage=anomaly_pct,
            earliest_timestamp=earliest,
            latest_timestamp=latest,
            temperature_summary=temp_summary,
            humidity_summary=rhum_summary,
            data_freshness=f"Station 02956 Dataset (Up to {latest})",
        )

    def get_weather_records(self, params: WeatherFilterParams) -> PaginatedWeatherResponse:
        filtered = self._filter_dataframe(
            self.df,
            start_date=params.start_date,
            end_date=params.end_date,
            status=params.status,
            min_temp=params.min_temp,
            max_temp=params.max_temp,
            search=params.search,
        )

        # Sorting
        sort_col = params.sort_by if params.sort_by in filtered.columns else "time"
        ascending = params.sort_dir.lower() == "asc"
        filtered = filtered.sort_values(by=sort_col, ascending=ascending)

        total = len(filtered)
        limit = max(1, min(params.limit, 1000))
        total_pages = max(1, (total + limit - 1) // limit)
        page = max(1, min(params.page, total_pages)) if total > 0 else 1

        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        page_df = filtered.iloc[start_idx:end_idx]

        items = []
        for _, row in page_df.iterrows():
            items.append(
                WeatherRecord(
                    time=str(row["time"]),
                    station=int(row["station"]) if "station" in row and pd.notna(row["station"]) else 2956,
                    temp=round(float(row["temp"]), 2) if pd.notna(row["temp"]) else None,
                    rhum=round(float(row["rhum"]), 2) if pd.notna(row["rhum"]) else None,
                    temp_change=round(float(row["temp_change"]), 2) if pd.notna(row["temp_change"]) else None,
                    humidity_change=round(float(row["humidity_change"]), 2) if pd.notna(row["humidity_change"]) else None,
                    hour=int(row["hour"]) if pd.notna(row["hour"]) else None,
                    month=int(row["month"]) if pd.notna(row["month"]) else None,
                    prediction=int(row["prediction"]) if pd.notna(row["prediction"]) else None,
                    anomaly_score=round(float(row["anomaly_score"]), 6) if pd.notna(row["anomaly_score"]) else None,
                    status=str(row["status"]),
                )
            )

        return PaginatedWeatherResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )

    def get_anomalies(self, params: WeatherFilterParams) -> PaginatedAnomalyResponse:
        anomaly_df = self.df[self.df["prediction"] == -1].copy()
        filtered = self._filter_dataframe(
            anomaly_df,
            start_date=params.start_date,
            end_date=params.end_date,
            min_temp=params.min_temp,
            max_temp=params.max_temp,
            search=params.search,
        )

        # Sorting: default sort by anomaly_score ascending (most anomalous first)
        sort_col = params.sort_by if params.sort_by in filtered.columns else "anomaly_score"
        ascending = params.sort_dir.lower() == "asc"
        filtered = filtered.sort_values(by=sort_col, ascending=ascending)

        total = len(filtered)
        limit = max(1, min(params.limit, 1000))
        total_pages = max(1, (total + limit - 1) // limit)
        page = max(1, min(params.page, total_pages)) if total > 0 else 1

        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        page_df = filtered.iloc[start_idx:end_idx]

        items = []
        for _, row in page_df.iterrows():
            items.append(
                AnomalyRecord(
                    time=str(row["time"]),
                    temp=round(float(row["temp"]), 2) if pd.notna(row["temp"]) else None,
                    rhum=round(float(row["rhum"]), 2) if pd.notna(row["rhum"]) else None,
                    temp_change=round(float(row["temp_change"]), 2) if pd.notna(row["temp_change"]) else None,
                    humidity_change=round(float(row["humidity_change"]), 2) if pd.notna(row["humidity_change"]) else None,
                    hour=int(row["hour"]) if pd.notna(row["hour"]) else None,
                    month=int(row["month"]) if pd.notna(row["month"]) else None,
                    prediction=-1,
                    anomaly_score=round(float(row["anomaly_score"]), 6),
                    status="Potential Anomaly",
                    severity=str(row["severity"]),
                )
            )

        return PaginatedAnomalyResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )

    def get_analytics(self) -> AnomalyAnalyticsResponse:
        df = self.df
        anomaly_df = df[df["prediction"] == -1]

        total_records = len(df)
        total_anomalies = len(anomaly_df)
        anomaly_rate = round((total_anomalies / total_records) * 100, 2) if total_records > 0 else 0.0

        scores = df["anomaly_score"].values
        min_score = round(float(np.min(scores)), 6)
        max_score = round(float(np.max(scores)), 6)
        mean_score = round(float(np.mean(scores)), 6)
        std_score = round(float(np.std(scores)), 6)

        # Histogram distribution with 16 buckets across the full score range
        counts, bin_edges = np.histogram(scores, bins=16)
        distribution = []
        for i in range(len(counts)):
            b_min = round(float(bin_edges[i]), 4)
            b_max = round(float(bin_edges[i + 1]), 4)
            distribution.append(
                AnomalyScoreBucket(
                    bucket_min=b_min,
                    bucket_max=b_max,
                    count=int(counts[i]),
                    label=f"{b_min:.3f} to {b_max:.3f}",
                )
            )

        # Anomalies by month
        month_names = {
            1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
            7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
        }
        monthly_anomalies = []
        month_group = df.groupby("month")
        for m, group in month_group:
            m_anom = int((group["prediction"] == -1).sum())
            m_norm = int((group["prediction"] == 1).sum())
            m_tot = len(group)
            monthly_anomalies.append({
                "month": int(m),
                "month_name": month_names.get(int(m), str(m)),
                "anomalies": m_anom,
                "normal": m_norm,
                "total": m_tot,
                "rate": round((m_anom / m_tot) * 100, 2) if m_tot > 0 else 0.0,
            })

        # Anomalies by hour
        hourly_anomalies = []
        hour_group = df.groupby("hour")
        for h, group in hour_group:
            h_anom = int((group["prediction"] == -1).sum())
            h_norm = int((group["prediction"] == 1).sum())
            h_tot = len(group)
            hourly_anomalies.append({
                "hour": int(h),
                "hour_label": f"{int(h):02d}:00",
                "anomalies": h_anom,
                "normal": h_norm,
                "total": h_tot,
                "rate": round((h_anom / h_tot) * 100, 2) if h_tot > 0 else 0.0,
            })

        # Severity breakdown
        severities = anomaly_df["severity"].value_counts().to_dict()
        severity_dict = {
            "Severe": int(severities.get("Severe", 0)),
            "Moderate": int(severities.get("Moderate", 0)),
            "Mild": int(severities.get("Mild", 0)),
        }

        return AnomalyAnalyticsResponse(
            total_anomalies=total_anomalies,
            total_records=total_records,
            anomaly_rate=anomaly_rate,
            min_score=min_score,
            max_score=max_score,
            mean_score=mean_score,
            std_score=std_score,
            score_distribution=distribution,
            anomalies_by_month=monthly_anomalies,
            anomalies_by_hour=hourly_anomalies,
            anomalies_by_severity=severity_dict,
        )

    def export_filtered_csv(self, params: WeatherFilterParams) -> Tuple[str, str]:
        """Returns CSV string content and suggested filename."""
        filtered = self._filter_dataframe(
            self.df,
            start_date=params.start_date,
            end_date=params.end_date,
            status=params.status,
            min_temp=params.min_temp,
            max_temp=params.max_temp,
            search=params.search,
        )
        sort_col = params.sort_by if params.sort_by in filtered.columns else "time"
        ascending = params.sort_dir.lower() == "asc"
        filtered = filtered.sort_values(by=sort_col, ascending=ascending)

        csv_buffer = io.StringIO()
        filtered.to_csv(csv_buffer, index=False)
        filename = f"weatherguard_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return csv_buffer.getvalue(), filename


weather_service = WeatherService()
