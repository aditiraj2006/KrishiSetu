import { type Request, type Response, type NextFunction } from "express";
import { verifyFirebaseIdToken } from "../firebaseJwt";
import { FirebaseAuthError } from "../errors/FirebaseAuthError";

/**
 * Express middleware that verifies a Firebase ID token from the Authorization
 * header (Bearer scheme) and attaches the decoded payload to req.user.
 *
 * Responds 401 if no token is present, 403 if the token is invalid.
 */
export async function requireFirebaseAuth(
  req: Request & { user?: { uid: string; [key: string]: unknown } },
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = await verifyFirebaseIdToken(token);
    req.user = decoded as { uid: string; [key: string]: unknown };
    next();
  } catch (err) {
    if (err instanceof FirebaseAuthError) {
      return res.status(403).json({ error: "Invalid Firebase token", code: err.code });
    }
    return res.status(403).json({ error: "Token verification failed" });
  }
}
