import os
import json
import logging
import requests
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings

logger = logging.getLogger("gemini_service")

# 10 Official Problem Statement Categories
CATEGORIES = [
    "education", "agriculture", "healthcare", "water_resources",
    "environment", "energy", "urban_development", "accessibility",
    "public_administration", "rural_livelihoods"
]

CATEGORY_KEYWORDS = {
    "agriculture": [
        "crop", "soil", "pest", "irrigation", "farming", "paddy", "fertilizer", "kisan", "yield", "drought", "seeds",
        "kheti", "fasal", "mitti", "keeda", "sinchai", "anaj", "khet", "urvarak", "dhan", "gehu", "paudha", "gobargas",
        "khet-bari", "chas", "chasi", "ropa", "behan", "bichha", "kisaan", "baadi", "tora", "baba", "kado"
    ],
    "water_resources": [
        "water", "arsenic", "fluoride", "borewell", "pond", "dam", "drinking", "contamination", "pipeline", "drainage", "handpump",
        "paani", "jal", "peypani", "peene ka pani", "nal", "kua", "kuan", "talab", "chapakal", "boring", "ganda pani", "jal sankat",
        "daah", "dahar", "chuan", "doba", "bandh", "aahar", "pokhari", "jharna", "khoro", "jor", "gadhia", "dhaas"
    ],
    "healthcare": [
        "hospital", "clinic", "disease", "malnutrition", "vaccine", "doctor", "health", "maternal", "sanitation", "ambulance", "fever",
        "aspataal", "swasthya", "bimari", "dawa", "davai", "ilaj", "rog", "poshan", "kuposhan", "tika", "chikitsa", "sehat",
        "rua", "haspatal", "daktar", "poshan", "sahiyya", "anganwadi", "dawai", "bimar", "roga"
    ],
    "education": [
        "school", "teacher", "student", "classroom", "books", "literacy", "dropout", "stem", "college", "vocational",
        "vidyalaya", "shiksha", "padhai", "kitab", "shikshak", "chhatra", "pathshala", "kaksha", "adhyayan",
        "ischool", "guruji", "master babu", "basta", "shiksha mantralaya"
    ],
    "environment": [
        "pollution", "forest", "mining", "dust", "effluent", "waste", "deforestation", "air quality", "biodiversity", "dumping",
        "pradushan", "jungle", "van", "dhuan", "khadan", "koyla", "ped", "hawa", "paryavaran", "kachra dumping",
        "bir", "dhur-dhuan", "chhai", "khadan", "khorha", "jhaad", "dhur"
    ],
    "energy": [
        "electricity", "power", "solar", "grid", "transformer", "biomass", "load shedding", "outage", "renewable",
        "bijli", "batti", "urja", "taar", "andhera", "current", "solar panel", "dhoop", "roshni",
        "chup-chup", "battie", "line kata", "voltage"
    ],
    "urban_development": [
        "road", "traffic", "slum", "sewage", "street light", "pothole", "solid waste", "urban flooding", "encroachment",
        "sadak", "gaddha", "kachra", "naali", "basti", "jaam", "gali", "pul", "puliya", "footpath",
        "dahar", "rasta", "kado", "kichad", "dhalo"
    ],
    "accessibility": [
        "disabled", "wheelchair", "ramp", "braille", "divyang", "elderly", "sign language", "mobility", "special needs",
        "viklang", "bujurg", "vridh", "chalne me pareshani", "sahayata", "divyangjan",
        "batha", "langda", "dekhai na dena", "sunai na dena"
    ],
    "public_administration": [
        "pension", "ration", "caste certificate", "land record", "grievance", "corruption", "panchayat", "bribe", "pds",
        "shikayat", "bhrashtachar", "praman patra", "khatian", "dakhil kharij", "mukhiya", "ghoos", "adhikar", "kotawala",
        "panch", "pradhan", "jameen", "dastavej", "afsar"
    ],
    "rural_livelihoods": [
        "artisan", "weaving", "tussar", "silk", "lac", "minor forest produce", "self help group", "shg", "poultry", "goat", "tribal market",
        "rozgar", "kamai", "bunkar", "mahila mandal", "murgi palan", "bakri", "haat", "bazaar", "hastshilp", "lah", "jute",
        "mahua", "kendupatta", "tassar", "sabai", "dholka", "sangh", "kam-dhandha", "sohrai", "kohbar"
    ]
}

JHARKHAND_SYSTEM_INSTRUCTION = """
You are the expert Societal STI Intelligence Engine for Bharat Panchyt (Government of Jharkhand).
You are fluent in English, Hindi (Devanagari & Romanized/Hinglish), and the regional languages and dialects of Jharkhand:
- Khortha (खोरठा)
- Nagpuri / Sadri (नागपुरी)
- Santhali (संथाली - Ol Chiki, Devanagari, and Latin transliteration)
- Mundari (मुंडारी)
- Ho (हो - Warang Chiti and transliteration)
- Kurmali (कुड़माली)
- Kurukh / Oraon (कुड़ुख़)
- Magahi & Bhojpuri (मगही / भोजपुरी)

Always interpret citizen complaints with deep cultural, geographical, and vernacular empathy.
Accurately identify root societal causes even if reported in local rural idioms or mixed dialect.
"""

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.timeout = 15.0 # 15-second timeout for reliable AI responses
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    def _call_gemini_rest(self, model: str, prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        if not self.api_key:
            return None
        
        sys_inst = system_instruction or JHARKHAND_SYSTEM_INSTRUCTION
        url = f"{self.base_url}/{model}:generateContent?key={self.api_key}"
        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1024,
                "responseMimeType": "application/json"
            }
        }
        if sys_inst:
            payload["systemInstruction"] = {
                "parts": [{"text": sys_inst}]
            }

        try:
            resp = requests.post(url, json=payload, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
                return None
        except Exception as e:
            logger.warning(f"Gemini API call timed out or failed: {e}. Falling back to heuristic.")
            return None

    # 1. classify_challenge
    def classify_challenge(self, description: str, photo: Optional[str] = None) -> Dict[str, Any]:
        prompt = f"""
        Classify the following citizen challenge reported in Jharkhand into exactly one of these 10 categories:
        {CATEGORIES}
        
        The report may be in English, Hindi (हिन्दी), or a Jharkhand regional dialect (Khortha, Nagpuri, Santhali, Mundari, Ho, Kurmali, Kurukh).
        Input text: "{description}"
        
        Return a JSON object with:
        "category": (one of the exact categories),
        "confidence": (float between 0.0 and 1.0)
        """
        gemini_out = self._call_gemini_rest("gemini-2.5-flash", prompt)
        if gemini_out:
            try:
                result = json.loads(gemini_out)
                if result.get("category") in CATEGORIES:
                    return {
                        "category": result["category"],
                        "confidence": float(result.get("confidence", 0.88))
                    }
            except Exception:
                pass

        # Fallback Heuristic
        desc_lower = description.lower()
        best_cat = "rural_livelihoods"
        max_matches = 0
        for cat, keywords in CATEGORY_KEYWORDS.items():
            matches = sum(1 for kw in keywords if kw in desc_lower)
            if matches > max_matches:
                max_matches = matches
                best_cat = cat

        confidence = 0.85 if max_matches > 0 else 0.65
        return {"category": best_cat, "confidence": confidence}

    # 2. generate_problem_brief
    def generate_problem_brief(self, text_or_transcript: str, voice_note: Optional[str] = None, language: str = "hi") -> str:
        prompt = f"""
        You are an institutional academic analyst for Bharat Panchyt (Jharkhand Societal Innovation Platform).
        The citizen input may be in English, Hindi (Devanagari or Romanized), or any Jharkhand regional language/dialect (Khortha, Nagpuri, Santhali, Mundari, Ho, Kurmali, Kurukh).
        Translate and synthesize the citizen-reported challenge input into a structured, academic-grade Problem Brief in English (with key vernacular terms preserved in parentheses).
        
        Input text: "{text_or_transcript}"
        Source Language: {language}
        
        Format the brief with:
        - Core Societal Problem (clear technical diagnosis of the grassroots issue)
        - Community Impact & Ground Reality in Jharkhand
        - Key Technical & Research Questions for Universities
        - Potential Deliverables (Prototype / Field Study / Deployment)
        """
        # gemini-2.5-flash
        if self.api_key:
            url = f"{self.base_url}/gemini-2.5-flash:generateContent?key={self.api_key}"
            try:
                resp = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=self.timeout)
                if resp.status_code == 200:
                    return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            except Exception as e:
                logger.warning(f"Gemini brief generation error: {e}")

        # Non-AI Fallback
        return f"""### Structured Problem Brief (Bharat Panchyt Synthesizer)
**Core Societal Problem:**
{text_or_transcript[:250]}...

**Community Impact & Ground Reality:**
Field reports indicate persistent operational obstacles impacting local livelihood and basic amenities. Immediate intervention is required to prevent secondary systemic failure.

**Key Technical & Research Questions for Universities:**
1. What low-cost, decentralized technical interventions can be engineered using locally available materials?
2. How can regional environmental/geological constraints in Jharkhand be accommodated in the design?
3. What is the operational maintenance protocol suitable for local panchayat or community administration?

**Potential Deliverables:**
- Field testbed prototype with sensor telemetry / localized filtration / durable mechanics.
- Standard Operating Procedure (SOP) manual in Hindi & local vernacular."""

    # 3. detect_duplicate
    def detect_duplicate(self, new_challenge_desc: str, nearby_challenges: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not nearby_challenges:
            return {"is_duplicate": False, "matched_id": None, "confidence": 0.0}

        prompt = f"""
        Compare this new community challenge description:
        "{new_challenge_desc}"
        
        Against these existing nearby challenges:
        {json.dumps([{"id": c["id"], "description": c["description"]} for c in nearby_challenges])}
        
        Determine if the new challenge is reporting the exact same physical issue or problem site.
        Return JSON:
        {{
            "is_duplicate": true/false,
            "matched_id": (id of matching challenge or null),
            "confidence": (float 0.0 to 1.0)
        }}
        """
        gemini_out = self._call_gemini_rest("gemini-2.5-flash", prompt)
        if gemini_out:
            try:
                res = json.loads(gemini_out)
                return {
                    "is_duplicate": bool(res.get("is_duplicate", False)),
                    "matched_id": res.get("matched_id"),
                    "confidence": float(res.get("confidence", 0.0))
                }
            except Exception:
                pass

        # Fallback keyword overlap heuristic
        words_new = set(new_challenge_desc.lower().split())
        for cand in nearby_challenges:
            words_cand = set(cand["description"].lower().split())
            overlap = len(words_new.intersection(words_cand))
            union = len(words_new.union(words_cand))
            jaccard = overlap / union if union > 0 else 0
            if jaccard > 0.45:
                return {"is_duplicate": True, "matched_id": cand["id"], "confidence": round(jaccard, 2)}

        return {"is_duplicate": False, "matched_id": None, "confidence": 0.0}

    # 4. score_priority
    def score_priority(self, challenge: Dict[str, Any], district_stats: Optional[Dict[str, Any]] = None) -> float:
        # Priority computation based on category urgency, duplicate count, submitter type
        cat = challenge.get("category", "")
        urgency_map = {
            "water_resources": 85.0,
            "healthcare": 80.0,
            "energy": 70.0,
            "environment": 75.0,
            "agriculture": 72.0,
            "rural_livelihoods": 68.0,
            "education": 65.0,
            "accessibility": 65.0,
            "urban_development": 60.0,
            "public_administration": 58.0
        }
        base_score = urgency_map.get(cat, 60.0)
        
        # Submitter type multiplier
        submitter_type = challenge.get("submitter_type", "citizen")
        if submitter_type in ["pri", "ulb", "govt_dept"]:
            base_score += 10.0
            
        # Duplicate report volume factor (more citizens reporting = higher societal urgency)
        duplicate_count = challenge.get("duplicate_count", 0)
        base_score += min(duplicate_count * 4.0, 15.0)

        return min(max(round(base_score, 1), 10.0), 100.0)

    # 5. bootstrap_expertise_graph (Gap-2 Fix)
    def bootstrap_expertise_graph(self, university_name: str) -> List[Dict[str, Any]]:
        prompt = f"""
        Simulate a Shodhganga thesis import, Google Scholar institutional author scan, and AISHE cataloging for:
        "{university_name}" in Jharkhand.
        
        Generate 3 to 5 realistic academic departments, each with:
        - "department_name": string
        - "discipline_tags": list of specific research expertise tags (e.g. "Acid Mine Drainage", "Tussar Silk Processing", "Solar Microgrids")
        - "source": one of "shodhganga_import", "scholar_import", "aishe_import", "manual_review"
        - "faculty_profiles": list of 2-3 faculty members with:
            - "name": string (Dr./Prof.)
            - "expertise_tags": list of 2-4 granular tags
            - "public_profile_url": mock Google scholar or university faculty URL
            - "verified": false
            
        Return JSON array of department objects.
        """
        gemini_out = self._call_gemini_rest("gemini-2.5-flash", prompt)
        if gemini_out:
            try:
                res = json.loads(gemini_out)
                if isinstance(res, list) and len(res) > 0:
                    return res
                elif isinstance(res, dict) and "departments" in res:
                    return res["departments"]
            except Exception:
                pass

        # High-fidelity mock fallback customized for Jharkhand universities
        u_lower = university_name.lower()
        if "mesra" in u_lower or "bit" in u_lower:
            return [
                {
                    "department_name": "Environmental Science & Engineering",
                    "discipline_tags": ["Industrial Effluent Treatment", "Heavy Metal Soil Bioremediation", "GIS Watershed Hydrology"],
                    "source": "shodhganga_import",
                    "faculty_profiles": [
                        {"name": "Dr. R. K. Sinha", "expertise_tags": ["Heavy Metal Adsorption", "Arsenic Removal", "Biochar Filters"], "public_profile_url": "https://scholar.google.com/citations?user=bit_rksinha", "verified": False},
                        {"name": "Dr. Ananya Roy", "expertise_tags": ["Mine Tailings Stabilization", "Soil Microbial Ecology"], "public_profile_url": "https://scholar.google.com/citations?user=bit_aroy", "verified": False}
                    ]
                },
                {
                    "department_name": "Electrical & Electronics Engineering",
                    "discipline_tags": ["Rural Solar Microgrids", "Smart Metering IoT", "Biomass Hybrid Generators"],
                    "source": "scholar_import",
                    "faculty_profiles": [
                        {"name": "Prof. S. P. Verma", "expertise_tags": ["Solar Inverters", "Microgrid Islanding Protection"], "public_profile_url": "https://scholar.google.com/citations?user=bit_spverma", "verified": False},
                        {"name": "Dr. Meenakshi Dey", "expertise_tags": ["Low-Power IoT Sensors", "Battery Management Systems"], "public_profile_url": "https://scholar.google.com/citations?user=bit_mdey", "verified": False}
                    ]
                },
                {
                    "department_name": "Bio-Engineering & Biotechnology",
                    "discipline_tags": ["Plant Tissue Culture", "Lac & Tussar Quality Enhancement", "Indigenous Fermentation"],
                    "source": "aishe_import",
                    "faculty_profiles": [
                        {"name": "Dr. Alok Murmu", "expertise_tags": ["Tribal Agri-Produce Processing", "Silk Sericulture Genetics"], "public_profile_url": "https://scholar.google.com/citations?user=bit_amurmu", "verified": False}
                    ]
                }
            ]
        elif "ism" in u_lower or "dhanbad" in u_lower:
            return [
                {
                    "department_name": "Mining Machinery & Mineral Engineering",
                    "discipline_tags": ["Coal Mine Dust Suppression", "Acid Mine Drainage Neutralization", "Overburden Stabilization"],
                    "source": "shodhganga_import",
                    "faculty_profiles": [
                        {"name": "Prof. A. K. Patra", "expertise_tags": ["Respirable Dust Monitoring", "Mine Ventilation Optimization"], "public_profile_url": "https://scholar.google.com/citations?user=iit_akpatra", "verified": False},
                        {"name": "Dr. Sneha Bannerjee", "expertise_tags": ["Acid Drainage Geochemistry", "Constructed Wetlands"], "public_profile_url": "https://scholar.google.com/citations?user=iit_sbannerjee", "verified": False}
                    ]
                },
                {
                    "department_name": "Environmental Engineering & Science",
                    "discipline_tags": ["Fly Ash Utilization", "Groundwater Fluoride Remediation", "Air Quality Telemetry"],
                    "source": "scholar_import",
                    "faculty_profiles": [
                        {"name": "Prof. V. M. S. R. Murthy", "expertise_tags": ["Coal Bed Methane", "Industrial Water Recovery"], "public_profile_url": "https://scholar.google.com/citations?user=iit_vmsrmurthy", "verified": False}
                    ]
                },
                {
                    "department_name": "Civil Engineering & Water Resources",
                    "discipline_tags": ["Rainwater Harvesting in Hard Rock Terrains", "Subsurface Dam Modeling"],
                    "source": "aishe_import",
                    "faculty_profiles": [
                        {"name": "Dr. Tanmoy Sengupta", "expertise_tags": ["Hydrogeology of Chotanagpur Plateau", "Check Dam Structural Integrity"], "public_profile_url": "https://scholar.google.com/citations?user=iit_tsengupta", "verified": False}
                    ]
                }
            ]
        else:
            return [
                {
                    "department_name": "Applied Science & Technology",
                    "discipline_tags": ["Community Water Treatment", "Renewable Energy Kits", "Low-Cost Agri-Tools"],
                    "source": "aishe_import",
                    "faculty_profiles": [
                        {"name": "Dr. Pradeep Kumar", "expertise_tags": ["Appropriate Rural Technology", "Solar Dryers"], "public_profile_url": "https://scholar.google.com/citations?user=jh_pkumar", "verified": False},
                        {"name": "Dr. Sunita Kujur", "expertise_tags": ["Indigenous Botanical Pesticides", "Soil Organic Carbon"], "public_profile_url": "https://scholar.google.com/citations?user=jh_skujur", "verified": False}
                    ]
                },
                {
                    "department_name": "Rural Development & Social Sciences",
                    "discipline_tags": ["Panchayat Capacity Building", "SHG Micro-Enterprise Logistics", "Tribal Livelihood Analytics"],
                    "source": "shodhganga_import",
                    "faculty_profiles": [
                        {"name": "Prof. Hemant Soren", "expertise_tags": ["Participatory Rural Appraisal", "Forest Produce Supply Chains"], "public_profile_url": "https://scholar.google.com/citations?user=jh_hsoren", "verified": False}
                    ]
                }
            ]

    # 6. score_university_match
    def score_university_match(self, challenge: Dict[str, Any], universities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        ch_text = f"{challenge.get('title', '')} {challenge.get('description', '')} {challenge.get('category', '')}".lower()
        ch_district_id = challenge.get("district_id")
        
        ranked_list = []
        for uni in universities:
            score = 50.0
            reasons = []
            
            # Proximity boost
            if uni.get("district_id") == ch_district_id:
                score += 15.0
                reasons.append("Local District Proximity (Jharkhand Field Access)")
            
            # Department / Expertise tag matching
            tag_matches = []
            verified_fac_matches = []
            unverified_dept_matches = []
            departments = uni.get("departments", [])
            for dept in departments:
                dept_source = str(dept.get("source", "shodhganga_import")).lower()
                dept_verified = dept.get("verified", False) or "manual_review" in dept_source
                tags = dept.get("discipline_tags", []) + dept.get("specializations", [])
                dept_has_match = False
                for t in tags:
                    if any(word in ch_text for word in t.lower().split() if len(word) > 3):
                        tag_matches.append(t)
                        dept_has_match = True
                        if dept_verified:
                            verified_fac_matches.append(t)
                
                # Check faculty profiles
                fac_has_verified = False
                for fac in dept.get("faculty_profiles", []):
                    fac_tags = fac.get("expertise_tags", [])
                    for ft in fac_tags:
                        if any(word in ch_text for word in ft.lower().split() if len(word) > 3):
                            tag_matches.append(f"{fac['name']} ({ft})")
                            if fac.get("verified") or dept_verified:
                                verified_fac_matches.append(f"{fac['name']} ({ft})")
                                fac_has_verified = True
                
                if dept_has_match and not (fac_has_verified or dept_verified):
                    unverified_dept_matches.append(dept.get("name", dept.get("department_name", "Academic Department")))

            # Also check top-level faculty if provided
            for fac in uni.get("faculty", []):
                fac_tags = fac.get("expertise_tags", [])
                for ft in fac_tags:
                    if any(word in ch_text for word in ft.lower().split() if len(word) > 3):
                        tag_matches.append(f"{fac['name']} ({ft})")
                        if fac.get("verified"):
                            verified_fac_matches.append(f"{fac['name']} ({ft})")

            is_verified = len(verified_fac_matches) > 0

            if tag_matches:
                tag_bonus = min(len(set(tag_matches)) * 7.0, 25.0)
                score += tag_bonus
                reasons.append(f"Domain & Faculty Expertise Alignments: {', '.join(list(set(tag_matches))[:3])}")
            else:
                reasons.append("General Engineering & Multidisciplinary Capacity")

            # Verification status weighting (Verified boost vs auto-imported draft adjustment)
            if is_verified:
                score += 8.0 # Verified department/faculty expertise bonus
                reasons.append(f"Verified Academic Expertise ({len(verified_fac_matches)} coordinator-confirmed profile tags)")
            elif unverified_dept_matches or tag_matches:
                score -= 3.0 # Unreviewed auto-imported draft adjustment (ranks verified higher when comparable)
                reasons.append("Auto-Imported Institutional Graph (Pending University Review)")
            
            # Trust score weighting
            trust_score = uni.get("trust_score", 85.0)
            score += (trust_score - 70.0) * 0.2
            reasons.append(f"Institutional Track Record (Trust Score: {int(trust_score)}/100)")
            
            final_score = min(max(round(score, 1), 40.0), 98.0)
            ranked_list.append({
                "university_id": uni["id"],
                "match_score": final_score,
                "is_verified_expertise": is_verified,
                "match_reasons": {
                    "summary": f"Ranked with {final_score}% societal capability alignment",
                    "factors": reasons
                }
            })
            
        ranked_list.sort(key=lambda x: x["match_score"], reverse=True)
        return ranked_list[:5] # Top 5

    # 7. match_csr_intent
    def match_csr_intent(self, csr_focus_areas: List[str], open_proposals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        focus_set = set([f.lower() for f in csr_focus_areas])
        scored_proposals = []
        for p in open_proposals:
            p_cat = p.get("category", "").lower()
            p_title = p.get("title", "").lower()
            p_summary = p.get("summary", "").lower()
            score = 60.0
            alignment_reasons = []
            
            if p_cat in focus_set:
                score += 25.0
                alignment_reasons.append(f"Direct alignment with declared CSR theme: '{p_cat}'")
            
            for area in focus_set:
                if area in p_title or area in p_summary:
                    score += 10.0
                    alignment_reasons.append(f"Focus area keyword '{area}' matched in project proposal")
                    
            final_score = min(round(score, 1), 99.0)
            scored_proposals.append({
                "proposal_id": p["id"],
                "score": final_score,
                "reasons": alignment_reasons or ["General CSR societal development priority"]
            })
            
        scored_proposals.sort(key=lambda x: x["score"], reverse=True)
        return scored_proposals

    # 8. generate_district_briefing (gemini-2.5-pro, cached once/day)
    def generate_district_briefing(self, district_stats: Dict[str, Any]) -> str:
        prompt = f"""
        Act as a Senior Governance & STI Nodal Officer for the Government of Jharkhand.
        Synthesize the following societal innovation data for {district_stats.get('district_name', 'Jharkhand')} into a formal briefing note.
        Data: {json.dumps(district_stats)}
        
        Provide a 3-paragraph executive brief covering:
        1. Current Societal Stress Areas & Submission Clusters
        2. University Research Mobilization & Ongoing Prototyping
        3. CSR & Industry Co-investment Opportunities with Recommended Interventions
        """
        # gemini-2.5-pro for narrative-quality task
        if self.api_key:
            url = f"{self.base_url}/gemini-2.5-pro:generateContent?key={self.api_key}"
            try:
                resp = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=self.timeout)
                if resp.status_code == 200:
                    return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            except Exception as e:
                logger.warning(f"Gemini-pro narrative briefing error: {e}")

        # Fallback Briefing
        d_name = district_stats.get('district_name', 'Jharkhand')
        total = district_stats.get('total_submissions', 12)
        top_cat = district_stats.get('top_category', 'Water Resources & Environment')
        return f"""### Executive STI Briefing — {d_name} District
**1. Societal Stress Distribution:**
{d_name} has registered {total} citizen and panchayat-verified problem statements under Bharat Panchyt. The primary concentration of societal stress lies in **{top_cat}**, driven by hard-rock hydrogeology, arsenic/fluoride groundwater contamination, and seasonal agricultural distress during post-monsoon phases.

**2. Academic Research Mobilization:**
Regional higher education institutions (including premier state and national institutes) have deployed multidisciplinary faculty teams. Active project teams are engaged in decentralized water purification testbeds, solar-powered agricultural value addition, and bio-remediation protocols.

**3. CSR & Public-Private Co-Investment:**
Immediate private capital mobilization is recommended under Corporate Social Responsibility mandates (Companies Act Schedule VII). High-leverage co-funding pathways exist in deploying pilot-verified prototypes across vulnerable block panchayats, ensuring accelerated field validation with institutional IP protection."""

    # 9. detect_systemic_patterns (Strategic Enhancement 2)
    def detect_systemic_patterns(self, recent_challenges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Groups recently validated challenges by category + semantic similarity across DIFFERENT districts.
        Only surfaces patterns that span 3+ distinct districts.
        Returns list of {pattern_theme, category, district_count, challenge_ids, severity}.
        """
        if not recent_challenges or len(recent_challenges) < 3:
            return []

        # Filter challenges that have category and district_id
        valid_challenges = [
            c for c in recent_challenges 
            if c.get("category") and c.get("district_id") is not None
        ]

        # Group by category
        by_category: Dict[str, List[Dict[str, Any]]] = {}
        for c in valid_challenges:
            cat = c["category"].value if hasattr(c["category"], "value") else str(c["category"])
            by_category.setdefault(cat, []).append(c)

        # Only categories spanning 3+ distinct districts are eligible
        eligible_categories = {
            cat: chs for cat, chs in by_category.items()
            if len({c["district_id"] for c in chs}) >= 3
        }

        if not eligible_categories:
            return []

        patterns: List[Dict[str, Any]] = []

        # 1. Try Gemini AI Cross-District Clustering
        prompt_data = []
        for cat, chs in eligible_categories.items():
            for c in chs[:15]: # cap per category to fit context
                prompt_data.append({
                    "id": c.get("id"),
                    "category": cat,
                    "district_id": c.get("district_id"),
                    "district_name": c.get("district_name", f"District-{c.get('district_id')}"),
                    "title": c.get("title", ""),
                    "description": (c.get("description") or "")[:250]
                })

        prompt = f"""
        You are a Senior Spatial Policy & STI Data Scientist for the Government of Jharkhand.
        Analyze the following grassroots societal innovation challenges reported from various districts:
        {json.dumps(prompt_data)}

        Detect systemic problem patterns where the same underlying technical, ecological, or systemic challenge occurs across 3 OR MORE DIFFERENT DISTRICTS.
        Do NOT group issues simply because they are in the same district. The value is finding CROSS-DISTRICT systemic patterns.

        Return a JSON array of objects:
        [
          {{
            "pattern_theme": "Concise, descriptive systemic pattern title (e.g. Acid Mine Drainage & Heavy Metal Leaching in Tribal Aquifers)",
            "category": "exact category string from data",
            "district_count": integer (must be >= 3),
            "challenge_ids": [list of integer IDs involved],
            "severity": "critical" / "high" / "medium"
          }}
        ]
        CRITICAL: ONLY include patterns where challenge_ids span at least 3 distinct districts!
        """

        gemini_out = self._call_gemini_rest("gemini-2.5-flash", prompt)
        if gemini_out:
            try:
                raw_patterns = json.loads(gemini_out)
                if isinstance(raw_patterns, list):
                    for p in raw_patterns:
                        ch_ids = [int(cid) for cid in p.get("challenge_ids", [])]
                        # Verify that these challenge IDs actually span 3+ districts
                        matching_chs = [c for c in valid_challenges if c.get("id") in ch_ids]
                        districts = {c.get("district_id") for c in matching_chs}
                        if len(districts) >= 3:
                            matched_cat = p.get("category") or (matching_chs[0]["category"].value if hasattr(matching_chs[0]["category"], "value") else str(matching_chs[0]["category"]))
                            patterns.append({
                                "pattern_theme": p.get("pattern_theme", "Cross-District Systemic Challenge"),
                                "category": matched_cat,
                                "district_count": len(districts),
                                "challenge_ids": [c["id"] for c in matching_chs],
                                "severity": p.get("severity", "high")
                            })
            except Exception as e:
                logger.warning(f"Error parsing Gemini systemic patterns: {e}")

        # If Gemini returned valid patterns, return them
        if patterns:
            return patterns

        # 2. Robust Heuristic Fallback: Category + Cross-District Semantic Keyword Clusters
        for cat, chs in eligible_categories.items():
            keywords = CATEGORY_KEYWORDS.get(cat, ["water", "soil", "crop", "power", "road", "clinic", "school"])
            processed_ch_sets = set()

            for kw in keywords:
                matching_kw_chs = [
                    c for c in chs
                    if kw in ((c.get("title") or "") + " " + (c.get("description") or "")).lower()
                ]
                distinct_districts = {c.get("district_id") for c in matching_kw_chs}

                if len(distinct_districts) >= 3:
                    ch_ids_tuple = tuple(sorted(c["id"] for c in matching_kw_chs))
                    if ch_ids_tuple not in processed_ch_sets:
                        processed_ch_sets.add(ch_ids_tuple)
                        d_count = len(distinct_districts)
                        severity = "critical" if d_count >= 5 else "high" if d_count >= 4 else "medium"
                        
                        kw_title = kw.replace("_", " ").title()
                        cat_title = cat.replace("_", " ").title()
                        theme = f"Systemic {kw_title} Vulnerability across {cat_title}"

                        patterns.append({
                            "pattern_theme": theme,
                            "category": cat,
                            "district_count": d_count,
                            "challenge_ids": list(ch_ids_tuple),
                            "severity": severity
                        })

        severity_order = {"critical": 3, "high": 2, "medium": 1, "low": 0}
        patterns.sort(key=lambda x: (severity_order.get(x["severity"], 0), x["district_count"]), reverse=True)
        return patterns

gemini_service = GeminiService()
