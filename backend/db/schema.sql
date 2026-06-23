-- =============================================================================
-- OceanMind — Core Database Schema (Phase A)
-- PostGIS must be enabled: CREATE EXTENSION IF NOT EXISTS postgis;
-- Run: psql -U postgres -d oceanmind -f schema.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- DATA BUBBLES — Unified spatiotemporal join key (core abstraction)
-- Adaptive radius: 5km coastal / 50km open ocean
-- Every observation table carries a bubble_id FK
-- =============================================================================
CREATE TABLE IF NOT EXISTS data_bubbles (
    bubble_id           SERIAL PRIMARY KEY,
    geom                GEOMETRY(POINT, 4326) NOT NULL,
    radius_km           FLOAT NOT NULL,       -- 5.0 coastal / 50.0 open ocean
    time_window_start   TIMESTAMPTZ NOT NULL,
    time_window_end     TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bubbles_geom
    ON data_bubbles USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_bubbles_time
    ON data_bubbles (time_window_start, time_window_end);

-- =============================================================================
-- PILLAR 1 — Oceanographic
-- =============================================================================

-- ARGO float CTD profiles
CREATE TABLE IF NOT EXISTS argo_profiles (
    profile_id      SERIAL PRIMARY KEY,
    bubble_id       INT REFERENCES data_bubbles(bubble_id),
    float_id        VARCHAR(20) NOT NULL,       -- WMO float ID
    platform_num    VARCHAR(20),
    datetime        TIMESTAMPTZ NOT NULL,
    latitude        FLOAT NOT NULL,
    longitude       FLOAT NOT NULL,
    depth_m         FLOAT,                      -- converted from dbar: 0.994*pres
    temperature_c   FLOAT,
    salinity_psu    FLOAT,                      -- PSU (dimensionless)
    dissolved_o2    FLOAT,                      -- µmol/kg
    ph              FLOAT,
    quality_flag    VARCHAR(16) DEFAULT 'PROBABLY_GOOD',  -- GOOD/PROBABLY_GOOD/BAD/MISSING
    source_system   VARCHAR(32) DEFAULT 'ARGO_GDAC',
    ingestion_ts    TIMESTAMPTZ DEFAULT NOW(),
    schema_version  VARCHAR(8) DEFAULT '1.0'
);

CREATE INDEX IF NOT EXISTS idx_argo_bubble   ON argo_profiles (bubble_id);
CREATE INDEX IF NOT EXISTS idx_argo_datetime ON argo_profiles (datetime);
CREATE INDEX IF NOT EXISTS idx_argo_floatid  ON argo_profiles (float_id);

-- INCOIS SST composites (weekly)
CREATE TABLE IF NOT EXISTS incois_sst (
    raster_id           SERIAL PRIMARY KEY,
    bubble_id           INT REFERENCES data_bubbles(bubble_id),
    composite_date      DATE NOT NULL,
    latitude            FLOAT NOT NULL,
    longitude           FLOAT NOT NULL,
    sst_c               FLOAT,                  -- Sea Surface Temperature °C
    chlorophyll_mgl     FLOAT,                  -- Chl-a mg/L
    pfz_advisory        VARCHAR(128),           -- Pillar 2 cross-pillar: PFZ zone advisory text
    ssh_anomaly         FLOAT,                  -- Sea Surface Height anomaly (m)
    mld_m               FLOAT,                  -- Mixed Layer Depth (m)
    wind_stress_curl    FLOAT,
    quality_flag        VARCHAR(16) DEFAULT 'GOOD',
    source_system       VARCHAR(32) DEFAULT 'INCOIS',
    ingestion_ts        TIMESTAMPTZ DEFAULT NOW(),
    schema_version      VARCHAR(8) DEFAULT '1.0'
);

CREATE INDEX IF NOT EXISTS idx_incois_bubble ON incois_sst (bubble_id);
CREATE INDEX IF NOT EXISTS idx_incois_date   ON incois_sst (composite_date);

-- =============================================================================
-- PILLAR 2 — Fisheries
-- =============================================================================

-- GFW AIS (post quality pipeline)
CREATE TABLE IF NOT EXISTS gfw_ais (
    record_id       SERIAL PRIMARY KEY,
    bubble_id       INT REFERENCES data_bubbles(bubble_id),
    mmsi            VARCHAR(20),                -- Maritime Mobile Service Identity (deduped)
    vessel_name     VARCHAR(128),
    flag_state      VARCHAR(4),
    datetime        TIMESTAMPTZ NOT NULL,
    latitude        FLOAT NOT NULL,
    longitude       FLOAT NOT NULL,
    sog             FLOAT,                      -- Speed Over Ground (knots)
    cog             FLOAT,                      -- Course Over Ground (degrees)
    fishing_hours   FLOAT DEFAULT 0.0,
    iuu_flag        BOOLEAN DEFAULT FALSE,
    quality_flag    VARCHAR(16) DEFAULT 'GOOD',
    source_system   VARCHAR(32) DEFAULT 'GFW',
    ingestion_ts    TIMESTAMPTZ DEFAULT NOW(),
    schema_version  VARCHAR(8) DEFAULT '1.0'
);

CREATE INDEX IF NOT EXISTS idx_ais_bubble   ON gfw_ais (bubble_id);
CREATE INDEX IF NOT EXISTS idx_ais_mmsi     ON gfw_ais (mmsi);
CREATE INDEX IF NOT EXISTS idx_ais_datetime ON gfw_ais (datetime);

-- =============================================================================
-- PILLAR 3 — Molecular Biodiversity / eDNA
-- =============================================================================

CREATE TABLE IF NOT EXISTS edna_occurrences (
    occurrence_id       SERIAL PRIMARY KEY,
    bubble_id           INT REFERENCES data_bubbles(bubble_id),
    species_aphia_id    INT NOT NULL,           -- WoRMS AphiaID (canonical key)
    species_name        VARCHAR(256),           -- WoRMS canonical name
    latitude            FLOAT NOT NULL,
    longitude           FLOAT NOT NULL,
    collection_date     DATE,
    sequence_hash       VARCHAR(64),            -- SHA-256 of raw sequence for dedup
    detection_method    VARCHAR(32),            -- BLAST / CNN / OCCURRENCE
    database_source     VARCHAR(64),            -- NCBI / BOLD / IndOBIS / OBIS
    confidence          FLOAT,                  -- 0.0–1.0
    quality_flag        VARCHAR(16) DEFAULT 'PROBABLY_GOOD',
    source_system       VARCHAR(32) DEFAULT 'NCBI_SRA',
    ingestion_ts        TIMESTAMPTZ DEFAULT NOW(),
    schema_version      VARCHAR(8) DEFAULT '1.0'
);

CREATE INDEX IF NOT EXISTS idx_edna_bubble  ON edna_occurrences (bubble_id);
CREATE INDEX IF NOT EXISTS idx_edna_aphia   ON edna_occurrences (species_aphia_id);

-- =============================================================================
-- LANDING SITE CV — Computer Vision output from catch photos
-- =============================================================================

CREATE TABLE IF NOT EXISTS landing_site_cv (
    cv_id               SERIAL PRIMARY KEY,
    bubble_id           INT REFERENCES data_bubbles(bubble_id),
    landing_site_id     VARCHAR(32) NOT NULL,
    fisher_id           VARCHAR(64),            -- anonymised token only, never real ID
    species_aphia_id    INT,                    -- WoRMS AphiaID
    species_name        VARCHAR(256),
    fork_length_mm      FLOAT,
    weight_g            FLOAT,
    cpue                FLOAT,                  -- Catch Per Unit Effort
    confidence          FLOAT,                  -- species ID confidence 0.0–1.0
    image_path          VARCHAR(512),           -- relative path; no PII in filename
    datetime            TIMESTAMPTZ NOT NULL,
    quality_flag        VARCHAR(16) DEFAULT 'GOOD',
    source_system       VARCHAR(32) DEFAULT 'LANDING_CV',
    ingestion_ts        TIMESTAMPTZ DEFAULT NOW(),
    schema_version      VARCHAR(8) DEFAULT '1.0'
);

CREATE INDEX IF NOT EXISTS idx_cv_bubble  ON landing_site_cv (bubble_id);
CREATE INDEX IF NOT EXISTS idx_cv_site    ON landing_site_cv (landing_site_id);

-- =============================================================================
-- SFZ OUTPUT — Weekly sustainable fishing zone classifications
-- =============================================================================

CREATE TABLE IF NOT EXISTS sfz_output (
    zone_id             SERIAL PRIMARY KEY,
    grid_cell_id        VARCHAR(32) NOT NULL,   -- e.g. "LAT_12.5_LON_74.0"
    latitude            FLOAT NOT NULL,
    longitude           FLOAT NOT NULL,
    week_start          DATE NOT NULL,
    ecological_class    VARCHAR(8) NOT NULL,    -- GREEN / AMBER / RED
    bycatch_risk_score  FLOAT,                  -- 0.0–1.0 from JSDM
    shap_top3           JSONB,                  -- [{"feature":"sst","value":0.34}, ...]
    model_version       VARCHAR(16) DEFAULT '1.0',
    -- legal_status column added in Phase 2 via ALTER TABLE
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sfz_week  ON sfz_output (week_start);
CREATE INDEX IF NOT EXISTS idx_sfz_class ON sfz_output (ecological_class);

-- =============================================================================
-- PROVENANCE LOG — Every record + AI output traceable to source
-- =============================================================================

CREATE TABLE IF NOT EXISTS provenance_log (
    record_id       SERIAL PRIMARY KEY,
    source_table    VARCHAR(64),
    source_system   VARCHAR(64),
    ingestion_ts    TIMESTAMPTZ,
    schema_version  VARCHAR(8),
    quality_flag    VARCHAR(16),
    fusion_method   VARCHAR(64),
    ai_answer_id    VARCHAR(64),               -- links RAG answers to source records
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ALERT SUBSCRIPTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS alert_subscriptions (
    sub_id          SERIAL PRIMARY KEY,
    phone           VARCHAR(20),               -- E.164 format
    device_token    VARCHAR(256),              -- Firebase FCM token
    language        VARCHAR(8) DEFAULT 'en',  -- 'hi' Hindi / 'ta' Tamil / 'en' English
    alert_types     VARCHAR[] DEFAULT ARRAY['zone_change', 'mhw', 'cyclone'],
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CATCH TRACE LOG — Mock blockchain records (Phase H)
-- MOCK_LEDGER: replaced with Hyperledger Fabric 2.5 in Phase 2
-- =============================================================================

CREATE TABLE IF NOT EXISTS catch_trace_log (
    id              SERIAL PRIMARY KEY,
    transaction_id  VARCHAR(64) UNIQUE NOT NULL,  -- SHA-256 hash
    species_aphia_id INT,
    species_name    VARCHAR(256),
    quantity_kg     FLOAT,
    latitude        FLOAT,
    longitude       FLOAT,
    landing_site_id VARCHAR(32),
    event_timestamp TIMESTAMPTZ NOT NULL,
    pmmsy_cert_ref  VARCHAR(64),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Verification query — run after seeding to confirm bubble joins work
-- SELECT b.bubble_id, a.temperature_c, s.sst_c
-- FROM data_bubbles b
-- LEFT JOIN argo_profiles a ON a.bubble_id = b.bubble_id
-- LEFT JOIN incois_sst s    ON s.bubble_id = b.bubble_id
-- WHERE b.bubble_id = 247;
-- =============================================================================
