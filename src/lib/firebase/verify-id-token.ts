type FirebaseAccount = {
  email: string;
  uid: string;
};

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseAccount | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  if (!apiKey || !idToken) return null;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );
  if (!res.ok) return null;

  const body = (await res.json()) as {
    users?: Array<{ email?: string; localId?: string }>;
  };
  const user = body.users?.[0];
  if (!user?.email || !user.localId) return null;
  return { email: user.email.toLowerCase(), uid: user.localId };
}
