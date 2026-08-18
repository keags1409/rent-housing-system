# Auth Testing — AURA (owner password gate)

Adapted from custom JWT auth playbook. This app has a single owner password (env ADMIN_PASSWORD), no user accounts.

## API tests
```
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
# login ok
curl -s -X POST "$API_URL/api/admin/login" -H "Content-Type: application/json" -d '{"password":"1234567890"}'
# wrong password -> 401
curl -s -X POST "$API_URL/api/admin/login" -H "Content-Type: application/json" -d '{"password":"wrong"}'
# protected without token -> 401
curl -s "$API_URL/api/reservations"
# protected with token -> 200
TOKEN=$(curl -s -X POST "$API_URL/api/admin/login" -H "Content-Type: application/json" -d '{"password":"1234567890"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s "$API_URL/api/reservations" -H "Authorization: Bearer $TOKEN"
```

## Checks
- JWT payload type must be "admin", 24h expiry, HS256 with JWT_SECRET from backend/.env
- 5 failed logins from same IP → 429 lockout for 15 min (Mongo collection login_attempts). Clear with db.login_attempts.deleteMany({}) if lockout blocks testing.
- Guest cancel does NOT require admin token but requires matching email.
