import { cert, initializeApp, type App } from "firebase-admin/app";
import { getStorage, type Storage } from "firebase-admin/storage";
import { type ServiceAccount } from "firebase-admin";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

let firebaseApp: App | null = null;
let firebaseStorage: Storage | null = null;

const getStorageBucketName = (): string => {
  return (
    process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || ""
  );
};

const getServiceAccount = (): ServiceAccount => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount;
    } catch (error) {
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON");
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!fs.existsSync(credentialsPath)) {
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS path does not exist");
    }
    const raw = fs.readFileSync(credentialsPath, "utf-8");
    return JSON.parse(raw) as ServiceAccount;
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    } as ServiceAccount;
  }

  throw new Error(
    "Firebase service account credentials are required for server-side storage uploads.",
  );
};

const initFirebaseStorage = (): Storage => {
  if (firebaseStorage) return firebaseStorage;

  const bucketName = getStorageBucketName();
  if (!bucketName) {
    throw new Error("FIREBASE_STORAGE_BUCKET is required");
  }

  if (!firebaseApp) {
    const serviceAccount = getServiceAccount();
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: bucketName,
    });
  }

  firebaseStorage = getStorage(firebaseApp);
  return firebaseStorage;
};

export const uploadPaymentProof = async (
  fileBuffer: Buffer,
  originalName: string,
  contentType: string,
): Promise<string> => {
  const storage = initFirebaseStorage();
  const bucket = storage.bucket();
  const filename = `payment-proofs/${Date.now()}-${randomUUID()}${path.extname(
    originalName,
  )}`;
  const file = bucket.file(filename);

  await file.save(fileBuffer, {
    contentType,
    resumable: false,
  });

  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${encodeURI(filename)}`;
};
