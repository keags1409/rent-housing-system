"""Backend API tests for AURA Forest Lake Resort."""
import os
import pytest
import requests
from datetime import date, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://villa-picker-3d.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

CREATED_IDS = []


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s
    # cleanup
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
        required = {"id", "name", "price_per_night", "bedrooms", "max_guests", "features", "images"}
        for v in data:
            assert required.issubset(v.keys()), f"Missing fields in {v.get('id')}"
            assert isinstance(v["features"], list)
            assert isinstance(v["images"], list) and len(v["images"]) > 0


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

    def test_availability_same_dates(self, session):
        ci, _ = _future_dates(60)
        r = session.get(f"{API}/availability", params={"check_in": ci, "check_out": ci}, timeout=15)
        assert r.status_code == 400


# -------- Reservations --------
class TestReservations:
    def test_create_reservation_and_pricing(self, session):
        ci, co = _future_dates(100, 3)
        payload = {
            "villa_id": "villa-01",
            "guest_name": "TEST_Alice",
            "guest_email": "test_alice@example.com",
            "check_in": ci, "check_out": co,
            "guests": 2,
        }
        r = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        CREATED_IDS.append(data["id"])
        assert data["villa_id"] == "villa-01"
        assert data["nights"] == 3
        # villa-01 price 650 * 3 + 75 = 2025
        assert data["total_price"] == 650 * 3 + 75
        assert data["status"] == "confirmed"

        # verify persistence via availability
        av = session.get(f"{API}/availability", params={"check_in": ci, "check_out": co}, timeout=15).json()
        assert "villa-01" in av["booked_villa_ids"]

    def test_overlap_conflict(self, session):
        ci, co = _future_dates(110, 3)
        payload = {
            "villa_id": "villa-02", "guest_name": "TEST_Bob",
            "guest_email": "test_bob@example.com",
            "check_in": ci, "check_out": co, "guests": 2,
        }
        r1 = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r1.status_code == 200
        CREATED_IDS.append(r1.json()["id"])
        # overlapping
        r2 = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r2.status_code == 409

    def test_invalid_dates(self, session):
        ci, co = _future_dates(120, 3)
        payload = {
            "villa_id": "villa-03", "guest_name": "TEST_C",
            "guest_email": "test_c@example.com",
            "check_in": co, "check_out": ci, "guests": 2,
        }
        r = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r.status_code == 400

    def test_too_many_guests(self, session):
        ci, co = _future_dates(130, 2)
        # villa-04 max_guests=2
        payload = {
            "villa_id": "villa-04", "guest_name": "TEST_D",
            "guest_email": "test_d@example.com",
            "check_in": ci, "check_out": co, "guests": 10,
        }
        r = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r.status_code == 400

    def test_unknown_villa(self, session):
        ci, co = _future_dates(140, 2)
        payload = {
            "villa_id": "villa-999", "guest_name": "TEST_E",
            "guest_email": "test_e@example.com",
            "check_in": ci, "check_out": co, "guests": 1,
        }
        r = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r.status_code == 404

    def test_list_reservations(self, session):
        r = session.get(f"{API}/reservations", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        ids = {d["id"] for d in data}
        for cid in CREATED_IDS:
            assert cid in ids

    def test_delete_reservation(self, session):
        ci, co = _future_dates(150, 2)
        payload = {
            "villa_id": "villa-05", "guest_name": "TEST_Del",
            "guest_email": "test_del@example.com",
            "check_in": ci, "check_out": co, "guests": 2,
        }
        r = session.post(f"{API}/reservations", json=payload, timeout=15)
        assert r.status_code == 200
        rid = r.json()["id"]
        d = session.delete(f"{API}/reservations/{rid}", timeout=15)
        assert d.status_code == 200
        # 404 second time
        d2 = session.delete(f"{API}/reservations/{rid}", timeout=15)
        assert d2.status_code == 404

    def test_stats(self, session):
        r = session.get(f"{API}/stats", timeout=15)
        assert r.status_code == 200
        data = r.json()
        for key in ("total_bookings", "total_revenue", "unique_guests", "villas_count"):
            assert key in data
        assert data["villas_count"] == 5
