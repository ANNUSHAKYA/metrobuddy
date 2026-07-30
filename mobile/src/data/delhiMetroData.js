// ─── Delhi Metro Complete Station Data ─────────────────────────
// All lines with ordered stations and interchange markers
// Source: DMRC official network map (2024-25)

const DELHI_METRO_LINES = [
  {
    id: 'red',
    name: 'Red Line',
    code: 'Line 1',
    color: '#EE1C25',
    emoji: '🔴',
    stations: [
      'Rithala',
      'Rohini West',
      'Rohini East',
      'Pitampura',
      'Kohat Enclave',
      'Netaji Subhash Place',
      'Keshav Puram',
      'Kanhaiya Nagar',
      'Inderlok',
      'Shastri Nagar',
      'Pratap Nagar',
      'Pul Bangash',
      'Tis Hazari',
      'Kashmere Gate',
      'Shastri Park',
      'Seelampur',
      'Welcome',
      'Shahdara',
      'Mansarovar Park',
      'Jhilmil',
      'Dilshad Garden',
      'Shaheed Nagar',
      'Raj Bagh',
      'Rajdhani Park',
      'Mohan Nagar',
      'Arthala',
      'Hindon River',
      'Shaheed Sthal (New Bus Adda)',
    ],
  },
  {
    id: 'yellow',
    name: 'Yellow Line',
    code: 'Line 2',
    color: '#FFCF20',
    textColor: '#333',
    emoji: '🟡',
    stations: [
      'Samaypur Badli',
      'Rohini Sector 18-19',
      'Haiderpur Badli Mor',
      'Jahangirpuri',
      'Adarsh Nagar',
      'Azadpur',
      'Model Town',
      'GTB Nagar',
      'Vishwavidyalaya',
      'Vidhan Sabha',
      'Civil Lines',
      'Kashmere Gate',
      'Chandni Chowk',
      'Chawri Bazar',
      'New Delhi',
      'Rajiv Chowk',
      'Patel Chowk',
      'Central Secretariat',
      'Udyog Bhawan',
      'Lok Kalyan Marg (Race Course)',
      'Jorbagh',
      'INA',
      'AIIMS',
      'Green Park',
      'Hauz Khas',
      'Malviya Nagar',
      'Saket',
      'Qutab Minar',
      'Chhatarpur',
      'Sultanpur',
      'Ghitorni',
      'Arjan Garh',
      'Guru Dronacharya',
      'Sikanderpur',
      'MG Road',
      'IFFCO Chowk',
      'HUDA City Centre',
    ],
  },
  {
    id: 'blue',
    name: 'Blue Line',
    code: 'Line 3/4',
    color: '#0B56A4',
    emoji: '🔵',
    stations: [
      'Dwarka Sector 21',
      'Dwarka Sector 8',
      'Dwarka Sector 9',
      'Dwarka Sector 10',
      'Dwarka Sector 11',
      'Dwarka Sector 12',
      'Dwarka Sector 13',
      'Dwarka Sector 14',
      'Dwarka',
      'Dwarka Mor',
      'Nawada',
      'Uttam Nagar West',
      'Uttam Nagar East',
      'Janakpuri West',
      'Janakpuri East',
      'Tilak Nagar',
      'Subhash Nagar',
      'Tagore Garden',
      'Rajouri Garden',
      'Ramesh Nagar',
      'Moti Nagar',
      'Kirti Nagar',
      'Shadipur',
      'Patel Nagar',
      'Rajendra Place',
      'Karol Bagh',
      'Jhandewalan',
      'Ramakrishna Ashram Marg',
      'Rajiv Chowk',
      'Barakhamba Road',
      'Mandi House',
      'Supreme Court (Pragati Maidan)',
      'Indraprastha',
      'Yamuna Bank',
      // Branch 1: Main line to Noida
      'Akshardham',
      'Mayur Vihar Phase-1',
      'Mayur Vihar Extension',
      'New Ashok Nagar',
      'Noida Sector 15',
      'Noida Sector 16',
      'Noida Sector 18',
      'Botanical Garden',
      'Golf Course',
      'Noida City Centre',
      'Noida Sector 34',
      'Noida Sector 52',
      'Noida Sector 61',
      'Noida Sector 59',
      'Noida Sector 62',
      'Noida Electronic City',
    ],
  },
  {
    id: 'blue-branch',
    name: 'Blue Line Branch',
    code: 'Line 4',
    color: '#0B56A4',
    emoji: '🔵',
    stations: [
      'Yamuna Bank',
      'Laxmi Nagar',
      'Nirman Vihar',
      'Preet Vihar',
      'Karkarduma',
      'Anand Vihar ISBT',
      'Kaushambi',
      'Vaishali',
    ],
  },
  {
    id: 'green',
    name: 'Green Line',
    code: 'Line 5',
    color: '#00A650',
    emoji: '🟢',
    stations: [
      'Inderlok',
      'Ashok Park Main',
      'Punjabi Bagh',
      'Shivaji Park',
      'Madipur',
      'Paschim Vihar East',
      'Paschim Vihar West',
      'Peera Garhi',
      'Udyog Nagar',
      'Surajmal Stadium (Maharaja Surajmal Stadium)',
      'Nangloi',
      'Nangloi Railway Station',
      'Rajdhani Park',
      'Mundka',
      'Mundka Industrial Area',
      'Ghevra',
      'Tikri Kalan',
      'Tikri Border',
      'Pandit Shree Ram Sharma',
      'Bahadurgarh City',
      'Brigadier Hoshiyar Singh',
    ],
  },
  {
    id: 'green-branch',
    name: 'Green Line Branch',
    code: 'Line 5 Branch',
    color: '#00A650',
    emoji: '🟢',
    stations: [
      'Kirti Nagar',
      'Satguru Ram Singh Marg',
      'Ashok Park Main',
    ],
  },
  {
    id: 'violet',
    name: 'Violet Line',
    code: 'Line 6',
    color: '#9B59B6',
    emoji: '🟣',
    stations: [
      'Kashmere Gate',
      'Lal Quila (Red Fort)',
      'Jama Masjid',
      'Delhi Gate',
      'ITO',
      'Mandi House',
      'Janpath',
      'Central Secretariat',
      'Khan Market',
      'Jawaharlal Nehru Stadium (JLN Stadium)',
      'Jangpura',
      'Lajpat Nagar',
      'Moolchand',
      'Kailash Colony',
      'Nehru Place',
      'Greater Kailash',
      'Govind Puri',
      'Harkesh Nagar Okhla',
      'Jasola Apollo',
      'Sarita Vihar',
      'Mohan Estate',
      'Tughlakabad',
      'Badarpur Border',
      'Sarai',
      'NHPC Chowk',
      'Mewala Maharajpur',
      'Sector 28',
      'Badkhal Mor',
      'Old Faridabad',
      'Neelam Chowk Ajronda',
      'Bata Chowk',
      'Escorts Mujesar',
      'Sant Surdas (Sihi)',
      'Raja Nahar Singh (Ballabhgarh)',
    ],
  },
  {
    id: 'pink',
    name: 'Pink Line',
    code: 'Line 7',
    color: '#F170A8',
    emoji: '🩷',
    stations: [
      'Majlis Park',
      'Azadpur',
      'Shalimar Bagh',
      'Netaji Subhash Place',
      'Shakurpur',
      'Punjabi Bagh West',
      'ESI Hospital (Basai Darapur)',
      'Rajouri Garden',
      'Maya Puri',
      'Naraina Vihar',
      'Delhi Cantt',
      'Durgabai Deshmukh South Campus',
      'Sir Vishweshwaraiah Moti Bagh (INA)',
      'Bhikaji Cama Place',
      'Sarojini Nagar',
      'INA',
      'South Extension',
      'Lajpat Nagar',
      'Vinobapuri',
      'Ashram',
      'Hazrat Nizamuddin',
      'Mayur Vihar Phase-1',
      'Mayur Vihar Pocket 1',
      'Trilokpuri Sanjay Lake',
      'East Vinod Nagar - Mayur Vihar II',
      'Mandawali - West Vinod Nagar',
      'IP Extension',
      'Anand Vihar ISBT',
      'Karkarduma',
      'Karkarduma Court',
      'Krishna Nagar',
      'East Azad Nagar',
      'Welcome',
      'Jaffrabad',
      'Maujpur-Babarpur',
      'Gokulpuri',
      'Johri Enclave',
      'Shiv Vihar',
    ],
  },
  {
    id: 'magenta',
    name: 'Magenta Line',
    code: 'Line 8',
    color: '#B3338A',
    emoji: '🟪',
    stations: [
      'Botanical Garden',
      'Okhla Bird Sanctuary',
      'Kalindi Kunj',
      'Jasola Vihar Shaheen Bagh',
      'Okhla Vihar',
      'Jamia Millia Islamia',
      'Sukhdev Vihar',
      'Okhla NSIC',
      'Kalkaji Mandir',
      'Nehru Enclave',
      'Greater Kailash',
      'Chirag Delhi',
      'Panchsheel Park',
      'Hauz Khas',
      'IIT Delhi',
      'R.K. Puram',
      'Munirka',
      'Vasant Vihar',
      'Shankar Vihar',
      'Terminal 1 IGI Airport',
      'Sadar Bazaar Cantonment',
      'Palam',
      'Dashrath Puri',
      'Dabri Mor - Janakpuri South',
      'Janakpuri West',
    ],
  },
  {
    id: 'grey',
    name: 'Grey Line',
    code: 'Line 9',
    color: '#8C8C8C',
    emoji: '⚪',
    stations: [
      'Dwarka',
      'Nangli',
      'Najafgarh',
      'Dhansa Bus Stand',
    ],
  },
  {
    id: 'airport',
    name: 'Airport Express',
    code: 'Airport Line',
    color: '#F58220',
    emoji: '✈️',
    stations: [
      'New Delhi',
      'Shivaji Stadium',
      'Dhaula Kuan',
      'Delhi Aerocity',
      'Terminal 3 IGI Airport',
      'Dwarka Sector 21',
    ],
  },
  {
    id: 'rapid',
    name: 'Rapid Metro (Gurugram)',
    code: 'Rapid Metro',
    color: '#F58220',
    emoji: '🟠',
    stations: [
      'Sector 55-56',
      'Sector 54 Chowk',
      'Sector 53-54',
      'Sector 42-43',
      'Phase 1 (Sikanderpur)',
      'Phase 2',
      'Phase 3',
      'Moulsari Avenue',
      'IFFCO Chowk',
      'Phase 1 Rapid',
    ],
  },
];

// ─── Interchange map: stations that appear on multiple lines ───
const buildInterchangeMap = () => {
  const stationLines = {};
  DELHI_METRO_LINES.forEach((line) => {
    line.stations.forEach((station) => {
      const key = station.toLowerCase();
      if (!stationLines[key]) {
        stationLines[key] = [];
      }
      // Avoid duplicate line entries for branches
      const lineId = line.id.replace('-branch', '');
      if (!stationLines[key].find((l) => l.id === lineId)) {
        stationLines[key].push({
          id: lineId,
          name: line.name.replace(' Branch', ''),
          color: line.color,
        });
      }
    });
  });
  return stationLines;
};

const INTERCHANGE_MAP = buildInterchangeMap();

// ─── Get all unique stations (flattened, deduped, sorted) ───
const getAllStations = () => {
  const seen = new Set();
  const stations = [];
  DELHI_METRO_LINES.forEach((line) => {
    line.stations.forEach((station) => {
      const key = station.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        stations.push({
          name: station,
          lines: INTERCHANGE_MAP[key] || [],
        });
      }
    });
  });
  return stations.sort((a, b) => a.name.localeCompare(b.name));
};

const ALL_STATIONS = getAllStations();

// ─── Search stations by query ───
const searchStations = (query) => {
  if (!query || !query.trim()) return ALL_STATIONS;
  const q = query.toLowerCase().trim();
  return ALL_STATIONS.filter((s) =>
    s.name.toLowerCase().includes(q)
  );
};

// ─── Get lines for a station ───
const getLinesForStation = (stationName) => {
  if (!stationName) return [];
  return INTERCHANGE_MAP[stationName.toLowerCase()] || [];
};

export {
  DELHI_METRO_LINES,
  INTERCHANGE_MAP,
  ALL_STATIONS,
  searchStations,
  getLinesForStation,
};

export default DELHI_METRO_LINES;
