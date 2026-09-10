/**
 * Mandi Master Table & Geo-Location Utilities
 * Verified list of official APMC markets across India with geographic coordinates
 * for distance-based nearby search and district matching.
 */

// Haversine formula to calculate distance in kilometers between two GPS coordinates
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const MANDI_MASTER_TABLE = [
  // Uttar Pradesh - Gorakhpur & Eastern UP
  {
    mandi_id: 'up_gorakhpur_01',
    state: 'Uttar Pradesh',
    district: 'Gorakhpur',
    market_name: 'Gorakhpur APMC',
    official_code: 'UP-GKP-01',
    latitude: 26.7606,
    longitude: 83.3732,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_gorakhpur_02',
    state: 'Uttar Pradesh',
    district: 'Gorakhpur',
    market_name: 'Sehjanwa APMC',
    official_code: 'UP-GKP-02',
    latitude: 26.7725,
    longitude: 83.1895,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_basti_01',
    state: 'Uttar Pradesh',
    district: 'Basti',
    market_name: 'Basti APMC',
    official_code: 'UP-BST-01',
    latitude: 26.8123,
    longitude: 82.7634,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_khalilabad_01',
    state: 'Uttar Pradesh',
    district: 'Sant Kabir Nagar',
    market_name: 'Khalilabad Mandi',
    official_code: 'UP-SKN-01',
    latitude: 26.7761,
    longitude: 83.0726,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_deoria_01',
    state: 'Uttar Pradesh',
    district: 'Deoria',
    market_name: 'Deoria APMC',
    official_code: 'UP-DEO-01',
    latitude: 26.5022,
    longitude: 83.7791,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_maharajganj_01',
    state: 'Uttar Pradesh',
    district: 'Maharajganj',
    market_name: 'Maharajganj APMC',
    official_code: 'UP-MRJ-01',
    latitude: 27.1436,
    longitude: 83.5619,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_lucknow_01',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market_name: 'Lucknow APMC',
    official_code: 'UP-LKO-01',
    latitude: 26.8467,
    longitude: 80.9462,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_lucknow_02',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market_name: 'Banthara APMC',
    official_code: 'UP-LKO-02',
    latitude: 26.7029,
    longitude: 80.8524,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_kanpur_01',
    state: 'Uttar Pradesh',
    district: 'Kanpur',
    market_name: 'Kanpur APMC',
    official_code: 'UP-KNP-01',
    latitude: 26.4499,
    longitude: 80.3319,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_varanasi_01',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    market_name: 'Varanasi APMC',
    official_code: 'UP-VNS-01',
    latitude: 25.3176,
    longitude: 82.9739,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_agra_01',
    state: 'Uttar Pradesh',
    district: 'Agra',
    market_name: 'Agra APMC',
    official_code: 'UP-AGR-01',
    latitude: 27.1767,
    longitude: 78.0081,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_ayodhya_01',
    state: 'Uttar Pradesh',
    district: 'Ayodhya',
    market_name: 'Ayodhya (Faizabad) APMC',
    official_code: 'UP-AYD-01',
    latitude: 26.7922,
    longitude: 82.1998,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_barabanki_01',
    state: 'Uttar Pradesh',
    district: 'Barabanki',
    market_name: 'Barabanki APMC',
    official_code: 'UP-BBK-01',
    latitude: 26.9275,
    longitude: 81.1834,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_aligarh_01',
    state: 'Uttar Pradesh',
    district: 'Aligarh',
    market_name: 'Aligarh APMC',
    official_code: 'UP-ALG-01',
    latitude: 27.8974,
    longitude: 78.0880,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_meerut_01',
    state: 'Uttar Pradesh',
    district: 'Meerut',
    market_name: 'Meerut APMC',
    official_code: 'UP-MRT-01',
    latitude: 28.9845,
    longitude: 77.7064,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'up_prayagraj_01',
    state: 'Uttar Pradesh',
    district: 'Prayagraj',
    market_name: 'Prayagraj (Allahabad) APMC',
    official_code: 'UP-PRY-01',
    latitude: 25.4358,
    longitude: 81.8463,
    source: 'AGMARKNET',
    active: true
  },

  // Maharashtra
  {
    mandi_id: 'mh_lasalgaon_01',
    state: 'Maharashtra',
    district: 'Nashik',
    market_name: 'Lasalgaon APMC',
    official_code: 'MH-NSK-01',
    latitude: 20.1476,
    longitude: 74.2255,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'mh_pimpalgaon_01',
    state: 'Maharashtra',
    district: 'Nashik',
    market_name: 'Pimpalgaon Baswant APMC',
    official_code: 'MH-NSK-02',
    latitude: 20.1738,
    longitude: 73.9877,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'mh_nashik_01',
    state: 'Maharashtra',
    district: 'Nashik',
    market_name: 'Nashik APMC',
    official_code: 'MH-NSK-03',
    latitude: 20.0059,
    longitude: 73.7898,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'mh_pune_01',
    state: 'Maharashtra',
    district: 'Pune',
    market_name: 'Pune APMC',
    official_code: 'MH-PUN-01',
    latitude: 18.5204,
    longitude: 73.8567,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'mh_vashi_01',
    state: 'Maharashtra',
    district: 'Thane',
    market_name: 'Vashi (Mumbai) APMC',
    official_code: 'MH-VSH-01',
    latitude: 19.0771,
    longitude: 72.9986,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'mh_nagpur_01',
    state: 'Maharashtra',
    district: 'Nagpur',
    market_name: 'Nagpur APMC',
    official_code: 'MH-NGP-01',
    latitude: 21.1458,
    longitude: 79.0882,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'mh_jalgaon_01',
    state: 'Maharashtra',
    district: 'Jalgaon',
    market_name: 'Jalgaon APMC',
    official_code: 'MH-JLG-01',
    latitude: 21.0077,
    longitude: 75.5626,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'mh_solapur_01',
    state: 'Maharashtra',
    district: 'Solapur',
    market_name: 'Solapur APMC',
    official_code: 'MH-SOL-01',
    latitude: 17.6599,
    longitude: 75.9064,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'mh_akola_01',
    state: 'Maharashtra',
    district: 'Akola',
    market_name: 'Akola APMC',
    official_code: 'MH-AKL-01',
    latitude: 20.7002,
    longitude: 77.0082,
    source: 'AGMARKNET',
    active: true
  },

  // Punjab
  {
    mandi_id: 'pb_khanna_01',
    state: 'Punjab',
    district: 'Ludhiana',
    market_name: 'Khanna Mandi',
    official_code: 'PB-LDH-01',
    latitude: 30.7071,
    longitude: 76.2167,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'pb_ludhiana_01',
    state: 'Punjab',
    district: 'Ludhiana',
    market_name: 'Ludhiana APMC',
    official_code: 'PB-LDH-02',
    latitude: 30.9010,
    longitude: 75.8573,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'pb_amritsar_01',
    state: 'Punjab',
    district: 'Amritsar',
    market_name: 'Amritsar Mandi',
    official_code: 'PB-ASR-01',
    latitude: 31.6340,
    longitude: 74.8723,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'pb_bathinda_01',
    state: 'Punjab',
    district: 'Bathinda',
    market_name: 'Bathinda APMC',
    official_code: 'PB-BTI-01',
    latitude: 30.2110,
    longitude: 74.9455,
    source: 'AGMARKNET',
    active: true
  },

  // Haryana
  {
    mandi_id: 'hr_karnal_01',
    state: 'Haryana',
    district: 'Karnal',
    market_name: 'Karnal APMC',
    official_code: 'HR-KRN-01',
    latitude: 29.6857,
    longitude: 76.9905,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'hr_kurukshetra_01',
    state: 'Haryana',
    district: 'Kurukshetra',
    market_name: 'Thanesar (Kurukshetra) APMC',
    official_code: 'HR-KRK-01',
    latitude: 29.9695,
    longitude: 76.8783,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'hr_sirsa_01',
    state: 'Haryana',
    district: 'Sirsa',
    market_name: 'Sirsa APMC',
    official_code: 'HR-SRS-01',
    latitude: 29.5349,
    longitude: 75.0298,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'hr_hisar_01',
    state: 'Haryana',
    district: 'Hisar',
    market_name: 'Hisar APMC',
    official_code: 'HR-HSR-01',
    latitude: 29.1492,
    longitude: 75.7217,
    source: 'AGMARKNET',
    active: true
  },

  // Madhya Pradesh
  {
    mandi_id: 'mp_indore_01',
    state: 'Madhya Pradesh',
    district: 'Indore',
    market_name: 'Indore APMC',
    official_code: 'MP-IND-01',
    latitude: 22.7196,
    longitude: 75.8577,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'mp_ujjain_01',
    state: 'Madhya Pradesh',
    district: 'Ujjain',
    market_name: 'Ujjain APMC',
    official_code: 'MP-UJN-01',
    latitude: 23.1765,
    longitude: 75.7885,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'mp_bhopal_01',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    market_name: 'Bhopal (Karond) APMC',
    official_code: 'MP-BPL-01',
    latitude: 23.2599,
    longitude: 77.4126,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'mp_neemuch_01',
    state: 'Madhya Pradesh',
    district: 'Neemuch',
    market_name: 'Neemuch APMC',
    official_code: 'MP-NMC-01',
    latitude: 24.4752,
    longitude: 74.8698,
    source: 'AGMARKNET',
    active: true
  },

  // Gujarat
  {
    mandi_id: 'gj_rajkot_01',
    state: 'Gujarat',
    district: 'Rajkot',
    market_name: 'Rajkot APMC',
    official_code: 'GJ-RJK-01',
    latitude: 22.3039,
    longitude: 70.8022,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'gj_gondal_01',
    state: 'Gujarat',
    district: 'Rajkot',
    market_name: 'Gondal APMC',
    official_code: 'GJ-GDL-01',
    latitude: 21.9619,
    longitude: 70.7923,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'gj_surat_01',
    state: 'Gujarat',
    district: 'Surat',
    market_name: 'Surat APMC',
    official_code: 'GJ-SRT-01',
    latitude: 21.1702,
    longitude: 72.8311,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'gj_unjha_01',
    state: 'Gujarat',
    district: 'Mehsana',
    market_name: 'Unjha APMC',
    official_code: 'GJ-UNJ-01',
    latitude: 23.8054,
    longitude: 72.3922,
    source: 'AGMARKNET',
    active: true
  },

  // Rajasthan
  {
    mandi_id: 'rj_kota_01',
    state: 'Rajasthan',
    district: 'Kota',
    market_name: 'Kota APMC',
    official_code: 'RJ-KTA-01',
    latitude: 25.2138,
    longitude: 75.8648,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'rj_jaipur_01',
    state: 'Rajasthan',
    district: 'Jaipur',
    market_name: 'Jaipur (Muhana) APMC',
    official_code: 'RJ-JPR-01',
    latitude: 26.9124,
    longitude: 75.7873,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'rj_ganganagar_01',
    state: 'Rajasthan',
    district: 'Ganganagar',
    market_name: 'Sri Ganganagar APMC',
    official_code: 'RJ-SGN-01',
    latitude: 29.9094,
    longitude: 73.8799,
    source: 'AGMARKNET',
    active: true
  },

  // Bihar
  {
    mandi_id: 'br_patna_01',
    state: 'Bihar',
    district: 'Patna',
    market_name: 'Patna APMC',
    official_code: 'BR-PAT-01',
    latitude: 25.5941,
    longitude: 85.1376,
    source: 'AGMARKNET',
    active: true
  },
  {
    mandi_id: 'br_muzaffarpur_01',
    state: 'Bihar',
    district: 'Muzaffarpur',
    market_name: 'Muzaffarpur APMC',
    official_code: 'BR-MUZ-01',
    latitude: 26.1209,
    longitude: 85.3647,
    source: 'AGMARKNET',
    active: true
  }
];

// Find mandis ordered by distance from given GPS coordinates
function findNearbyMandis(latitude, longitude, maxRadiusKm = 100) {
  if (latitude == null || longitude == null) return [];
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (isNaN(lat) || isNaN(lon)) return [];

  const results = MANDI_MASTER_TABLE.map((mandi) => {
    const distanceKm = calculateDistanceKm(lat, lon, mandi.latitude, mandi.longitude);
    return {
      ...mandi,
      distanceKm
    };
  })
    .filter((m) => m.distanceKm !== null && m.distanceKm <= maxRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return results;
}

// Get all unique States
function getAllStates() {
  const states = [...new Set(MANDI_MASTER_TABLE.map((m) => m.state))];
  return states.sort();
}

// Get all unique Districts for a state
function getDistrictsByState(state) {
  if (!state || state === 'All') {
    return [...new Set(MANDI_MASTER_TABLE.map((m) => m.district))].sort();
  }
  return [
    ...new Set(
      MANDI_MASTER_TABLE.filter((m) => m.state.toLowerCase() === state.toLowerCase()).map(
        (m) => m.district
      )
    )
  ].sort();
}

// Get markets for a district and state
function getMarketsByDistrict(state, district) {
  return MANDI_MASTER_TABLE.filter((m) => {
    const matchState = !state || state === 'All' || m.state.toLowerCase() === state.toLowerCase();
    const matchDistrict =
      !district || district === 'All' || m.district.toLowerCase() === district.toLowerCase();
    return matchState && matchDistrict;
  });
}

module.exports = {
  MANDI_MASTER_TABLE,
  calculateDistanceKm,
  findNearbyMandis,
  getAllStates,
  getDistrictsByState,
  getMarketsByDistrict
};
