import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'Fasal_Drishti_Technical_Diagrams')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Set global styles
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

def create_architecture_diagram():
    fig, ax = plt.subplots(figsize=(13, 9), dpi=300)
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 9)
    ax.axis('off')

    # Background canvas
    ax.add_patch(patches.Rectangle((0, 0), 13, 9, color='#f8fafc', zorder=0))

    # Title
    ax.text(6.5, 8.6, "FASAL DRISHTI: SYSTEM ARCHITECTURE & INTEGRATION TIERS", 
            ha='center', va='center', fontsize=15, fontweight='bold', color='#0f172a')
    ax.text(6.5, 8.25, "Layered Architecture of Edge-Resilient Multi-Spectral Farm Telemetry & AI Decision Support Platform", 
            ha='center', va='center', fontsize=9.5, fontstyle='italic', color='#475569')


    # Tier 1: Client & Presentation
    tier1 = patches.FancyBboxPatch((0.5, 6.3), 12, 1.6, boxstyle="round,pad=0.2,rounding_size=0.3",
                                  facecolor='#e0f2fe', edgecolor='#38bdf8', linewidth=1.5)
    ax.add_patch(tier1)
    ax.text(0.8, 7.6, "TIER 1: PRESENTATION & CLIENT ACQUISITION LAYER", fontsize=10, fontweight='bold', color='#0369a1')
    
    modules_t1 = [
        ("Mobile Client App\n(@capacitor/android,\nCamera & Geolocation)", 1.0, 6.5, 2.5, 0.9),
        ("PWA / Desktop Dashboard\n(React 18, Vite,\nTailwind CSS, Recharts)", 3.8, 6.5, 2.7, 0.9),
        ("GIS Mapping Module\n(Leaflet.js Engine,\nGPS Polygon Tracing)", 6.8, 6.5, 2.6, 0.9),
        ("Multimodal Assistant\n(SWAR Voice Assistant,\nWeb Speech API & TTS)", 9.7, 6.5, 2.6, 0.9)
    ]
    for title, x, y, w, h in modules_t1:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", facecolor='#ffffff', edgecolor='#7dd3fc', linewidth=1.2))
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#0c4a6e')

    # Tier 2: Edge & Self-Healing Resilience
    tier2 = patches.FancyBboxPatch((0.5, 4.4), 12, 1.5, boxstyle="round,pad=0.2,rounding_size=0.3",
                                  facecolor='#dcfce7', edgecolor='#4ade80', linewidth=1.5)
    ax.add_patch(tier2)
    ax.text(0.8, 5.6, "TIER 2: CLIENT-SIDE SELF-HEALING & RESILIENCE ENGINE", fontsize=10, fontweight='bold', color='#15803d')

    modules_t2 = [
        ("Error Classification\n(ErrorClassifier.js,\nCategory & Root Cause)", 1.0, 4.6, 2.6, 0.8),
        ("Bounded Recovery Loop\n(RecoveryManager.js,\nMax 3 Attempts Bounded)", 3.9, 4.6, 2.6, 0.8),
        ("Shadow Backup & Cache\n(LocalStorage Auto-Recovery,\nCorrupted JSON Restore)", 6.8, 4.6, 2.6, 0.8),
        ("Offline Crop Engine\n(UniversalCropEngine.js,\nLocal Rule Fallback)", 9.7, 4.6, 2.6, 0.8)
    ]
    for title, x, y, w, h in modules_t2:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", facecolor='#ffffff', edgecolor='#86efac', linewidth=1.2))
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#14532d')

    # Tier 3: Core Application & Orchestration Backend
    tier3 = patches.FancyBboxPatch((0.5, 2.4), 8.5, 1.6, boxstyle="round,pad=0.2,rounding_size=0.3",
                                  facecolor='#fef3c7', edgecolor='#fcd34d', linewidth=1.5)
    ax.add_patch(tier3)
    ax.text(0.8, 3.7, "TIER 3: CORE BACKEND & INTELLIGENCE SERVER (Node.js/Express)", fontsize=10, fontweight='bold', color='#b45309')

    modules_t3 = [
        ("REST API Router & Auth\n(19 Route Endpoints,\nJWT Session Security)", 0.8, 2.6, 2.5, 0.85),
        ("AI Vision & Advisor Engine\n(Gemini 3.5 Flash-Lite,\nStrict JSON Schema Filter)", 3.5, 2.6, 2.6, 0.85),
        ("Autonomous Monitor Scheduler\n(FieldMonitoringService,\n6-Hour Observation Cycle)", 6.3, 2.6, 2.5, 0.85)
    ]
    for title, x, y, w, h in modules_t3:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", facecolor='#ffffff', edgecolor='#fde68a', linewidth=1.2))
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#78350f')

    # Tier 4: Dual Persistence Engine
    tier4 = patches.FancyBboxPatch((9.3, 2.4), 3.2, 1.6, boxstyle="round,pad=0.2,rounding_size=0.3",
                                  facecolor='#f3e8ff', edgecolor='#c084fc', linewidth=1.5)
    ax.add_patch(tier4)
    ax.text(9.5, 3.7, "TIER 4: DUAL PERSISTENCE", fontsize=9.5, fontweight='bold', color='#6b21a8')

    modules_t4 = [
        ("MongoDB Atlas Primary Store\n(17 Mongoose Schemas)", 9.5, 3.1, 2.8, 0.45),
        ("Resilient Disk JSON Store\n(Zero-Loss Persistent DB)", 9.5, 2.55, 2.8, 0.45)
    ]
    for title, x, y, w, h in modules_t4:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08", facecolor='#ffffff', edgecolor='#d8b4fe', linewidth=1.1))
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=7, fontweight='bold', color='#581c87')

    # Tier 5: External Telemetry & Cloud Services
    tier5 = patches.FancyBboxPatch((0.5, 0.4), 12, 1.6, boxstyle="round,pad=0.2,rounding_size=0.3",
                                  facecolor='#fee2e2', edgecolor='#f87171', linewidth=1.5)
    ax.add_patch(tier5)
    ax.text(0.8, 1.7, "TIER 5: EXTERNAL SATELLITE, METEOROLOGICAL & MARKET TELEMETRY", fontsize=10, fontweight='bold', color='#b91c1c')

    modules_t5 = [
        ("ESA Copernicus CDSE\n(Sentinel-2 L2A OData API,\n10m Multi-spectral NDVI)", 0.8, 0.6, 2.6, 0.85),
        ("Open-Meteo Agro-Weather\n(ECMWF High-Res Telemetry,\nRain, ET0, Soil Moisture)", 3.7, 0.6, 2.7, 0.85),
        ("Google Gemini AI API\n(Multimodal Vision + LLM\nConversational Agronomy)", 6.7, 0.6, 2.6, 0.85),
        ("AGMARKNET / Data.gov.in\n(Real-Time Mandi Rates,\nDaily Market Price Feeds)", 9.6, 0.6, 2.7, 0.85)
    ]
    for title, x, y, w, h in modules_t5:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", facecolor='#ffffff', edgecolor='#fca5a5', linewidth=1.2))
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#7f1d1d')

    # Connecting Arrows
    def draw_arrow(x1, y1, x2, y2, label=""):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="<->", color="#475569", lw=1.5, ls="--"))
        if label:
            ax.text((x1+x2)/2 + 0.1, (y1+y2)/2, label, fontsize=6.5, color='#475569', fontweight='bold')

    draw_arrow(6.5, 6.3, 6.5, 5.9, "State & Action Sync")
    draw_arrow(4.7, 4.4, 4.7, 4.0, "API HTTP / JSON")
    draw_arrow(9.0, 3.2, 9.3, 3.2, "Dual Read/Write")
    draw_arrow(4.7, 2.4, 4.7, 2.0, "HTTPS Ingestion")

    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, 'architecture_diagram.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {output_path}")

def create_data_flow_diagram():
    fig, ax = plt.subplots(figsize=(13, 8), dpi=300)
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 8)
    ax.axis('off')
    ax.add_patch(patches.Rectangle((0, 0), 13, 8, color='#f8fafc', zorder=0))

    ax.text(6.5, 7.6, "FASAL DRISHTI: END-TO-END DATA FLOW DIAGRAM", 
            ha='center', va='center', fontsize=15, fontweight='bold', color='#0f172a')
    ax.text(6.5, 7.25, "Telemetric Ingestion, Multi-Source Feature Extraction, Reasoning, and Output Sinks", 
            ha='center', va='center', fontsize=9.5, fontstyle='italic', color='#475569')

    # Stage 1: Data Sources (Inputs)
    ax.add_patch(patches.FancyBboxPatch((0.5, 0.5), 2.8, 6.3, boxstyle="round,pad=0.2", facecolor='#f1f5f9', edgecolor='#94a3b8', linewidth=1.5))
    ax.text(1.9, 6.5, "1. INGESTION SOURCES", ha='center', fontsize=10, fontweight='bold', color='#1e293b')

    inputs = [
        ("Farmer Input & Profile\n- Mobile & Credentials\n- Farm Area & Soil Type\n- Active Crop & Sowing Date", 0.7, 5.0, 2.4, 1.2),
        ("GIS GPS Coordinates\n- Field Perimeter Boundary\n- Lat/Lng Corner Polygon\n- Calculated Area & Centroid", 0.7, 3.5, 2.4, 1.2),
        ("Satellite Multi-Spectral\n- Sentinel-2 L2A BOA Reflectance\n- Band 8 (NIR) & Band 4 (Red)\n- Cloud Cover Filtering (<30%)", 0.7, 2.0, 2.4, 1.2),
        ("Environmental Telemetry\n- Open-Meteo ECMWF Forecast\n- Temp, Humidity, Precip, ET0\n- Soil Moisture & Temp (0-7cm)", 0.7, 0.6, 2.4, 1.2)
    ]
    for title, x, y, w, h in inputs:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08", facecolor='#ffffff', edgecolor='#cbd5e1', linewidth=1.1))
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=7.2, color='#334155')

    # Stage 2: Processing & Reasoning Engines
    ax.add_patch(patches.FancyBboxPatch((4.0, 0.5), 4.8, 6.3, boxstyle="round,pad=0.2", facecolor='#eff6ff', edgecolor='#60a5fa', linewidth=1.5))
    ax.text(6.4, 6.5, "2. CORE PROCESSING & REASONING ENGINES", ha='center', fontsize=10, fontweight='bold', color='#1d4ed8')

    processors = [
        ("Spatial Geometry & Index Calculator\n• Shoelace Polygon Area Algorithm\n• Center Centroid Extraction\n• Spectral NDVI: (NIR - Red) / (NIR + Red)", 4.2, 4.9, 4.4, 1.3),
        ("Agro-Meteorological Water Balance Engine\n• Soil Retention Coefficient Factor (0.75 - 1.30)\n• Crop Growth Stage Kc Factor (0.35 - 1.15)\n• Root Saturation & Waterlogging Risk Index", 4.2, 3.4, 4.4, 1.3),
        ("Multimodal AI Diagnostic Pipeline\n• Gemini 3.5 Flash-Lite LLM Reasoning\n• Strict Senior-Scientist JSON Schema Enforcement\n• Universal Crop Rule Pathology Fallback Engine", 4.2, 1.9, 4.4, 1.3),
        ("Self-Healing Client Fault-Recovery Broker\n• Error Classifier & Bounded Loop (< 3 tries)\n• Shadow Backup & Corrupted State Self-Recovery", 4.2, 0.6, 4.4, 1.1)
    ]
    for title, x, y, w, h in processors:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08", facecolor='#ffffff', edgecolor='#bfdbfe', linewidth=1.1))
        ax.text(x + 0.15, y + h/2, title, ha='left', va='center', fontsize=7.5, color='#1e3a8a')

    # Stage 3: Output Sinks & Farmer Deliverables
    ax.add_patch(patches.FancyBboxPatch((9.5, 0.5), 3.0, 6.3, boxstyle="round,pad=0.2", facecolor='#f0fdf4', edgecolor='#4ade80', linewidth=1.5))
    ax.text(11.0, 6.5, "3. OUTPUT SINKS & ACTIONS", ha='center', fontsize=10, fontweight='bold', color='#15803d')

    outputs = [
        ("Actionable Work Plan\n- Today / 24h / 7-Day Actions\n- Dynamic Health Score (1-100)\n- Organic & Chemical Dosages", 9.7, 5.0, 2.6, 1.2),
        ("Interactive GIS Telemetry\n- Satellite Overlay Heatmaps\n- Zone-level NDVI Vegetation\n- Real-Time Soil Moisture Level", 9.7, 3.5, 2.6, 1.2),
        ("SWAR Conversational Audio\n- 12 Regional Language Voice\n- Hands-Free Voice Synthesis\n- Clear Non-Latin Natural Script", 9.7, 2.0, 2.6, 1.2),
        ("Mandi Market Intelligence\n- Nearby APMC Distance Map\n- Live/Benchmark Daily Rates\n- Price Forecast & Trade Timing", 9.7, 0.6, 2.6, 1.2)
    ]
    for title, x, y, w, h in outputs:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08", facecolor='#ffffff', edgecolor='#bbf7d0', linewidth=1.1))
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=7.2, color='#14532d')

    # Flow arrows
    ax.annotate('', xy=(4.0, 5.6), xytext=(3.3, 5.6), arrowprops=dict(arrowstyle="->", color="#2563eb", lw=2))
    ax.annotate('', xy=(4.0, 4.1), xytext=(3.3, 4.1), arrowprops=dict(arrowstyle="->", color="#2563eb", lw=2))
    ax.annotate('', xy=(4.0, 2.6), xytext=(3.3, 2.6), arrowprops=dict(arrowstyle="->", color="#2563eb", lw=2))
    ax.annotate('', xy=(4.0, 1.2), xytext=(3.3, 1.2), arrowprops=dict(arrowstyle="->", color="#2563eb", lw=2))

    ax.annotate('', xy=(9.5, 5.6), xytext=(8.8, 5.6), arrowprops=dict(arrowstyle="->", color="#16a34a", lw=2))
    ax.annotate('', xy=(9.5, 4.1), xytext=(8.8, 4.1), arrowprops=dict(arrowstyle="->", color="#16a34a", lw=2))
    ax.annotate('', xy=(9.5, 2.6), xytext=(8.8, 2.6), arrowprops=dict(arrowstyle="->", color="#16a34a", lw=2))
    ax.annotate('', xy=(9.5, 1.2), xytext=(8.8, 1.2), arrowprops=dict(arrowstyle="->", color="#16a34a", lw=2))

    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, 'data_flow_diagram.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {output_path}")

def create_field_monitoring_flowchart():
    fig, ax = plt.subplots(figsize=(10, 11), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 11)
    ax.axis('off')
    ax.add_patch(patches.Rectangle((0, 0), 10, 11, color='#ffffff', zorder=0))

    ax.text(5.0, 10.6, "AUTONOMOUS FIELD MONITORING & SATELLITE CLOSED-LOOP PIPELINE", 
            ha='center', va='center', fontsize=12.5, fontweight='bold', color='#0f172a')
    ax.text(5.0, 10.3, "Continuous 6-Hour Background Worker Execution Workflow", 
            ha='center', va='center', fontsize=9, fontstyle='italic', color='#475569')

    boxes = [
        ("START: Background Monitoring Scheduler Interval (Every 6 Hours)", 2.0, 9.4, 6.0, 0.6, '#38bdf8', '#0284c7'),
        ("Query Active Fields Database (MongoDB / Resilient Disk Store)", 2.0, 8.4, 6.0, 0.6, '#f1f5f9', '#64748b'),
        ("Extract Field Boundary Polygon, Spatial Centroid & Soil Class", 2.0, 7.4, 6.0, 0.6, '#f1f5f9', '#64748b'),
        ("Fetch Copernicus Sentinel-2 L2A Passes & Open-Meteo Telemetry", 2.0, 6.4, 6.0, 0.6, '#fef08a', '#ca8a04'),
        ("Compute Multi-spectral NDVI & Calibrated Root-Zone Water Balance\nFormula: NDVI = (NIR - Red)/(NIR + Red)  |  Moisture = Soil Retention * (Rain - ET0)", 1.2, 5.1, 7.6, 0.9, '#bbf7d0', '#16a34a'),
        ("Evaluate Anomaly & Stress Thresholds\n(Waterlogging, Drought, Foliar Necrosis, Growth Stagnation)", 1.5, 3.8, 7.0, 0.8, '#fed7aa', '#ea580c'),
        ("Condition Normal?\nNDVI >= Baseline &\nMoisture Adequate", 1.8, 2.3, 3.0, 0.9, '#e2e8f0', '#475569'),
        ("Active Stress Detected?\nWaterlogging, Pest,\nor Blight Risk", 5.2, 2.3, 3.0, 0.9, '#fecaca', '#dc2626'),
        ("Update Field Health Snapshot\nScore 85-95% (Healthy)\nSchedule Next Orbit Pass", 1.8, 0.8, 3.0, 0.9, '#dcfce7', '#16a34a'),
        ("Generate Closed-Loop Action Plan\nPriority: URGENT / HIGH\nDispatch Multilingual Audio & SMS", 5.2, 0.8, 3.0, 0.9, '#fee2e2', '#b91c1c')
    ]

    for title, x, y, w, h, bg, border in boxes:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.15", facecolor=bg, edgecolor=border, linewidth=1.5))
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#0f172a')

    # Flow arrows
    def link(x1, y1, x2, y2):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="->", color="#334155", lw=1.5))

    link(5.0, 9.4, 5.0, 9.0)
    link(5.0, 8.4, 5.0, 8.0)
    link(5.0, 7.4, 5.0, 7.0)
    link(5.0, 6.4, 5.0, 6.0)
    link(5.0, 5.1, 5.0, 4.6)
    
    # Split to normal or stress
    link(3.3, 3.8, 3.3, 3.2)
    link(6.7, 3.8, 6.7, 3.2)

    link(3.3, 2.3, 3.3, 1.7)
    link(6.7, 2.3, 6.7, 1.7)

    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, 'field_monitoring_flowchart.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {output_path}")

def create_multimodal_diagnosis_flowchart():
    fig, ax = plt.subplots(figsize=(10, 10), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis('off')
    ax.add_patch(patches.Rectangle((0, 0), 10, 10, color='#ffffff', zorder=0))

    ax.text(5.0, 9.6, "MULTIMODAL PLANT PATHOLOGY & TIERED DIAGNOSTIC FLOWCHART", 
            ha='center', va='center', fontsize=12.5, fontweight='bold', color='#0f172a')
    ax.text(5.0, 9.3, "Visual Foliar Inspection, Agronomic Reasoner, and Fallback Architecture", 
            ha='center', va='center', fontsize=9, fontstyle='italic', color='#475569')

    boxes = [
        ("FARMER INPUT: Foliar Leaf Photograph or Voice Query (SWAR Assistant)", 1.5, 8.3, 7.0, 0.6, '#bae6fd', '#0284c7'),
        ("Preprocessing: Image Resizing & EXIF Normalization / Speech-to-Text Transcription", 1.2, 7.2, 7.6, 0.6, '#f1f5f9', '#64748b'),
        ("Tier 1: Gemini 3.5 Flash-Lite Multimodal Model Processing", 1.8, 6.1, 6.4, 0.6, '#fef08a', '#ca8a04'),
        ("Is Gemini Cloud Available &\nValid Diagnostic JSON Returned?", 2.5, 4.8, 5.0, 0.8, '#fed7aa', '#ea580c'),
        ("Tier 1 Success: Extract JSON\nCrop, Pathology, Severity,\nWhat-To-Do-Now & Timeline", 0.8, 3.3, 3.8, 0.9, '#dcfce7', '#16a34a'),
        ("Tier 2 Fallback: Universal Agronomy\nPathology Engine (Local Rules)\nZero Dependency Standalone", 5.4, 3.3, 3.8, 0.9, '#fecaca', '#dc2626'),
        ("Sanitization & Normalization Broker\n• Strip Raw LaTeX / Math Markup ($24°C$ -> 24°C)\n• Enforce 12-Language Vernacular Translation", 1.5, 1.8, 7.0, 0.8, '#e0e7ff', '#6366f1'),
        ("DELIVERY: Dynamic Health Card (1-100), Checklist Action Items, & SWAR Audio Readout", 1.0, 0.6, 8.0, 0.6, '#bbf7d0', '#059669')
    ]

    for title, x, y, w, h, bg, border in boxes:
        ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08,rounding_size=0.15", facecolor=bg, edgecolor=border, linewidth=1.5))
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#0f172a')

    # Connecting arrows
    def link(x1, y1, x2, y2, label=""):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="->", color="#334155", lw=1.5))
        if label:
            ax.text((x1+x2)/2 + 0.15, (y1+y2)/2, label, fontsize=7.5, fontweight='bold', color='#334155')

    link(5.0, 8.3, 5.0, 7.8)
    link(5.0, 7.2, 5.0, 6.7)
    link(5.0, 6.1, 5.0, 5.6)
    
    # Branching
    link(3.5, 4.8, 2.7, 4.2, "YES")
    link(6.5, 4.8, 7.3, 4.2, "NO / TIMEOUT")

    link(2.7, 3.3, 4.0, 2.6)
    link(7.3, 3.3, 6.0, 2.6)

    link(5.0, 1.8, 5.0, 1.2)

    plt.tight_layout()
    output_path = os.path.join(OUTPUT_DIR, 'multimodal_crop_diagnosis_flowchart.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {output_path}")

if __name__ == '__main__':
    create_architecture_diagram()
    create_data_flow_diagram()
    create_field_monitoring_flowchart()
    create_multimodal_diagnosis_flowchart()
    print("All 4 technical diagrams successfully created!")
