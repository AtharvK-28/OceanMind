export interface HealthResponse {
  db: string;
  mhi_model: string;
  sfz_model: string;
  rag: string;
  blockchain: string;
  timestamp: string;
}

export interface MHICell {
  latitude: number;
  longitude: number;
  mhi_score: number;
  stress_level: "CRITICAL" | "WARNING" | "WATCH" | "NORMAL";
  alert: boolean;
}

export interface MHIStatusResponse {
  grid_cells: MHICell[];
  total_cells: number;
  alerts_active: number;
  computed_at: string;
  model: string;
}

export interface MHIScoreResponse {
  mhi_score: number;
  stress_level: string;
  alert: boolean;
  features_used: string[];
  thresholds: Record<string, number>;
}

export interface SHAPEntry {
  feature: string;
  value: number;
}

export interface SFZFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    ecological_class: "GREEN" | "AMBER" | "RED";
    bycatch_risk_score: number;
    shap_top3: SHAPEntry[];
    confidence: number;
  };
}

export interface SFZCurrentResponse {
  geojson: { type: "FeatureCollection"; features: SFZFeature[] };
  zone_summary: Record<string, number>;
  total_zones: number;
  week_start: string;
  model: string;
}

export interface SFZClassifyResponse {
  ecological_class: string;
  bycatch_risk_score: number;
  shap_top3: SHAPEntry[];
  confidence: number;
}

export interface MigrationFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    migration_probability: number;
    ci_lower: number;
    ci_upper: number;
    uncertainty: number;
  };
}

export interface MigrationForecastResponse {
  features: MigrationFeature[];
  model: string;
  uncertainty_method: string;
  weeks_ahead: number;
}

export interface CVDetection {
  detection_id: number;
  species_scientific: string;
  species_common: string;
  aphia_id: number;
  confidence: number;
  fork_length_mm: number;
  estimated_weight_g: number;
  source?: string;
}

export interface CVAnalyzeResponse {
  total_fish_detected: number;
  species_summary: Record<string, number>;
  detections: CVDetection[];
  model: string;
}

export interface EDNATaxon {
  species_scientific: string;
  species_common: string;
  aphia_id: number;
  read_count: number;
  confidence: number;
  detection_method: string;
  marker: string;
}

export interface EDNAAnalyzeResponse {
  sample_id: string;
  species_detected: number;
  total_reads: number;
  diversity_indices: { shannon_h: number; simpson_d: number; evenness_j: number };
  taxa: EDNATaxon[];
}

export interface SpeciesRef {
  species: string;
  common: string;
  aphia_id: number;
  worms: { aphia_id: number; status: string; worms_url: string };
  fishbase_url: string;
}

export interface SpeciesReferenceResponse {
  species_count: number;
  milestone_species: number[];
  species: SpeciesRef[];
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  sst_delta_c: number;
  duration_weeks: number;
}

export interface ScenarioPoint {
  lat: number;
  lon: number;
  baseline_mhi: number;
  projected_mhi: number;
  delta_mhi: number;
  alert_level: string;
}

export interface MigrationShiftPoint {
  lat: number;
  lon: number;
  baseline_prob: number;
  projected_prob: number;
  delta_prob: number;
}

export interface ScenarioResponse {
  scenario: { name: string; sst_delta_c: number; duration_weeks: number; severity: string };
  mhi_projection?: {
    grid_points: number;
    avg_delta_mhi: number;
    critical_cells: number;
    data: ScenarioPoint[];
    summary: string;
  };
  migration_shift?: {
    grid_points: number;
    poleward_shift_deg: number;
    data: MigrationShiftPoint[];
    summary: string;
  };
  computed_at: string;
  model: string;
}

export interface ProvenanceCitation {
  source_id: string;
  source_system: string;
  quality_flag: string;
  relevance_score: number;
  ingestion_ts: string;
}

export interface RAGQueryResponse {
  answer: string;
  provenance: ProvenanceCitation[];
  answer_id: string;
  model_used: string;
  timestamp: string;
}

export interface CatchTraceResponse {
  transaction_id: string;
  pmmsy_cert_ref: string;
  block_number: number;
  status: string;
}

export interface ChainSummaryResponse {
  total_blocks: number;
  total_catch_records: number;
  species_logged: string[];
  genesis_hash: string;
  ledger_type: string;
}

export interface CatchRecord {
  transaction_id: string;
  block_number: number;
  species_name: string;
  quantity_kg: number;
  latitude: number;
  longitude: number;
  landing_site_id: string;
  event_timestamp: string;
  pmmsy_cert_ref: string;
}

export interface VoiceQueryResponse {
  query: { original_text: string; english_text: string; language: string; stt_source: string };
  answer: { english: string; localized: string; language: string };
  provenance: ProvenanceCitation[];
  pipeline: { stt: string; nmt: string; rag: string; tts: string };
  tts: { enabled: boolean; audio_base64: string | null };
}

export interface VoiceLanguage {
  code: string;
  name: string;
  native: string;
  status: string;
}
