export type FirebaseAuthErrorCode =
    | "MISSING_KID"
    | "UNKNOWN_KID"
    | "CERT_FETCH_FAILED"
    | "INVALID_TOKEN"
    | "MISSING_UID";

export class FirebaseAuthError extends Error {
    constructor(
        message: string,
        public readonly code: FirebaseAuthErrorCode,
    ) {
        super(message);
        this.name = "FirebaseAuthError";
    }
}