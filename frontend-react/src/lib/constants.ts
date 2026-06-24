export const NAV_ITEMS = [
  { label: "Fisher View", href: "/", icon: "🚤", section: "fisher" },
  { label: "Dashboard", href: "/dashboard", icon: "📊", section: "expert" },
  { label: "Marine Health Index", href: "/mhi", icon: "🌡️", section: "expert" },
  { label: "Fishing Zones", href: "/sfz", icon: "🎣", section: "expert" },
  { label: "Migration Forecast", href: "/migration", icon: "🐟", section: "expert" },
  { label: "Biodiversity & CV", href: "/biodiversity", icon: "🔬", section: "expert" },
  { label: "Digital Twin", href: "/digital-twin", icon: "🌐", section: "expert" },
  { label: "Ask OceanMind", href: "/rag", icon: "💬", section: "expert" },
  { label: "Catch Ledger", href: "/blockchain", icon: "⛓️", section: "expert" },
  { label: "Alerts", href: "/alerts", icon: "🔔", section: "expert" },
  { label: "Voice", href: "/voice", icon: "🗣️", section: "expert" },
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
