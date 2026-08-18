"""Backend API tests for AURA Forest Lake Resort - iteration 2 (admin auth, mocked email, guest lookup/cancel)."""
import os
import pytest
import requests
from datetime import date, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://villa-picker-3d.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "1234567890"

CREATED_IDS = []


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def admin_session(session, admin_token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"})
    yield s
    # Cleanup created reservations with admin token
    for rid in CREATED_IDS:
        try:
            s.delete(f"{API}/reservations/{rid}", timeout=10)
        except Exception:
            pass


def _future_dates(offset=30, nights=3):
    ci = date.today() + timedelta(days=offset)
    co = ci + timedelta(days=nights)
    return ci.isoformat(), co.isoformat()


# -------- Villas --------
class TestVillas:
    def test_get_villas(self, session):
        r = session.get(f"{API}/villas", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) == 5


# -------- Availability --------
class TestAvailability:
    def test_availability_valid(self, session):
        ci, co = _future_dates(60)
        r = session.get(f"{API}/availability", params={"check_in": ci, "check_out": co}, timeout=15)
        assert r.status_code == 200
        assert "booked_villa_ids" in r.json()

    def test_availability_bad_dates(self, session):
        ci, co = _future_dates(60)
        r = session.get(f"{API}/availability", params={"check_in": co, "check_out": ci}, timeout=15)
        assert r.status_code == 400


# -------- Reservations (create still open) --------
class TestReservations:
    def test_create_reservation_and_pricing(self, session):
        ci, co = _future_dates(200, 3)
        payload = {
            "villa_id": "villa-01",
            "guest_name": "TEST_Alice",
            "guest_email": "test_alice@example.com",
            "check_in": ci, "check_out": co, "guests": 2,
        }
        r = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        CREATED_IDS.append(data["id"])
        assert data["nights"] == 3
        assert data["total_price"] == 650 * 3 + 75
        assert data["status"] == "confirmed"

    def test_overlap_conflict(self, session):
        ci, co = _future_dates(210, 3)
        payload = {
            "villa_id": "villa-02", "guest_name": "TEST_Bob",
            "guest_email": "test_bob@example.com",
            "check_in": ci, "check_out": co, "guests": 2,
        }
        r1 = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r1.status_code == 200
        CREATED_IDS.append(r1.json()["id"])
        r2 = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r2.status_code == 409

    def test_too_many_guests(self, session):
        ci, co = _future_dates(230, 2)
        payload = {
            "villa_id": "villa-04", "guest_name": "TEST_D",
            "guest_email": "test_d@example.com",
            "check_in": ci, "check_out": co, "guests": 10,
        }
        r = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r.status_code == 400

    def test_unknown_villa(self, session):
        ci, co = _future_dates(240, 2)
        payload = {
            "villa_id": "villa-999", "guest_name": "TEST_E",
            "guest_email": "test_e@example.com",
            "check_in": ci, "check_out": co, "guests": 1,
        }
        r = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r.status_code == 404


# -------- Admin auth --------
class TestAdminAuth:
    def test_admin_login_success(self, session):
        r = session.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        assert "token" in r.json()

    def test_admin_login_wrong_password(self, session):
        r = session.post(f"{API}/admin/login", json={"password": "wrongpass"}, timeout=15)
        assert r.status_code == 401

    def test_list_reservations_no_auth(self, session):
        r = session.get(f"{API}/reservations", timeout=15)
        assert r.status_code == 401

    def test_list_reservations_bad_token(self, session):
        r = session.get(
            f"{API}/reservations", timeout=15,
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert r.status_code == 401

    def test_list_reservations_with_admin(self, admin_session):
        r = admin_session.get(f"{API}/reservations", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_delete_reservation_no_auth(self, session):
        r = session.delete(f"{API}/reservations/some-id", timeout=15)
        assert r.status_code == 401


# -------- Mocked email log --------
class TestEmailLog:
    def test_reservation_creates_email_log(self, session, admin_session):
        ci, co = _future_dates(260, 2)
        payload = {
            "villa_id": "villa-03", "guest_name": "TEST_Email",
            "guest_email": "test_email@example.com",
            "check_in": ci, "check_out": co, "guests": 2,
        }
        r = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r.status_code == 200
        rid = r.json()["id"]
        CREATED_IDS.append(rid)
        # Verify email doc via mongosh
        import subprocess, json
        cmd = [
            "mongosh", "test_database", "--quiet", "--eval",
            f'JSON.stringify(db.email_log.findOne({{reservation_id: "{rid}"}}))'
        ]
        try:
            out = subprocess.check_output(cmd, timeout=10).decode().strip()
            doc = json.loads(out) if out and out != "null" else None
        except FileNotFoundError:
            pytest.skip("mongosh not available on host")
        assert doc is not None, "email_log doc not created for reservation"
        assert doc["status"] == "logged"
        assert doc["to"] == "test_email@example.com"
        assert "html" in doc and "AURA" in doc["html"]
        assert "subject" in doc


# -------- Guest lookup + cancel --------
class TestGuestLookupCancel:
    def test_my_reservations(self, session):
        ci, co = _future_dates(280, 2)
        email = "TEST_lookup@example.com"
        payload = {
            "villa_id": "villa-05", "guest_name": "TEST_LU",
            "guest_email": email, "check_in": ci, "check_out": co, "guests": 2,
        }
        r = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r.status_code == 200
        rid = r.json()["id"]
        CREATED_IDS.append(rid)
        # Lookup — case-insensitive
        r = session.get(f"{API}/my-reservations", params={"email": email.lower()}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert any(d["id"] == rid for d in data)
        # Uppercase match too
        r2 = session.get(f"{API}/my-reservations", params={"email": email.upper()}, timeout=15)
        assert r2.status_code == 200
        assert any(d["id"] == rid for d in r2.json())

    def test_cancel_mismatched_email(self, session):
        ci, co = _future_dates(300, 2)
        email = "TEST_cancel1@example.com"
        r = session.post(f"{API}/reservations", json={
            "villa_id": "villa-01", "guest_name": "TEST_CA",
            "guest_email": email, "check_in": ci, "check_out": co, "guests": 2,
        }, timeout=15)
        assert r.status_code == 200
        rid = r.json()["id"]
        CREATED_IDS.append(rid)
        r = session.post(f"{API}/reservations/{rid}/cancel",
                         json={"email": "wrong@example.com"}, timeout=15)
        assert r.status_code == 403

    def test_cancel_unknown_id(self, session):
        r = session.post(f"{API}/reservations/unknown-id-xyz/cancel",
                         json={"email": "any@example.com"}, timeout=15)
        assert r.status_code == 404

    def test_cancel_success(self, session):
        ci, co = _future_dates(320, 2)
        email = "TEST_cancel2@example.com"
        r = session.post(f"{API}/reservations", json={
            "villa_id": "villa-02", "guest_name": "TEST_CB",
            "guest_email": email, "check_in": ci, "check_out": co, "guests": 2,
        }, timeout=15)
        assert r.status_code == 200
        rid = r.json()["id"]
        # Case-insensitive email match
        r = session.post(f"{API}/reservations/{rid}/cancel",
                         json={"email": email.upper()}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("cancelled") is True
        # Confirm gone
        r = session.get(f"{API}/my-reservations", params={"email": email}, timeout=15)
        assert all(d["id"] != rid for d in r.json())


# -------- Brute force lockout (last so cleanup happens) --------
class TestLockout:
    def test_brute_force_lockout(self, session):
        # 5 wrong attempts → 6th should be 429
        last_status = None
        for _ in range(6):
            r = session.post(f"{API}/admin/login", json={"password": "definitely_wrong"}, timeout=15)
            last_status = r.status_code
        assert last_status == 429, f"Expected 429 lockout, got {last_status}"
        # Cleanup lockout via mongosh so future admin logins succeed
        import subprocess
        try:
            subprocess.run(
                ["mongosh", "test_database", "--quiet", "--eval",
                 "db.login_attempts.deleteMany({})"],
                check=False, timeout=10,
            )
        except FileNotFoundError:
            pass


# -------- Stats --------
class TestStats:
    def test_stats(self, session):
        r = session.get(f"{API}/stats", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["villas_count"] == 5
