"""
OceanMind — Streamlit Dashboard
AI-Driven Unified Marine Data Intelligence Platform
Biothon 2026 | Marwadi University, Dept. of Bioinformatics

Run: streamlit run frontend/app.py
     (API must be running at API_BASE_URL, default http://localhost:8000)
"""

import os
import json
from datetime import datetime

import requests
import pandas as pd
import numpy as np
import streamlit as st
import folium
from streamlit_folium import st_folium
import plotly.express as px
import plotly.graph_objects as go

# ── Config ─────────────────────────────────────────────────────────────────────
API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")
TIMEOUT  = 15  # seconds

st.set_page_config(
    page_title="OceanMind",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Helpers ────────────────────────────────────────────────────────────────────

def api_get(path: str, params: dict = None) -> dict | None:
    """GET request to the OceanMind API with graceful error handling."""
    try:
        r = requests.get(f"{API_BASE}{path}", params=params, timeout=TIMEOUT)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.ConnectionError:
        st.error(
            f"⚠️ Cannot reach the OceanMind API at **{API_BASE}**. "
            "Start it with: `uvicorn backend.main:app --reload`"
        )
        return None
    except requests.exceptions.HTTPError as e:
        st.error(f"API error {e.response.status_code}: {e.response.text[:200]}")
        return None
    except Exception as e:
        st.error(f"Unexpected error: {e}")
        return None


def api_post(path: str, payload: dict) -> dict | None:
    """POST request to the OceanMind API."""
    try:
        r = requests.post(f"{API_BASE}{path}", json=payload, timeout=TIMEOUT)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.ConnectionError:
        st.error(
            f"⚠️ Cannot reach the OceanMind API at **{API_BASE}**. "
            "Start it with: `uvicorn backend.main:app --reload`"
        )
        return None
    except requests.exceptions.HTTPError as e:
        st.error(f"API error {e.response.status_code}: {e.response.text[:200]}")
        return None
    except Exception as e:
        st.error(f"Unexpected error: {e}")
        return None


def mhi_color(score: float) -> str:
    if score < 25:  return "#d32f2f"   # critical — red
    if score < 50:  return "#f57c00"   # warning — orange
    if score < 65:  return "#fbc02d"   # watch — yellow
    return "#388e3c"                   # normal — green


def sfz_color(zone: str) -> str:
    return {"GREEN": "#2e7d32", "AMBER": "#f9a825", "RED": "#c62828"}.get(zone, "#9e9e9e")


def sfz_folium_color(zone: str) -> str:
    return {"GREEN": "green", "AMBER": "orange", "RED": "red"}.get(zone, "gray")


# ── Sidebar ────────────────────────────────────────────────────────────────────

with st.sidebar:
    st.image(
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Ocean_Planet_Mosaic.jpg/320px-Ocean_Planet_Mosaic.jpg",
        use_container_width=True,
    )
    st.title("🌊 OceanMind")
    st.caption("AI Marine Intelligence Platform")
    st.divider()

    page = st.radio(
        "Navigate",
        [
            "📊 Dashboard",
            "🌡️ Marine Health Index",
            "🎣 Sustainable Fishing Zones",
            "🐟 Migration Forecast",
            "🔬 Biodiversity & CV",
            "🌐 Digital Twin Scenarios",
            "💬 RAG Query Interface",
            "⛓️ Blockchain Traceability",
            "🔔 Alerts & Subscriptions",
        ],
        label_visibility="collapsed",
    )

    st.divider()
    health = api_get("/health")
    if health:
        st.markdown("**System Status**")
        db_col = "🟢" if health.get("db") == "ok" else "🟡"
        mhi_col = "🟢" if health.get("mhi_model") == "loaded" else "🔴"
        sfz_col = "🟢" if health.get("sfz_model") == "loaded" else "🔴"
        rag_col = "🟢" if health.get("rag") == "ready" else "🟡"
        st.caption(f"{db_col} PostGIS  |  {mhi_col} MHI  |  {sfz_col} SFZ")
        st.caption(f"{rag_col} RAG  |  ⛓️ {health.get('blockchain', '—')}")
        st.caption(f"_Updated {datetime.now().strftime('%H:%M:%S')}_")

# ══════════════════════════════════════════════════════════════════════════════
# PAGE: Dashboard
# ══════════════════════════════════════════════════════════════════════════════

if page == "📊 Dashboard":
    st.title("OceanMind — Marine Intelligence Dashboard")
    st.caption("AI-Driven Unified Marine Data Intelligence | Indian EEZ | Biothon 2026")

    col1, col2, col3, col4 = st.columns(4)

    # Quick stats from API
    mhi_data = api_get("/api/v1/mhi/status")
    sfz_data = api_get("/api/v1/sfz/current")
    chain    = api_get("/api/v1/trace/chain-summary")

    if mhi_data:
        alerts = mhi_data.get("alerts_active", 0)
        total  = mhi_data.get("total_cells", 0)
        col1.metric("🌡️ MHI Grid Cells", total, help="Active monitoring cells in Indian EEZ")
        col2.metric("🚨 Active MHI Alerts", alerts, delta=f"{alerts} cells stressed", delta_color="inverse")

    if sfz_data:
        summary = sfz_data.get("zone_summary", {})
        green   = summary.get("GREEN", 0)
        red     = summary.get("RED", 0)
        col3.metric("🟢 Green Zones", green, help="Recommended fishing zones this week")
        col4.metric("🔴 Red Zones", red, delta=f"avoid {red} zones", delta_color="inverse")

    st.divider()

    # Map overview (SFZ)
    st.subheader("🗺️ Indian EEZ Overview — Sustainable Fishing Zones")

    if sfz_data:
        geojson = sfz_data.get("geojson", {})
        features = geojson.get("features", [])

        if features:
            m = folium.Map(location=[15, 78], zoom_start=5, tiles="CartoDB dark_matter")

            for feat in features[:300]:  # cap for performance
                props = feat.get("properties", {})
                coords = feat.get("geometry", {}).get("coordinates", [0, 0])
                zone   = props.get("ecological_class", "AMBER")
                score  = props.get("bycatch_risk_score", 0.5)
                shap   = props.get("shap_top3", [])

                popup_html = (
                    f"<b>Zone:</b> {zone}<br>"
                    f"<b>Bycatch Risk:</b> {score:.2f}<br>"
                    f"<b>Top Drivers:</b> {', '.join(shap) if shap else '—'}"
                )

                folium.CircleMarker(
                    location=[coords[1], coords[0]],
                    radius=6,
                    color=sfz_folium_color(zone),
                    fill=True,
                    fill_opacity=0.65,
                    popup=folium.Popup(popup_html, max_width=220),
                    tooltip=f"{zone} | Risk: {score:.2f}",
                ).add_to(m)

            # Legend
            legend_html = """
            <div style="position:fixed;bottom:30px;left:30px;z-index:1000;
                        background:rgba(0,0,0,0.75);padding:12px;border-radius:8px;color:white;font-size:13px">
              <b>Fishing Zone</b><br>
              <span style="color:#4caf50">●</span> GREEN — Recommended<br>
              <span style="color:#ff9800">●</span> AMBER — Caution<br>
              <span style="color:#f44336">●</span> RED — Avoid
            </div>"""
            m.get_root().html.add_child(folium.Element(legend_html))

            st_folium(m, width=None, height=480, returned_objects=[])
        else:
            st.info("No SFZ data available from API.")

    # Zone distribution pie chart
    if sfz_data:
        st.subheader("Zone Distribution This Week")
        summary = sfz_data.get("zone_summary", {})
        if summary:
            pie_df = pd.DataFrame(
                {"Zone": list(summary.keys()), "Count": list(summary.values())}
            )
            fig = px.pie(
                pie_df,
                names="Zone",
                values="Count",
                color="Zone",
                color_discrete_map={"GREEN": "#388e3c", "AMBER": "#f9a825", "RED": "#c62828"},
                hole=0.4,
            )
            fig.update_layout(
                margin=dict(t=20, b=20, l=20, r=20),
                height=300,
                paper_bgcolor="rgba(0,0,0,0)",
                font_color="white",
            )
            c1, c2 = st.columns([1, 2])
            c1.plotly_chart(fig, use_container_width=True)
            c2.markdown(
                f"""
                | Zone   | Count | Action |
                |--------|-------|--------|
                | 🟢 GREEN | {summary.get('GREEN',0)} | Safe to fish |
                | 🟡 AMBER | {summary.get('AMBER',0)} | Fish with caution |
                | 🔴 RED   | {summary.get('RED',0)} | Avoid — overfished or heatwave |
                """
            )

    # Blockchain summary
    if chain:
        st.divider()
        st.subheader("⛓️ Catch Ledger")
        c1, c2, c3 = st.columns(3)
        c1.metric("Total Blocks", chain.get("total_blocks", 0))
        c2.metric("Catch Records", chain.get("total_catch_records", 0))
        c3.metric("Species Logged", len(chain.get("species_logged", [])))


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: Marine Health Index
# ══════════════════════════════════════════════════════════════════════════════

elif page == "🌡️ Marine Health Index":
    st.title("🌡️ Marine Health Index")
    st.markdown(
        "**Isolation Forest** anomaly detection across SST, Chlorophyll-a, "
        "Dissolved Oxygen, pH, and Salinity. Score 0–100 (lower = more stressed)."
    )

    col1, col2 = st.columns([1, 3])
    with col1:
        st.subheader("Parameters")
        lat_min = st.slider("Lat min", 0.0, 30.0, 5.0, 1.0)
        lat_max = st.slider("Lat max", 0.0, 30.0, 25.0, 1.0)
        lon_min = st.slider("Lon min", 50.0, 110.0, 60.0, 1.0)
        lon_max = st.slider("Lon max", 50.0, 110.0, 100.0, 1.0)
        run = st.button("🔄 Fetch MHI Grid", use_container_width=True)

    with col2:
        if run or "mhi_result" not in st.session_state:
            with st.spinner("Computing Marine Health Index..."):
                data = api_get(
                    "/api/v1/mhi/status",
                    params={"lat_min": lat_min, "lat_max": lat_max,
                            "lon_min": lon_min, "lon_max": lon_max},
                )
                if data:
                    st.session_state["mhi_result"] = data

        data = st.session_state.get("mhi_result")
        if data:
            cells = data.get("grid_cells", [])
            if cells:
                df = pd.DataFrame(cells)

                # Map
                m = folium.Map(location=[15, 78], zoom_start=5, tiles="CartoDB dark_matter")
                for _, row in df.iterrows():
                    color = mhi_color(row["mhi_score"])
                    popup = (
                        f"<b>MHI Score:</b> {row['mhi_score']:.1f}<br>"
                        f"<b>Stress:</b> {row['stress_level']}<br>"
                        f"<b>Alert:</b> {'⚠️ YES' if row['alert'] else 'No'}"
                    )
                    folium.CircleMarker(
                        location=[row["latitude"], row["longitude"]],
                        radius=7,
                        color=color,
                        fill=True,
                        fill_opacity=0.7,
                        popup=folium.Popup(popup, max_width=200),
                        tooltip=f"MHI {row['mhi_score']:.0f} | {row['stress_level']}",
                    ).add_to(m)

                st_folium(m, width=None, height=420, returned_objects=[])

                # Score distribution histogram
                fig = px.histogram(
                    df,
                    x="mhi_score",
                    color="stress_level",
                    nbins=20,
                    title="MHI Score Distribution",
                    color_discrete_map={
                        "CRITICAL": "#d32f2f",
                        "WARNING":  "#f57c00",
                        "WATCH":    "#fbc02d",
                        "NORMAL":   "#388e3c",
                    },
                )
                fig.update_layout(
                    height=300,
                    paper_bgcolor="rgba(0,0,0,0)",
                    font_color="white",
                    margin=dict(t=40, b=20),
                )
                st.plotly_chart(fig, use_container_width=True)

                # Alerts summary
                alerts_df = df[df["alert"] == True]
                if not alerts_df.empty:
                    st.warning(
                        f"⚠️ {len(alerts_df)} cells with active stress alerts. "
                        "Check zones highlighted in orange/red on the map."
                    )

    st.divider()
    st.subheader("Single-Point MHI Score")
    with st.form("mhi_single"):
        c1, c2, c3 = st.columns(3)
        sst   = c1.number_input("SST (°C)", 20.0, 35.0, 28.5, 0.1)
        chl   = c2.number_input("Chlorophyll (mg/L)", 0.01, 5.0, 0.3, 0.05)
        do2   = c3.number_input("Dissolved O₂ (µmol/kg)", 50.0, 350.0, 200.0, 5.0)
        c4, c5, c6 = st.columns(3)
        ph    = c4.number_input("pH", 7.5, 8.5, 8.1, 0.01)
        sal   = c5.number_input("Salinity (PSU)", 30.0, 40.0, 34.5, 0.1)
        submit = c6.form_submit_button("Compute Score")

    if submit:
        result = api_post("/api/v1/mhi/score", {
            "sst_c": sst, "chlorophyll_mgl": chl,
            "dissolved_o2": do2, "ph": ph, "salinity_psu": sal,
        })
        if result:
            score = result.get("mhi_score", 0)
            level = result.get("stress_level", "—")
            alert = result.get("alert", False)
            color = mhi_color(score)
            st.markdown(
                f"""
                <div style="background:{color};padding:20px;border-radius:10px;color:white;text-align:center">
                  <h2>MHI Score: {score:.1f} / 100</h2>
                  <h4>Stress Level: {level} {'⚠️' if alert else '✅'}</h4>
                </div>
                """,
                unsafe_allow_html=True,
            )


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: Sustainable Fishing Zones
# ══════════════════════════════════════════════════════════════════════════════

elif page == "🎣 Sustainable Fishing Zones":
    st.title("🎣 Sustainable Fishing Zones")
    st.markdown(
        "**XGBoost** weekly classifier with **SHAP** explainability. "
        "Green = recommended · Amber = caution · Red = avoid."
    )

    with st.spinner("Loading SFZ data..."):
        data = api_get("/api/v1/sfz/current")

    if data:
        geojson  = data.get("geojson", {})
        features = geojson.get("features", [])
        summary  = data.get("zone_summary", {})

        # Metrics row
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("🟢 GREEN", summary.get("GREEN", 0))
        c2.metric("🟡 AMBER", summary.get("AMBER", 0))
        c3.metric("🔴 RED",   summary.get("RED", 0))
        c4.metric("Total Zones", data.get("total_zones", 0))

        st.caption(f"Week of {data.get('week_start')} · Model: {data.get('model')}")

        if features:
            m = folium.Map(location=[15, 78], zoom_start=5, tiles="CartoDB positron")
            for feat in features[:500]:
                props  = feat.get("properties", {})
                coords = feat.get("geometry", {}).get("coordinates", [0, 0])
                zone   = props.get("ecological_class", "AMBER")
                risk   = props.get("bycatch_risk_score", 0.5)
                shap   = props.get("shap_top3", [])

                popup_html = (
                    f"<b>Zone Class:</b> <span style='color:{sfz_color(zone)}'>{zone}</span><br>"
                    f"<b>Bycatch Risk:</b> {risk:.2f}<br>"
                    f"<b>SHAP Top-3:</b><br>{'<br>'.join(f'• {f}' for f in shap) if shap else '—'}"
                )
                folium.CircleMarker(
                    location=[coords[1], coords[0]],
                    radius=7,
                    color=sfz_folium_color(zone),
                    fill=True,
                    fill_opacity=0.7,
                    popup=folium.Popup(popup_html, max_width=250),
                    tooltip=f"{zone} | Bycatch risk: {risk:.2f}",
                ).add_to(m)

            st_folium(m, width=None, height=480, returned_objects=[])

        # SHAP feature breakdown
        st.subheader("SHAP Feature Importance Distribution")
        feature_counts: dict[str, int] = {}
        for feat in features:
            for f in feat.get("properties", {}).get("shap_top3", []):
                feature_counts[f] = feature_counts.get(f, 0) + 1

        if feature_counts:
            fc_df = pd.DataFrame(
                [{"Feature": k, "Count": v} for k, v in
                 sorted(feature_counts.items(), key=lambda x: -x[1])]
            )
            fig = px.bar(
                fc_df,
                x="Count",
                y="Feature",
                orientation="h",
                title="How often each feature appears in SHAP top-3 explanations",
                color="Count",
                color_continuous_scale="Teal",
            )
            fig.update_layout(
                height=350,
                paper_bgcolor="rgba(0,0,0,0)",
                font_color="white",
                margin=dict(t=40, b=20),
            )
            st.plotly_chart(fig, use_container_width=True)

    st.divider()
    st.subheader("Classify a Single Location")
    with st.form("sfz_single"):
        c1, c2 = st.columns(2)
        lat  = c1.number_input("Latitude",   5.0, 25.0, 12.0, 0.5)
        lon  = c2.number_input("Longitude", 60.0, 100.0, 74.0, 0.5)
        c3, c4 = st.columns(2)
        sst  = c3.number_input("SST (°C)", 20.0, 35.0, 28.5, 0.5)
        chl  = c4.number_input("Chlorophyll (mg/L)", 0.05, 3.0, 0.3, 0.05)
        submit = st.form_submit_button("Classify Zone")

    if submit:
        result = api_post("/api/v1/sfz/classify", {
            "latitude": lat, "longitude": lon,
            "sst_c": sst, "chlorophyll_mgl": chl,
            "ssh_anomaly": 0.0, "mld_m": 50.0,
            "fishing_effort_h": 2.0, "wind_stress_curl": 0.0,
        })
        if result:
            zone  = result.get("ecological_class", "—")
            risk  = result.get("bycatch_risk_score", 0)
            shap3 = result.get("shap_top3", [])
            color = sfz_color(zone)
            st.markdown(
                f"""
                <div style="background:{color};padding:18px;border-radius:10px;
                            color:white;text-align:center">
                  <h2>Zone: {zone}</h2>
                  <p>Bycatch Risk Score: <b>{risk:.3f}</b></p>
                  <p>Top SHAP features: <b>{', '.join(shap3)}</b></p>
                </div>
                """,
                unsafe_allow_html=True,
            )


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: Migration Forecast
# ══════════════════════════════════════════════════════════════════════════════

elif page == "🐟 Migration Forecast":
    st.title("🐟 Fish Migration Forecast")
    st.markdown(
        "**ConvLSTM (CATCH architecture)** — Spatiotemporal probability heatmap "
        "with **Monte Carlo Dropout** confidence intervals (N=50 passes)."
    )

    weeks = st.slider("Weeks ahead", 1, 8, 1)

    with st.spinner(f"Running ConvLSTM forecast for week +{weeks}..."):
        data = api_get("/api/v1/migration/forecast", params={"weeks_ahead": weeks})

    if data:
        features = data.get("features", [])
        st.caption(
            f"Model: {data.get('model')} · "
            f"Uncertainty: {data.get('uncertainty_method')} · "
            f"Coverage: {data.get('coverage')}"
        )

        if features:
            rows = []
            for feat in features:
                coords = feat["geometry"]["coordinates"]
                props  = feat["properties"]
                rows.append({
                    "lat": coords[1], "lon": coords[0],
                    "prob":      props["migration_probability"],
                    "ci_lower":  props["ci_lower"],
                    "ci_upper":  props["ci_upper"],
                    "uncertainty": props["uncertainty"],
                })
            df = pd.DataFrame(rows)

            # Heatmap via Plotly density
            fig = go.Figure()

            fig.add_trace(go.Densitymapbox(
                lat=df["lat"],
                lon=df["lon"],
                z=df["prob"],
                radius=18,
                colorscale="Viridis",
                zmin=0,
                zmax=1,
                name="Migration Probability",
                colorbar=dict(title="P(fish)", tickfont=dict(color="white")),
            ))

            fig.update_layout(
                mapbox=dict(
                    style="carto-darkmatter",
                    center={"lat": 15, "lon": 78},
                    zoom=4,
                ),
                margin=dict(t=0, b=0, l=0, r=0),
                height=480,
                paper_bgcolor="rgba(0,0,0,0)",
            )
            st.plotly_chart(fig, use_container_width=True)

            # Confidence interval scatter
            st.subheader("Prediction Uncertainty (Monte Carlo CI Bands)")
            top25 = df.nlargest(25, "prob")
            fig2 = go.Figure()
            fig2.add_trace(go.Scatter(
                x=top25["lon"],
                y=top25["prob"],
                error_y=dict(
                    type="data",
                    symmetric=False,
                    array=top25["ci_upper"] - top25["prob"],
                    arrayminus=top25["prob"] - top25["ci_lower"],
                    color="rgba(100,200,255,0.5)",
                ),
                mode="markers",
                marker=dict(color="cyan", size=8),
                name="Top-25 cells (by probability)",
            ))
            fig2.update_layout(
                xaxis_title="Longitude",
                yaxis_title="Migration Probability",
                height=320,
                paper_bgcolor="rgba(0,0,0,0)",
                font_color="white",
                margin=dict(t=20, b=40),
            )
            st.plotly_chart(fig2, use_container_width=True)

            # Stats
            c1, c2, c3 = st.columns(3)
            c1.metric("Peak Probability",  f"{df['prob'].max():.3f}")
            c2.metric("Mean Probability",  f"{df['prob'].mean():.3f}")
            c3.metric("Mean CI Width",     f"±{df['uncertainty'].mean():.3f}")


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: RAG Query Interface
# ══════════════════════════════════════════════════════════════════════════════

elif page == "💬 RAG Query Interface":
    st.title("💬 OceanMind RAG Interface")
    st.markdown(
        "Ask natural language questions about ocean conditions, fishing zones, "
        "marine health, or species data. Powered by **LangChain + Llama-3 + FAISS** "
        "with full **provenance tracing**."
    )

    # Suggested queries
    st.markdown("**Try asking:**")
    suggestions = [
        "Marine health near Gujarat this week",
        "What is a marine heatwave and how does OceanMind detect it?",
        "Which species dominate Kerala fishing landings?",
        "How does the ARGO float network work?",
        "What does a RED fishing zone mean?",
        "Explain IUU fishing detection via AIS",
    ]
    cols = st.columns(3)
    chosen = None
    for i, s in enumerate(suggestions):
        if cols[i % 3].button(s, key=f"sug_{i}"):
            chosen = s

    st.divider()

    query = st.text_area(
        "Your question",
        value=chosen or "",
        placeholder="e.g. What is the current marine health status near Gujarat?",
        height=80,
    )

    if st.button("🔍 Ask OceanMind", disabled=not query.strip()):
        with st.spinner("Retrieving from ocean knowledge base..."):
            result = api_post("/api/v1/rag/query", {"query": query.strip()})

        if result:
            st.subheader("Answer")
            st.info(result.get("answer", "No answer returned."))

            st.subheader("📚 Provenance Citations")
            prov = result.get("provenance", [])
            if prov:
                prov_df = pd.DataFrame(prov)[[
                    "source_id", "source_system", "quality_flag",
                    "relevance_score", "ingestion_ts",
                ]].rename(columns={
                    "source_id":      "Source ID",
                    "source_system":  "System",
                    "quality_flag":   "Quality",
                    "relevance_score":"Relevance",
                    "ingestion_ts":   "Ingested At",
                })
                st.dataframe(prov_df, use_container_width=True, hide_index=True)
            else:
                st.caption("No provenance data returned.")

            st.caption(
                f"Model: `{result.get('model_used')}` · "
                f"Answer ID: `{result.get('answer_id')}` · "
                f"{result.get('timestamp', '')}"
            )


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: Blockchain Traceability
# ══════════════════════════════════════════════════════════════════════════════

elif page == "⛓️ Blockchain Traceability":
    st.title("⛓️ Catch Traceability Ledger")
    st.markdown(
        "**Phase H MVP:** in-memory SHA-256 hash chain (mock ledger). "
        "Phase 2: replaces with **Hyperledger Fabric 2.5** — API contract identical."
    )

    tab1, tab2, tab3 = st.tabs(["Log Catch", "Verify Transaction", "Chain History"])

    # ── Log a catch ─────────────────────────────────────────────────────────
    with tab1:
        st.subheader("Register a Catch Event")
        with st.form("catch_form"):
            c1, c2 = st.columns(2)
            species_options = {
                "Indian Mackerel (AphiaID 217044)":    217044,
                "Oil Sardine (AphiaID 217033)":        217033,
                "Giant Tiger Prawn (AphiaID 158966)":  158966,
                "Yellowfin Tuna (AphiaID 127246)":     127246,
            }
            species_label = c1.selectbox("Species", list(species_options.keys()))
            species_aphia = species_options[species_label]
            species_name  = species_label.split(" (")[0]

            qty  = c2.number_input("Quantity (kg)", 1.0, 5000.0, 100.0, 10.0)

            landing_options = {
                "Veraval, Gujarat":   "VERAVAL_GJ",
                "Kochi, Kerala":      "KOCHI_KL",
                "Chennai, Tamil Nadu":"CHENNAI_TN",
                "Visakhapatnam, AP":  "VIZAG_AP",
                "Mangalore, Karnataka":"MANGALORE_KA",
            }
            site_label = c1.selectbox("Landing Site", list(landing_options.keys()))
            site_code  = landing_options[site_label]

            c3, c4 = st.columns(2)
            lat = c3.number_input("Latitude",   5.0, 25.0, 12.0, 0.5)
            lon = c4.number_input("Longitude", 60.0, 100.0, 74.0, 0.5)

            fisher_token = st.text_input(
                "Fisher Token (optional, anonymised)",
                placeholder="e.g. FISHER_GJ_8821",
            )
            submit = st.form_submit_button("📝 Log Catch to Ledger")

        if submit:
            payload = {
                "species_aphia_id": species_aphia,
                "species_name":     species_name,
                "quantity_kg":      qty,
                "latitude":         lat,
                "longitude":        lon,
                "landing_site_id":  site_code,
                "fisher_token":     fisher_token or None,
            }
            result = api_post("/api/v1/trace/catch", payload)
            if result:
                st.success("✅ Catch logged to ledger!")
                st.json(result)

    # ── Verify transaction ──────────────────────────────────────────────────
    with tab2:
        st.subheader("Verify a Transaction")
        tx_id = st.text_input("Transaction ID (SHA-256)", placeholder="Enter 64-character hex...")
        if st.button("🔍 Verify", disabled=not tx_id.strip()):
            result = api_get(f"/api/v1/trace/verify/{tx_id.strip()}")
            if result:
                st.success("✅ Transaction found on ledger!")
                st.json(result)

    # ── Chain history ───────────────────────────────────────────────────────
    with tab3:
        st.subheader("Catch History")
        landing_filter = st.text_input("Filter by landing site code", placeholder="e.g. VERAVAL_GJ")
        if st.button("📜 Load History"):
            params = {}
            if landing_filter.strip():
                params["landing_site"] = landing_filter.strip()
            result = api_get("/api/v1/trace/history", params=params)
            if result:
                records = result.get("records", [])
                if records:
                    df = pd.DataFrame(records)
                    st.dataframe(df, use_container_width=True, hide_index=True)
                else:
                    st.info("No records in ledger yet. Log a catch first.")

        # Chain summary
        chain = api_get("/api/v1/trace/chain-summary")
        if chain:
            st.divider()
            st.subheader("Ledger Summary")
            c1, c2, c3 = st.columns(3)
            c1.metric("Total Blocks",    chain.get("total_blocks", 0))
            c2.metric("Catch Records",   chain.get("total_catch_records", 0))
            c3.metric("Genesis Hash",    chain.get("genesis_hash", "—")[:16] + "…")
            species = chain.get("species_logged", [])
            if species:
                st.markdown(f"**Species logged:** {', '.join(species)}")


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: Alerts & Subscriptions
# ══════════════════════════════════════════════════════════════════════════════

elif page == "🔔 Alerts & Subscriptions":
    st.title("🔔 Alerts & Subscriptions")
    st.markdown(
        "**Phase F:** Zone-change SMS (Twilio) + Firebase FCM push notifications. "
        "Bhashini voice interface: **Hindi + Tamil** (MVP). "
        "< 60-second SLA from trigger to delivery."
    )

    tab1, tab2 = st.tabs(["Subscribe", "Demo Alert"])

    with tab1:
        st.subheader("Register for Alerts")
        with st.form("alert_form"):
            phone  = st.text_input("Phone (E.164)", placeholder="+919876543210")
            device = st.text_input("FCM Device Token (optional)", placeholder="Firebase token...")
            lang   = st.selectbox(
                "Language",
                ["en — English", "hi — Hindi", "ta — Tamil"],
                index=0,
            )
            lang_code = lang.split(" — ")[0]
            alert_types = st.multiselect(
                "Alert types",
                ["zone_change", "mhw", "cyclone", "mhi_threshold"],
                default=["zone_change", "mhw", "cyclone"],
            )
            submit = st.form_submit_button("📲 Subscribe")

        if submit:
            if not phone and not device:
                st.error("Provide at least a phone number or FCM token.")
            else:
                result = api_post("/api/v1/alerts/subscribe", {
                    "phone":        phone or None,
                    "device_token": device or None,
                    "language":     lang_code,
                    "alert_types":  alert_types,
                })
                if result:
                    st.success(f"✅ Subscribed! ID: {result.get('sub_id')} · Lang: {result.get('language')}")
                    st.info(
                        "**Phase 2 note:** Live SMS delivery via Twilio and "
                        "FCM push require credentials in .env. "
                        "Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, FIREBASE_SERVER_KEY."
                    )

    with tab2:
        st.subheader("Trigger Demo Alert")
        st.markdown(
            "Simulates the full event pipeline: "
            "INCOIS SST update → SFZ reclassification → alert dispatch → delivery log."
        )
        if st.button("🚨 Fire Demo Zone-Change Alert"):
            result = api_get("/api/v1/alerts/trigger-demo")
            if result:
                st.warning("Demo alert triggered!")
                st.json(result)

        st.divider()
        st.subheader("Alert Architecture")
        st.markdown("""
        ```
        INCOIS SST update  →  SFZ reclassification trigger
               │
               ▼
        Async event queue
               │
        ┌──────┴──────────┐
        │                 │
        Twilio SMS        Firebase FCM
        (< 60s SLA)       (Android push)
               │
        Bhashini TTS
        (Hindi / Tamil voice — MVP)
        ```
        """)


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: Biodiversity & CV (Phase B)
# ══════════════════════════════════════════════════════════════════════════════

elif page == "🔬 Biodiversity & CV":
    st.title("🔬 Biodiversity & Computer Vision")
    st.markdown(
        "**Phase B:** YOLOv8 landing-site fish identification + ResNet101 species ID. "
        "eDNA metabarcoding (1D CNN + BLAST+). WoRMS AphiaID entity resolution. "
        "Milestone species: *R. kanagurta* · *S. longiceps* · *P. monodon*."
    )

    tab_cv, tab_edna, tab_ref = st.tabs(["📸 CV Fish Analysis", "🧬 eDNA Analysis", "📋 Species Reference"])

    # ── CV Tab ─────────────────────────────────────────────────────────────────
    with tab_cv:
        st.subheader("Landing-Site Fish Species Identification")
        st.info(
            "**Production pipeline:** Submit a catch photo → YOLOv8 detects individual fish "
            "→ ResNet101 classifies species → fork length + weight estimated via allometric equations.\n\n"
            "**MVP mode:** Synthetic realistic results based on site coordinates."
        )

        with st.form("cv_form"):
            c1, c2 = st.columns(2)
            with c1:
                site_lat = st.number_input("Site Latitude", value=8.5, min_value=-30.0, max_value=30.0, step=0.1)
                site_lon = st.number_input("Site Longitude", value=76.9, min_value=40.0, max_value=110.0, step=0.1)
            with c2:
                site_name = st.text_input("Site Name (optional)", placeholder="e.g. Vizhinjam Harbour")
                st.caption("Upload catch photo (Phase 2 with YOLOv8 GPU inference)")
                _ = st.file_uploader("Catch photo (optional demo)", type=["jpg","jpeg","png"], disabled=False)
            analyze = st.form_submit_button("🔍 Analyze Catch", use_container_width=True)

        if analyze or "cv_result" not in st.session_state:
            with st.spinner("Running CV pipeline…"):
                result = api_post("/api/v1/cv/analyze", {
                    "site_lat": site_lat if analyze else 8.5,
                    "site_lon": site_lon if analyze else 76.9,
                    "site_name": site_name if analyze else None,
                })
                if result:
                    st.session_state["cv_result"] = result

        cv = st.session_state.get("cv_result")
        if cv:
            st.success(f"✅ Detected **{cv['total_fish_detected']} fish** across **{len(cv['species_summary'])} species**")

            # Species summary bar chart
            sp_data = pd.DataFrame(
                [(k, v) for k, v in cv["species_summary"].items()],
                columns=["Species", "Count"]
            ).sort_values("Count", ascending=False)
            fig = px.bar(sp_data, x="Species", y="Count", title="Species Composition",
                         color="Count", color_continuous_scale="Viridis")
            fig.update_layout(xaxis_tickangle=-35, height=320)
            st.plotly_chart(fig, use_container_width=True)

            # Detection table
            st.subheader("Individual Detections")
            det_df = pd.DataFrame([{
                "ID": d["detection_id"],
                "Species": d["species_scientific"],
                "Common Name": d["species_common"],
                "AphiaID": d["aphia_id"],
                "Confidence": f"{d['confidence']:.1%}",
                "Fork Length (mm)": d["fork_length_mm"],
                "Weight (g)": d["estimated_weight_g"],
            } for d in cv["detections"]])
            st.dataframe(det_df, use_container_width=True, hide_index=True)
            st.caption(f"Model: {cv['model']}")

    # ── eDNA Tab ───────────────────────────────────────────────────────────────
    with tab_edna:
        st.subheader("eDNA Metabarcoding Analysis")
        st.info(
            "**Pipeline:** FastQC → DADA2 ASV denoising → BLAST+ (NCBI + BOLD) → "
            "1D CNN (novel sequences) → WoRMS normalisation → Vegan diversity indices.\n\n"
            "**DENIED-001:** Real-time eDNA is permanently out of scope (24–48h bio processing). "
            "Results reflect published/cached dataset analysis."
        )

        with st.form("edna_form"):
            c1, c2, c3 = st.columns(3)
            with c1:
                sample_id = st.text_input("Sample ID", value="OcM-eDNA-001")
                sample_lat = st.number_input("Latitude", value=12.0, min_value=-30.0, max_value=30.0, step=0.5)
            with c2:
                sample_lon = st.number_input("Longitude", value=74.0, min_value=40.0, max_value=110.0, step=0.5)
                depth_m = st.number_input("Sample Depth (m)", value=5.0, min_value=0.0, max_value=200.0, step=1.0)
            with c3:
                st.caption("Primers: MiFish 12S + 18S rRNA")
                st.caption("(Miya et al. 2015)")
            run_edna = st.form_submit_button("🧬 Run eDNA Analysis", use_container_width=True)

        if run_edna:
            with st.spinner("Running eDNA pipeline…"):
                edna = api_post("/api/v1/edna/analyze", {
                    "sample_id": sample_id, "sample_lat": sample_lat,
                    "sample_lon": sample_lon, "depth_m": depth_m,
                })
                if edna:
                    st.session_state["edna_result"] = edna

        edna = st.session_state.get("edna_result")
        if edna:
            c1, c2, c3, c4 = st.columns(4)
            c1.metric("Species Detected", edna["species_detected"])
            c2.metric("Total Reads", f"{edna['total_reads']:,}")
            c3.metric("Shannon H′", edna["diversity_indices"]["shannon_h"])
            c4.metric("Simpson D′", edna["diversity_indices"]["simpson_d"])

            taxa_df = pd.DataFrame([{
                "Species": t["species_scientific"],
                "Common": t["species_common"],
                "AphiaID": t["aphia_id"],
                "Reads": t["read_count"],
                "Confidence": f"{t['confidence']:.1%}",
                "Method": t["detection_method"],
                "Marker": t["marker"],
            } for t in edna["taxa"]])
            st.dataframe(taxa_df, use_container_width=True, hide_index=True)

            fig = px.pie(taxa_df.head(8), names="Species", values="Reads",
                         title="eDNA Read Distribution (top 8 species)")
            st.plotly_chart(fig, use_container_width=True)

    # ── Species Reference Tab ─────────────────────────────────────────────────
    with tab_ref:
        st.subheader("WoRMS-Validated Species Reference")
        with st.spinner("Loading reference list…"):
            ref = api_get("/api/v1/cv/species-reference")
        if ref:
            st.success(
                f"✅ **{ref['species_count']} species** in reference database. "
                f"Phase B milestone AphiaIDs: {ref['milestone_species']}"
            )
            ref_df = pd.DataFrame([{
                "Species": s["species"],
                "Common Name": s["common"],
                "AphiaID": s["aphia_id"],
                "WoRMS Status": s["worms"]["status"],
                "FishBase": s["fishbase_url"],
            } for s in ref["species"]])
            st.dataframe(ref_df, use_container_width=True, hide_index=True)


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: Digital Twin Scenarios (Phase G)
# ══════════════════════════════════════════════════════════════════════════════

elif page == "🌐 Digital Twin Scenarios":
    st.title("🌐 Digital Twin — MHW Scenario Engine")
    st.markdown(
        "**Phase G:** Parameterised SST perturbation → projected MHI score change + migration zone shift. "
        "Target: **< 30s** compute time. "
        "Phase 2: Lagrangian IBM (OceanParcels) + larval connectivity + socioecological ABM."
    )

    # Load presets
    presets_data = api_get("/api/v1/digital-twin/presets")
    preset_map = {}
    if presets_data:
        for p in presets_data["presets"]:
            preset_map[p["name"]] = p

    col_ctrl, col_result = st.columns([1, 2])

    with col_ctrl:
        st.subheader("Scenario Parameters")

        if preset_map:
            preset_choice = st.selectbox(
                "Load Preset",
                ["— Custom —"] + list(preset_map.keys()),
            )
        else:
            preset_choice = "— Custom —"

        default_delta = 2.0
        default_weeks = 3
        if preset_choice != "— Custom —" and preset_choice in preset_map:
            default_delta = preset_map[preset_choice]["sst_delta_c"]
            default_weeks = preset_map[preset_choice]["duration_weeks"]
            st.info(preset_map[preset_choice]["description"])

        sst_delta = st.slider("SST Perturbation (°C)", min_value=-5.0, max_value=10.0,
                               value=float(default_delta), step=0.5)
        duration = st.slider("Duration (weeks)", min_value=1, max_value=52, value=int(default_weeks))
        scenario_name = st.text_input("Scenario Label (optional)",
                                       placeholder=f"+{sst_delta}°C for {duration} weeks")

        incl_mhi  = st.checkbox("Include MHI Projection", value=True)
        incl_mig  = st.checkbox("Include Migration Shift", value=True)

        run_btn = st.button("🚀 Run Scenario", use_container_width=True, type="primary")

    if run_btn:
        with st.spinner(f"Running scenario: {sst_delta:+.1f}°C for {duration} weeks…"):
            result = api_post("/api/v1/digital-twin/scenario", {
                "sst_delta_c": sst_delta,
                "duration_weeks": duration,
                "scenario_name": scenario_name or None,
                "include_migration_shift": incl_mig,
                "include_mhi_projection": incl_mhi,
            })
            if result:
                st.session_state["scenario_result"] = result

    scenario = st.session_state.get("scenario_result")

    with col_result:
        if not scenario:
            st.info("Configure a scenario on the left and click **Run Scenario**.")
        else:
            sc = scenario["scenario"]
            severity_color = {
                "MILD": "🟢", "MODERATE": "🟡", "SEVERE": "🟠", "EXTREME": "🔴"
            }.get(sc["severity"], "⚪")
            st.subheader(f"{severity_color} {sc['name']}")
            st.caption(
                f"Severity: **{sc['severity']}** · Grid: {scenario['grid_resolution_deg']}° · "
                f"Computed: {scenario['computed_at'][:19]}"
            )

            if "mhi_projection" in scenario:
                mhi_proj = scenario["mhi_projection"]
                st.markdown("#### 🌡️ Marine Health Index Projection")
                c1, c2, c3 = st.columns(3)
                c1.metric("Grid Points", mhi_proj["grid_points"])
                c2.metric("Avg ΔMH​I", f"{mhi_proj['avg_delta_mhi']:+.1f}")
                c3.metric("Critical/Warning Cells", mhi_proj["critical_cells"])
                st.info(mhi_proj["summary"])

                mhi_df = pd.DataFrame(mhi_proj["data"])
                fig = px.scatter_mapbox(
                    mhi_df, lat="lat", lon="lon",
                    color="delta_mhi", size=abs(mhi_df["delta_mhi"]).clip(lower=1),
                    color_continuous_scale="RdYlGn",
                    color_continuous_midpoint=0,
                    hover_data=["baseline_mhi", "projected_mhi", "alert_level"],
                    title="Projected MHI Change (ΔMH​I per grid cell)",
                    mapbox_style="open-street-map", zoom=3,
                    center={"lat": 15, "lon": 75},
                    height=380,
                )
                st.plotly_chart(fig, use_container_width=True)

            if "migration_shift" in scenario:
                mig = scenario["migration_shift"]
                st.markdown("#### 🐟 Migration Zone Shift")
                c1, c2 = st.columns(2)
                c1.metric("Poleward Shift", f"{mig['poleward_shift_deg']:+.2f}°")
                c2.metric("Grid Points", mig["grid_points"])
                st.info(mig["summary"])

                mig_df = pd.DataFrame(mig["data"])
                fig2 = px.scatter_mapbox(
                    mig_df, lat="lat", lon="lon",
                    color="delta_prob", size_max=12,
                    color_continuous_scale="RdBu",
                    color_continuous_midpoint=0,
                    hover_data=["baseline_prob", "projected_prob"],
                    title="Migration Probability Change (Δprob per grid cell)",
                    mapbox_style="open-street-map", zoom=3,
                    center={"lat": 15, "lon": 75},
                    height=380,
                )
                st.plotly_chart(fig2, use_container_width=True)

            st.caption(
                f"🔬 Model: {scenario['model']} · "
                f"Phase 2: {scenario['phase2_note']}"
            )
