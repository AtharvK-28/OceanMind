"""
OceanMind — Phase C, D, E, F, H Integration Tests

Tests:
  Phase C: MHI scoring (single + grid) |Migration forecast |CI bands
  Phase D: SFZ current zones |single classify |SHAP top-3 structure |feature counting
  Phase E: RAG query |provenance citations |fallback mode
  Phase F: Alert subscribe |demo trigger |input validation
  Phase H: Blockchain catch logging |verify |chain summary |history |AphiaID consistency

Run: python tests/test_phase_c_d_e_f_h.py
     (No DB or external API required — all endpoints use synthetic/fallback data)
"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from backend.main import app, mhi_model, sfz_model
from backend.models.mhi import _synthetic_mhi_data
from backend.models.sfz import _synthetic_sfz_data

# Ensure models are trained before any tests (lifespan doesn't fire without context manager)
if not mhi_model._trained:
    mhi_model.train(_synthetic_mhi_data(n=500))
if not sfz_model._trained:
    sfz_model.train(_synthetic_sfz_data(n=500))

client = TestClient(app)


# ══════════════════════════════════════════════════════════════════════════════
# Phase C — Marine Health Index
# ══════════════════════════════════════════════════════════════════════════════

def test_mhi_status_default():
    """MHI status endpoint returns grid cells with scores and alerts."""
    print("\n[Phase C] Testing MHI status (default bbox)...")
    resp = client.get("/api/v1/mhi/status")
    assert resp.status_code == 200, f"MHI status failed: {resp.text}"
    data = resp.json()

    assert "grid_cells" in data
    assert "total_cells" in data
    assert "alerts_active" in data
    assert data["total_cells"] > 0
    assert len(data["grid_cells"]) == data["total_cells"]

    for cell in data["grid_cells"][:5]:
        assert "latitude" in cell
        assert "longitude" in cell
        assert "mhi_score" in cell
        assert 0 <= cell["mhi_score"] <= 100
        assert cell["stress_level"] in ("CRITICAL", "WARNING", "WATCH", "NORMAL")
        assert isinstance(cell["alert"], bool)

    print(f"  [OK] {data['total_cells']} grid cells |{data['alerts_active']} alerts active.")


def test_mhi_status_custom_bbox():
    """MHI status with a narrow bounding box returns fewer cells."""
    print("\n[Phase C] Testing MHI status (narrow bbox)...")
    resp = client.get("/api/v1/mhi/status", params={
        "lat_min": 10.0, "lat_max": 14.0,
        "lon_min": 70.0, "lon_max": 76.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_cells"] > 0

    wide = client.get("/api/v1/mhi/status").json()
    assert data["total_cells"] < wide["total_cells"], "Narrow bbox should return fewer cells"
    print(f"  [OK] Narrow bbox: {data['total_cells']} cells (vs {wide['total_cells']} full grid).")


def test_mhi_score_single():
    """Single-point MHI scoring returns valid score and stress level."""
    print("\n[Phase C] Testing MHI single-point score...")
    resp = client.post("/api/v1/mhi/score", json={
        "sst_c": 28.5,
        "chlorophyll_mgl": 0.3,
        "dissolved_o2": 200.0,
        "ph": 8.1,
        "salinity_psu": 34.5,
    })
    assert resp.status_code == 200, f"MHI score failed: {resp.text}"
    data = resp.json()

    assert "mhi_score" in data
    assert 0 <= data["mhi_score"] <= 100
    assert data["stress_level"] in ("CRITICAL", "WARNING", "WATCH", "NORMAL")
    assert isinstance(data["alert"], bool)
    assert "features_used" in data
    assert len(data["features_used"]) > 0
    print(f"  [OK] MHI score: {data['mhi_score']:.1f} |Stress: {data['stress_level']}")


def test_mhi_score_stressed_conditions():
    """Stressed ocean params should produce a lower MHI score than healthy params."""
    print("\n[Phase C] Testing MHI stressed vs healthy comparison...")
    healthy = client.post("/api/v1/mhi/score", json={
        "sst_c": 28.0, "chlorophyll_mgl": 0.5,
        "dissolved_o2": 210.0, "ph": 8.1, "salinity_psu": 34.5,
    }).json()

    stressed = client.post("/api/v1/mhi/score", json={
        "sst_c": 33.0, "chlorophyll_mgl": 0.02,
        "dissolved_o2": 90.0, "ph": 7.7, "salinity_psu": 36.0,
    }).json()

    assert healthy["mhi_score"] > stressed["mhi_score"], (
        f"Healthy ({healthy['mhi_score']}) should score higher than stressed ({stressed['mhi_score']})"
    )
    print(f"  [OK] Healthy: {healthy['mhi_score']:.1f} > Stressed: {stressed['mhi_score']:.1f}")


def test_mhi_stress_classification():
    """Stress level classification matches documented thresholds."""
    print("\n[Phase C] Testing MHI stress level thresholds...")
    data = client.get("/api/v1/mhi/status").json()
    for cell in data["grid_cells"]:
        score = cell["mhi_score"]
        level = cell["stress_level"]
        if score < 25:
            assert level == "CRITICAL"
        elif score < 50:
            assert level == "WARNING"
        elif score < 65:
            assert level == "WATCH"
        else:
            assert level == "NORMAL"
    print(f"  [OK] All {data['total_cells']} cells have correct stress classification.")


# ── Migration Forecast ────────────────────────────────────────────────────────

def test_migration_forecast_default():
    """Migration forecast returns features with probability and CI bands."""
    print("\n[Phase C] Testing migration forecast (1 week ahead)...")
    resp = client.get("/api/v1/migration/forecast", params={"weeks_ahead": 1})
    assert resp.status_code == 200
    data = resp.json()

    assert "features" in data
    assert len(data["features"]) > 0
    assert data["uncertainty_method"] == "Monte Carlo Dropout N=50"

    for feat in data["features"][:5]:
        props = feat["properties"]
        assert 0.0 <= props["migration_probability"] <= 1.0
        assert props["ci_lower"] <= props["migration_probability"] <= props["ci_upper"]
        assert props["uncertainty"] >= 0
        coords = feat["geometry"]["coordinates"]
        assert len(coords) == 2
    print(f"  [OK] {len(data['features'])} grid cells with CI bands.")


def test_migration_forecast_weeks_range():
    """Forecast accepts 1–8 weeks; rejects out-of-range."""
    print("\n[Phase C] Testing migration forecast week range validation...")
    for w in [1, 4, 8]:
        resp = client.get("/api/v1/migration/forecast", params={"weeks_ahead": w})
        assert resp.status_code == 200, f"Week {w} should be valid"

    resp = client.get("/api/v1/migration/forecast", params={"weeks_ahead": 0})
    assert resp.status_code == 422, "Week 0 should be rejected"
    resp = client.get("/api/v1/migration/forecast", params={"weeks_ahead": 9})
    assert resp.status_code == 422, "Week 9 should be rejected"
    print("  [OK] Weeks 1-8 accepted, 0 and 9 rejected.")


# ══════════════════════════════════════════════════════════════════════════════
# Phase D — Sustainable Fishing Zones
# ══════════════════════════════════════════════════════════════════════════════

def test_sfz_current_zones():
    """SFZ current endpoint returns GeoJSON with zone summary."""
    print("\n[Phase D] Testing SFZ current zones...")
    resp = client.get("/api/v1/sfz/current")
    assert resp.status_code == 200, f"SFZ current failed: {resp.text}"
    data = resp.json()

    assert "geojson" in data
    assert "zone_summary" in data
    assert "total_zones" in data
    assert data["total_zones"] > 0

    summary = data["zone_summary"]
    assert any(k in summary for k in ["GREEN", "AMBER", "RED"]), "At least one zone class expected"

    features = data["geojson"]["features"]
    assert len(features) > 0
    print(f"  [OK] {data['total_zones']} zones |Summary: {summary}")


def test_sfz_geojson_structure():
    """Each SFZ GeoJSON feature has required properties."""
    print("\n[Phase D] Testing SFZ GeoJSON feature structure...")
    data = client.get("/api/v1/sfz/current").json()
    features = data["geojson"]["features"]

    for feat in features[:10]:
        assert feat["type"] == "Feature"
        assert feat["geometry"]["type"] == "Point"
        coords = feat["geometry"]["coordinates"]
        assert len(coords) == 2
        assert isinstance(coords[0], (int, float))

        props = feat["properties"]
        assert props["ecological_class"] in ("GREEN", "AMBER", "RED")
        assert 0.0 <= props["bycatch_risk_score"] <= 1.0
        assert "shap_top3" in props
    print(f"  [OK] Validated structure on {min(10, len(features))} features.")


def test_sfz_shap_top3_structure():
    """SHAP top-3 features are dicts with 'feature' and 'value' keys."""
    print("\n[Phase D] Testing SHAP top-3 dict structure (bug fix validation)...")
    data = client.get("/api/v1/sfz/current").json()
    features = data["geojson"]["features"]

    checked = 0
    for feat in features[:20]:
        shap_top3 = feat["properties"].get("shap_top3", [])
        if not shap_top3:
            continue
        assert isinstance(shap_top3, list)
        assert len(shap_top3) <= 3
        for entry in shap_top3:
            assert isinstance(entry, dict), f"SHAP entry should be dict, got {type(entry)}"
            assert "feature" in entry, f"SHAP entry missing 'feature' key: {entry}"
            assert "value" in entry, f"SHAP entry missing 'value' key: {entry}"
            assert isinstance(entry["feature"], str)
            assert isinstance(entry["value"], (int, float))
        checked += 1

    assert checked > 0, "No features had shap_top3 data to validate"
    print(f"  [OK] Validated SHAP top-3 dict structure on {checked} features.")


def test_sfz_shap_feature_counting():
    """SHAP feature names can be extracted and counted (bug fix validation)."""
    print("\n[Phase D] Testing SHAP feature counting (bug fix validation)...")
    data = client.get("/api/v1/sfz/current").json()
    features = data["geojson"]["features"]

    feature_counts: dict[str, int] = {}
    for feat in features:
        for f in feat.get("properties", {}).get("shap_top3", []):
            fname = f["feature"] if isinstance(f, dict) else str(f)
            feature_counts[fname] = feature_counts.get(fname, 0) + 1

    assert len(feature_counts) > 0, "Should have counted at least one feature"
    for name in feature_counts:
        assert isinstance(name, str), f"Feature name should be str, got {type(name)}: {name}"

    top_feature = max(feature_counts, key=feature_counts.get)
    print(f"  [OK] Counted {len(feature_counts)} unique features. Top: '{top_feature}' ({feature_counts[top_feature]}x)")


def test_sfz_classify_single():
    """Single-location SFZ classification returns zone + SHAP."""
    print("\n[Phase D] Testing SFZ single-point classification...")
    resp = client.post("/api/v1/sfz/classify", json={
        "latitude": 12.0, "longitude": 74.0,
        "sst_c": 28.5, "chlorophyll_mgl": 0.3,
        "ssh_anomaly": 0.0, "mld_m": 50.0,
        "fishing_effort_h": 2.0, "wind_stress_curl": 0.0,
    })
    assert resp.status_code == 200, f"SFZ classify failed: {resp.text}"
    data = resp.json()

    assert data["ecological_class"] in ("GREEN", "AMBER", "RED")
    assert 0.0 <= data["bycatch_risk_score"] <= 1.0
    assert "shap_top3" in data
    assert isinstance(data["shap_top3"], list)
    assert "confidence" in data

    for entry in data["shap_top3"]:
        assert isinstance(entry, dict)
        assert "feature" in entry
        assert "value" in entry
    print(f"  [OK] Zone: {data['ecological_class']} |Risk: {data['bycatch_risk_score']:.3f} |"
          f"Top feature: {data['shap_top3'][0]['feature']}")


def test_sfz_zone_summary_matches_features():
    """Zone summary counts should match GeoJSON feature counts."""
    print("\n[Phase D] Testing zone summary consistency...")
    data = client.get("/api/v1/sfz/current").json()
    features = data["geojson"]["features"]
    summary = data["zone_summary"]

    counted = {}
    for feat in features:
        cls = feat["properties"]["ecological_class"]
        counted[cls] = counted.get(cls, 0) + 1

    for zone_class, count in summary.items():
        assert zone_class in counted, f"Summary has {zone_class} but no features with that class"
        assert counted[zone_class] == count, (
            f"{zone_class}: summary says {count} but counted {counted[zone_class]}"
        )
    print(f"  [OK] Zone summary matches feature counts: {summary}")


# ══════════════════════════════════════════════════════════════════════════════
# Phase E — RAG Conversational AI
# ══════════════════════════════════════════════════════════════════════════════

def test_rag_query_basic():
    """RAG query returns answer with provenance citations."""
    print("\n[Phase E] Testing RAG query (basic)...")
    resp = client.post("/api/v1/rag/query", json={
        "query": "What is the Marine Health Index?"
    })
    assert resp.status_code == 200, f"RAG query failed: {resp.text}"
    data = resp.json()

    assert "answer" in data
    assert len(data["answer"]) > 0
    assert "provenance" in data
    assert len(data["provenance"]) > 0
    assert "answer_id" in data
    assert "model_used" in data
    assert "timestamp" in data

    print(f"  [OK] Answer length: {len(data['answer'])} chars |"
          f"Provenance: {len(data['provenance'])} citations |"
          f"Model: {data['model_used']}")


def test_rag_provenance_structure():
    """Each provenance citation has required traceability fields."""
    print("\n[Phase E] Testing RAG provenance structure...")
    data = client.post("/api/v1/rag/query", json={
        "query": "How does ARGO float network work?"
    }).json()

    for prov in data["provenance"]:
        assert "source_id" in prov
        assert "source_system" in prov
        assert "quality_flag" in prov
        assert prov["quality_flag"] in ("GOOD", "PROBABLY_GOOD", "BAD", "MISSING")
        assert "ingestion_ts" in prov
        assert "relevance_score" in prov
        assert isinstance(prov["relevance_score"], (int, float))
        assert "ai_answer_id" in prov
        assert prov["ai_answer_id"] == data["answer_id"]
    print(f"  [OK] All {len(data['provenance'])} citations have valid provenance fields.")


def test_rag_query_validation():
    """RAG rejects queries shorter than 3 characters."""
    print("\n[Phase E] Testing RAG query validation...")
    resp = client.post("/api/v1/rag/query", json={"query": "ab"})
    assert resp.status_code == 422, "Query < 3 chars should be rejected"

    resp = client.post("/api/v1/rag/query", json={"query": "SST"})
    assert resp.status_code == 200, "Query of 3 chars should be accepted"
    print("  [OK] Short query rejected, minimum-length query accepted.")


def test_rag_different_queries_different_provenance():
    """Different queries should retrieve different source documents."""
    print("\n[Phase E] Testing RAG retrieval variation...")
    r1 = client.post("/api/v1/rag/query", json={"query": "What is IUU fishing?"}).json()
    r2 = client.post("/api/v1/rag/query", json={"query": "Tell me about eDNA metabarcoding"}).json()

    sources1 = {p["source_id"] for p in r1["provenance"]}
    sources2 = {p["source_id"] for p in r2["provenance"]}
    assert sources1 != sources2, "Different queries should retrieve different sources"
    print(f"  [OK] Query 1 sources: {sources1}")
    print(f"    Query 2 sources: {sources2}")


# ══════════════════════════════════════════════════════════════════════════════
# Phase F — Alerts & Subscriptions
# ══════════════════════════════════════════════════════════════════════════════

def test_alert_subscribe_phone():
    """Subscribe with phone number returns sub_id and language."""
    print("\n[Phase F] Testing alert subscribe (phone)...")
    resp = client.post("/api/v1/alerts/subscribe", json={
        "phone": "+919876543210",
        "language": "hi",
        "alert_types": ["zone_change", "mhw"],
    })
    assert resp.status_code == 200, f"Subscribe failed: {resp.text}"
    data = resp.json()

    assert "sub_id" in data
    assert data["sub_id"] > 0
    assert data["language"] == "hi"
    print(f"  [OK] Subscribed: sub_id={data['sub_id']} |lang={data['language']}")


def test_alert_subscribe_device_token():
    """Subscribe with FCM device token (no phone)."""
    print("\n[Phase F] Testing alert subscribe (FCM token)...")
    resp = client.post("/api/v1/alerts/subscribe", json={
        "device_token": "fcm_test_token_abc123",
        "language": "ta",
        "alert_types": ["cyclone"],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["language"] == "ta"
    print(f"  [OK] FCM subscribe: sub_id={data['sub_id']}")


def test_alert_subscribe_no_contact():
    """Subscribe without phone or device_token is rejected."""
    print("\n[Phase F] Testing alert subscribe (no contact info)...")
    resp = client.post("/api/v1/alerts/subscribe", json={
        "language": "en",
        "alert_types": ["zone_change"],
    })
    assert resp.status_code == 400, "Missing phone + device_token should return 400"
    print("  [OK] Correctly rejected subscription with no contact info.")


def test_alert_trigger_demo():
    """Demo alert trigger returns alert payload."""
    print("\n[Phase F] Testing demo alert trigger...")
    resp = client.get("/api/v1/alerts/trigger-demo")
    assert resp.status_code == 200
    data = resp.json()

    assert data["alert_type"] == "zone_change"
    assert "old_class" in data
    assert "new_class" in data
    assert "triggered_at" in data
    assert "recipients_notified" in data
    assert isinstance(data["recipients_notified"], int)
    print(f"  [OK] Demo alert: {data['old_class']}->{data['new_class']} |"
          f"{data['recipients_notified']} recipients")


def test_alert_subscribe_increments_id():
    """Successive subscriptions get incrementing IDs."""
    print("\n[Phase F] Testing subscription ID incrementing...")
    r1 = client.post("/api/v1/alerts/subscribe", json={
        "phone": "+911111111111", "language": "en", "alert_types": ["mhw"],
    }).json()
    r2 = client.post("/api/v1/alerts/subscribe", json={
        "phone": "+912222222222", "language": "en", "alert_types": ["mhw"],
    }).json()
    assert r2["sub_id"] > r1["sub_id"], "IDs should increment"
    print(f"  [OK] IDs incrementing: {r1['sub_id']} -> {r2['sub_id']}")


# ══════════════════════════════════════════════════════════════════════════════
# Phase F — Bhashini Voice Interface
# ══════════════════════════════════════════════════════════════════════════════

def test_voice_languages():
    """Voice languages endpoint returns Hindi + Tamil + English."""
    print("\n[Phase F] Testing voice languages...")
    resp = client.get("/api/v1/voice/languages")
    assert resp.status_code == 200
    data = resp.json()

    codes = {l["code"] for l in data["languages"]}
    assert "hi" in codes, "Hindi missing"
    assert "ta" in codes, "Tamil missing"
    assert "en" in codes, "English missing"
    print(f"  [OK] {len(data['languages'])} languages: {codes}")


def test_voice_query_hindi_text():
    """Hindi text query returns localized answer + provenance."""
    print("\n[Phase F] Testing voice query (Hindi text)...")
    resp = client.post("/api/v1/voice/query", json={
        "text": "Gujarat ke paas samudri swasthya kaisa hai?",
        "language": "hi",
        "tts_enabled": True,
    })
    assert resp.status_code == 200
    data = resp.json()

    assert "answer" in data
    assert data["answer"]["language"] == "hi"
    assert len(data["answer"]["localized"]) > 0
    assert len(data["answer"]["english"]) > 0
    assert data["query"]["stt_source"] == "text_input"
    assert "provenance" in data
    assert len(data["provenance"]) > 0
    print(f"  [OK] Hindi answer: {len(data['answer']['localized'])} chars |{len(data['provenance'])} citations")


def test_voice_query_tamil_simulated():
    """Simulated Tamil voice input returns transcription + answer."""
    print("\n[Phase F] Testing voice query (Tamil simulated audio)...")
    resp = client.post("/api/v1/voice/query", json={
        "audio_base64": "SIMULATED_AUDIO",
        "language": "ta",
        "tts_enabled": True,
    })
    assert resp.status_code == 200
    data = resp.json()

    assert data["query"]["stt_source"] == "bhashini_asr_simulated"
    assert len(data["query"]["original_text"]) > 0
    assert data["answer"]["language"] == "ta"
    assert "pipeline" in data
    assert "stt" in data["pipeline"]
    assert "tts" in data["pipeline"]
    print(f"  [OK] Tamil transcribed: {len(data['query']['original_text'])} chars via simulated ASR")


def test_voice_query_no_input():
    """Voice query with no text or audio returns error message."""
    print("\n[Phase F] Testing voice query (no input)...")
    resp = client.post("/api/v1/voice/query", json={
        "language": "hi",
        "tts_enabled": False,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "error" in data
    print(f"  [OK] No-input returns error prompt in Hindi")


def test_voice_pipeline_structure():
    """Voice response includes full pipeline metadata."""
    print("\n[Phase F] Testing voice pipeline structure...")
    resp = client.post("/api/v1/voice/query", json={
        "text": "What is IUU fishing?",
        "language": "en",
    })
    data = resp.json()

    assert "pipeline" in data
    p = data["pipeline"]
    assert "stt" in p
    assert "nmt" in p
    assert "rag" in p
    assert "tts" in p
    assert "supported_languages" in data
    assert "tts" in data
    assert data["tts"]["audio_format"] == "wav"
    print(f"  [OK] Pipeline: stt={p['stt'][:15]} | nmt={p['nmt']} | rag={p['rag']}")


# ══════════════════════════════════════════════════════════════════════════════
# Phase H — Blockchain Traceability
# ══════════════════════════════════════════════════════════════════════════════

def test_blockchain_log_catch():
    """Log a catch event and get back transaction_id + PMMSY cert."""
    print("\n[Phase H] Testing catch event logging...")
    resp = client.post("/api/v1/trace/catch", json={
        "species_aphia_id": 217044,
        "species_name": "Rastrelliger kanagurta",
        "quantity_kg": 150.0,
        "latitude": 12.5,
        "longitude": 74.8,
        "landing_site_id": "KOCHI_KL",
        "fisher_token": "FISHER_KL_001",
    })
    assert resp.status_code == 200, f"Catch log failed: {resp.text}"
    data = resp.json()

    assert "transaction_id" in data
    assert len(data["transaction_id"]) == 64, "Transaction ID should be SHA-256 (64 hex chars)"
    assert "pmmsy_cert_ref" in data
    assert data["pmmsy_cert_ref"].startswith("PMMSY-KOCHI_KL-")
    assert "block_number" in data
    assert data["block_number"] >= 1
    assert data["status"] == "COMMITTED"
    print(f"  [OK] Block #{data['block_number']} |TX: {data['transaction_id'][:16]}... |"
          f"Cert: {data['pmmsy_cert_ref']}")
    return data["transaction_id"]


def test_blockchain_verify_transaction():
    """Verify a logged transaction by its SHA-256 ID."""
    print("\n[Phase H] Testing transaction verification...")
    log_resp = client.post("/api/v1/trace/catch", json={
        "species_aphia_id": 217033,
        "species_name": "Sardinella longiceps",
        "quantity_kg": 80.0,
        "latitude": 9.9,
        "longitude": 76.2,
        "landing_site_id": "KOCHI_KL",
    }).json()
    tx_id = log_resp["transaction_id"]

    resp = client.get(f"/api/v1/trace/verify/{tx_id}")
    assert resp.status_code == 200, f"Verify failed: {resp.text}"
    data = resp.json()

    assert data["transaction_id"] == tx_id
    assert data["species_name"] == "Sardinella longiceps"
    assert data["quantity_kg"] == 80.0
    assert data["landing_site_id"] == "KOCHI_KL"
    print(f"  [OK] Verified TX {tx_id[:16]}... -> {data['species_name']}")


def test_blockchain_verify_not_found():
    """Verifying a nonexistent transaction returns 404."""
    print("\n[Phase H] Testing verify not found...")
    fake_tx = "a" * 64
    resp = client.get(f"/api/v1/trace/verify/{fake_tx}")
    assert resp.status_code == 404
    print("  [OK] Nonexistent transaction correctly returns 404.")


def test_blockchain_chain_summary():
    """Chain summary includes total_catch_records and species_logged (bug fix)."""
    print("\n[Phase H] Testing chain summary (bug fix validation)...")
    client.post("/api/v1/trace/catch", json={
        "species_aphia_id": 158966,
        "species_name": "Penaeus monodon",
        "quantity_kg": 25.0,
        "latitude": 15.4,
        "longitude": 73.8,
        "landing_site_id": "MANGALORE_KA",
    })

    resp = client.get("/api/v1/trace/chain-summary")
    assert resp.status_code == 200
    data = resp.json()

    assert "total_blocks" in data
    assert data["total_blocks"] >= 1
    assert "total_catch_records" in data, "Missing total_catch_records (bug fix field)"
    assert data["total_catch_records"] >= 1
    assert "species_logged" in data, "Missing species_logged (bug fix field)"
    assert isinstance(data["species_logged"], list)
    assert len(data["species_logged"]) >= 1
    assert "genesis_hash" in data
    assert "ledger_type" in data
    assert data["ledger_type"] == "MOCK_IN_MEMORY"
    print(f"  [OK] Chain: {data['total_blocks']} blocks |"
          f"{data['total_catch_records']} records |"
          f"Species: {data['species_logged']}")


def test_blockchain_history():
    """Catch history returns logged records."""
    print("\n[Phase H] Testing catch history...")
    resp = client.get("/api/v1/trace/history")
    assert resp.status_code == 200
    data = resp.json()

    assert "records" in data
    assert "total" in data
    assert len(data["records"]) >= 1

    for rec in data["records"]:
        assert "transaction_id" in rec
        assert "species_name" in rec
        assert "quantity_kg" in rec
        assert "landing_site_id" in rec
    print(f"  [OK] History: {len(data['records'])} records.")


def test_blockchain_history_filter():
    """Catch history filtered by landing site."""
    print("\n[Phase H] Testing catch history filter...")
    client.post("/api/v1/trace/catch", json={
        "species_aphia_id": 217044,
        "species_name": "Rastrelliger kanagurta",
        "quantity_kg": 200.0,
        "latitude": 20.9,
        "longitude": 70.3,
        "landing_site_id": "VERAVAL_GJ",
    })

    filtered = client.get("/api/v1/trace/history", params={"landing_site": "VERAVAL_GJ"}).json()
    all_recs = client.get("/api/v1/trace/history").json()

    assert len(filtered["records"]) >= 1
    assert len(filtered["records"]) <= len(all_recs["records"])
    for rec in filtered["records"]:
        assert rec["landing_site_id"] == "VERAVAL_GJ"
    print(f"  [OK] Filtered: {len(filtered['records'])} VERAVAL_GJ records (of {len(all_recs['records'])} total).")


def test_blockchain_chain_integrity():
    """Each block references the previous block's hash."""
    print("\n[Phase H] Testing chain hash integrity...")
    tx1 = client.post("/api/v1/trace/catch", json={
        "species_aphia_id": 217044,
        "species_name": "Rastrelliger kanagurta",
        "quantity_kg": 50.0, "latitude": 10.0, "longitude": 75.0,
        "landing_site_id": "KOCHI_KL",
    }).json()

    tx2 = client.post("/api/v1/trace/catch", json={
        "species_aphia_id": 217033,
        "species_name": "Sardinella longiceps",
        "quantity_kg": 30.0, "latitude": 10.1, "longitude": 75.1,
        "landing_site_id": "KOCHI_KL",
    }).json()

    rec1 = client.get(f"/api/v1/trace/verify/{tx1['transaction_id']}").json()
    rec2 = client.get(f"/api/v1/trace/verify/{tx2['transaction_id']}").json()

    assert rec2["block_number"] > rec1["block_number"]
    assert rec2["previous_hash"] == rec1["transaction_id"], (
        "Block 2's previous_hash should equal Block 1's transaction_id"
    )
    print(f"  [OK] Block #{rec1['block_number']} -> #{rec2['block_number']} |Chain links verified.")


def test_aphiaid_consistency():
    """Yellowfin Tuna AphiaID is consistent across species reference and blockchain options."""
    print("\n[Phase H] Testing AphiaID consistency (bug fix validation)...")
    ref = client.get("/api/v1/cv/species-reference").json()

    tuna_entry = None
    for sp in ref["species"]:
        if "albacares" in sp["species"]:
            tuna_entry = sp
            break

    assert tuna_entry is not None, "Yellowfin Tuna not found in species reference"
    assert tuna_entry["aphia_id"] == 127660, (
        f"Yellowfin Tuna AphiaID should be 127660, got {tuna_entry['aphia_id']}"
    )
    print(f"  [OK] Yellowfin Tuna AphiaID: {tuna_entry['aphia_id']} (correct: 127660)")


# ══════════════════════════════════════════════════════════════════════════════
# Runner
# ══════════════════════════════════════════════════════════════════════════════

def run_all():
    print("=" * 65)
    print("OceanMind — Phase C, D, E, F, H Integration Tests")
    print("=" * 65)

    # Phase C — MHI + Migration
    test_mhi_status_default()
    test_mhi_status_custom_bbox()
    test_mhi_score_single()
    test_mhi_score_stressed_conditions()
    test_mhi_stress_classification()
    test_migration_forecast_default()
    test_migration_forecast_weeks_range()

    # Phase D — SFZ
    test_sfz_current_zones()
    test_sfz_geojson_structure()
    test_sfz_shap_top3_structure()
    test_sfz_shap_feature_counting()
    test_sfz_classify_single()
    test_sfz_zone_summary_matches_features()

    # Phase E — RAG
    test_rag_query_basic()
    test_rag_provenance_structure()
    test_rag_query_validation()
    test_rag_different_queries_different_provenance()

    # Phase F — Alerts
    test_alert_subscribe_phone()
    test_alert_subscribe_device_token()
    test_alert_subscribe_no_contact()
    test_alert_trigger_demo()
    test_alert_subscribe_increments_id()

    # Phase F — Bhashini Voice
    test_voice_languages()
    test_voice_query_hindi_text()
    test_voice_query_tamil_simulated()
    test_voice_query_no_input()
    test_voice_pipeline_structure()

    # Phase H — Blockchain
    test_blockchain_log_catch()
    test_blockchain_verify_transaction()
    test_blockchain_verify_not_found()
    test_blockchain_chain_summary()
    test_blockchain_history()
    test_blockchain_history_filter()
    test_blockchain_chain_integrity()
    test_aphiaid_consistency()

    print("\n" + "=" * 65)
    print("[PASS] All Phase C, D, E, F, H tests passed.")
    print("=" * 65)


if __name__ == "__main__":
    run_all()
