# ShodhSetu (शोध सेतु) — Societal Innovation Collaboration Portal

**Smart India Hackathon 2026** | **Government of Jharkhand**
*Department of Higher and Technical Education*

---

## Overview

**ShodhSetu** is a societal innovation portal engineered to connect citizen-reported grassroots challenges across Jharkhand to the research capacity of Higher Education Institutions (HEIs) and the execution capital of Corporate Social Responsibility (CSR) and industry partners, under district administrative governance.

---

## Core System Architecture & Highlights

### 1. Gap 1 Solved: Strict District Validation Pipeline with 48h SLA Engine
- Citizens & PRIs submit multimodal community challenges (voice notes, geotagged photos, GPS coordinates).
- AI Pre-Screening: `gemini-2.5-flash` classifies domain, flags duplicates within ~500m / district, calculates priority index, and synthesizes an academic problem brief.
- Institutional submissions from PRIs / ULBs / government departments skip the human review queue and are auto-validated.
- District STI Nodal Officers review remaining submissions oldest-first with color-coded SLA indicators (`<24h` on-track, `24h-48h` warning, `>48h` breach).
- Escalation Engine: Any challenge sitting unvalidated for `> 48h` automatically escalates into the State Admin dashboard.

### 2. Gap 2 Solved: Shodhganga & AISHE Institutional Expertise Bootstrap Graph
- Solves cold-start data friction: automatically harvests and indexes thesis records from Shodhganga, Google Scholar author profiles, and AISHE catalog data.
- Maps department research focus tags and faculty researcher competencies with provenance badges (`shodhganga_import`, `scholar_import`, `aishe_import`).
- University coordinators can edit, augment, and verify departmental tags via an interactive review interface.
- Algorithmic University Matching (`score_university_match`): Multi-factor scoring combining department tags, faculty verified profiles, district proximity, and institutional Trust Score to suggest top-5 candidate universities.

### 3. Gap 3 Solved: Automated Intellectual Property (IP) Framework Generator
- Automated PDF generation via ReportLab based on standardized Jharkhand STI templates:
  1. **Public Good / Open Innovation Framework** (100% public domain / grassroots community license)
  2. **Bilateral Collaborative Research Framework** (50:50 joint ownership with 24-month commercial first right of refusal)
  3. **Industry-Sponsored Tech-Transfer Framework** (80:20 split with perpetual academic publication rights)
- Supports custom terms override with uploaded document linkage.
- Instant, signed legal PDF download on-demand.

### 4. Algorithmic Trust Score Engine
- Evaluates Universities and Industry Partners on completion rate (%), average delivery delay (days), and independent outcome ratings.
- Dynamically updates institutional credibility upon milestone completion and outcome verification.

### 5. Independent Outcome Verification & Public Registry
- Formal claim review for working prototypes, pilot deployments, full community deployments, patents, and startups.
- Transparent public registry accessible to citizens, researchers, and journalists.

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Router 6, Axios
- **Backend**: FastAPI (Python 3.14 compatible), SQLAlchemy ORM, SQLite / PostgreSQL (swappable via `DATABASE_URL`), PyJWT, bcrypt, ReportLab PDF Engine
- **AI Engine**: Google Gemini API (`gemini-2.5-flash` for real-time classification/brief synthesis and `gemini-2.5-pro` for daily executive briefings) with strict 8-second timeouts and heuristic fallback modes
- **Design Language**: Institutional Navy (`#0B2447`), Civic Teal (`#19A7CE`), Amber (`#F4B400`), Verified Green (`#2ECC71`), Red Flagged (`#E74C3C`), Inter & Manrope fonts

---

## Seed Data & Demo Accounts

All test accounts use the password: `Pass@1234`

| Role | Email | Designation / Organization |
| :--- | :--- | :--- |
| **University Coordinator** | `uni.bit@jh.gov.in` | BIT Mesra R&D Directorate (Ranchi) |
| **University Coordinator** | `uni.ism@jh.gov.in` | IIT (ISM) Dhanbad Mining & Env. Hub |
| **Industry / CSR Lead** | `csr.tatasteel@jh.gov.in` | Tata Steel Foundation & CSR (Jamshedpur) |
| **Industry / CSR Lead** | `csr.coalindia@jh.gov.in` | Coal India Limited (BCCL/CCL) CSR (Dhanbad) |
| **District Validation Officer** | `dvo.ranchi@jh.gov.in` | District STI Nodal Officer (Ranchi) |
| **District Validation Officer** | `dvo.dhanbad@jh.gov.in` | District STI Nodal Officer (Dhanbad) |
| **State Government Admin** | `admin.sti@jh.gov.in` | State STI Director (Govt. of Jharkhand) |

---

## Quickstart Guide

### 1. Backend Setup
```bash
cd backend
# Create virtual environment
python -m venv venv
# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run database migrations & seed 28 challenges, 6 universities, 5 CSR partners
python seed.py

# Launch FastAPI server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit `http://localhost:5173` in your browser.
