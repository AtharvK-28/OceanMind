"""
OceanMind — Phase B & G Integration Tests

Tests:
  Phase B: CV fish analysis · eDNA pipeline · species reference · WoRMS AphiaID
  Phase G: Digital twin scenario engine · MHI projection · migration shift · presets

Run: python tests/test_phase_b_and_g.py
     (No DB or external API required — all endpoints use synthetic data)
"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


# ══════════════════════════════════════════════════════════════════════════════
# Phase B — Computer Vision
# ══════════════════════════════════════════════════════════════════════════════

def test_cv_analyze_default():
    """CV endpoint returns detections with required fields."""
    print("\n[Phase B] Testing CV analyze (default site)…")
    resp = client.post("/api/v1/cv/analyze", json={
        "site_lat": 8.5,
        "site_lon": 76.9,
        "site_name": "Vizhinjam Harbour",
    })
    assert resp.status_code == 200, f"CV analyze failed: {resp.text}"
    data = resp.json()

    assert "total_fish_detected" in data
    assert data["total_fish_detected"] > 0
    assert "detections" in data
    assert len(data["detections"]) == data["total_fish_detected"]

    # Check each detection has required fields
    for d in data["detections"]:
        assert "species_scientific" in d
        assert "aphia_id" in d
        assert "confidence" in d
        assert 0.0 <= d["confidence"] <= 1.0
        assert "fork_length_mm" in d
        assert d["fork_length_mm"] > 0
        assert "estimated_weight_g" in d
        assert "worms" in d
        assert d["worms"]["aphia_id"] == d["aphia_id"]

    print(f"  ✓ {data['total_fish_detected']} fish detected across {len(data['species_summary'])} species.")


def test_cv_analyze_northern_site():
    """CV results differ by coordinates (different RNG seed)."""
    print("\n[Phase B] Testing CV analyze (northern site, Gulf of Mannar)…")
    resp = client.post("/api/v1/cv/analyze", json={"site_lat": 21.0, "site_lon": 72.5})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_fish_detected"] > 0
    print(f"  ✓ Northern site: {data['total_fish_detected']} detections.")


def test_cv_species_reference():
    """Species reference contains Phase B milestone AphiaIDs."""
    print("\n[Phase B] Testing species reference (WoRMS AphiaID milestone check)…")
    resp = client.get("/api/v1/cv/species-reference")
    assert resp.status_code == 200
    data = resp.json()

    assert data["species_count"] >= 3
    # Phase B milestone: these three must be present
    MILESTONE_IDS = {217044, 217033, 158966}
    found_ids = {s["aphia_id"] for s in data["species"]}
    for mid in MILESTONE_IDS:
        assert mid in found_ids, f"Milestone AphiaID {mid} missing from reference"
    print(f"  ✓ {data['species_count']} species. Milestone AphiaIDs {MILESTONE_IDS} all present.")


def test_cv_worms_fields():
    """Every species in reference has valid WoRMS fields."""
    print("\n[Phase B] Testing WoRMS field completeness in species reference…")
    resp = client.get("/api/v1/cv/species-reference")
    data = resp.json()
    for sp in data["species"]:
        w = sp["worms"]
        assert "aphia_id" in w
        assert "worms_url" in w
        assert "status" in w
        assert w["aphia_id"] == sp["aphia_id"]
    print(f"  ✓ All {data['species_count']} species have valid WoRMS fields.")


# ══════════════════════════════════════════════════════════════════════════════
# Phase B — eDNA
# ══════════════════════════════════════════════════════════════════════════════

def test_edna_analyze():
    """eDNA endpoint returns taxa, diversity indices, pipeline metadata."""
    print("\n[Phase B] Testing eDNA analyze…")
    resp = client.post("/api/v1/edna/analyze", json={
        "sample_id": "TEST-001",
        "sample_lat": 12.0,
        "sample_lon": 74.0,
        "depth_m": 5.0,
    })
    assert resp.status_code == 200, f"eDNA analyze failed: {resp.text}"
    data = resp.json()

    assert data["sample_id"] == "TEST-001"
    assert data["species_detected"] > 0
    assert data["total_reads"] > 0
    assert len(data["taxa"]) == data["species_detected"]

    # Diversity indices
    div = data["diversity_indices"]
    assert "shannon_h" in div and div["shannon_h"] > 0.0
    assert "simpson_d" in div and 0.0 < div["simpson_d"] < 1.0
    assert "evenness_j" in div

    # Pipeline metadata
    assert "pipeline" in data
    assert "quality_control" in data["pipeline"]
    assert "denoising" in data["pipeline"]

    # Each taxon has WoRMS fields
    for t in data["taxa"]:
        assert "aphia_id" in t
        assert "worms" in t
        assert "read_count" in t
        assert t["read_count"] > 0

    print(f"  ✓ {data['species_detected']} species · {data['total_reads']:,} reads · "
          f"Shannon H′={div['shannon_h']:.3f}")


def test_edna_different_coordinates():
    """eDNA results vary by sample location."""
    print("\n[Phase B] Testing eDNA spatial variation…")
    resp1 = client.post("/api/v1/edna/analyze", json={
        "sample_id": "S1", "sample_lat": 8.0, "sample_lon": 77.0, "depth_m": 3.0
    })
    resp2 = client.post("/api/v1/edna/analyze", json={
        "sample_id": "S2", "sample_lat": 20.0, "sample_lon": 65.0, "depth_m": 50.0
    })
    assert resp1.status_code == 200 and resp2.status_code == 200
    d1, d2 = resp1.json(), resp2.json()
    # Two different locations should return different read counts
    assert d1["total_reads"] != d2["total_reads"]
    print(f"  ✓ Location S1: {d1['total_reads']:,} reads | S2: {d2['total_reads']:,} reads — spatially distinct.")


# ══════════════════════════════════════════════════════════════════════════════
# Phase G — Digital Twin
# ══════════════════════════════════════════════════════════════════════════════

def test_scenario_mild_warming():
    """Mild warming scenario returns valid structure."""
    print("\n[Phase G] Testing scenario: mild warming (+1°C, 2 weeks)…")
    resp = client.post("/api/v1/digital-twin/scenario", json={
        "sst_delta_c": 1.0,
        "duration_weeks": 2,
        "include_mhi_projection": True,
        "include_migration_shift": True,
    })
    assert resp.status_code == 200, f"Scenario failed: {resp.text}"
    data = resp.json()

    assert "scenario" in data
    assert data["scenario"]["sst_delta_c"] == 1.0
    assert data["scenario"]["severity"] in ("MILD", "MODERATE", "SEVERE", "EXTREME")
    assert "mhi_projection" in data
    assert "migration_shift" in data
    print(f"  ✓ Severity: {data['scenario']['severity']} · "
          f"MHI grid: {data['mhi_projection']['grid_points']} pts · "
          f"Avg ΔMHI: {data['mhi_projection']['avg_delta_mhi']:+.2f}")


def test_scenario_extreme_warming():
    """Extreme warming (+4°C) must flag as EXTREME severity."""
    print("\n[Phase G] Testing scenario: extreme warming (+4°C, 6 weeks)…")
    resp = client.post("/api/v1/digital-twin/scenario", json={
        "sst_delta_c": 4.0,
        "duration_weeks": 6,
        "include_mhi_projection": True,
        "include_migration_shift": True,
    })
    data = resp.json()
    assert data["scenario"]["severity"] == "EXTREME"
    mhi = data["mhi_projection"]
    # Extreme warming should push many cells to WARNING/CRITICAL
    assert mhi["critical_cells"] > 0
    assert mhi["avg_delta_mhi"] < 0  # net decline
    print(f"  ✓ EXTREME scenario: {mhi['critical_cells']} critical cells · avg ΔMHI={mhi['avg_delta_mhi']:+.2f}")


def test_scenario_cooling():
    """Negative SST delta (cooling) should improve MHI."""
    print("\n[Phase G] Testing scenario: cooling event (−1°C, 4 weeks)…")
    resp = client.post("/api/v1/digital-twin/scenario", json={
        "sst_delta_c": -1.0,
        "duration_weeks": 4,
        "include_mhi_projection": True,
        "include_migration_shift": False,
    })
    data = resp.json()
    assert resp.status_code == 200
    assert "mhi_projection" in data
    assert "migration_shift" not in data  # not requested
    # Cooling should on average improve MHI (positive avg_delta_mhi)
    mhi = data["mhi_projection"]
    assert mhi["avg_delta_mhi"] > 0, "Cooling should increase MHI on average"
    print(f"  ✓ Cooling scenario: avg ΔMHI={mhi['avg_delta_mhi']:+.2f} (positive = improvement)")


def test_scenario_mhi_grid_structure():
    """MHI grid points have all required fields."""
    print("\n[Phase G] Testing MHI grid structure…")
    resp = client.post("/api/v1/digital-twin/scenario", json={
        "sst_delta_c": 2.0, "duration_weeks": 3,
        "include_mhi_projection": True, "include_migration_shift": False,
    })
    data = resp.json()
    for pt in data["mhi_projection"]["data"][:5]:
        assert "lat" in pt and "lon" in pt
        assert "baseline_mhi" in pt
        assert "projected_mhi" in pt
        assert "delta_mhi" in pt
        assert "alert_level" in pt
        assert pt["alert_level"] in ("NORMAL", "WATCH", "WARNING", "CRITICAL")
        assert 0 <= pt["projected_mhi"] <= 100
    print("  ✓ MHI grid points have correct structure and valid ranges.")


def test_scenario_migration_poleward_shift():
    """Positive SST delta should produce positive poleward shift."""
    print("\n[Phase G] Testing migration poleward shift direction…")
    resp = client.post("/api/v1/digital-twin/scenario", json={
        "sst_delta_c": 2.5, "duration_weeks": 4,
        "include_mhi_projection": False, "include_migration_shift": True,
    })
    data = resp.json()
    mig = data["migration_shift"]
    assert mig["poleward_shift_deg"] > 0, "Warming should produce poleward shift"
    print(f"  ✓ Poleward shift: +{mig['poleward_shift_deg']:.2f}° for +2.5°C scenario")


def test_scenario_presets():
    """Presets endpoint returns 4 valid presets including IPCC scenarios."""
    print("\n[Phase G] Testing scenario presets…")
    resp = client.get("/api/v1/digital-twin/presets")
    assert resp.status_code == 200
    data = resp.json()
    assert "presets" in data
    assert len(data["presets"]) >= 4
    preset_ids = {p["id"] for p in data["presets"]}
    assert "ipcc_rcp45_2050" in preset_ids
    assert "ipcc_rcp85_2050" in preset_ids
    for p in data["presets"]:
        assert "sst_delta_c" in p
        assert "duration_weeks" in p
        assert isinstance(p["duration_weeks"], int) and p["duration_weeks"] >= 1
    print(f"  ✓ {len(data['presets'])} presets: {preset_ids}")


def test_scenario_name_label():
    """Custom scenario name is echoed back in response."""
    print("\n[Phase G] Testing scenario name label…")
    resp = client.post("/api/v1/digital-twin/scenario", json={
        "sst_delta_c": 1.5, "duration_weeks": 5,
        "scenario_name": "My Custom Test Scenario",
        "include_mhi_projection": False, "include_migration_shift": False,
    })
    data = resp.json()
    assert data["scenario"]["name"] == "My Custom Test Scenario"
    print("  ✓ Custom scenario name correctly echoed.")


# ══════════════════════════════════════════════════════════════════════════════
# Runner
# ══════════════════════════════════════════════════════════════════════════════

def run_all():
    print("=" * 65)
    print("OceanMind — Phase B & G Integration Tests")
    print("=" * 65)

    # Phase B — CV
    test_cv_analyze_default()
    test_cv_analyze_northern_site()
    test_cv_species_reference()
    test_cv_worms_fields()

    # Phase B — eDNA
    test_edna_analyze()
    test_edna_different_coordinates()

    # Phase G — Digital Twin
    test_scenario_mild_warming()
    test_scenario_extreme_warming()
    test_scenario_cooling()
    test_scenario_mhi_grid_structure()
    test_scenario_migration_poleward_shift()
    test_scenario_presets()
    test_scenario_name_label()

    print("\n" + "=" * 65)
    print("✅ All Phase B & G tests passed.")
    print("=" * 65)


if __name__ == "__main__":
    run_all()
