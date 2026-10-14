import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import { CATEGORIES, DEPARTMENTS } from '../utils/constants.js';
import { computePriority } from '../utils/priority.js';

// Coordinates centered around demo city coordinates (32.345, 44.357)
const CENTER = { lat: 32.3452, lng: 44.3572 };

// 5 City Zones and coordinate offsets
const ZONES = [
  { name: 'Central', latOffset: 0.0, lngOffset: 0.0 },
  { name: 'North', latOffset: 0.015, lngOffset: 0.005 },
  { name: 'West', latOffset: -0.003, lngOffset: -0.018 },
  { name: 'East', latOffset: 0.004, lngOffset: 0.019 },
  { name: 'South', latOffset: -0.016, lngOffset: -0.004 },
];

const TEMPLATES = {
  pothole: [
    'Large pothole on main road causing vehicle damage',
    'Deep asphalt crater near intersection',
    'Recurrent depression expanding after rain',
    'Multiple potholes on transit corridor',
  ],
  road_damage: [
    'Cracked and broken road surface',
    'Long structural fissure on boulevard',
    'Pavement edge deterioration and subsidence',
    'Asphalt crumbling near flyover ramp',
  ],
  waterlogging: [
    'Severe waterlogging obstructing lanes',
    'Stagnant rainwater pool blocking crossing',
    'Monsoon runoff overflow across service road',
    'Submerged roadway with hydroplaning risk',
  ],
  drainage: [
    'Blocked storm drain overflowing onto street',
    'Dislodged manhole frame causing dangerous bumps',
    'Clogged sewer grate causing sidewalk flooding',
    'Damaged catch basin filled with silt',
  ],
  streetlight: [
    'Streetlight out along critical blind curve',
    'Dual LED mast flickering and dark at junction',
    'Damaged lamppost pole following gusty winds',
    'Entire street corridor lighting failure',
  ],
  traffic_sign: [
    'Damaged speed limit sign bent backward',
    'Missing stop sign at high-traffic intersection',
    'Faded pedestrian crosswalk thermoplastic markings',
    'Overgrown tree branches obscuring warning sign',
  ],
  garbage: [
    'Overflowing dumpster spill encroaching roadway',
    'Construction debris dumped on sidewalk',
    'Waste mound creating traffic bottle-neck',
  ],
  water_leakage: [
    'Underground main water pipe burst flooding road',
    'High-pressure utility valve leaking across pavement',
  ],
  other: [
    'Damaged safety guard rail along highway divider',
    'Fallen tree limbs blocking lane',
  ],
};

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578874691223-a49267429148?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
];

const TEAMS = [
  'Road Maintenance Team',
  'Inspection Team',
  'Drainage Team',
  'Electrical Team',
  'Utility Team',
];

const LOCATIONS = [
  { addr: "32, MG Road, Near Domino's", zone: 'Central' },
  { addr: 'Near City Park, Sector 4', zone: 'Central' },
  { addr: 'Jalan Budi Utomo Commercial Strip', zone: 'East' },
  { addr: 'Jalan Merdeka, Junction 12', zone: 'North' },
  { addr: 'Near Community Center, Green Park', zone: 'West' },
  { addr: 'Tolleyhowki Market, Gate 3', zone: 'South' },
  { addr: 'Lumine Hotel East Boulevard', zone: 'East' },
  { addr: 'Near Central Library Boulevard', zone: 'Central' },
  { addr: 'Jalan Wahid Hasyim Ring Road', zone: 'North' },
  { addr: 'City Park South Entry', zone: 'Central' },
  { addr: 'Metro Station Plaza Avenue', zone: 'Central' },
  { addr: 'Riverside Park Promenade', zone: 'West' },
  { addr: 'Tech Park Expressway Exit 2', zone: 'East' },
  { addr: 'Sunrise Hospital Access Road', zone: 'South' },
];

export async function seedInitialData() {
  const adminExists = await User.findOne({ role: 'admin' });
  const complaintCount = await Complaint.countDocuments();

  if (adminExists && complaintCount >= 20) {
    return; // Already populated
  }

  console.log('Seeding initial official admin, citizens and complaint data...');
  const adminHash = await bcrypt.hash('admin123', 10);
  const citizenHash = await bcrypt.hash('password123', 10);

  // 1. Create or ensure Admin account
  let admin = await User.findOne({ email: 'admin@civiclens.dev' });
  if (!admin) {
    admin = await User.create({
      name: 'Vikram',
      email: 'admin@civiclens.dev',
      passwordHash: adminHash,
      role: 'admin',
      department: 'City Inspector',
      points: 280,
    });
  }

  // 2. Create sample citizens
  const citizenNames = ['Aarav', 'Diya', 'Rohan', 'Ananya', 'Kabir', 'Meera', 'Ishaan', 'Sana', 'Vihaan', 'Tara'];
  const citizens = [];
  for (const name of citizenNames) {
    const email = `${name.toLowerCase()}@civiclens.dev`;
    let u = await User.findOne({ email });
    if (!u) {
      u = await User.create({
        name,
        email,
        passwordHash: citizenHash,
        role: 'citizen',
        points: Math.floor(Math.random() * 80) + 15,
      });
    }
    citizens.push(u);
  }

  // 3. Create complaints if needed
  if (complaintCount < 20) {
    const statuses = ['reported', 'ai_verified', 'assigned', 'in_progress', 'resolved', 'citizen_verified'];
    const docs = [];
    const now = Date.now();

    for (let i = 0; i < 52; i++) {
      const loc = LOCATIONS[i % LOCATIONS.length];
      const zoneObj = ZONES.find(z => z.name === loc.zone) || ZONES[0];
      const category = CATEGORIES[i % CATEGORIES.length];
      const templateList = TEMPLATES[category] || TEMPLATES.pothole;
      const title = templateList[i % templateList.length];

      // Time created over the last 150 days (5 months)
      const daysAgo = (i * 2.8) % 150;
      const createdAt = new Date(now - daysAgo * 86_400_000);

      // Status
      let status = statuses[i % statuses.length];
      if (daysAgo < 5) status = (i % 2 === 0) ? 'reported' : 'assigned';
      const isResolved = ['resolved', 'citizen_verified'].includes(status);
      const resolvedAt = isResolved ? new Date(createdAt.getTime() + (Math.random() * 3 + 1) * 86_400_000) : null;

      // Coordinate jitter around zone center
      const latJitter = (Math.random() - 0.5) * 0.008;
      const lngJitter = (Math.random() - 0.5) * 0.008;
      const lat = CENTER.lat + zoneObj.latOffset + latJitter;
      const lng = CENTER.lng + zoneObj.lngOffset + lngJitter;

      // Severity (0 to 100)
      let aiSeverity = 35 + ((i * 13) % 60);
      if (i % 4 === 0) aiSeverity = 85 + (i % 12); // ensure critical ones
      else if (i % 3 === 0) aiSeverity = 20 + (i % 15); // ensure low ones

      const confirmations = citizens.slice(0, (i % 7) + 1).map(c => c._id);
      const team = TEAMS[i % TEAMS.length];

      const statusHistory = [
        { status: 'reported', by: citizens[i % citizens.length]._id, at: createdAt },
      ];
      if (status !== 'reported') {
        statusHistory.push({ status: 'assigned', by: admin._id, at: new Date(createdAt.getTime() + 18e5) });
      }
      if (['in_progress', 'resolved', 'citizen_verified'].includes(status)) {
        statusHistory.push({ status: 'in_progress', by: admin._id, at: new Date(createdAt.getTime() + 36e5 * 6) });
      }
      if (isResolved) {
        statusHistory.push({ status: 'resolved', by: admin._id, at: resolvedAt });
      }

      const c = new Complaint({
        reporter: citizens[i % citizens.length]._id,
        category,
        aiConfidence: Math.floor(Math.random() * 15) + 84,
        aiModel: 'CivicVision-v2.4',
        aiSeverity,
        risk: `${title} posing hazard to motorists and pedestrians`,
        department: DEPARTMENTS[category] || 'Road Maintenance Team',
        assignedTo: team,
        title,
        description: `${title} reported at ${loc.addr}. Needs prompt inspection and repair by ${team}.`,
        beforeImage: { url: SAMPLE_IMAGES[i % SAMPLE_IMAGES.length] },
        location: { type: 'Point', coordinates: [lng, lat] },
        address: loc.addr,
        confirmations,
        confirmationCount: confirmations.length,
        status,
        statusHistory,
        createdAt,
      });

      c.priority = computePriority(c);
      docs.push(c);
    }

    await Complaint.insertMany(docs);
    console.log(`Seeded ${docs.length} real complaints across 5 city zones.`);
  }
}

