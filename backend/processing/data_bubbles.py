"""
OceanMind — Data Bubbles (Phase A)
Spatiotemporal fusion abstraction.
Maps incoming observations to unified bubble_ids in PostGIS.
Adaptive radius: 5km coastal / 50km open ocean.
"""
from datetime import timedelta
import pandas as pd
from sqlalchemy import text
from loguru import logger
from backend.db.connection import get_raw_conn

class DataBubbleManager:
    def __init__(self):
        # We define a rough threshold: distance to coast.
        # For simplicity in MVP, we might just use a standard radius
        # or determine coastal vs open ocean based on depth/location.
        self.coastal_radius_km = 5.0
        self.open_ocean_radius_km = 50.0
        self.time_window_hours = 24  # 1 day window

    def assign_bubbles(self, df: pd.DataFrame, table_name: str) -> pd.DataFrame:
        """
        Assigns bubble_ids to a DataFrame of observations.
        Requires 'latitude', 'longitude', and 'datetime' (or 'composite_date') columns.
        If a suitable bubble doesn't exist, it creates one.
        """
        if df.empty:
            return df
            
        logger.info(f"Assigning bubbles for {len(df)} records destined for {table_name}.")
        
        # We will iterate and assign. In production, this would be a bulk PostGIS operation.
        assigned_df = df.copy()
        
        time_col = "datetime" if "datetime" in assigned_df.columns else "composite_date"
        if time_col not in assigned_df.columns:
            logger.error("No valid time column found for bubble assignment.")
            return assigned_df

        # Ensure datetime type
        assigned_df[time_col] = pd.to_datetime(assigned_df[time_col])
        assigned_df["bubble_id"] = None

        with get_raw_conn() as conn:
            cursor = conn.cursor()
            
            for idx, row in assigned_df.iterrows():
                lat = float(row["latitude"])
                lon = float(row["longitude"])
                obs_time = row[time_col]
                
                # Determine radius (simplification: if depth is known and > 200m, open ocean)
                # For MVP, let's assume 50km if far from Indian coast, 5km if near.
                # Just using 50km default for the hackathon demo if unspecified.
                radius = self.open_ocean_radius_km
                
                # Query to find existing bubble
                find_bubble_sql = """
                    SELECT bubble_id
                    FROM data_bubbles
                    WHERE ST_DWithin(
                        geom::geography,
                        ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                        radius_km * 1000
                    )
                    AND %s BETWEEN time_window_start AND time_window_end
                    LIMIT 1;
                """
                cursor.execute(find_bubble_sql, (lon, lat, obs_time))
                result = cursor.fetchone()
                
                if result:
                    bubble_id = result["bubble_id"]
                else:
                    # Create new bubble
                    t_start = obs_time - timedelta(hours=self.time_window_hours / 2)
                    t_end = obs_time + timedelta(hours=self.time_window_hours / 2)
                    
                    insert_bubble_sql = """
                        INSERT INTO data_bubbles (geom, radius_km, time_window_start, time_window_end)
                        VALUES (ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, %s)
                        RETURNING bubble_id;
                    """
                    cursor.execute(insert_bubble_sql, (lon, lat, radius, t_start, t_end))
                    bubble_id = cursor.fetchone()["bubble_id"]
                    
                assigned_df.at[idx, "bubble_id"] = bubble_id

            conn.commit()
            
        logger.info("Bubble assignment complete.")
        return assigned_df
