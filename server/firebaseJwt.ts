import jwt, { JwtPayload } from "jsonwebtoken";

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let cachedCerts: Record<string, string> | null = null;
let certsExpireAt = 0;

const getProjectId = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is required for token verification");
  }
  return projectId;
};

const parseMaxAgeSeconds = (cacheControl: string | null) => {
  if (!cacheControl) return null;
  const match = cacheControl.match(/max-age=(\d+)/i);
  return match ? Number(match[1]) : null;
};

const fetchCerts = async () => {
  if (cachedCerts && Date.now() < certsExpireAt) {
    return cachedCerts;
  }

  const res = await fetch(CERTS_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch Firebase certs: ${res.status}`);
  }

  const cacheControl = res.headers.get("cache-control");
  const maxAgeSeconds = parseMaxAgeSeconds(cacheControl) ?? 3600;
  const data = (await res.json()) as Record<string, string>;

  cachedCerts = data;
  certsExpireAt = Date.now() + maxAgeSeconds * 1000;

  return cachedCerts;
};

const getTokenKid = (token: string) => {
  const decoded = jwt.decode(token, { complete: true }) as
    | { header?: { kid?: string } }
    | null;
  return decoded?.header?.kid ?? null;
};

export const verifyFirebaseIdToken = async (token: string) => {
  const kid = getTokenKid(token);
  if (!kid) {
    throw new Error("Missing token kid");
  }

  const certs = await fetchCerts();
  const publicKey = certs[kid];
  if (!publicKey) {
    cachedCerts = null;
    certsExpireAt = 0;
    throw new Error("Unknown token kid");
  }

  const projectId = getProjectId();
  const issuer = `https://securetoken.google.com/${projectId}`;

  const decoded = jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
    audience: projectId,
    issuer,
  }) as JwtPayload & { uid?: string; user_id?: string };

  const uid = decoded.uid || decoded.user_id || decoded.sub;
  if (!uid) {
    throw new Error("Token missing uid");
  }

  return { ...decoded, uid };
};
