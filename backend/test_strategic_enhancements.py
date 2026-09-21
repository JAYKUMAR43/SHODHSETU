import os
import sys
import json

# Force UTF-8 output for Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure python path has root directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal, engine, migrate_schema
from backend.app.models.models import (
    User, UserRole, Challenge, OutcomeRecord, OutcomeType, VerificationStatus,
    CitizenConfirmationStatus, SystemicPattern, SystemicPatternStatus, Proposal,
    ProjectTeam, ChallengeCategory, SubmitterType, Notification
)
from backend.app.core.security import create_access_token

client = TestClient(app)

def run_tests():
    print("=== Starting Strategic Enhancements Verification Suite ===")
    
    # 1. Schema migration check
    migrate_schema(engine)
    print("✓ Schema migration verified successfully.")

    db = SessionLocal()

    # Get or create admin user for auth
    admin_user = db.query(User).filter(User.role == UserRole.GOVERNMENT).first()
    assert admin_user is not None, "Admin user must exist in database"
    token = create_access_token(data={"sub": str(admin_user.id), "role": admin_user.role.value})
    auth_headers = {"Authorization": f"Bearer {token}"}

    # ----------------------------------------------------
    # TEST 1: Citizen Outcome Confirmation Loop (Enhancement 1)
    # ----------------------------------------------------
    print("\n[Test 1] Testing Citizen Outcome Confirmation Loop...")
    
    # Find or create a deployed outcome record
    outcome = db.query(OutcomeRecord).filter(
        OutcomeRecord.outcome_type.in_([OutcomeType.PILOT_DEPLOYMENT, OutcomeType.FULL_DEPLOYMENT])
    ).first()

    assert outcome is not None, "Need at least one deployment outcome record"
    
    # Get associated challenge
    orig_ch = outcome.proposal.project_team.challenge if outcome.proposal and outcome.proposal.project_team else None
    assert orig_ch is not None, "Outcome must be linked to a challenge"

    tracking_id = orig_ch.tracking_id
    print(f"  Testing on tracking_id: {tracking_id}, outcome_id: {outcome.id}")

    # Set to pending
    outcome.citizen_confirmation_status = CitizenConfirmationStatus.PENDING
    db.commit()

    # Test confirm: working
    res = client.post(
        f"/api/v1/challenges/track/{tracking_id}/confirm-outcome",
        json={"confirmed": True, "comment": "Solar water pump running seamlessly in our village!"}
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["citizen_confirmation_status"] == "confirmed_working"
    print("  ✓ Confirmed working submission succeeded.")

    # Check track endpoint reflects linked_outcome
    res = client.get(f"/api/v1/challenges/track/{tracking_id}")
    assert res.status_code == 200
    track_data = res.json()
    assert track_data["linked_outcome"] is not None
    assert track_data["linked_outcome"]["citizen_confirmation_status"] == "confirmed_working"
    print("  ✓ Track endpoint returns updated citizen_confirmation_status.")

    # Test confirm: dispute
    res = client.post(
        f"/api/v1/challenges/track/{tracking_id}/confirm-outcome",
        json={"confirmed": False, "comment": "Water pressure dropped significantly after heavy rain."}
    )
    assert res.status_code == 200
    assert res.json()["citizen_confirmation_status"] == "disputed"
    print("  ✓ Citizen dispute submission succeeded.")

    # Check that notification was generated for dispute
    notif = db.query(Notification).filter(Notification.event_type == "OUTCOME_DISPUTED").order_by(Notification.created_at.desc()).first()
    assert notif is not None, "Notification should be generated for disputed outcome"
    print("  ✓ Officer notification successfully generated for dispute.")

    # Check public registry endpoint includes citizen_confirmation_status
    res = client.get("/api/v1/registry/outcomes")
    assert res.status_code == 200
    reg_items = res.json()
    matching_reg = next((x for x in reg_items if x["id"] == outcome.id), None)
    assert matching_reg is not None
    assert matching_reg["citizen_confirmation_status"] == "disputed"
    print("  ✓ Public registry returns citizen_confirmation_status badge data.")

    # Reset status back to confirmed_working for registry display
    outcome.citizen_confirmation_status = CitizenConfirmationStatus.CONFIRMED_WORKING
    db.commit()

    # ----------------------------------------------------
    # TEST 2: Cross-District Pattern Detection (Enhancement 2)
    # ----------------------------------------------------
    print("\n[Test 2] Testing Cross-District Pattern Detection...")
    
    # Trigger scan
    res = client.post("/api/v1/admin/patterns/scan", headers=auth_headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    scan_res = res.json()
    print(f"  ✓ Pattern scan returned {scan_res.get('pattern_count')} systemic patterns.")

    # Test GET patterns endpoint
    res = client.get("/api/v1/admin/patterns", headers=auth_headers)
    assert res.status_code == 200
    patterns_data = res.json()
    assert len(patterns_data) >= 1
    
    # Verify each pattern meets the 3+ distinct district rule
    for p in patterns_data:
        assert p["district_count"] >= 3, f"Pattern {p['id']} has fewer than 3 districts: {p['district_count']}"
        assert p["severity"] in ["critical", "high", "medium"]
        assert len(p["linked_challenge_ids"]) >= 3
    print("  ✓ All detected patterns strictly satisfy the 3+ distinct district rule.")

    target_pattern_id = patterns_data[0]["id"]
    print("  ✓ GET /api/v1/admin/patterns succeeded.")

    # Test PATCH acknowledge endpoint
    res = client.patch(f"/api/v1/admin/patterns/{target_pattern_id}/acknowledge", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "acknowledged"
    print("  ✓ PATCH /api/v1/admin/patterns/{id}/acknowledge succeeded.")

    # ----------------------------------------------------
    # TEST 3: Post-Deployment Issue Reporting (Enhancement 4)
    # ----------------------------------------------------
    print("\n[Test 3] Testing Post-Deployment Issue Reporting...")
    
    issue_payload = {
        "title": "Submersible pump inverter trip during monsoon",
        "description": "The deployed solar filtration setup frequently cuts power when humidity rises. Need inverter capacitor inspection.",
        "submitter_contact": "villager@ranchi.org"
    }
    res = client.post(f"/api/v1/outcomes/{outcome.id}/report-issue", json=issue_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    new_challenge = res.json()
    new_tracking_id = new_challenge["tracking_id"]
    assert new_tracking_id is not None
    assert new_challenge["related_outcome_id"] == outcome.id
    print(f"  ✓ Issue successfully reported against Outcome #{outcome.id}, Tracking ID: {new_tracking_id}")

    # Track newly created post-deployment issue
    res = client.get(f"/api/v1/challenges/track/{new_tracking_id}")
    assert res.status_code == 200
    issue_track = res.json()
    assert issue_track["related_outcome_id"] == outcome.id
    assert issue_track["related_outcome"] is not None
    assert issue_track["related_outcome"]["proposal_title"] == outcome.proposal.title
    print(f"  ✓ Issue tracking properly loads backward link to original outcome '{outcome.proposal.title}'.")

    # ----------------------------------------------------
    # TEST 4: Hindi Translations Consistency Check (Enhancement 3)
    # ----------------------------------------------------
    print("\n[Test 4] Testing Translation JSON keys consistency...")
    en_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "i18n", "locales", "en.json"))
    hi_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "i18n", "locales", "hi.json"))
    
    with open(en_path, "r", encoding="utf-8") as f:
        en_dict = json.load(f)
    with open(hi_path, "r", encoding="utf-8") as f:
        hi_dict = json.load(f)

    for section in ["nav", "landing", "citizen_hub", "submit", "track", "registry"]:
        assert section in en_dict, f"Missing section '{section}' in en.json"
        assert section in hi_dict, f"Missing section '{section}' in hi.json"
        missing_keys = set(en_dict[section].keys()) - set(hi_dict[section].keys())
        assert len(missing_keys) == 0, f"Missing keys in hi.json for section '{section}': {missing_keys}"
    print("  ✓ All i18n translation sections and keys are complete and synchronized between en.json and hi.json.")

    db.close()
    print("\n=======================================================")
    print(">>> ALL 4 STRATEGIC ENHANCEMENT TESTS PASSED 100%! <<<")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
