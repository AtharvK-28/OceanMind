export const NAV_ITEMS = [
  { label: "Fisher View", href: "/", icon: "ph ph-sailboat", section: "fisher" },
  { label: "Fishing Advisory", href: "/fishing-advisory", icon: "ph ph-target", section: "fisher" },
  { label: "Ask by Voice", href: "/voice", icon: "ph ph-microphone", section: "fisher" },
  { label: "Community Catch", href: "/community", icon: "ph ph-users-three", section: "fisher" },
  { label: "Ocean Footprint", href: "/footprint", icon: "ph ph-leaf", section: "fisher" },
  { label: "Dashboard", href: "/dashboard", icon: "ph ph-squares-four", section: "expert" },
  { label: "Impact", href: "/impact", icon: "ph ph-hand-heart", section: "expert" },
  { label: "Data Trust", href: "/trust", icon: "ph ph-shield-check", section: "expert" },
  { label: "Marine Health Index", href: "/mhi", icon: "ph ph-heartbeat", section: "expert" },
  { label: "Fishing Zones", href: "/sfz", icon: "ph ph-map-trifold", section: "expert" },
  { label: "Migration Forecast", href: "/migration", icon: "ph ph-fish", section: "expert" },
  { label: "Biodiversity & CV", href: "/biodiversity", icon: "ph ph-microscope", section: "expert" },
  { label: "Species Encyclopedia", href: "/species", icon: "ph ph-book-open", section: "expert" },
  { label: "Digital Twin", href: "/digital-twin", icon: "ph ph-globe-hemisphere-east", section: "expert" },
  { label: "Ask OceanMind", href: "/rag", icon: "ph ph-chat-circle-dots", section: "expert" },
  { label: "Catch Ledger", href: "/blockchain", icon: "ph ph-cube", section: "expert" },
  { label: "Alerts", href: "/alerts", icon: "ph ph-bell", section: "expert" },
  { label: "Plans & Pricing", href: "/pricing", icon: "ph ph-tag", section: "expert" },
];

export const SPECIES_OPTIONS: Record<string, number> = {
  "Indian Mackerel (AphiaID 217044)": 217044,
  "Oil Sardine (AphiaID 217033)": 217033,
  "Giant Tiger Prawn (AphiaID 158966)": 158966,
  "Yellowfin Tuna (AphiaID 127660)": 127660,
};

export const LANDING_SITES: Record<string, string> = {
  "Veraval, Gujarat": "VERAVAL_GJ",
  "Kochi, Kerala": "KOCHI_KL",
  "Chennai, Tamil Nadu": "CHENNAI_TN",
  "Visakhapatnam, AP": "VIZAG_AP",
  "Mangalore, Karnataka": "MANGALORE_KA",
};

export const SUGGESTED_RAG_QUERIES = [
  "Marine health near Gujarat this week",
  "What is a marine heatwave and how does OceanMind detect it?",
  "Which species dominate Kerala fishing landings?",
  "How does the ARGO float network work?",
  "What does a RED fishing zone mean?",
  "Explain IUU fishing detection via AIS",
];

export const REGIONS: Record<string, { lat: number; lng: number; zoom: number }> = {
  "All India": { lat: 15, lng: 78, zoom: 5 },
  "Gujarat Coast": { lat: 21.0, lng: 70.0, zoom: 7 },
  "Kerala Coast": { lat: 10.0, lng: 76.0, zoom: 7 },
  "Tamil Nadu Coast": { lat: 13.0, lng: 80.0, zoom: 7 },
  "Andhra Pradesh Coast": { lat: 16.5, lng: 82.5, zoom: 7 },
};
