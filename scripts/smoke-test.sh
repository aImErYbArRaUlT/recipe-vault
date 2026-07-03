#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://simmer-app-production.up.railway.app}"
PASS=0
FAIL=0
SKIP=0

red() { printf "\033[31m%s\033[0m" "$1"; }
green() { printf "\033[32m%s\033[0m" "$1"; }
yellow() { printf "\033[33m%s\033[0m" "$1"; }

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  $(green PASS) $label"
    PASS=$((PASS + 1))
  else
    echo "  $(red FAIL) $label (expected $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

check_range() {
  local label="$1" min="$2" max="$3" actual="$4"
  if [ "$actual" -ge "$min" ] 2>/dev/null && [ "$actual" -le "$max" ] 2>/dev/null; then
    echo "  $(green PASS) $label ($actual)"
    PASS=$((PASS + 1))
  else
    echo "  $(red FAIL) $label (expected ${min}-${max}, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

skip() {
  echo "  $(yellow SKIP) $1"
  SKIP=$((SKIP + 1))
}

http_code() { curl -s -o /dev/null -w "%{http_code}" "$1"; }
http_code_post() { curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$2" "$1"; }

# Generate unique test user (no + or ! to avoid URL encoding issues with form POST)
TS=$(date +%s)
TEST_EMAIL="smoketest${TS}@test.simmer.kitchen"
TEST_PASSWORD="SmokeTest1234"
TEST_NAME="Smoke Test ${TS}"
COOKIE_JAR=$(mktemp)
trap "rm -f $COOKIE_JAR" EXIT

authed_get() { curl -s -b "$COOKIE_JAR" "$1"; }
authed_get_code() { curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$1"; }
authed_post() { curl -s -b "$COOKIE_JAR" -X POST -H "Content-Type: application/json" -d "$2" "$1"; }
authed_post_code() { curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X POST -H "Content-Type: application/json" -d "$2" "$1"; }
authed_patch() { curl -s -b "$COOKIE_JAR" -X PATCH -H "Content-Type: application/json" -d "$2" "$1"; }
authed_patch_code() { curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X PATCH -H "Content-Type: application/json" -d "$2" "$1"; }
authed_delete_code() { curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X DELETE "$1"; }

echo ""
echo "=== Simmer Production Smoke Tests ==="
echo "Base: $BASE_URL"
echo "Test user: $TEST_EMAIL"
echo ""

# ── 1. Health ──
echo "-- Health --"
code=$(http_code "$BASE_URL/api/health")
check "GET /api/health" "200" "$code"
body=$(curl -s "$BASE_URL/api/health")
if echo "$body" | grep -q '"ok"'; then
  echo "  $(green PASS) Health body contains ok"
  PASS=$((PASS + 1))
else
  echo "  $(red FAIL) Health body: $body"
  FAIL=$((FAIL + 1))
fi

# ── 2. Public Pages ──
echo ""
echo "-- Public Pages --"
for path in "/" "/pricing" "/login" "/signup" "/forgot-password"; do
  code=$(http_code "$BASE_URL$path")
  check_range "GET $path" 200 302 "$code"
done

# ── 3. Protected Pages (should redirect or serve page shell) ──
echo ""
echo "-- Protected Pages --"
for path in "/dashboard" "/recipes" "/cookbooks" "/settings" "/family"; do
  code=$(http_code "$BASE_URL$path")
  check_range "GET $path (serves)" 200 307 "$code"
done

# ── 4. Signup ──
echo ""
echo "-- Signup --"
signup_body=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"displayName\":\"$TEST_NAME\"}" \
  "$BASE_URL/api/auth/signup")

if echo "$signup_body" | grep -q '"id"'; then
  echo "  $(green PASS) POST /api/auth/signup (created user)"
  PASS=$((PASS + 1))
  USER_ID=$(echo "$signup_body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
else
  echo "  $(red FAIL) POST /api/auth/signup: $signup_body"
  FAIL=$((FAIL + 1))
  USER_ID=""
fi

# ── 5. Login via NextAuth (get session cookie) ──
echo ""
echo "-- Login --"
# Get CSRF token
csrf_page=$(curl -s -c "$COOKIE_JAR" "$BASE_URL/api/auth/csrf")
CSRF_TOKEN=$(echo "$csrf_page" | python3 -c "import sys,json; print(json.load(sys.stdin).get('csrfToken',''))" 2>/dev/null || echo "")

if [ -n "$CSRF_TOKEN" ]; then
  login_resp=$(curl -s -L -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "csrfToken=$CSRF_TOKEN" \
    --data-urlencode "email=$TEST_EMAIL" \
    --data-urlencode "password=$TEST_PASSWORD" \
    --data-urlencode "callbackUrl=$BASE_URL/dashboard" \
    --data-urlencode "json=true" \
    -o /dev/null -w "%{http_code}" \
    "$BASE_URL/api/auth/callback/credentials")
  check_range "POST /api/auth/callback/credentials" 200 302 "$login_resp"

  # Verify session cookie was set
  session_body=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/auth/session")
  if echo "$session_body" | grep -q '"user"'; then
    echo "  $(green PASS) Session cookie valid"
    PASS=$((PASS + 1))
  else
    echo "  $(red FAIL) Session not established: $session_body"
    FAIL=$((FAIL + 1))
  fi
else
  skip "Login (no CSRF token)"
  skip "Session cookie"
fi

# ── 6. Authed: /api/auth/me ──
echo ""
echo "-- User Profile --"
me_body=$(authed_get "$BASE_URL/api/auth/me")
if echo "$me_body" | grep -q '"email"'; then
  echo "  $(green PASS) GET /api/auth/me (authenticated)"
  PASS=$((PASS + 1))
else
  echo "  $(red FAIL) GET /api/auth/me: $me_body"
  FAIL=$((FAIL + 1))
fi

# ── 7. Update profile ──
patch_code=$(authed_patch_code "$BASE_URL/api/auth/me" '{"displayName":"Smoke Updated","skillLevel":"intermediate","measurementSystem":"metric"}')
check "PATCH /api/auth/me" "200" "$patch_code"

# ── 8. Recipes CRUD ──
echo ""
echo "-- Recipes --"
recipe_body=$(authed_post "$BASE_URL/api/recipes" '{
  "title":"Smoke Test Pasta",
  "description":"A test recipe created by smoke tests",
  "ingredients":[{"name":"Pasta","quantity":200,"unit":"g"},{"name":"Olive oil","quantity":2,"unit":"tbsp"}],
  "steps":[{"instruction":"Boil water"},{"instruction":"Cook pasta for 8 minutes"},{"instruction":"Drain and toss with oil"}],
  "prepTimeMinutes":5,
  "cookTimeMinutes":10,
  "totalTimeMinutes":15,
  "servings":2,
  "cuisine":"Italian",
  "tags":["smoke-test","pasta"],
  "difficulty":"easy"
}')

RECIPE_ID=$(echo "$recipe_body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
if [ -n "$RECIPE_ID" ] && [ "$RECIPE_ID" != "" ]; then
  echo "  $(green PASS) POST /api/recipes (id: $RECIPE_ID)"
  PASS=$((PASS + 1))
else
  echo "  $(red FAIL) POST /api/recipes: $recipe_body"
  FAIL=$((FAIL + 1))
  RECIPE_ID=""
fi

# Get recipe
if [ -n "$RECIPE_ID" ]; then
  code=$(authed_get_code "$BASE_URL/api/recipes/$RECIPE_ID")
  check "GET /api/recipes/$RECIPE_ID" "200" "$code"
else
  skip "GET /api/recipes/:id (no recipe created)"
fi

# List recipes
list_code=$(authed_get_code "$BASE_URL/api/recipes")
check "GET /api/recipes" "200" "$list_code"

# Update recipe
if [ -n "$RECIPE_ID" ]; then
  patch_code=$(authed_patch_code "$BASE_URL/api/recipes/$RECIPE_ID" '{"title":"Updated Smoke Pasta","changesSummary":"Renamed in smoke test"}')
  check "PATCH /api/recipes/$RECIPE_ID" "200" "$patch_code"
else
  skip "PATCH /api/recipes/:id"
fi

# Recipe versions
if [ -n "$RECIPE_ID" ]; then
  code=$(authed_get_code "$BASE_URL/api/recipes/$RECIPE_ID/versions")
  check_range "GET /api/recipes/$RECIPE_ID/versions" 200 200 "$code"
else
  skip "GET /api/recipes/:id/versions"
fi

# Cook log
if [ -n "$RECIPE_ID" ]; then
  log_code=$(authed_post_code "$BASE_URL/api/recipes/$RECIPE_ID/logs" '{"rating":5,"notes":"Smoke test cook log","wouldMakeAgain":true}')
  check_range "POST /api/recipes/$RECIPE_ID/logs" 200 201 "$log_code"

  logs_code=$(authed_get_code "$BASE_URL/api/recipes/$RECIPE_ID/logs")
  check "GET /api/recipes/$RECIPE_ID/logs" "200" "$logs_code"
else
  skip "Cook logs (no recipe)"
fi

# Share recipe
if [ -n "$RECIPE_ID" ]; then
  share_code=$(authed_post_code "$BASE_URL/api/recipes/$RECIPE_ID/share" '{}')
  check_range "POST /api/recipes/$RECIPE_ID/share" 200 200 "$share_code"
else
  skip "Share recipe"
fi

# Fork recipe
if [ -n "$RECIPE_ID" ]; then
  fork_code=$(authed_post_code "$BASE_URL/api/recipes/$RECIPE_ID/fork" '{}')
  check_range "POST /api/recipes/$RECIPE_ID/fork" 200 201 "$fork_code"
else
  skip "Fork recipe"
fi

# ── 9. Cookbooks ──
echo ""
echo "-- Cookbooks --"
cb_body=$(authed_post "$BASE_URL/api/cookbooks" '{"title":"Smoke Test Cookbook"}')
COOKBOOK_ID=$(echo "$cb_body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
if [ -n "$COOKBOOK_ID" ] && [ "$COOKBOOK_ID" != "" ]; then
  echo "  $(green PASS) POST /api/cookbooks (id: $COOKBOOK_ID)"
  PASS=$((PASS + 1))
else
  echo "  $(red FAIL) POST /api/cookbooks: $cb_body"
  FAIL=$((FAIL + 1))
  COOKBOOK_ID=""
fi

cb_list_code=$(authed_get_code "$BASE_URL/api/cookbooks")
check "GET /api/cookbooks" "200" "$cb_list_code"

# Add recipe to cookbook
if [ -n "$COOKBOOK_ID" ] && [ -n "$RECIPE_ID" ]; then
  add_code=$(authed_post_code "$BASE_URL/api/cookbooks/$COOKBOOK_ID/recipes" "{\"recipeId\":\"$RECIPE_ID\"}")
  check_range "POST /api/cookbooks/$COOKBOOK_ID/recipes" 200 201 "$add_code"

  cb_recipes_code=$(authed_get_code "$BASE_URL/api/cookbooks/$COOKBOOK_ID/recipes")
  check "GET /api/cookbooks/$COOKBOOK_ID/recipes" "200" "$cb_recipes_code"
else
  skip "Add recipe to cookbook"
fi

# ── 10. Family ──
echo ""
echo "-- Family --"
# Family requires family plan; trial user gets 403 (feature gated)
family_create_code=$(authed_post_code "$BASE_URL/api/family" '{"name":"Smoke Test Family"}')
check "POST /api/family (gated for trial)" "403" "$family_create_code"

family_get_code=$(authed_get_code "$BASE_URL/api/family")
check "GET /api/family (gated for trial)" "403" "$family_get_code"

# ── 11. Cook Guide (AI) ──
echo ""
echo "-- Cook Guide (AI) --"
if [ -n "$RECIPE_ID" ]; then
  session_body=$(authed_post "$BASE_URL/api/cookguide/start" "{\"recipeId\":\"$RECIPE_ID\"}")
  SESSION_ID=$(echo "$session_body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sessionId','') or d.get('id',''))" 2>/dev/null || echo "")
  if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "" ]; then
    echo "  $(green PASS) POST /api/cookguide/start (session: $SESSION_ID)"
    PASS=$((PASS + 1))

    msg_code=$(authed_post_code "$BASE_URL/api/cookguide/message" "{\"sessionId\":\"$SESSION_ID\",\"message\":\"What temperature should I boil the water at?\"}")
    check "POST /api/cookguide/message" "200" "$msg_code"

    end_code=$(authed_post_code "$BASE_URL/api/cookguide/end" "{\"sessionId\":\"$SESSION_ID\"}")
    check_range "POST /api/cookguide/end" 200 200 "$end_code"
  else
    echo "  $(red FAIL) POST /api/cookguide/start: $session_body"
    FAIL=$((FAIL + 1))
    skip "Cook guide message"
    skip "Cook guide end"
  fi
else
  skip "Cook guide (no recipe)"
fi

# ── 12. Stripe Billing ──
echo ""
echo "-- Billing --"
sub_code=$(authed_get_code "$BASE_URL/api/stripe/subscription")
check_range "GET /api/stripe/subscription" 200 200 "$sub_code"

# ── 13. Forgot Password API ──
echo ""
echo "-- Password Reset --"
forgot_code=$(http_code_post "$BASE_URL/api/auth/forgot-password" "{\"email\":\"$TEST_EMAIL\"}")
check "POST /api/auth/forgot-password" "200" "$forgot_code"

# ── 14. Change Password ──
change_code=$(authed_post_code "$BASE_URL/api/auth/change-password" "{\"currentPassword\":\"$TEST_PASSWORD\",\"newPassword\":\"SmokeNew456!\"}")
check "POST /api/auth/change-password" "200" "$change_code"

# ── 15. Cleanup: Delete recipe and cookbook ──
echo ""
echo "-- Cleanup --"
if [ -n "$RECIPE_ID" ]; then
  del_code=$(authed_delete_code "$BASE_URL/api/recipes/$RECIPE_ID")
  check "DELETE /api/recipes/$RECIPE_ID" "200" "$del_code"
fi

if [ -n "$COOKBOOK_ID" ]; then
  del_code=$(authed_delete_code "$BASE_URL/api/cookbooks/$COOKBOOK_ID")
  check "DELETE /api/cookbooks/$COOKBOOK_ID" "200" "$del_code"
fi

# Delete test user
del_user_code=$(authed_delete_code "$BASE_URL/api/auth/me")
check "DELETE /api/auth/me (cleanup)" "200" "$del_user_code"

# ── Summary ──
echo ""
echo "==============================="
echo "  $(green PASS): $PASS"
echo "  $(red FAIL): $FAIL"
echo "  $(yellow SKIP): $SKIP"
TOTAL=$((PASS + FAIL + SKIP))
echo "  Total: $TOTAL"
echo "==============================="
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
