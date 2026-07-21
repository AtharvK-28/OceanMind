export const INDIA_BOUNDS: [[number, number], [number, number]] = [[4, 58], [26, 102]];
export const INDIA_CENTER: [number, number] = [15, 80];
export const INDIA_ZOOM = 5;

export interface FishingZone {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
  bbox: [[number, number], [number, number]];
  description: string;
}

export const INDIAN_ZONES: FishingZone[] = [
  { id: "all",        name: "Full Indian EEZ",      center: [15, 80],   zoom: 5,  bbox: [[5,60],[25,100]], description: "5°–25°N, 60°–100°E" },
  { id: "veraval",    name: "Veraval Bank (GJ)",    center: [21, 69],   zoom: 7,  bbox: [[19,67],[23,72]], description: "Gujarat • Saurashtra shelf" },
  { id: "kochi",      name: "Kochi Shelf (KL)",     center: [10, 76],   zoom: 7,  bbox: [[8,74],[12,78]],  description: "Kerala • Lakshadweep Sea" },
  { id: "vizag",      name: "Vizag Bank (AP)",      center: [17, 83],   zoom: 7,  bbox: [[15,81],[19,86]], description: "Andhra Pradesh shelf" },
  { id: "mangalore",  name: "Mangalore (KA)",       center: [13, 74.5], zoom: 7,  bbox: [[11,73],[15,76]], description: "Karnataka coast" },
  { id: "paradip",    name: "Paradip Shelf (OD)",   center: [20.3, 86.7],zoom: 7, bbox: [[18,85],[22,89]], description: "Odisha • Bay of Bengal" },
  { id: "gulf-mannar","name": "Gulf of Mannar (TN)",center: [9, 79],    zoom: 7,  bbox: [[7,77],[11,81]],  description: "Tamil Nadu coast" },
  { id: "andaman",    name: "Andaman Sea",          center: [12, 93],   zoom: 6,  bbox: [[8,91],[16,95]],  description: "Andaman & Nicobar EEZ" },
];
