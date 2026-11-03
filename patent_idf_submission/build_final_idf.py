import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUBMISSION_DIR = os.path.join(BASE_DIR, 'patent_idf_submission')
DIAGRAMS_DIR = os.path.join(SUBMISSION_DIR, 'Fasal_Drishti_Technical_Diagrams')
SCREENSHOTS_DIR = os.path.join(BASE_DIR, 'screenshots')

def get_image_path(filename):
    candidates = [
        os.path.join(DIAGRAMS_DIR, filename),
        os.path.join(SCREENSHOTS_DIR, filename),
        os.path.join(BASE_DIR, filename),
        os.path.join(BASE_DIR, 'frontend', filename)
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def style_paragraph(p, space_before=0, space_after=6, line_spacing=1.15):
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing

def add_header_footer(doc):
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
        
        # Header
        header = s.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("INVENTION DISCLOSURE FORM (IDF) — ACADEMIC PATENT SPECIFICATION")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(100, 116, 139)
        
        # Footer
        footer = s.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("KIPM College of Engineering & Technology, Gorakhpur  |  Confidential & Proprietary Submission Document")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(148, 163, 184)

def build_document():
    doc = Document()
    add_header_footer(doc)

    # Document Title Block
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_inst, space_before=0, space_after=3)
    r_inst = p_inst.add_run("KIPM COLLEGE OF ENGINEERING AND TECHNOLOGY, GIDA, GORAKHPUR")
    r_inst.font.name = "Calibri"
    r_inst.font.size = Pt(11)
    r_inst.font.bold = True
    r_inst.font.color.rgb = RGBColor(71, 85, 105)

    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_top, space_before=3, space_after=2)
    r_file = p_top.add_run("OFFICE OF RESEARCH, INNOVATION & INTELLECTUAL PROPERTY")
    r_file.font.name = "Calibri"
    r_file.font.size = Pt(12)
    r_file.font.bold = True
    r_file.font.color.rgb = RGBColor(15, 23, 42)

    p_idf = doc.add_paragraph()
    p_idf.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_idf, space_before=4, space_after=18)
    r_idf = p_idf.add_run("INVENTION DISCLOSURE FORM (IDF)")
    r_idf.font.name = "Calibri"
    r_idf.font.size = Pt(19)
    r_idf.font.bold = True
    r_idf.font.color.rgb = RGBColor(15, 23, 42)

    def add_question(q_num, q_text):
        p = doc.add_paragraph()
        style_paragraph(p, space_before=14, space_after=6)
        r = p.add_run(f"Ques.{q_num}. {q_text}")
        r.font.name = "Calibri"
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(15, 23, 42)
        return p

    def add_answer_heading(a_num, prefix=""):
        p = doc.add_paragraph()
        style_paragraph(p, space_before=2, space_after=6)
        text = f"Answer.{a_num}."
        if prefix:
            text += f" {prefix}"
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = RGBColor(30, 41, 59)
        return p

    def add_body(text, bold_prefix="", space_after=6):
        p = doc.add_paragraph()
        style_paragraph(p, space_before=0, space_after=space_after)
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = "Calibri"
            rb.font.size = Pt(10.5)
            rb.font.bold = True
            rb.font.color.rgb = RGBColor(30, 41, 59)
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(10.5)
        r.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        style_paragraph(p, space_before=1, space_after=3)
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = "Calibri"
            rb.font.size = Pt(10.5)
            rb.font.bold = True
            rb.font.color.rgb = RGBColor(30, 41, 59)
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(10.5)
        r.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_numbered(num_str, text, bold_prefix=""):
        p = doc.add_paragraph()
        style_paragraph(p, space_before=2, space_after=4)
        p.paragraph_format.left_indent = Inches(0.25)
        rn = p.add_run(num_str + " ")
        rn.font.name = "Calibri"
        rn.font.size = Pt(10.5)
        rn.font.bold = True
        rn.font.color.rgb = RGBColor(30, 41, 59)
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = "Calibri"
            rb.font.size = Pt(10.5)
            rb.font.bold = True
            rb.font.color.rgb = RGBColor(30, 41, 59)
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(10.5)
        r.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_image_figure(img_path, caption, width=Inches(5.6)):
        if img_path and os.path.exists(img_path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            style_paragraph(p, space_before=8, space_after=3)
            p.add_run().add_picture(img_path, width=width)
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            style_paragraph(p_cap, space_before=0, space_after=10)
            rcap = p_cap.add_run(caption)
            rcap.font.name = "Calibri"
            rcap.font.size = Pt(9.0)
            rcap.font.italic = True
            rcap.font.bold = True
            rcap.font.color.rgb = RGBColor(71, 85, 105)

    def add_callout(text, prefix="VERIFICATION NOTE: "):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
        p = cell.paragraphs[0]
        style_paragraph(p, space_before=0, space_after=0)
        r_pre = p.add_run(prefix)
        r_pre.font.name = "Calibri"
        r_pre.font.size = Pt(9.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(30, 41, 59)
        r_txt = p.add_run(text)
        r_txt.font.name = "Calibri"
        r_txt.font.size = Pt(9.5)
        r_txt.font.color.rgb = RGBColor(71, 85, 105)
        doc.add_paragraph() # spacer

    # ==========================================================================
    # SECTION 1: TITLE OF INVENTION
    # ==========================================================================
    add_question(1, "Title of your invention…")
    add_answer_heading(1, "Fasal Drishti – AI-Powered Smart Agriculture and Farm Monitoring System")
    add_body(
        "Formal Patent Specification Title: Edge-Resilient Multi-Spectral Agro-Telemetry and Multimodal Decision Support Architecture for Precision Field Monitoring.",
        bold_prefix="Academic & Patent Specification Subtitle: "
    )

    # ==========================================================================
    # SECTION 2: TYPE OF INVENTION
    # ==========================================================================
    add_question(2, "Type of Invention…")
    add_answer_heading(2)
    add_body(
        "This invention relates to a computer-implemented agricultural information system and geospatial telemetry processing architecture. "
        "It integrates geospatial GPS boundary vectorization (Shoelace polygon calculation), European Space Agency (ESA) Copernicus Sentinel-2 Level-2A satellite multi-spectral telemetry (NDVI calculation), "
        "Open-Meteo ECMWF numerical weather telemetry, a dual-tier artificial intelligence reasoning pipeline (cloud-based multimodal Large Language Model via Google Gemini @google/genai SDK paired with a deterministic local rule-based agricultural fallback engine), "
        "and a client-side self-healing bounded recovery loop with zero-loss shadow persistence. "
        "The system operates across progressive web applications and native Android devices (via Capacitor) to provide automated, closed-loop farm health monitoring without persistent cloud or database dependencies."
    )

    # ==========================================================================
    # SECTION 3: BRIEF DESCRIPTION
    # ==========================================================================
    add_question(3, "Brief Description of your invention.")
    add_answer_heading(3)
    add_body(
        "The invention relates to an AI-powered smart agriculture and continuous field monitoring platform, designated as Fasal Drishti. "
        "The platform provides end-to-end precision agricultural decision support for smallholder and commercial farmers, agricultural extension workers, and Krishi Vigyan Kendra (KVK) scientists. "
        "The platform ingests field polygon boundaries recorded via mobile/browser GPS coordinates and automatically calculates accurate field land area and centroid coordinates using the Shoelace polygon algorithm. "
        "An autonomous background monitoring scheduler polls ESA Copernicus Sentinel-2 satellite multi-spectral bands (Band 8 NIR and Band 4 Red) to derive calibrated Normalized Difference Vegetation Index (NDVI) scores, "
        "and correlates vegetation vigor with real-time root-zone soil moisture and evapotranspiration (ET0) telemetry fetched from Open-Meteo agro-meteorological models."
    )
    add_body(
        "For crop pathology and diagnostic queries, the invention employs a dual-tier multimodal processing pipeline: "
        "visual leaf photographs and natural vernacular text/voice queries are analyzed using Google Gemini 3.5 Flash-Lite under strict JSON schema enforcement to output concrete immediate actions, dosage requirements, and a 7-day timeline. "
        "To guarantee operational reliability in rural regions with intermittent internet connectivity, the system includes a client-side self-healing engine (with bounded retry loops <= 3 attempts, fault classification, and shadow data restoration) "
        "paired with an offline agronomic rule engine and a dual-persistence backend that operates seamlessly across external MongoDB instances and resilient disk-backed JSON databases without data loss."
    )

    # ==========================================================================
    # SECTION 4: OBJECTIVES OF INVENTION
    # ==========================================================================
    add_question(4, "Objective of your invention.")
    add_answer_heading(4, "Objectives are:")
    add_bullet("To eliminate subjective visual guesswork in farm monitoring by providing automated, objective 10-meter resolution multi-spectral satellite NDVI vegetation vigor tracking.", "1. ")
    add_bullet("To enable accurate spatial boundary capture and acreage computation directly through mobile/web GPS perimeter tracing without requiring specialized surveyor hardware.", "2. ")
    add_bullet("To diagnose crop diseases, pest attacks, and foliar stress rapidly using multimodal vision AI while preventing artificial hallucinations through strict JSON schema constraints and deterministic fallback engines.", "3. ")
    add_bullet("To correlate environmental weather telemetry (temperature, relative humidity, precipitation probability, and soil moisture) with crop phenological growth stages for proactive waterlogging and drought mitigation.", "4. ")
    add_bullet("To provide complete operational resilience against network drops and server restarts through a client-side self-healing recovery loop and dual-persistence storage architecture.", "5. ")
    add_bullet("To overcome rural language barriers by delivering diagnostic results, agricultural advisories, and voice assistance across 12 Indian regional languages without Latin/LaTeX markup corruption.", "6. ")
    add_bullet("To empower farmers with real-time APMC Mandi price discovery, distance-aware market routing, and transparent NPK fertilizer dosage calculators.", "7. ")

    # ==========================================================================
    # SECTION 5: HOW TO USE THE INVENTION
    # ==========================================================================
    add_question(5, "How to use the invention.")
    add_answer_heading(5)
    add_numbered("1.", "Farmer Authentication & Profile Setup: The farmer registers or logs into the platform using an Indian 10-digit mobile number with permanent session persistence. The profile captures agro-climatic region, soil type, and primary crops.", "Step 1: ")
    add_numbered("2.", "GPS Field Perimeter Tracing & Mapping: The farmer walks the perimeter of the farm or selects plot corners on high-resolution Leaflet satellite maps. The system traces the polygon, verifies geometry, and computes total acreage (e.g., 2.5 Acres) and centroid coordinates.", "Step 2: ")
    add_numbered("3.", "Autonomous Satellite & Environmental Sync: Once saved, the autonomous background scheduler registers the field coordinates and queries Copernicus Sentinel-2 satellite passes and Open-Meteo agro-weather telemetry.", "Step 3: ")
    add_numbered("4.", "Vegetation Vigor & Water Stress Monitoring: The farmer accesses the Field Monitoring module to inspect live NDVI scores, multi-zone spatial heatmaps, historical temporal comparisons (7d, 15d, 30d deltas), and root-zone soil water saturation levels.", "Step 4: ")
    add_numbered("5.", "Multimodal Crop Disease Scanning: If abnormal leaf discoloration or pest symptoms appear, the farmer captures a leaf photo via the mobile camera or selects symptoms. The system processes the image through multimodal vision AI to detect the disease with confidence scoring.", "Step 5: ")
    add_numbered("6.", "Actionable Advisory & Dosage Generation: The system outputs clear immediate remedies, organic vs. chemical treatments with exact dosages (e.g., 2g/L water), and next-action timelines (Today, 24 Hours, Next 7 Days).", "Step 6: ")
    add_numbered("7.", "Interactive Voice Interaction (SWAR Assistant): The farmer triggers the floating SWAR assistant button to listen to advisories via text-to-speech or ask voice questions in their native language (Hindi, Punjabi, Marathi, etc.).", "Step 7: ")
    add_numbered("8.", "Fertilizer & Market Price Execution: The farmer utilizes the customized NPK fertilizer calculator for crop-specific stage dosages and reviews nearby APMC Mandi rates to time market sales profitably.", "Step 8: ")
    add_numbered("9.", "Closed-Loop Task Tracking: Dynamic checklists update as the farmer marks treatments complete, automatically feeding back into the farm health history record.", "Step 9: ")

    # ==========================================================================
    # SECTION 6: PROBLEM YOUR INVENTION IS SOLVING
    # ==========================================================================
    add_question(6, "Problem your invention is solving…")
    add_answer_heading(6)
    add_body(
        "Traditional smallholder agriculture in developing countries, particularly India, suffers from critical operational and informational bottlenecks: "
    )
    add_bullet("Delayed Disease & Pest Identification: Farmers typically detect crop infections only after severe foliar damage or yield loss has occurred. Access to Krishi Vigyan Kendra (KVK) scientists or agricultural extension officers is often delayed by days or weeks, forcing farmers into indiscriminate pesticide overuse.", "1. ")
    add_bullet("Lack of Spatial Field-Level Monitoring: Traditional farm inspection relies entirely on manual walking, which fails to detect localized sub-surface waterlogging, micro-nutrient deficiencies, or early-stage canopy degradation across large or divided plots.", "2. ")
    add_bullet("Connectivity Fragility & Data Loss: Most existing cloud-based agricultural applications crash or fail completely when operating in remote rural areas with intermittent cellular connectivity, resulting in lost field records and blank interfaces.", "3. ")
    add_bullet("Unreliable AI Advice & Hallucinations: Generic generative AI models frequently generate dangerous unapproved chemical dosages, hallucinate crop diseases, or output unreadable LaTeX mathematical formatting (e.g., $24^\\circ\\text{C}$) that alienates rural users.", "4. ")
    add_bullet("Linguistic & Literacy Exclusions: Rural farmers are predominantly non-English speakers. Existing software tools lack natural regional language speech synthesis and localized vernacular vocabulary.", "5. ")
    add_body(
        "Fasal Drishti solves these problems through an integrated, edge-resilient architecture combining verified satellite multispectral telemetry, automated polygon geometry calculation, constrained multimodal AI reasoning, client-side self-healing fault recovery, and native vernacular speech synthesis."
    )

    # ==========================================================================
    # SECTION 7: PURPOSE AND OBJECT OF INVENTION
    # ==========================================================================
    add_question(7, "Purpose and object of Invention………")
    add_answer_heading(7)
    add_body(
        "The purpose of this invention is to establish an accessible, failure-resilient, and scientifically rigorous digital farming platform that bridges the gap between orbital satellite telemetry, artificial intelligence, and everyday rural farm management. "
        "The specific technical and practical outcomes include:"
    )
    add_bullet("Autonomous Continuous Telemetry: Transforming passive farm profiles into continuously monitored geospatial entities that periodically evaluate orbital vegetation vigor and soil water balance without requiring manual user polling.", "• ")
    add_bullet("Guaranteed Zero Data Loss & Fault Recovery: Providing client-side self-healing layers that automatically intercept JSON corruption, permission denials, and network timeouts, recovering state from shadow backups within 3 bounded iterations.", "• ")
    add_bullet("Scientific Crop Pathology without Hallucination: Ensuring all agronomic guidance strictly adheres to standardized agronomic schemas, validated active chemical ingredients, and safe dosages verified by agricultural research norms.", "• ")
    add_bullet("Vernacular Speech Equality: Democratizing sophisticated satellite and AI technology for illiterate or semi-literate farmers via hands-free 12-language voice assistants.", "• ")
    add_bullet("Economic Empowerment: Reducing input cultivation costs through precise NPK calculations and optimizing crop realization through real-time government mandi rate transparency.", "• ")

    # ==========================================================================
    # SECTION 8: POTENTIAL COMMERCIAL APPLICATIONS
    # ==========================================================================
    add_question(8, "Discuss potential commercial application of the invention.")
    add_answer_heading(8, "This invention can be utilized across multiple public and commercial sectors:")
    add_bullet("Individual Smallholder & Commercial Farmers: As a direct-to-farmer mobile application (Android APK & PWA) for daily farm monitoring, disease diagnostics, and task scheduling.", "1. ")
    add_bullet("Farmer Producer Organizations (FPOs) & Cooperatives: For managing clustered field mapping, aggregate crop health surveillance, bulk input procurement, and shared mandi market intelligence.", "2. ")
    add_bullet("Krishi Vigyan Kendras (KVK) & Extension Services: As a digital diagnostic portal where extension officers monitor regional crop stress, track pest outbreaks on radar maps, and review escalated farmer cases.", "3. ")
    add_bullet("Agricultural Input & Fertilizer Companies: As an agronomic advisory tool for providing balanced, site-specific fertilizer recommendations and pest management protocols.", "4. ")
    add_bullet("Crop Insurance Providers (PMFBY) & Financial Institutions: Utilizing objective historical Sentinel-2 NDVI time-series curves and rainfall data for fast, fraud-resistant crop loss assessment and claim verification.", "5. ")
    add_bullet("Government Agriculture Departments: For regional crop monitoring, drought/flood impact assessment, and automated delivery of government welfare schemes.", "6. ")
    add_body(
        "Commercialization Models: The platform can be deployed as a freemium mobile software-as-a-service (SaaS) for farmers, an enterprise B2B subscription for FPOs and agribusinesses, or licensed directly to state agricultural boards for regional deployment."
    )

    # ==========================================================================
    # SECTION 9: SUPPORTING EVIDENCE AND REFERENCES
    # ==========================================================================
    add_question(9, "Provide any additional material (such as photographs, reports, publications, and references to texts or other information material) which may be helpful to an understanding of the invention identify and indicate the specific relevance of each.")
    add_answer_heading(9, "The following technical supporting documents, diagrams, and actual application screenshots are attached:")

    add_bullet("Figure 1: Complete System Architecture & Layered Integration Tiers (Supports Ques. 2, 3, 12)", "• ")
    add_bullet("Figure 2: End-to-End Data Flow Diagram from Ingestion Sources to Output Sinks (Supports Ques. 3, 5, 12)", "• ")
    add_bullet("Figure 3: Autonomous Field Monitoring & Sentinel-2 Closed-Loop Scheduling Flowchart (Supports Ques. 4, 7, 12)", "• ")
    add_bullet("Figure 4: Multimodal Plant Pathology & Tiered Diagnostic Fallback Flowchart (Supports Ques. 3, 6, 12)", "• ")
    add_bullet("Screenshot 1: Verified Live Farmer Dashboard (Hariom Yadav - Paddy Crop, 87% Health, Weather & Soil Status) (Supports Ques. 5, 12)", "• ")
    add_bullet("Screenshot 2: GPS-Based Field Perimeter Boundary Tracing & Acreage Computation (Supports Ques. 5, 12)", "• ")
    add_bullet("Screenshot 3: Autonomous Field Monitoring, Multi-Zone NDVI & Soil Moisture Evaluation (Supports Ques. 3, 12)", "• ")
    add_bullet("Screenshot 4: AI Crop Disease Scanner with Multimodal Diagnostic Findings (Supports Ques. 5, 12)", "• ")
    add_bullet("Screenshot 5: Real-Time AGMARKNET Mandi Price Discovery & Distance-Aware Filtering (Supports Ques. 8, 12)", "• ")
    add_bullet("Screenshot 6: SWAR Multilingual Voice Assistant & Active Farm Intelligence Context (Supports Ques. 5, 12)", "• ")

    add_body("--- DETAILED TECHNICAL DIAGRAMS AND VERIFIED APPLICATION SCREENSHOTS ---", bold_prefix="", space_after=10)

    # Insert Diagram 1
    add_image_figure(get_image_path('architecture_diagram.png'), 
                     "Figure 1: Fasal Drishti Complete System Architecture & Layered Integration Tiers")

    # Insert Diagram 2
    add_image_figure(get_image_path('data_flow_diagram.png'), 
                     "Figure 2: End-to-End Data Flow Diagram from Ingestion Sources to Output Action Sinks")

    # Insert Diagram 3
    add_image_figure(get_image_path('field_monitoring_flowchart.png'), 
                     "Figure 3: Autonomous Field Monitoring & Sentinel-2 Closed-Loop Scheduling Pipeline")

    # Insert Diagram 4
    add_image_figure(get_image_path('multimodal_crop_diagnosis_flowchart.png'), 
                     "Figure 4: Multimodal Plant Pathology & Tiered Diagnostic Fallback Flowchart")

    # Insert Screenshot 1: Home Dashboard
    add_image_figure(get_image_path('home_final.png'), 
                     "Screenshot 1: Verified Live Farmer Dashboard (Hariom Yadav - Paddy Crop, 87% Health, Gorakhpur Weather & Soil Moisture)")

    # Insert Screenshot 2: Field Mapping
    add_image_figure(get_image_path('live_mapping_boundary.png'), 
                     "Screenshot 2: GPS-Based Field Perimeter Boundary Tracing with Real Shoelace Acreage Computation")

    # Insert Screenshot 3: Field Monitoring Page
    add_image_figure(get_image_path('live_field_monitoring_page.png'), 
                     "Screenshot 3: Autonomous Field Monitoring Interface showing Multi-Zone NDVI, Soil Moisture, and Weather Correlation")

    # Insert Screenshot 4: Plant Pathology Scanner
    add_image_figure(get_image_path('test_tab_diagnose.png'), 
                     "Screenshot 4: AI Crop Disease Scanner with Multimodal Diagnostic Findings, Chemical/Organic Treatments, and Action Timeline")

    # Insert Screenshot 5: Mandi Prices
    add_image_figure(get_image_path('test_tab_mandi.png'), 
                     "Screenshot 5: Real-Time AGMARKNET Mandi Price Discovery & Predictive Selling Intelligence")

    # Insert Screenshot 6: Mobile Client View / SWAR
    add_image_figure(get_image_path('phone_fd_screen.png'), 
                     "Screenshot 6: Fasal Drishti Native Android / Mobile Viewport with Active Farm Intelligence and SWAR Voice Assistant Trigger")

    # Prior Art & Comparative Differentiation Table
    add_body("Preliminary Prior-Art Comparison Table:", bold_prefix="Supporting Prior-Art Analysis: ")
    table_pa = doc.add_table(rows=5, cols=4)
    table_pa.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Feature / Dimension", "Generic Agriculture Apps (e.g., Plantix)", "Earth Observation Platforms (e.g., NASA Harvest / GEE)", "Fasal Drishti (Present Invention)"]
    widths = [Inches(1.4), Inches(1.5), Inches(1.5), Inches(2.1)]
    
    for i, h in enumerate(headers):
        cell = table_pa.cell(0, i)
        cell.width = widths[i]
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        style_paragraph(p, space_before=0, space_after=0)
        run = p.add_run(h)
        run.font.name = "Calibri"
        run.font.size = Pt(8.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)

    pa_data = [
        ("Disease Diagnosis", "Isolated photo-only CNN classification; lacks field context.", "None; focuses on macro-level yield and land use.", "Multimodal Vision AI (Gemini 3.5) conditioned on farm GPS, soil type, crop stage, and local weather."),
        ("Satellite NDVI Vigor", "Typically absent or limited to static coarse tiles.", "Coarse satellite monitoring; no farmer-actionable micro-dosages.", "Automated 6-hr Sentinel-2 L2A ingestion (10m) combined with root-zone water balance & temporal deltas."),
        ("Offline & Rural Resilience", "Fails or displays blank screen on network disconnect.", "Requires high-bandwidth desktop GIS workstation.", "Client self-healing broker with bounded retry (<=3), shadow localStorage recovery, and deterministic rule engine."),
        ("Vernacular Voice Interface", "Text-heavy; primarily English or machine-translated.", "Complex English GIS dashboards for researchers.", "SWAR floating speech assistant across 12 Indian regional languages with LaTeX markup sanitizer.")
    ]

    for row_idx, data in enumerate(pa_data, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = table_pa.cell(row_idx, col_idx)
            cell.width = widths[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            style_paragraph(p, space_before=0, space_after=0)
            run = p.add_run(text)
            run.font.name = "Calibri"
            run.font.size = Pt(8.0)
            if col_idx == 0:
                run.font.bold = True
                run.font.color.rgb = RGBColor(30, 41, 59)
            elif col_idx == 3:
                run.font.bold = True
                run.font.color.rgb = RGBColor(16, 85, 45) # Dark green
            else:
                run.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph() # spacing

    # ==========================================================================
    # SECTION 10: ABSTRACT
    # ==========================================================================
    add_question(10, "Abstract:")
    add_answer_heading(10)
    add_body(
        "Fasal Drishti is an AI-powered smart agriculture and continuous farm telemetry platform designed to overcome information fragmentation, delayed disease detection, and network failure vulnerabilities in smallholder farming. "
        "The system combines mobile GPS field perimeter tracing with automated spherical Shoelace polygon computation to digitally anchor registered farms and compute exact acreage. "
        "An autonomous background monitoring scheduler polls European Space Agency (ESA) Copernicus Sentinel-2 multispectral satellite imagery (10m resolution) to calculate Normalized Difference Vegetation Index (NDVI) values, "
        "correlating canopy vigor with real-time root-zone soil moisture and agro-weather telemetry fetched from Open-Meteo models. "
        "For crop pathology, a multimodal processing pipeline pairs Google Gemini 3.5 Flash-Lite under strict JSON schema enforcement with a deterministic local agronomy rule engine, ensuring hallucination-free diagnoses, active ingredient dosages, and structured timelines. "
        "To ensure robust operation in remote rural environments, the platform features a client-side self-healing resilience engine with bounded recovery loops and shadow data restoration, alongside a dual-persistence backend operating across MongoDB and local disk-backed JSON databases. "
        "Delivered in 12 Indian regional languages with hands-free voice interaction via the SWAR speech assistant, the platform bridges orbital telemetry, artificial intelligence, and field-level precision agriculture."
    )

    # ==========================================================================
    # SECTION 11: SUMMARY OF THE INVENTION
    # ==========================================================================
    add_question(11, "Summary of the invention:")
    add_answer_heading(11)
    add_body(
        "The invention provides a unified, edge-resilient precision agricultural platform that integrates satellite Earth observation, numerical weather prediction, multimodal artificial intelligence, and mobile GIS mapping into a zero-loss decision support ecosystem. "
        "The primary technological contributions of the system comprise:"
    )
    add_bullet("Spatial Farm Digitization: Vectorized GPS boundary capture using a Shoelace polygon calculation algorithm that accurately determines land acreage and spatial centroids without manual surveyor intervention.", "1. ")
    add_bullet("Continuous Autonomous Earth Observation: An autonomous 6-hour scheduler that fetches Sentinel-2 Level-2A multi-spectral surface reflectance bands (B8 NIR and B4 Red), computes calibrated NDVI indices [NDVI = (B8 - B4)/(B8 + B4)], and detects temporal vegetation degradation.", "2. ")
    add_bullet("Agro-Meteorological Water Balance Modeling: Real-time synthesis of ECMWF weather models, precipitation probability, evapotranspiration (ET0), and soil retention factors to predict root-zone waterlogging or drought stress before visible plant wilting occurs.", "3. ")
    add_bullet("Constrained Multimodal Agronomic Reasoner: A dual-tier diagnostic framework combining large multimodal generative models with an offline deterministic rule engine. Strict system prompts eliminate technical LaTeX notation and enforce approved chemical dosages with organic alternatives.", "4. ")
    add_bullet("Self-Healing Client Architecture & Dual Persistence: A client fault-recovery broker that classifies errors, bounds retries to maximum 3 attempts, recovers corrupted localStorage state from shadow backups, and mirrors server records between MongoDB and disk-backed persistent storage.", "5. ")
    add_bullet("Multilingual Vernacular Accessibility: Complete integration of 12 Indian regional languages with speech-to-text input and natural text-to-speech audio delivery via the SWAR floating voice assistant.", "6. ")

    # ==========================================================================
    # SECTION 12: DETAIL DESCRIPTION OF INVENTION WITH METHODOLOGY
    # ==========================================================================
    add_question(12, "Detail description of invention with methodology.")
    add_answer_heading(12)
    add_body(
        "The Fasal Drishti system is organized into distinct, interacting technological layers that execute data ingestion, spatial indexing, multi-spectral satellite processing, multimodal diagnostic reasoning, and client-side self-healing fault recovery. "
        "The detailed methodology is described below according to the system's verified architectural components."
    )

    add_body("1. Overall System Architecture & Tiers", bold_prefix="12.1 ")
    add_body(
        "As depicted in Figure 1, the platform operates across five coordinated functional tiers: "
        "(a) Tier 1 (Presentation & Client Acquisition Layer): Implemented in React 18, Vite, and Tailwind CSS, bundled with Capacitor for native Android deployment and PWA execution. GIS visualization is handled by Leaflet.js with dual Esri World Imagery satellite and OpenStreetMap layers. "
        "(b) Tier 2 (Client-Side Self-Healing Engine): Composed of ErrorClassifier.js, ValidationManager.js, RecoveryManager.js, and FeatureRecoveryStrategy.js, enforcing zero-loss bounded retry loops and shadow backup restoration. "
        "(c) Tier 3 (Core Application Backend): A Node.js and Express REST API server providing 19 modular endpoints, managing session authentication, AI orchestration, autonomous background scheduling, and telemetry synthesis. "
        "(d) Tier 4 (Dual-Persistence Subsystem): A hybrid storage engine where write operations are mirrored to MongoDB Atlas (when available) and an in-memory/disk-backed JSON persistent store (fasal_drishti_persistent_db.json), guaranteeing zero data loss during server restarts or offline operation. "
        "(e) Tier 5 (External Telemetry Ingestion): Secure HTTPS interfaces connecting to ESA Copernicus CDSE, Open-Meteo Weather API, Google Gemini AI API, and AGMARKNET / Data.gov.in."
    )

    add_body("2. GPS Field Mapping & Polygon Boundary Processing Methodology", bold_prefix="12.2 ")
    add_body(
        "When a farmer defines a field boundary, the system records sequential geographic coordinate vertices P_i = (lat_i, lng_i) for i = 1, ..., n (n >= 3). "
        "The spatial area A is calculated using the spherical projection Shoelace formula converted into acres: "
        "Area (sq meters) = (R^2 / 2) * |sum_{i=1}^n (lng_{i+1} - lng_{i-1}) * sin(lat_i)|, where R = 6,378,137 meters. "
        "The geometric centroid C = (lat_c, lng_c) is computed as lat_c = (1/n) * sum(lat_i) and lng_c = (1/n) * sum(lng_i). "
        "These coordinates are converted into Well-Known Text (WKT) POLYGON format to enable spatial intersection queries with orbital satellite footprints."
    )

    add_body("3. Satellite Multi-Spectral Processing & NDVI Computation", bold_prefix="12.3 ")
    add_body(
        "The autonomous monitoring scheduler executes every 6 hours. For each monitored field, the centroid and WKT polygon are submitted to the ESA Copernicus Data Space Ecosystem (CDSE) OData catalog. "
        "The query filters for Sentinel-2 Level-2A Bottom-Of-Atmosphere (BOA) surface reflectance products with cloud cover <= 30%. "
        "The Normalized Difference Vegetation Index (NDVI) is computed across the 10-meter resolution spectral bands: "
        "NDVI = (Band 8 [NIR] - Band 4 [Red]) / (Band 8 [NIR] + Band 4 [Red]). "
        "Vegetation vigor is classified into operational agronomic states: "
        "NDVI >= 0.70 (Vigorous Canopy / Healthy), 0.50 - 0.69 (Moderate Vigor / Normal Growth), 0.35 - 0.49 (Vegetative Stress / Yellowing), < 0.35 (Severe Stress / Barren / Soil). "
        "Temporal comparisons calculate deltas: Delta_NDVI = NDVI_current - NDVI_historical for 7-day, 15-day, and 30-day windows without interpolating or fabricating missing satellite passes."
    )

    add_body("4. Agro-Meteorological Water Balance & Root-Zone Moisture Engine", bold_prefix="12.4 ")
    add_body(
        "To evaluate field water stress without expensive in-situ IoT probes, the system queries Open-Meteo ECMWF numerical weather models for the field centroid: "
        "retrieving 2m temperature, relative humidity, precipitation sum (mm), wind speed, FAO-56 Penman-Monteith reference evapotranspiration (ET0), and 0-7cm soil moisture. "
        "The effective field crop water demand is computed as: ET_c = K_c * ET_0, where K_c is the growth-stage crop coefficient (e.g., Sowing = 0.40, Flowering = 1.15, Maturity = 0.65). "
        "Soil water retention factor S_r is applied based on farmer soil classification (Black Soil = 1.25, Alluvial = 1.10, Sandy Loam = 0.75). "
        "When cumulative rainfall exceeds field drainage capacity (Precipitation > 3 * ET_c) under slow-draining soil, an automated Waterlogging Anomaly Alert is generated."
    )

    add_body("5. Multimodal AI Diagnostic Reasoning & Schema Enforcement", bold_prefix="12.5 ")
    add_body(
        "When a farmer submits a leaf photograph or symptom query, the system executes a dual-tier diagnostic pipeline: "
        "Tier 1 invokes Google Gemini 3.5 Flash-Lite multimodal model with system instructions enforcing Senior KVK Scientist role-playing. "
        "Strict JSON schema output is enforced, returning fields: crop_name, detected_issue, severity, health_score (1-100), what_needs_attention, what_to_do_now, why_is_this_happening, and action_timeline (Today, 24 Hours, 2-3 Days, Next 7 Days). "
        "A post-processing sanitizer (cleanLatexAndFormat) automatically converts broken LaTeX symbols ($24^\\circ\\text{C}$ -> 24°C, $\\sim$ -> लगभग) into plain text. "
        "If the cloud AI endpoint experiences rate limits or timeouts, Tier 2 (Universal Agriculture Rule Engine) instantly generates deterministic agronomic recommendations from an internal pathology matrix, ensuring 100% uptime."
    )

    add_body("6. Client-Side Self-Healing & Fault-Recovery Broker", bold_prefix="12.6 ")
    add_body(
        "To prevent white-screen crashes on rural mobile devices, the frontend embeds a self-healing supervision layer. "
        "Errors are trapped and classified into categories: NETWORK_ERROR, PERMISSION_ERROR, SESSION_ERROR, PARSING_ERROR, or AI_PROVIDER_ERROR. "
        "RecoveryManager executes a strictly bounded loop (attempt < 3) to prevent infinite loops. "
        "If localStorage becomes corrupted, shadow backup restoration automatically recovers cached farm boundaries and user sessions with zero data loss. "
        "All telemetry data and diagnostic logs are sanitized to redact passwords and tokens before storage."
    )

    add_body("7. Verified Feature Implementation Status (Operational vs. Simulated vs. Planned)", bold_prefix="12.7 ")
    add_body(
        "In compliance with patent disclosure rigor, Table 2 documents the exact implementation status of each system component based on source code verification:"
    )

    table_feats = doc.add_table(rows=7, cols=4)
    table_feats.alignment = WD_TABLE_ALIGNMENT.CENTER
    f_headers = ["Subsystem / Feature", "Active Provider / Component", "Implementation State", "Verified Technical Behavior"]
    f_widths = [Inches(1.5), Inches(1.6), Inches(1.4), Inches(1.9)]

    for i, h in enumerate(f_headers):
        cell = table_feats.cell(0, i)
        cell.width = f_widths[i]
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        style_paragraph(p, space_before=0, space_after=0)
        run = p.add_run(h)
        run.font.name = "Calibri"
        run.font.size = Pt(8.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)

    feat_data = [
        ("Mobile & Web Frontend", "React 18 + Vite + Tailwind CSS + Capacitor 8", "Fully Implemented & Tested", "Live Android APK & GitHub Pages PWA with touch navigation and offline cache."),
        ("Crop Disease Scanner", "Google Gemini 3.5 Flash-Lite + Vision API", "Fully Implemented & Tested", "Multimodal leaf diagnosis with JSON schema enforcement and local KVK rule fallback."),
        ("Weather Forecast", "Open-Meteo ECMWF Numerical Weather API", "Fully Implemented & Operational", "Live 5-day agro-meteorological forecast, rain probability, and ET0 calculation."),
        ("Mandi Bhav Market Rates", "Data.gov.in Agmarknet Official Resource API", "Fully Implemented & Operational", "Live APMC prices (Resource ID: 9ef84268-d588) with in-memory historical backup."),
        ("Satellite NDVI Vigor", "ESA Copernicus Sentinel-2 OData API", "Implemented & Operational", "Live OData querying for S2A/S2B L2A products; ISRO Bhuvan & GEE planned."),
        ("Soil & In-Field Sensors", "REST Telemetry API (Field.js schema) + UI Input", "Simulated / Schema Ingestion", "Software ingestion endpoint active; physical ESP32 / LoRaWAN hardware is planned.")
    ]

    for row_idx, data in enumerate(feat_data, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = table_feats.cell(row_idx, col_idx)
            cell.width = f_widths[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            style_paragraph(p, space_before=0, space_after=0)
            run = p.add_run(text)
            run.font.name = "Calibri"
            run.font.size = Pt(8.0)
            if col_idx == 0:
                run.font.bold = True
                run.font.color.rgb = RGBColor(30, 41, 59)
            elif col_idx == 2:
                run.font.bold = True
                if "Fully Implemented" in text:
                    run.font.color.rgb = RGBColor(16, 85, 45) # Dark green
                else:
                    run.font.color.rgb = RGBColor(180, 83, 9) # Amber
            else:
                run.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph() # spacing

    add_body("8. Working Process Sequence", bold_prefix="12.8 ")
    add_numbered("1.", "User registers or logs in with 10-digit mobile number; permanent JWT access session is generated and cached in local storage.", "")
    add_numbered("2.", "Farmer defines field boundary polygon using GPS location or Leaflet map selection; Shoelace algorithm calculates acreage and centroid.", "")
    add_numbered("3.", "System stores field records in dual persistence (MongoDB Atlas and disk JSON store).", "")
    add_numbered("4.", "Autonomous 6-hour scheduler evaluates active fields against Sentinel-2 multispectral passes and Open-Meteo weather models.", "")
    add_numbered("5.", "Scheduler computes NDVI vegetation vigor and root-zone water balance; if stress is detected, closed-loop alerts and action plans are generated.", "")
    add_numbered("6.", "Farmer submits leaf photos or voice questions for disease diagnosis; multimodal AI processes the request under strict JSON schema enforcement.", "")
    add_numbered("7.", "Deterministic rule engine provides immediate backup if cloud AI is unreachable.", "")
    add_numbered("8.", "SWAR voice assistant synthesizes advice in 12 regional languages and provides hands-free conversational assistance.", "")
    add_numbered("9.", "Actionable tasks are saved to farmer checklists, and real-time mandi prices are tracked to optimize market selling.", "")

    # ==========================================================================
    # SECTION 13: APPLICANT AND INVENTOR DETAILS
    # ==========================================================================
    add_question(13, "Applicant and inventor details(Name with address):")
    add_answer_heading(13)

    add_body("Invention Identity & Institution:", bold_prefix="13.1 ")
    add_bullet("Invention Name: Fasal Drishti – AI-Powered Smart Agriculture and Farm Monitoring System", "• ")
    add_bullet("Institution / College: KIPM College of Engineering and Technology, GIDA, Gorakhpur, Uttar Pradesh", "• ")
    add_bullet("Institutional Address: Plot No. BL-1 & 2, Sector-9, GIDA, Gorakhpur, Uttar Pradesh, India - 273209", "• ")
    add_bullet("Academic Guide: Mr. Nitesh Jaiswal, Training and Placement Head, KIPM College of Engineering and Technology", "• ")
    add_bullet("Official Project Email: fasaldrishti@gmail.com", "• ")
    add_bullet("Primary Contact Phone: +91 6306237144", "• ")
    add_bullet("Applicant Ownership: Inventors (joint applicant ownership, subject to confirmation of legal details) [TO CONFIRM legal applicant status: whether individual student inventors or jointly assigned through KIPM College]", "• ")
    add_bullet("Internal Hackathon Disclosure Date: 20 August [TO CONFIRM: Year and Event Context, e.g., 2026 / Internal College Hackathon]", "• ")

    add_body("Inventors' Complete Roster & Verified Addresses:", bold_prefix="13.2 ")
    add_body(
        "Note: The address-to-inventor mapping is preserved in the exact order provided by the project team. "
        "All details are marked for final student verification and PIN code confirmation prior to formal patent office filing."
    )

    table_inv = doc.add_table(rows=7, cols=4)
    table_inv.alignment = WD_TABLE_ALIGNMENT.CENTER
    i_headers = ["S.No.", "Inventor Full Name", "Residential Address (As Provided)", "Status / Note"]
    i_widths = [Inches(0.6), Inches(1.8), Inches(2.7), Inches(1.3)]

    for i, h in enumerate(i_headers):
        cell = table_inv.cell(0, i)
        cell.width = i_widths[i]
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        style_paragraph(p, space_before=0, space_after=0)
        run = p.add_run(h)
        run.font.name = "Calibri"
        run.font.size = Pt(8.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)

    inventor_rows = [
        ("1", "Prince Yadav", "Shahpur, Gita Vatika – 273006", "Address mapped; [TO CONFIRM PIN & full street]"),
        ("2", "Hariom Yadav", "Gorakhpur, Sahajanwa – 273209", "Address mapped; [TO CONFIRM full house details]"),
        ("3", "Ankush Singh", "Gorakhpur – complete address not provided", "[TO CONFIRM: Complete street & PIN code]"),
        ("4", "Reetu Mishra", "Dhuriyapar, Uruwa Bazar, Gorakhpur – 273407", "Address mapped; [TO CONFIRM full street details]"),
        ("5", "Soni Singh", "Bhikhampur Road, Deoria – 274001", "Address mapped; [TO CONFIRM full house details]"),
        ("6", "Garima", "Tamkuhi Raj, Kushinagar – 274407", "Address mapped; [TO CONFIRM surname & full street]")
    ]

    for row_idx, data in enumerate(inventor_rows, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = table_inv.cell(row_idx, col_idx)
            cell.width = i_widths[col_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            style_paragraph(p, space_before=0, space_after=0)
            run = p.add_run(text)
            run.font.name = "Calibri"
            run.font.size = Pt(8.0)
            if col_idx == 1:
                run.font.bold = True
                run.font.color.rgb = RGBColor(30, 41, 59)
            elif col_idx == 3 and "[TO CONFIRM" in text:
                run.font.bold = True
                run.font.color.rgb = RGBColor(180, 83, 9) # Amber
            else:
                run.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph() # spacing

    # Remaining Confirmations Checklist
    add_body("Remaining Confirmations Checklist for Legal Filing:", bold_prefix="13.3 ")
    add_bullet("[TO CONFIRM] Legal Applicant Ownership: Confirmation whether the patent will be filed jointly in the names of all 6 individual student inventors, or filed under the institutional name of KIPM College of Engineering and Technology with students as inventors.", "• ")
    add_bullet("[TO CONFIRM] Address Verification: Complete house numbers, street names, and PIN codes for Inventor 3 (Ankush Singh) and Inventor 6 (Garima).", "• ")
    add_bullet("[TO CONFIRM] Complete Date & Event Year: Exact calendar year for the 20 August disclosure date (e.g., 20 August 2026) and official name of the KIPM internal college hackathon.", "• ")
    add_bullet("[TO CONFIRM] Prior Public Disclosure Grace Period: Verification of whether the project was publicly presented outside the college before filing (Indian Patent Act Section 31 grace period eligibility).", "• ")

    # Save to both paths
    dest_path1 = os.path.join(SUBMISSION_DIR, 'Fasal_Drishti_Patent_IDF_Final.docx')
    dest_path2 = os.path.join(BASE_DIR, 'Fasal_Drishti_Patent_IDF_Final.docx')
    
    doc.save(dest_path1)
    doc.save(dest_path2)
    print(f"Successfully generated DOCX:\n1. {dest_path1}\n2. {dest_path2}")

    return dest_path1, dest_path2

def convert_to_pdf(docx_path):
    pdf_path = docx_path.replace('.docx', '.pdf')
    try:
        import win32com.client
        import pythoncom
        pythoncom.CoInitialize()
        word = win32com.client.Dispatch('Word.Application')
        word.Visible = False
        doc = word.Documents.Open(os.path.abspath(docx_path))
        doc.SaveAs(os.path.abspath(pdf_path), FileFormat=17) # 17 = wdFormatPDF
        doc.Close()
        word.Quit()
        print(f"Successfully generated PDF: {pdf_path}")
        return pdf_path
    except Exception as e:
        print(f"PDF conversion note: {e}")
        return None

if __name__ == '__main__':
    docx1, docx2 = build_document()
    convert_to_pdf(docx1)
    convert_to_pdf(docx2)
