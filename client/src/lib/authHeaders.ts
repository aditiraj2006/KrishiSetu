import { getAuth } from "firebase/auth";

export async function getAuthHeaders(
  baseHeaders: Record<string, string> = {}
): Promise<Record<string, string>> {
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
