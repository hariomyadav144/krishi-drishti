import os
import sys
import io
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
import pypdf
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUBMISSION_DIR = os.path.join(BASE_DIR, 'patent_idf_submission')
DOCS_DIR = os.path.join(BASE_DIR, 'docs')

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
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

def generate_cover_and_toc_docx():
    doc = Document()
    for s in doc.sections:
        s.top_margin = Inches(0.9)
        s.bottom_margin = Inches(0.9)
        s.left_margin = Inches(0.9)
        s.right_margin = Inches(0.9)

    # --------------------------------------------------------------------------
    # PAGE 1: MASTER EXECUTIVE COVER PAGE
    # --------------------------------------------------------------------------
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_inst, space_before=0, space_after=2)
    r1 = p_inst.add_run("KIPM COLLEGE OF ENGINEERING AND TECHNOLOGY")
    r1.font.name = "Calibri"
    r1.font.size = Pt(13)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(15, 23, 42)

    p_loc = doc.add_paragraph()
    p_loc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_loc, space_before=0, space_after=18)
    r2 = p_loc.add_run("Plot No. BL-1 & 2, Sector-9, GIDA, Gorakhpur, Uttar Pradesh, India - 273209\nAffiliated to Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow")
    r2.font.name = "Calibri"
    r2.font.size = Pt(9.5)
    r2.font.color.rgb = RGBColor(71, 85, 105)

    p_bar = doc.add_paragraph()
    p_bar.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_bar, space_before=0, space_after=12)
    r_bar = p_bar.add_run("────────────────────────────────────────────────────────────────────────")
    r_bar.font.name = "Calibri"
    r_bar.font.size = Pt(10)
    r_bar.font.color.rgb = RGBColor(203, 213, 225)

    p_dossier = doc.add_paragraph()
    p_dossier.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_dossier, space_before=6, space_after=4)
    r_dos = p_dossier.add_run("OFFICIAL PATENT APPLICATION & TECHNICAL DOSSIER")
    r_dos.font.name = "Calibri"
    r_dos.font.size = Pt(12)
    r_dos.font.bold = True
    r_dos.font.color.rgb = RGBColor(30, 58, 138) # Deep navy

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_title, space_before=4, space_after=6)
    r_title = p_title.add_run("FASAL DRISHTI")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(26)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_sub, space_before=0, space_after=20)
    r_sub = p_sub.add_run("AI-Powered Smart Agriculture, Multi-Spectral Agro-Telemetry,\nand Continuous Farm Health Monitoring System")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(12)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(16, 85, 45) # Deep forest green

    # Metadata Summary Box
    table_meta = doc.add_table(rows=5, cols=2)
    table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_widths = [Inches(2.2), Inches(4.5)]
    meta_data = [
        ("Invention Name", "Fasal Drishti – AI-Powered Smart Agriculture and Farm Monitoring System"),
        ("Applicant Ownership", "Inventors (joint applicant ownership, subject to confirmation of legal details) [TO CONFIRM legal applicant status: whether individual student inventors or jointly assigned through institution]"),
        ("Institution & Guide", "KIPM College of Engineering & Technology, GIDA, Gorakhpur | Guide: Mr. Nitesh Jaiswal (Training & Placement Head)"),
        ("Official Contact", "Email: fasaldrishti@gmail.com | Phone: +91 6306237144"),
        ("Disclosure Context", "20 August [TO CONFIRM: Year and Event Context, e.g., 2026 / Internal College Hackathon]")
    ]

    for idx, (label, val) in enumerate(meta_data):
        cell_lbl = table_meta.cell(idx, 0)
        cell_val = table_meta.cell(idx, 1)
        cell_lbl.width = meta_widths[0]
        cell_val.width = meta_widths[1]
        set_cell_background(cell_lbl, "F1F5F9")
        set_cell_background(cell_val, "FFFFFF")
        set_cell_margins(cell_lbl, top=60, bottom=60, left=100, right=100)
        set_cell_margins(cell_val, top=60, bottom=60, left=100, right=100)
        
        p1 = cell_lbl.paragraphs[0]
        style_paragraph(p1, space_before=0, space_after=0)
        r_lbl = p1.add_run(label)
        r_lbl.font.name = "Calibri"
        r_lbl.font.size = Pt(9.0)
        r_lbl.font.bold = True
        r_lbl.font.color.rgb = RGBColor(30, 41, 59)

        p2 = cell_val.paragraphs[0]
        style_paragraph(p2, space_before=0, space_after=0)
        r_val = p2.add_run(val)
        r_val.font.name = "Calibri"
        r_val.font.size = Pt(9.0)
        r_val.font.color.rgb = RGBColor(51, 65, 85)

    p_sp = doc.add_paragraph()
    style_paragraph(p_sp, space_before=8, space_after=2)

    p_inv_hdr = doc.add_paragraph()
    style_paragraph(p_inv_hdr, space_before=4, space_after=4)
    r_ih = p_inv_hdr.add_run("INVENTORS' ROSTER & ADDRESSES (AS PROVIDED):")
    r_ih.font.name = "Calibri"
    r_ih.font.size = Pt(10)
    r_ih.font.bold = True
    r_ih.font.color.rgb = RGBColor(15, 23, 42)

    table_inv = doc.add_table(rows=7, cols=3)
    table_inv.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_widths = [Inches(0.6), Inches(2.2), Inches(3.9)]
    inv_headers = ["S.No.", "Inventor Full Name", "Residential Address (As Provided)"]
    for i, h in enumerate(inv_headers):
        c = table_inv.cell(0, i)
        c.width = t_widths[i]
        set_cell_background(c, "1E293B")
        set_cell_margins(c, top=60, bottom=60, left=80, right=80)
        p = c.paragraphs[0]
        style_paragraph(p, space_before=0, space_after=0)
        rn = p.add_run(h)
        rn.font.name = "Calibri"
        rn.font.size = Pt(8.5)
        rn.font.bold = True
        rn.font.color.rgb = RGBColor(255, 255, 255)

    inv_list = [
        ("1", "Prince Yadav", "Shahpur, Gita Vatika – 273006 [TO CONFIRM complete house details]"),
        ("2", "Hariom Yadav", "Gorakhpur, Sahajanwa – 273209 [TO CONFIRM complete house details]"),
        ("3", "Ankush Singh", "Gorakhpur – complete address not provided [TO CONFIRM street & PIN]"),
        ("4", "Reetu Mishra", "Dhuriyapar, Uruwa Bazar, Gorakhpur – 273407 [TO CONFIRM street details]"),
        ("5", "Soni Singh", "Bhikhampur Road, Deoria – 274001 [TO CONFIRM house details]"),
        ("6", "Garima", "Tamkuhi Raj, Kushinagar – 274407 [TO CONFIRM surname & street]")
    ]

    for row_idx, row in enumerate(inv_list, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(row):
            c = table_inv.cell(row_idx, col_idx)
            c.width = t_widths[col_idx]
            set_cell_background(c, bg)
            set_cell_margins(c, top=50, bottom=50, left=80, right=80)
            p = c.paragraphs[0]
            style_paragraph(p, space_before=0, space_after=0)
            rn = p.add_run(text)
            rn.font.name = "Calibri"
            rn.font.size = Pt(8.0)
            if col_idx == 1:
                rn.font.bold = True
                rn.font.color.rgb = RGBColor(30, 41, 59)
            else:
                rn.font.color.rgb = RGBColor(71, 85, 105)

    # --------------------------------------------------------------------------
    # PAGE 2: TABLE OF CONTENTS
    # --------------------------------------------------------------------------
    doc.add_page_break()

    p_toc_title = doc.add_paragraph()
    p_toc_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_toc_title, space_before=6, space_after=4)
    r_tt = p_toc_title.add_run("TABLE OF CONTENTS & DOSSIER STRUCTURE")
    r_tt.font.name = "Calibri"
    r_tt.font.size = Pt(16)
    r_tt.font.bold = True
    r_tt.font.color.rgb = RGBColor(15, 23, 42)

    p_toc_sub = doc.add_paragraph()
    p_toc_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_toc_sub, space_before=0, space_after=14)
    r_ts = p_toc_sub.add_run("Fasal Drishti — Complete Integrated Patent Specification & Engineering Dossier")
    r_ts.font.name = "Calibri"
    r_ts.font.size = Pt(10)
    r_ts.font.color.rgb = RGBColor(71, 85, 105)

    table_toc = doc.add_table(rows=1, cols=3)
    table_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    toc_widths = [Inches(1.2), Inches(4.3), Inches(1.2)]
    
    # Headers
    h_c0 = table_toc.cell(0, 0)
    h_c1 = table_toc.cell(0, 1)
    h_c2 = table_toc.cell(0, 2)
    h_c0.width, h_c1.width, h_c2.width = toc_widths
    set_cell_background(h_c0, "1E293B")
    set_cell_background(h_c1, "1E293B")
    set_cell_background(h_c2, "1E293B")
    for cell, text, align in [(h_c0, "Section", WD_ALIGN_PARAGRAPH.LEFT), (h_c1, "Document Title & Scope of Content", WD_ALIGN_PARAGRAPH.LEFT), (h_c2, "Page Range", WD_ALIGN_PARAGRAPH.RIGHT)]:
        set_cell_margins(cell, top=70, bottom=70, left=90, right=90)
        p = cell.paragraphs[0]
        p.alignment = align
        style_paragraph(p, space_before=0, space_after=0)
        rn = p.add_run(text)
        rn.font.name = "Calibri"
        rn.font.size = Pt(8.5)
        rn.font.bold = True
        rn.font.color.rgb = RGBColor(255, 255, 255)

    toc_entries = [
        ("Preliminaries", "Master Executive Cover Page & Project Information Block", "Page 1"),
        ("TOC", "Comprehensive Table of Contents & Structure of the Dossier", "Page 2"),
        ("Part I", "Invention Disclosure Form (IDF) — Academic Patent Specification\n• Ques. 1: Title of Invention & Technical Subtitle\n• Ques. 2: Type of Invention (Computer-Implemented System)\n• Ques. 3: Brief Description (End-to-End Operational Overview)\n• Ques. 4: Objectives of Invention (7 Verified Engineering Goals)\n• Ques. 5: Working Process & Usage Instructions (9 Step-by-Step Actions)\n• Ques. 6: Agricultural Problems Solved (Field-level bottlenecks)\n• Ques. 7: Purpose, Object & Technical Contributions\n• Ques. 8: Commercial Applications & Deployment Models", "Pages 3 – 8"),
        ("Part I (Cont.)", "Supporting Technical Evidence, Diagrams & Application Screenshots\n• Figure 1: System Architecture & Layered Integration Tiers\n• Figure 2: End-to-End Telemetry Data Flow Diagram\n• Figure 3: Autonomous Monitoring & Sentinel-2 Closed-Loop Scheduling\n• Figure 4: Multimodal Plant Pathology Diagnostic Fallback Flowchart\n• Screenshot 1: Verified Live Farmer Dashboard (Hariom Yadav - Paddy)\n• Screenshot 2: GPS-Based Boundary Tracing & Shoelace Acreage\n• Screenshot 3: Autonomous Field Monitoring, Multi-Zone NDVI & Soil Water\n• Screenshot 4: Multimodal AI Crop Disease Scanner & Action Timeline\n• Screenshot 5: AGMARKNET Official Mandi Price Discovery Interface\n• Screenshot 6: SWAR Floating Voice Assistant & Native Android Client\n• Table 1: Preliminary Prior-Art Comparison Matrix", "Pages 9 – 14"),
        ("Part I (Cont.)", "Patent Specification Text, Methodology & Legal Declarations\n• Ques. 10: Formal Patent Specification Abstract\n• Ques. 11: Summary of Invention (6 Primary Technological Pillars)\n• Ques. 12: Detailed Description & Engineering Methodology (12.1 – 12.8)\n• Table 2: Verified Implementation Status (Active vs. Simulated vs. Planned)\n• Ques. 13: Applicant, Inventor Roster, Institutional Details & Confirmations", "Pages 15 – 23"),
        ("Part II", "Technical & Architectural Project Report (Academic Project Report)\n• Chapter 1: Motivation, Problem Statement & Engineering Goals\n• Chapter 2: Real Data Sources & Acquisition Architecture (Copernicus / Open-Meteo)\n• Chapter 3: System Architecture & Technical Specifications (React/Express/MongoDB)\n• Chapter 4: Interactive GPS Field Boundary Mapping & Shoelace Area Computation\n• Chapter 5: Multimodal AI Crop Disease Scanner & Gemini Vision Integration\n• Chapter 6: Satellite Radar, Sentinel-2 Multispectral & Agro-Meteorology\n• Chapter 7: Market Rates, SWAR Multilingual Voice Assistant & Utilities\n• Chapter 8: Comprehensive Comparative Analysis & Technological Differentiators\n• Chapter 9: Engineering Challenges, Field Testing & Academic References", "Pages 24 – 33"),
        ("Part III", "Fasal Drishti Technical Audit Report\n• Architectural inspection, component-by-component verification\n• Full code mapping & patent claim foundations (Shoelace, NDVI, Gemini, Self-healing)", "Pages 34 – 35"),
        ("Part IV", "Patent IDF Evidence & Filing Action Checklist\n• Itemized audit of verified artifacts, diagrams, code files\n• Pre-filing confirmation checklist (Ownership, Full Addresses, Calendar Year)", "Page 36")
    ]

    for idx, (sec, title, p_range) in enumerate(toc_entries):
        row = table_toc.add_row()
        c0, c1, c2 = row.cells
        c0.width, c1.width, c2.width = toc_widths
        bg = "F8FAFC" if idx % 2 == 1 else "FFFFFF"
        for c in (c0, c1, c2):
            set_cell_background(c, bg)
            set_cell_margins(c, top=60, bottom=60, left=90, right=90)
        
        p0 = c0.paragraphs[0]
        style_paragraph(p0, space_before=0, space_after=0)
        r0 = p0.add_run(sec)
        r0.font.name = "Calibri"
        r0.font.size = Pt(8.5)
        r0.font.bold = True
        r0.font.color.rgb = RGBColor(30, 41, 59)

        p1 = c1.paragraphs[0]
        style_paragraph(p1, space_before=0, space_after=0)
        r1 = p1.add_run(title)
        r1.font.name = "Calibri"
        r1.font.size = Pt(8.0)
        r1.font.color.rgb = RGBColor(51, 65, 85)

        p2 = c2.paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        style_paragraph(p2, space_before=0, space_after=0)
        r2 = p2.add_run(p_range)
        r2.font.name = "Calibri"
        r2.font.size = Pt(8.0)
        r2.font.bold = True
        r2.font.color.rgb = RGBColor(16, 85, 45) # Green

    cover_docx = os.path.join(SUBMISSION_DIR, 'temp_cover_toc.docx')
    doc.save(cover_docx)
    print(f"Cover and TOC docx saved to: {cover_docx}")
    return cover_docx

def convert_docx_to_pdf(docx_path):
    pdf_path = docx_path.replace('.docx', '.pdf')
    import win32com.client
    import pythoncom
    pythoncom.CoInitialize()
    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    doc = word.Documents.Open(os.path.abspath(docx_path))
    doc.SaveAs(os.path.abspath(pdf_path), FileFormat=17) # wdFormatPDF
    doc.Close()
    word.Quit()
    print(f"Converted {docx_path} -> {pdf_path}")
    return pdf_path

def create_page_number_overlay(page_number, total_pages, page_width, page_height):
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
    can.setFont("Helvetica", 7.5)
    can.setFillColor(HexColor("#64748B")) # Slate 500
    
    # Bottom margin line & page number
    # Don't draw on cover page (page 1)
    if page_number > 1:
        can.drawString(54, 32, "FASAL DRISHTI — COMPLETE PATENT SPECIFICATION & TECHNICAL DOSSIER")
        can.drawRightString(page_width - 54, 32, f"Page {page_number} of {total_pages}")
        can.setStrokeColor(HexColor("#E2E8F0"))
        can.setLineWidth(0.5)
        can.line(54, 42, page_width - 54, 42)
    
    can.save()
    packet.seek(0)
    return pypdf.PdfReader(packet).pages[0]

def build_complete_merged_pdf():
    print("Step 1: Generating Master Cover Page & Table of Contents...")
    cover_docx = generate_cover_and_toc_docx()
    cover_pdf = convert_docx_to_pdf(cover_docx)

    # Documents to merge in exact logical order:
    doc_sources = [
        ("Master Cover Page & Table of Contents", cover_pdf),
        ("Invention Disclosure Form (IDF) Final Academic Specification", os.path.join(SUBMISSION_DIR, 'Fasal_Drishti_Patent_IDF_Final.pdf')),
        ("Fasal Drishti Technical & Architectural Project Report", os.path.join(DOCS_DIR, 'Fasal_Drishti_Academic_Project_Report.pdf')),
        ("Fasal Drishti Technical Audit Report", os.path.join(SUBMISSION_DIR, 'Fasal_Drishti_Technical_Audit.pdf')),
        ("Patent IDF Evidence & Filing Action Checklist", os.path.join(SUBMISSION_DIR, 'Fasal_Drishti_IDF_Evidence_Checklist.pdf'))
    ]

    print("\nStep 2: Inspecting and loading source PDF files...")
    all_pages = []
    source_summary = []

    for label, path in doc_sources:
        if not os.path.exists(path):
            print(f"ERROR: Missing expected PDF file: {path} ({label})")
            continue
        reader = pypdf.PdfReader(path)
        count = len(reader.pages)
        source_summary.append((label, os.path.basename(path), count))
        print(f" -> Loaded {count} pages from '{label}' [{os.path.basename(path)}]")
        for page in reader.pages:
            all_pages.append(page)

    total_pages = len(all_pages)
    print(f"\nStep 3: Stamping continuous running headers and numbering across {total_pages} total pages...")

    writer = pypdf.PdfWriter()

    for idx, page in enumerate(all_pages, start=1):
        box = page.mediabox
        p_width = float(box.width)
        p_height = float(box.height)
        
        overlay = create_page_number_overlay(idx, total_pages, p_width, p_height)
        page.merge_page(overlay)
        writer.add_page(page)

    final_pdf_dest1 = os.path.join(SUBMISSION_DIR, 'Fasal_Drishti_Complete_Patent_Document.pdf')
    final_pdf_dest2 = os.path.join(BASE_DIR, 'Fasal_Drishti_Complete_Patent_Document.pdf')

    with open(final_pdf_dest1, 'wb') as f:
        writer.write(f)
    print(f"\nSuccessfully wrote merged dossier to:\n1. {final_pdf_dest1} ({os.path.getsize(final_pdf_dest1)} bytes)")

    with open(final_pdf_dest2, 'wb') as f:
        writer.write(f)
    print(f"2. {final_pdf_dest2} ({os.path.getsize(final_pdf_dest2)} bytes)")

    # Clean up temp files
    try:
        if os.path.exists(cover_docx): os.remove(cover_docx)
        if os.path.exists(cover_pdf): os.remove(cover_pdf)
    except Exception:
        pass

    print(f"\nALL OPERATIONS COMPLETE! Final document page count: {total_pages}")
    return source_summary, total_pages, final_pdf_dest2

if __name__ == '__main__':
    build_complete_merged_pdf()
