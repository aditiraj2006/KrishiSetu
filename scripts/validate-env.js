const PLACEHOLDER_RE = /^(your[-_\s]|xxx|replace|<[^>]+>|todo|test|sample|example|changeme|dummy)/i;
 
function isMissing(value) {
  if (value === undefined || value === null) return true;
  if (typeof value !== "string") return true;
  if (value.trim() === "") return true;
  return false;
}
 
function isPlaceholder(value) {
  return typeof value === "string" && PLACEHOLDER_RE.test(value.trim());
}
const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,

  measurementId:     process.env.VITE_FIREBASE_MEASUREMENT_ID,
};
 
const REQUIRED_FIREBASE_KEYS = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];
 
const OPTIONAL_FIREBASE_KEYS = [
  "measurementId", 
];
 
const errors   = []; 
const warnings = []; 

REQUIRED_FIREBASE_KEYS.forEach((key) => {
  const value = firebaseConfig[key];
 
  if (isMissing(value)) {
    errors.push(`VITE_FIREBASE_${key.replace(/([A-Z])/g, "_$1").toUpperCase()} is not set`);
    return;
  }
  if (isPlaceholder(value)) {
    errors.push(
      `VITE_FIREBASE_${key.replace(/([A-Z])/g, "_$1").toUpperCase()} looks like a placeholder: "${value}"`
    );
  }
});
 
OPTIONAL_FIREBASE_KEYS.forEach((key) => {
  const value = firebaseConfig[key];
  if (isMissing(value) || isPlaceholder(value)) {
    warnings.push(
      `VITE_FIREBASE_${key.replace(/([A-Z])/g, "_$1").toUpperCase()} is not set (optional — Firebase Analytics will be disabled)`
    );
  }
});
 
// ── Other required variables ──────────────────────────────────────────────────
 
const googleGeminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (isMissing(googleGeminiApiKey)) {
  errors.push("GOOGLE_GEMINI_API_KEY is not set");
} else if (isPlaceholder(googleGeminiApiKey)) {
  errors.push(`GOOGLE_GEMINI_API_KEY looks like a placeholder: "${googleGeminiApiKey}"`);
}
 
// MongoDB URI
const mongodbUri = process.env.MONGODB_URI;
if (isMissing(mongodbUri)) {
  errors.push("MONGODB_URI is not set");
} else if (isPlaceholder(mongodbUri)) {
  errors.push(`MONGODB_URI looks like a placeholder: "${mongodbUri}"`);
} else if (
  !mongodbUri.startsWith("mongodb://") &&
  !mongodbUri.startsWith("mongodb+srv://")
) {
  
  errors.push(`MONGODB_URI must start with mongodb:// or mongodb+srv://, got: "${mongodbUri.slice(0, 20)}..."`);
}
 
// Email credentials
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
if (isMissing(emailUser) || isMissing(emailPass)) {
  warnings.push("EMAIL_USER / EMAIL_PASS not set — email notification features will be disabled");
}
 
// Session secret 
const sessionSecret = process.env.SESSION_SECRET;
if (isMissing(sessionSecret)) {
  errors.push("SESSION_SECRET is not set");
} else if (typeof sessionSecret === "string" && sessionSecret.length < 32) {
  errors.push(`SESSION_SECRET is too short (${sessionSecret.length} chars). Use at least 32 random characters.`);
}
 
// ── Report results ────────────────────────────────────────────────────────────
 
if (warnings.length > 0) {
  console.warn("\n[validate-env] ⚠️  Optional variables not set:");
  warnings.forEach((w) => console.warn(`   ⚠️  ${w}`));
}
 
if (errors.length > 0) {
  console.error("\n[validate-env] Environment validation FAILED:");
  errors.forEach((e) => console.error(`  ${e}`));
  console.error(
    "\n   Copy .env.example to .env and fill in the missing values.\n"
  );
  process.exit(1);
}
 
console.log(
  "[validate-env] All required environment variables are set.\n"
);
