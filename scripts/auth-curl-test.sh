#!/usr/bin/env bash
set -euo pipefail
set +H

BASE='http://localhost:3000/api/v1/auth'
EMAIL="auth.$(date +%s)@example.com"
PASSWORD='Secret123'
NEW_PASSWORD='NewSecret456'
MONGODB_URI='mongodb+srv://XEFORT:XEFORT%40%402025@cluster.dsm1ixd.mongodb.net/?appName=Cluster'
MONGODB_DB_NAME='XSOCIAL'

request() {
  local name="$1"
  local method="$2"
  local url="$3"
  local data="${4-}"
  local bearer="${5-}"
  local out
  local code
  out=$(mktemp)

  if [[ -n "$bearer" ]]; then
    code=$(curl -sS -o "$out" -w '%{http_code}' -X "$method" "$url" -H "Authorization: Bearer $bearer" -H 'Content-Type: application/json' -d "$data")
  elif [[ -n "$data" ]]; then
    code=$(curl -sS -o "$out" -w '%{http_code}' -X "$method" "$url" -H 'Content-Type: application/json' -d "$data")
  else
    code=$(curl -sS -o "$out" -w '%{http_code}' -X "$method" "$url")
  fi

  echo "=== $name ==="
  echo "HTTP $code"
  cat "$out"
  echo
  echo
  rm -f "$out"
}

get_user_field() {
  local email="$1"
  local field="$2"
  TEST_EMAIL="$email" TEST_FIELD="$field" MONGODB_URI="$MONGODB_URI" MONGODB_DB_NAME="$MONGODB_DB_NAME" node - <<'NODE'
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
const email = process.env.TEST_EMAIL;
const field = process.env.TEST_FIELD;

(async () => {
  await mongoose.connect(uri, { dbName });
  const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
  const User = mongoose.model('UserCurlLookup', userSchema);
  const user = await User.findOne({ email }).lean();
  process.stdout.write(String((user && user[field]) || ''));
  await mongoose.disconnect();
})().catch(() => {
  process.stdout.write('');
  process.exit(0);
});
NODE
}

echo "Testing user: $EMAIL"

request 'signup invalid payload' 'POST' "$BASE/signup" '{"email":"bad"}'
request 'verify-email invalid payload' 'POST' "$BASE/verify-email" '{}'
request 'login unknown user' 'POST' "$BASE/login" '{"email":"none@example.com","password":"x"}'
request 'refresh invalid payload' 'POST' "$BASE/refresh" '{}'
request 'logout missing auth' 'POST' "$BASE/logout" '{"refreshToken":"x"}'
request 'forgot-password invalid payload' 'POST' "$BASE/forgot-password" '{}'
request 'reset-password invalid payload' 'POST' "$BASE/reset-password" '{}'

request 'signup valid' 'POST' "$BASE/signup" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"

VERIFY_TOKEN=$(get_user_field "$EMAIL" 'emailVerificationToken')
echo "Verification token length: ${#VERIFY_TOKEN}"

request 'login before verify' 'POST' "$BASE/login" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
request 'verify-email invalid token' 'POST' "$BASE/verify-email" '{"token":"invalid-token"}'
request 'verify-email valid token' 'POST' "$BASE/verify-email" "{\"token\":\"$VERIFY_TOKEN\"}"

LOGIN_OUT=$(mktemp)
curl -sS -o "$LOGIN_OUT" -X POST "$BASE/login" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"

echo '=== login after verify ==='
cat "$LOGIN_OUT"
echo
echo

ACCESS_TOKEN=$(node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write((d.data&&d.data.tokens&&d.data.tokens.accessToken)||'');" "$LOGIN_OUT")
REFRESH_TOKEN=$(node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write((d.data&&d.data.tokens&&d.data.tokens.refreshToken)||'');" "$LOGIN_OUT")
rm -f "$LOGIN_OUT"

echo "Access token length: ${#ACCESS_TOKEN}"
echo "Refresh token length: ${#REFRESH_TOKEN}"
echo

request 'refresh invalid token' 'POST' "$BASE/refresh" '{"refreshToken":"invalid"}'
request 'refresh valid token' 'POST' "$BASE/refresh" "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
request 'logout invalid bearer' 'POST' "$BASE/logout" '{"refreshToken":"x"}' 'bad.token'
request 'logout valid bearer' 'POST' "$BASE/logout" "{\"refreshToken\":\"$REFRESH_TOKEN\"}" "$ACCESS_TOKEN"

request 'forgot-password existing' 'POST' "$BASE/forgot-password" "{\"email\":\"$EMAIL\"}"
RESET_TOKEN=$(get_user_field "$EMAIL" 'resetPasswordToken')
echo "Reset token length: ${#RESET_TOKEN}"

request 'reset-password invalid token' 'POST' "$BASE/reset-password" '{"token":"invalid","newPassword":"abc123"}'
request 'reset-password valid token' 'POST' "$BASE/reset-password" "{\"token\":\"$RESET_TOKEN\",\"newPassword\":\"$NEW_PASSWORD\"}"
request 'login old password should fail' 'POST' "$BASE/login" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
request 'login new password should pass' 'POST' "$BASE/login" "{\"email\":\"$EMAIL\",\"password\":\"$NEW_PASSWORD\"}"
