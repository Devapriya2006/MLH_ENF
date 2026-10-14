export const CATEGORIES = ['pothole','garbage','streetlight','water_leakage','road_damage','waterlogging','fallen_tree','traffic_sign','other'];
export const STATUSES = ['reported','ai_verified','assigned','in_progress','resolved','citizen_verified'];
export const CLOSED = ['resolved','citizen_verified'];
export const DEPARTMENTS = {
  pothole: 'Road & Transport',
  road_damage: 'Road & Transport',
  traffic_sign: 'Traffic Police / Road & Transport',
  streetlight: 'Electrical Department',
  garbage: 'Solid Waste Management',
  water_leakage: 'Water Supply Department',
  waterlogging: 'Drainage & Sewerage',
  fallen_tree: 'Parks & Horticulture',
  other: 'General Administration',
};
export const CATEGORY_RISK = {
  pothole: 80, waterlogging: 85, fallen_tree: 75, streetlight: 60,
  water_leakage: 55, traffic_sign: 60, road_damage: 55, garbage: 45, other: 30,
};
export const DUP_RADIUS = Number(process.env.DUP_RADIUS_M) || 50;
export const VERIFY_THRESHOLD = Number(process.env.VERIFY_THRESHOLD) || 1;
export const MAX_LOCATION_ACCURACY_M = Number(process.env.MAX_LOCATION_ACCURACY_M) || 20;
