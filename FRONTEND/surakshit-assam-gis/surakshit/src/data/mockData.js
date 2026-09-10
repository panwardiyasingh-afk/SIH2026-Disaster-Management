/**
 * DEMO / PLACEHOLDER DATA LAYER
 * ------------------------------------------------------------------
 * Every figure in this file is synthetic and exists only to drive the
 * frontend's visual state (map colouring, charts, cards, priority
 * boards). None of it represents verified government, hazard, census
 * or disaster-history records for Assam.
 *
 * This layer is intentionally isolated so it can be swapped for real
 * GIS / AI / backend API responses without touching component code —
 * every component consumes data through the shape defined here.
 * ------------------------------------------------------------------
 */

export const DEMO_DATA_NOTICE =
  'Demo data for visualization only — not official hazard or population records.'

// Assam district boundaries (simplified, sourced from public GeoJSON,
// district-level 2011 administrative boundaries).
import assamDistricts from './assam-districts.geojson?raw'

export const assamDistrictsGeoJSON = JSON.parse(assamDistricts)

export const HAZARDS = [
  { id: 'flood', label: 'Flood' },
  { id: 'landslide', label: 'Landslide' },
  { id: 'coastalErosion', label: 'Coastal Erosion' },
  { id: 'cloudburst', label: 'Cloudburst' },
]

export const RISK_ZONES = [
  { id: 'red', label: 'Red Zone', description: 'Unsuitable for permanent habitation', color: '#C6362F' },
  { id: 'orange', label: 'Orange Zone', description: 'Moderate risk, close monitoring', color: '#C97A2E' },
  { id: 'yellow', label: 'Yellow Zone', description: 'Lower risk, periodic review', color: '#B8932A' },
  { id: 'green', label: 'Safer Zone', description: 'Suitable for habitation', color: '#2F8F5B' },
]

const zoneColor = { red: '#C6362F', orange: '#C97A2E', yellow: '#B8932A', green: '#2F8F5B' }

// Deterministic pseudo-random generator so demo values stay stable
// across renders/builds instead of reshuffling on every load.
function seededRandom(seed) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

const districtNames = assamDistrictsGeoJSON.features.map((f) => f.properties.district)

function buildDistrictProfiles() {
  const rand = seededRandom(42)
  return districtNames.map((name, i) => {
    const hazardIntensity = Math.round(30 + rand() * 65)
    const populationVulnerability = Math.round(25 + rand() * 70)
    const disasterHistory = Math.round(20 + rand() * 75)
    const composite = Math.round(
      hazardIntensity * 0.45 + populationVulnerability * 0.3 + disasterHistory * 0.25
    )
    let zone = 'green'
    if (composite >= 75) zone = 'red'
    else if (composite >= 58) zone = 'orange'
    else if (composite >= 42) zone = 'yellow'

    const hazardMix = {
      flood: Math.round(20 + rand() * 78),
      landslide: Math.round(10 + rand() * 78),
      coastalErosion: Math.round(5 + rand() * 60),
      cloudburst: Math.round(15 + rand() * 70),
    }
    const dominantHazard = Object.entries(hazardMix).sort((a, b) => b[1] - a[1])[0][0]

    return {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      district: name,
      hazardIntensity,
      populationVulnerability,
      disasterHistory,
      compositeRisk: composite,
      zone,
      color: zoneColor[zone],
      hazardMix,
      dominantHazard,
    }
  })
}

export const districtRiskProfiles = buildDistrictProfiles()

export const districtProfileByName = Object.fromEntries(
  districtRiskProfiles.map((d) => [d.district, d])
)

// Top-line figures for the analysis panel (aggregated from the
// district profiles above — demo only).
export const hazardVulnerabilitySummary = {
  redZoneDistricts: districtRiskProfiles.filter((d) => d.zone === 'red').length,
  totalDistricts: districtRiskProfiles.length,
  avgHazardIntensity: Math.round(
    districtRiskProfiles.reduce((s, d) => s + d.hazardIntensity, 0) / districtRiskProfiles.length
  ),
  avgVulnerability: Math.round(
    districtRiskProfiles.reduce((s, d) => s + d.populationVulnerability, 0) /
      districtRiskProfiles.length
  ),
  avgDisasterHistory: Math.round(
    districtRiskProfiles.reduce((s, d) => s + d.disasterHistory, 0) / districtRiskProfiles.length
  ),
}

export const topVulnerableDistricts = [...districtRiskProfiles]
  .sort((a, b) => b.compositeRisk - a.compositeRisk)
  .slice(0, 6)

// Candidate safer relocation sites — demo only.
export const relocationSites = [
  {
    id: 'site-boko-upland',
    name: 'Boko Upland Corridor',
    district: 'Kamrup',
    suitability: 'High',
    suitabilityScore: 86,
    carryingCapacity: 4200,
    currentUtilization: 31,
    recommendation: 'Recommended for immediate intake',
  },
  {
    id: 'site-dhekiajuli-plateau',
    name: 'Dhekiajuli Plateau Belt',
    district: 'Sonitpur',
    suitability: 'High',
    suitabilityScore: 81,
    carryingCapacity: 3100,
    currentUtilization: 42,
    recommendation: 'Recommended, phase intake with infrastructure buildout',
  },
  {
    id: 'site-lanka-ridge',
    name: 'Lanka Ridge Extension',
    district: 'Hojai',
    suitability: 'Moderate',
    suitabilityScore: 68,
    carryingCapacity: 2400,
    currentUtilization: 55,
    recommendation: 'Suitable with drainage mitigation works',
  },
  {
    id: 'site-panbari-terrace',
    name: 'Panbari Terrace Zone',
    district: 'Golaghat',
    suitability: 'Moderate',
    suitabilityScore: 64,
    carryingCapacity: 1800,
    currentUtilization: 63,
    recommendation: 'Usable for short-term relocation only',
  },
  {
    id: 'site-udalguri-highland',
    name: 'Udalguri Highland Tract',
    district: 'Udalguri',
    suitability: 'High',
    suitabilityScore: 78,
    carryingCapacity: 2700,
    currentUtilization: 37,
    recommendation: 'Recommended for medium-term planned relocation',
  },
  {
    id: 'site-katigorah-bench',
    name: 'Katigorah Bench Land',
    district: 'Cachar',
    suitability: 'Low',
    suitabilityScore: 41,
    carryingCapacity: 900,
    currentUtilization: 74,
    recommendation: 'Not recommended without capacity augmentation',
  },
]

// Relocation priority board — demo only.
export const relocationPriorities = {
  immediate: [
    {
      id: 'hab-1',
      habitation: 'Char Chapori Cluster',
      district: 'Dhubri',
      hazardIntensity: 91,
      populationVulnerability: 88,
      disasterHistory: 84,
      note: 'Repeated flood inundation, active erosion at settlement edge',
    },
    {
      id: 'hab-2',
      habitation: 'Lower Kopili Bank Settlement',
      district: 'Hojai',
      hazardIntensity: 87,
      populationVulnerability: 79,
      disasterHistory: 90,
      note: 'History of cloudburst-triggered flash flooding',
    },
  ],
  shortTerm: [
    {
      id: 'hab-3',
      habitation: 'Barapani Slope Hamlet',
      district: 'Dima Hasao',
      hazardIntensity: 74,
      populationVulnerability: 66,
      disasterHistory: 61,
      note: 'Landslide-prone slope, monsoon-sensitive access road',
    },
    {
      id: 'hab-4',
      habitation: 'Rongjuli Foothill Cluster',
      district: 'Goalpara',
      hazardIntensity: 69,
      populationVulnerability: 71,
      disasterHistory: 58,
      note: 'Recurrent shallow flooding during peak monsoon',
    },
  ],
  mediumTerm: [
    {
      id: 'hab-5',
      habitation: 'Majuli Riverine Village',
      district: 'Majuli',
      hazardIntensity: 58,
      populationVulnerability: 62,
      disasterHistory: 65,
      note: 'Gradual erosion, planning window available',
    },
    {
      id: 'hab-6',
      habitation: 'Naharani Tea Belt Line',
      district: 'Karbi Anglong',
      hazardIntensity: 49,
      populationVulnerability: 44,
      disasterHistory: 40,
      note: 'Emerging risk, monitor and plan proactively',
    },
  ],
}

// Decision-support insight cards — demo only.
export const decisionSupportInsights = [
  {
    id: 'ds-1',
    title: 'Red Zone expansion detected',
    body: `${districtRiskProfiles.filter((d) => d.zone === 'red').length} districts now show composite risk above the Red Zone threshold, driven primarily by flood and landslide intensity.`,
    tag: 'Red Zone',
  },
  {
    id: 'ds-2',
    title: 'Relocation capacity available',
    body: 'Boko Upland Corridor and Udalguri Highland Tract together hold over 6,800 units of unutilised carrying capacity for planned intake.',
    tag: 'Safer Sites',
  },
  {
    id: 'ds-3',
    title: 'Immediate action required',
    body: '2 habitations are flagged for immediate relocation based on compounding hazard intensity, vulnerability, and disaster history.',
    tag: 'Priority',
  },
  {
    id: 'ds-4',
    title: 'Proactive planning window',
    body: 'Medium-term habitations show early risk signals — planning now can avoid reactive, post-disaster relocation later.',
    tag: 'Planning',
  },
]

export const workflowSteps = [
  { id: 1, title: 'Identify vulnerable habitation', description: 'Locate settlements within mapped hazard zones across Assam.' },
  { id: 2, title: 'Analyze contributing factors', description: 'Assess hazard intensity, population vulnerability, and disaster history together.' },
  { id: 3, title: 'Identify safer alternative sites', description: 'Screen candidate relocation sites for suitability.' },
  { id: 4, title: 'Evaluate carrying capacity', description: 'Check how much capacity each safer site can realistically absorb.' },
  { id: 5, title: 'Assign relocation priority', description: 'Classify habitations as immediate, short-term, or medium-term.' },
  { id: 6, title: 'Provide decision support', description: 'Surface actionable insight for State Disaster Management Authorities.' },
]
