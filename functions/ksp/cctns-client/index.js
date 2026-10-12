/**
 * CCTNS (Crime and Criminal Tracking Network & Systems) API Client
 * Mode: DEMO_SIMULATOR (Synthetic Data for Prototype Evaluation)
 * 
 * When live CCTNS credentials are configured and authorized, connects to national API gateway.
 * When unconfigured, returns explicitly tagged simulated prototype data.
 */
const https = require('https');
const crypto = require('crypto');

// CCTNS Configuration (set in .env for production)
const CCTNS_API_BASE = process.env.CCTNS_API_BASE || null;
const CCTNS_API_KEY = process.env.CCTNS_API_KEY || null;
const CCTNS_STATE_CODE = process.env.CCTNS_STATE_CODE || 'KA'; // Karnataka
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Check if CCTNS is configured for live connection
 */
function isLiveMode() {
  return !!(CCTNS_API_BASE && CCTNS_API_KEY);
}

/**
 * Make an authenticated request to CCTNS API with retry logic
 */
async function makeRequest(endpoint, method = 'GET', body = null, retryCount = 0) {
  if (!isLiveMode()) {
    throw new Error('CCTNS_NOT_CONFIGURED');
  }

  return new Promise((resolve, reject) => {
    const url = `${CCTNS_API_BASE}${endpoint}`;
    const dataString = body ? JSON.stringify(body) : null;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CCTNS_API_KEY}`,
        'X-State-Code': CCTNS_STATE_CODE,
        'X-Request-ID': crypto.randomUUID(),
        ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {})
      },
      timeout: 30000
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } 
          catch (e) { reject(new Error('Invalid CCTNS response JSON')); }
        } else if (res.statusCode === 429 && retryCount < MAX_RETRIES) {
          // Rate limited — retry with exponential backoff
          const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
          setTimeout(() => {
            makeRequest(endpoint, method, body, retryCount + 1).then(resolve).catch(reject);
          }, delay);
        } else {
          reject(new Error(`CCTNS API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        setTimeout(() => {
          makeRequest(endpoint, method, body, retryCount + 1).then(resolve).catch(reject);
        }, delay);
      } else {
        reject(err);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('CCTNS request timed out'));
    });

    if (dataString) req.write(dataString);
    req.end();
  });
}

/**
 * Fetch new FIRs from CCTNS since a given timestamp
 */
async function fetchNewFIRs(sinceTimestamp = null) {
  if (isLiveMode()) {
    const since = sinceTimestamp || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    return await makeRequest(`/api/v2/firs?state=${CCTNS_STATE_CODE}&since=${since}`);
  }

  // Complete 31 Karnataka Districts with geographic centroids for hotspot mapping
  const KARNATAKA_DISTRICTS = {
    "Bengaluru City": { lat: 12.9716, lng: 77.5946 },
    "Bengaluru Rural": { lat: 13.2257, lng: 77.5750 },
    "Ramanagara": { lat: 12.7150, lng: 77.2814 },
    "Chikkaballapura": { lat: 13.4355, lng: 77.7275 },
    "Kolar": { lat: 13.1367, lng: 78.1292 },
    "Tumakuru": { lat: 13.3379, lng: 77.1022 },
    "Mysuru": { lat: 12.2958, lng: 76.6394 },
    "Mandya": { lat: 12.5218, lng: 76.8951 },
    "Hassan": { lat: 13.0033, lng: 76.1004 },
    "Chamarajanagara": { lat: 11.9261, lng: 76.9437 },
    "Kodagu": { lat: 12.4244, lng: 75.7382 },
    "Udupi": { lat: 13.3409, lng: 74.7421 },
    "Mangaluru": { lat: 12.9141, lng: 74.8560 },
    "Karwar": { lat: 14.8058, lng: 74.1305 },
    "Hubballi-Dharwad": { lat: 15.3647, lng: 75.1240 },
    "Belagavi": { lat: 15.8497, lng: 74.4977 },
    "Vijayapura": { lat: 16.8302, lng: 75.7100 },
    "Bagalkote": { lat: 16.1855, lng: 75.6968 },
    "Gadag": { lat: 15.4319, lng: 75.6355 },
    "Haveri": { lat: 14.7954, lng: 75.3992 },
    "Kalaburagi": { lat: 17.3297, lng: 76.8343 },
    "Yadgir": { lat: 16.7645, lng: 77.1350 },
    "Raichur": { lat: 16.2076, lng: 77.3556 },
    "Koppal": { lat: 15.3524, lng: 76.1554 },
    "Ballari": { lat: 15.1394, lng: 76.9214 },
    "Vijayanagara": { lat: 15.2689, lng: 76.3909 },
    "Bidar": { lat: 17.9104, lng: 77.5199 },
    "Davanagere": { lat: 14.4644, lng: 75.9218 },
    "Shivamogga": { lat: 13.9299, lng: 75.5681 },
    "Chitradurga": { lat: 14.2251, lng: 76.3980 },
    "Chikkamagaluru": { lat: 13.3161, lng: 75.7720 }
  };

  const districtNames = Object.keys(KARNATAKA_DISTRICTS);
  const crimeTypes = ['Cyber Crime', 'Theft', 'Organized Crime', 'Financial Fraud', 'Assault'];
  const accusedNames = [
    'Mohammad Sharief', 'Ramesh Gowda', 'Rupa Naik', 'Sandeep Kumar', 
    'Imran Pasha', 'Chethan Reddy', 'Vijay Patil', 'Satish Swamy',
    'Deepak Hegde', 'Anand Poojary', 'Manjunath Naik', 'Kiran Kumar'
  ];
  const victimNames = ['State of Karnataka', 'Suma Rao', 'Prakash Murthy', 'Lakshmi Devi', 'Naveen Kumar'];
  
  const count = 5 + Math.floor(Math.random() * 5); // 5 to 10 brand new cases every sync
  const now = Date.now();
  const firs = [];

  for (let i = 0; i < count; i++) {
    const dName = districtNames[Math.floor(Math.random() * districtNames.length)];
    const coords = KARNATAKA_DISTRICTS[dName];
    const cType = crimeTypes[Math.floor(Math.random() * crimeTypes.length)];
    const latOffset = (Math.random() - 0.5) * 0.05;
    const lngOffset = (Math.random() - 0.5) * 0.05;
    const firNum = `KA-${new Date().getFullYear()}-${dName.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    firs.push({
      fir_number: firNum,
      district: dName,
      police_station: `${dName} Central PS`,
      crime_type: cType,
      status: Math.random() > 0.4 ? 'Under Active Investigation' : 'Warrant Issued',
      date_reported: new Date().toISOString().split('T')[0],
      date_occurrence: new Date(now - Math.random() * 5 * 24 * 3600000).toISOString().split('T')[0],
      description: `Real-time CCTNS synced ${cType} complaint logged at ${dName} Central Jurisdiction. Multi-district intelligence correlation active.`,
      modus_operandi: `Modus Operandi pattern: ${cType} execution identified across ${dName} precinct boundaries.`,
      accused_name: accusedNames[Math.floor(Math.random() * accusedNames.length)],
      accused_age: 28 + Math.floor(Math.random() * 25),
      risk_score: parseFloat((70 + Math.random() * 28).toFixed(1)),
      gang_affiliation: Math.random() > 0.5 ? 'Organized Crime Syndicate' : 'Independent Offender',
      victim_name: victimNames[Math.floor(Math.random() * victimNames.length)],
      location: {
        lat: coords.lat + latOffset,
        lng: coords.lng + lngOffset,
        address: `${dName} Circle Main Road, Precinct #${Math.floor(Math.random() * 12 + 1)}`,
        area_type: 'Urban'
      }
    });
  }

  return { success: true, firs, source: 'CCTNS_SIMULATED', count };
}

/**
 * Fetch accused/suspect updates from CCTNS
 */
async function fetchAccusedUpdates(sinceTimestamp = null) {
  if (isLiveMode()) {
    const since = sinceTimestamp || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    return await makeRequest(`/api/v2/accused?state=${CCTNS_STATE_CODE}&since=${since}`);
  }

  return {
    success: true,
    accused: [],
    count: 0,
    source: 'CCTNS_SIMULATED'
  };
}

/**
 * Fetch warrant status updates from CCTNS
 */
async function fetchWarrantStatus() {
  if (isLiveMode()) {
    return await makeRequest(`/api/v2/warrants?state=${CCTNS_STATE_CODE}&status=pending`);
  }

  return {
    success: true,
    warrants: [
      { fir_number: 'FIR-2026-003', type: 'Non-Bailable', status: 'Pending', issued_by: 'CMM Court Bengaluru', accused: 'Rupa Naik' },
      { fir_number: 'FIR-2026-007', type: 'Search', status: 'Pending', issued_by: 'Sessions Court Mysuru', accused: 'Unknown' }
    ],
    source: 'CCTNS_SIMULATED'
  };
}

/**
 * Push local intelligence data back to CCTNS
 */
async function pushIntelligence(payload) {
  if (isLiveMode()) {
    return await makeRequest('/api/v2/intelligence/submit', 'POST', payload);
  }

  return {
    success: true,
    acknowledgement: `CCTNS-ACK-${Date.now()}`,
    message: 'Intelligence payload queued for CCTNS submission (simulated mode)',
    source: 'CCTNS_SIMULATED'
  };
}

/**
 * Get CCTNS connection status
 */
function getConnectionStatus() {
  return {
    live: isLiveMode(),
    endpoint: CCTNS_API_BASE || 'Not configured',
    stateCode: CCTNS_STATE_CODE,
    mode: isLiveMode() ? 'PRODUCTION' : 'SIMULATED'
  };
}

module.exports = {
  fetchNewFIRs,
  fetchAccusedUpdates,
  fetchWarrantStatus,
  pushIntelligence,
  getConnectionStatus,
  isLiveMode
};
