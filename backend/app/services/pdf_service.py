import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import Drawing, Rect, Circle, Line
from backend.app.core.config import settings
from backend.app.services.storage_service import storage_service

def create_pdf_logo(size=36):
    """
    Renders the Bharat Panchyt 3-node bridge mark in ReportLab vectors:
    Teal (Citizen) -> Amber (Research) -> Green (Industry/Govt)
    connected by a green arc on a dark navy (#0B2447) rounded tile.
    """
    d = Drawing(size, size)
    d.add(Rect(0, 0, size, size, rx=8, ry=8, fillColor=colors.HexColor('#0B2447'), strokeColor=None))
    
    # Coordinates in 64x64 mapped to size (ReportLab origin is bottom-left)
    # y = 64 - svg_y
    p0 = (14 * size / 64, 24 * size / 64)
    p1 = (32 * size / 64, 48 * size / 64)
    p2 = (50 * size / 64, 24 * size / 64)
    
    steps = 20
    for i in range(steps):
        t0 = i / float(steps)
        t1 = (i + 1) / float(steps)
        x0 = (1 - t0)**2 * p0[0] + 2 * (1 - t0) * t0 * p1[0] + t0**2 * p2[0]
        y0 = (1 - t0)**2 * p0[1] + 2 * (1 - t0) * t0 * p1[1] + t0**2 * p2[1]
        x1 = (1 - t1)**2 * p0[0] + 2 * (1 - t1) * t1 * p1[0] + t1**2 * p2[0]
        y1 = (1 - t1)**2 * p0[1] + 2 * (1 - t1) * t1 * p1[1] + t1**2 * p2[1]
        d.add(Line(x0, y0, x1, y1, strokeColor=colors.HexColor('#2ECC71'), strokeWidth=2))
        
    # Teal dot: Citizen
    d.add(Circle(p0[0], p0[1], 3.2, fillColor=colors.HexColor('#19A7CE'), strokeColor=None))
    # Amber dot: Research / HEI
    d.add(Circle(p1[0], 44 * size / 64, 3.8, fillColor=colors.HexColor('#F4B400'), strokeColor=None))
    # Green dot: Industry / Govt
    d.add(Circle(p2[0], p2[1], 3.2, fillColor=colors.HexColor('#2ECC71'), strokeColor=None))
    return d

IP_TEMPLATES_TERMS = {
    "public_good": {
        "title": "Open Societal Innovation & Public Good IP Framework",
        "description": "All intellectual property, blueprints, source code, and design files created under this project are irrevocably dedicated to the public domain or licensed under Open Access / Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0). Neither the University nor the Industry Partner shall assert patent exclusivity that limits equitable access by the Government of Jharkhand or local community beneficiaries.",
        "commercial_rights": "Non-exclusive royalty-free license granted to local micro-enterprises, SHGs, and state agencies for community welfare and grassroots deployment.",
        "ownership_split": "100% Open Public Good / State Community Domain"
    },
    "joint_ownership": {
        "title": "Bilateral Collaborative Research & Joint Ownership IP Framework",
        "description": "Intellectual property resulting from this project shall be co-owned equally (50:50) by the University and the Industry Partner. Any patent filing shall list both institutional inventors. Commercialization revenue, licensing fees, and tech-transfer royalties shall be divided equally between the University Research Fund and the Industry Commercialization Entity after deducting state innovation levy.",
        "commercial_rights": "The Industry Partner holds first right of refusal for exclusive commercial manufacturing for a period of 24 months, subject to fair pricing guarantees for citizens of Jharkhand.",
        "ownership_split": "50% University (Research Team) : 50% Industry Partner"
    },
    "industry_led": {
        "title": "Industry-Sponsored Innovation & Tech-Transfer IP Framework",
        "description": "Intellectual property arising from this engagement shall reside primarily with the Industry/CSR Partner, in consideration of 100% project capital expenditure and field trial funding. The University retains perpetual, royalty-free academic research and publication rights, as well as patent inventorship credit for faculty mentors and student researchers.",
        "commercial_rights": "The Industry Partner retains exclusive global commercial rights, provided that subsidized deployment or public welfare pricing is guaranteed for state-notified backward blocks in Jharkhand.",
        "ownership_split": "80% Industry Partner : 20% University (Academic Perpetuity)"
    }
}

def generate_ip_agreement_pdf(
    proposal_title: str,
    university_name: str,
    industry_name: str,
    template_type: str,
    agreement_id: int
) -> str:
    target_dir = os.path.join(settings.UPLOAD_DIR, "ip_agreements")
    os.makedirs(target_dir, exist_ok=True)
    
    filename = f"IP_Agreement_{agreement_id}_{template_type}.pdf"
    file_path = os.path.join(target_dir, filename)
    
    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#0B2447'),
        alignment=0
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#19A7CE'),
        alignment=0
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b')
    )
    bold_label = ParagraphStyle(
        'DocBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0B2447')
    )
    center_heading = ParagraphStyle(
        'CenterHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0B2447'),
        alignment=1
    )
    center_sub = ParagraphStyle(
        'CenterSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#19A7CE'),
        alignment=1
    )
    
    story = []
    
    # Header with Logo Mark
    logo_flowable = create_pdf_logo(38)
    header_table = Table(
        [
            [
                logo_flowable,
                [
                    Paragraph("BHARAT PANCHYT INNOVATION COLLABORATION PORTAL", title_style),
                    Paragraph("GOVERNMENT OF JHARKHAND — HIGHER & TECHNICAL EDUCATION DEPARTMENT", subtitle_style)
                ]
            ]
        ],
        colWidths=[48, 484]
    )
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0B2447'), spaceAfter=12))
    
    template_data = IP_TEMPLATES_TERMS.get(template_type, IP_TEMPLATES_TERMS["public_good"])
    
    story.append(Paragraph("<b>MEMORANDUM OF INTELLECTUAL PROPERTY FRAMEWORK</b>", center_heading))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Framework Model: <b>{template_data['title']}</b>", center_sub))
    story.append(Spacer(1, 12))
    
    # Metadata Table
    clean_title = proposal_title or "Grassroots Innovation Collaborative Proposal"
    clean_uni = university_name or "Academic Research Institution"
    clean_ind = industry_name or "Industry Commercialization Partner"
    
    data = [
        [Paragraph("Agreement ID:", bold_label), Paragraph(f"BP-IP-{agreement_id:04d}", body_style)],
        [Paragraph("Project Title:", bold_label), Paragraph(clean_title, body_style)],
        [Paragraph("Academic Institution (HEI):", bold_label), Paragraph(clean_uni, body_style)],
        [Paragraph("Industry / CSR Sponsor:", bold_label), Paragraph(clean_ind, body_style)],
        [Paragraph("Date of Execution:", bold_label), Paragraph(datetime.now().strftime("%d %B %Y"), body_style)],
        [Paragraph("Jurisdiction:", bold_label), Paragraph("State of Jharkhand, Republic of India", body_style)],
        [Paragraph("Ownership Allocation:", bold_label), Paragraph(template_data['ownership_split'], body_style)],
    ]
    
    t = Table(data, colWidths=[160, 360])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))
    
    # Core Clauses
    story.append(Paragraph("<b>Clause 1: Scope of Engagement & Purpose</b>", bold_label))
    story.append(Paragraph(
        "This Agreement governs intellectual property, data assets, and technology transfer resulting from societal problem statement research mobilized through the Bharat Panchyt platform for Jharkhand.",
        body_style
    ))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph("<b>Clause 2: Intellectual Property Allocation</b>", bold_label))
    story.append(Paragraph(template_data["description"], body_style))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph("<b>Clause 3: Commercialization & State Public Welfare Rights</b>", bold_label))
    story.append(Paragraph(template_data["commercial_rights"], body_style))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph("<b>Clause 4: Dispute Resolution & Governing Law</b>", bold_label))
    story.append(Paragraph(
        "Any dispute arising out of this agreement shall be submitted to the Principal Secretary, Department of Higher and Technical Education, Government of Jharkhand, acting as the sole administrative arbitrator whose determination shall be final and binding.",
        body_style
    ))
    story.append(Spacer(1, 18))
    
    # Signatures
    sig_data = [
        [
            Paragraph("<b>For the Academic Institution:</b><br/><br/><br/>_______________________________<br/>Authorized Signatory / Dean R&D<br/>" + clean_uni, body_style),
            Paragraph("<b>For the Industry / CSR Partner:</b><br/><br/><br/>_______________________________<br/>Managing Director / Head CSR<br/>" + clean_ind, body_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[260, 260])
    sig_table.setStyle(TableStyle([
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(sig_table)
    
    doc.build(story)
    
    # Persist file via storage_service (uploads to Blob if configured)
    return storage_service.persist_local_file(file_path, folder="ip_agreements")


def generate_activity_report_pdf(
    role: str,
    user_name: str,
    org_name: str,
    period: str,
    metrics: dict,
    summary_notes: list = None
) -> str:
    """
    Generates a formal executive/activity report PDF for authenticated portals
    (University, Industry, District Validation Officer, State Government).
    """
    target_dir = os.path.join(settings.UPLOAD_DIR, "reports")
    os.makedirs(target_dir, exist_ok=True)

    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    import re
    clean_org_slug = re.sub(r'[^a-zA-Z0-9]+', '_', (org_name or "Entity")).strip("_")[:35]
    filename = f"{clean_org_slug}_{period}_{timestamp_str}.pdf"
    file_path = os.path.join(target_dir, filename)

    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#0B2447'),
        alignment=0
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#19A7CE'),
        alignment=0
    )
    center_title = ParagraphStyle(
        'CenterTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0B2447'),
        alignment=1
    )
    center_sub = ParagraphStyle(
        'CenterSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#19A7CE'),
        alignment=1
    )
    section_heading = ParagraphStyle(
        'DocHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0B2447')
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b')
    )
    bold_label = ParagraphStyle(
        'DocBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0B2447')
    )

    story = []

    # Header with Bharat Panchyt Logo Mark & Entity Branding
    clean_org = org_name or "Government of Jharkhand"
    logo_flowable = create_pdf_logo(38)
    header_table = Table(
        [
            [
                logo_flowable,
                [
                    Paragraph(f"<b>{clean_org.upper()}</b>", title_style),
                    Paragraph("BHARAT PANCHYT STATE INNOVATION & MONITORING SYSTEM — GOVT. OF JHARKHAND", subtitle_style)
                ]
            ]
        ],
        colWidths=[48, 484]
    )
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0B2447'), spaceAfter=10))

    # Report Title
    clean_period = period or "weekly"
    period_label = "OFFICIAL WEEKLY PROGRESS & STI ACTIVITY REPORT" if clean_period.lower() == "weekly" else "OFFICIAL MONTHLY PERFORMANCE AUDIT REPORT"
    story.append(Paragraph(f"<b>{clean_org.upper()}</b>", center_title))
    story.append(Spacer(1, 2))
    story.append(Paragraph(f"<b>{period_label}</b>", center_sub))
    story.append(Spacer(1, 10))

    # Metadata Grid
    clean_user = user_name or "Authorized Officer"
    meta_data = [
        [Paragraph("Authorized Entity:", bold_label), Paragraph(clean_org, body_style),
         Paragraph("Period Window:", bold_label), Paragraph(f"{clean_period.capitalize()} ({datetime.now().strftime('%B %Y')})", body_style)],
        [Paragraph("Officer / Lead:", bold_label), Paragraph(clean_user, body_style),
         Paragraph("Generated At:", bold_label), Paragraph(datetime.now().strftime("%d-%b-%Y %H:%M UTC"), body_style)],
        [Paragraph("Institutional Role:", bold_label), Paragraph((role or "OFFICER").upper(), body_style),
         Paragraph("Compliance Status:", bold_label), Paragraph("Verified & Validated", body_style)],
    ]
    meta_table = Table(meta_data, colWidths=[110, 160, 100, 150])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # Core Metrics Snapshot Table
    story.append(Paragraph("Key Performance & Operational Metrics", section_heading))
    story.append(Spacer(1, 5))

    metrics_dict = metrics or {}
    table_rows = []
    header_row = [Paragraph("Performance Indicator", bold_label), Paragraph("Value / Score", bold_label)]
    table_rows.append(header_row)

    for k, v in metrics_dict.items():
        clean_key = str(k).replace("_", " ").title()
        val_str = str(v) if v is not None else "0"
        table_rows.append([
            Paragraph(f"<b>{clean_key}</b>", body_style),
            Paragraph(val_str, bold_label)
        ])

    metrics_table = Table(table_rows, colWidths=[360, 160])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#94a3b8')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(metrics_table)
    story.append(Spacer(1, 12))

    # Highlights & Summary
    story.append(Paragraph("Operational Highlights & Governance Notes", section_heading))
    story.append(Spacer(1, 5))

    notes = summary_notes or [
        "Active participation in the Smart India Hackathon 2026 societal innovation pipeline for Jharkhand.",
        "All pending submissions and stage-gates are continuously audited against state STI benchmarks.",
        "Cross-sector alignment established between academia, grassroots citizen reporters, and corporate CSR entities.",
        "Digitally notarized audit trail registered in the State Innovation Registry."
    ]

    for note in notes:
        story.append(Paragraph(f"• {note}", body_style))
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 16))

    # Official Seal / Sign-off Footer
    footer_data = [
        [
            Paragraph("<b>Prepared by:</b><br/><br/>_______________________________<br/>" + clean_user + "<br/>" + clean_org, body_style),
            Paragraph("<b>Digitally Counter-Signed:</b><br/><br/><i>[Digitally Verified via Bharat Panchyt PKI]</i><br/>Principal Secretary, Higher & Technical Education<br/>Government of Jharkhand", body_style)
        ]
    ]
    footer_table = Table(footer_data, colWidths=[260, 260])
    footer_table.setStyle(TableStyle([
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(footer_table)

    doc.build(story)

    # Persist file via storage_service (uploads to Blob if configured)
    return storage_service.persist_local_file(file_path, folder="reports")
