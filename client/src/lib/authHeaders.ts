import { getAuth } from "firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase";

export async function getAuthHeaders(
  baseHeaders: Record<string, string> = {},
): Promise<Record<string, string>> {
  if (!isFirebaseConfigured) {
    return { ...baseHeaders };
  }

  const user = getAuth().currentUser;
  if (!user) {
    return { ...baseHeaders };
  }

  const idToken = await user.getIdToken();
  return {
    ...baseHeaders,
    Authorization: `Bearer ${idToken}`,
    "firebase-uid": user.uid,
  };
}
