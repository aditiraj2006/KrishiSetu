import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import toast, { Toaster } from "react-hot-toast";
import { useLocation } from "wouter";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

// ─── Role options ─────────────────────────────────────────────────────────────
const ROLES: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: "farmer",      label: "Farmer",      icon: "🌾", desc: "Register & track produce"  },
  { value: "distributor", label: "Distributor",  icon: "🚚", desc: "Manage supply chain"       },
  { value: "retailer",    label: "Retailer",     icon: "🏪", desc: "Source verified products"  },
  { value: "consumer",    label: "Consumer",     icon: "🧑", desc: "Verify product origin"     },
];

export default function LoginPage() {
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail, loading } = useAuth();

  const [tab, setTab]                   = useState<"email" | "google">("google");
  const [isSignUp, setIsSignUp]         = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(() => {
    return sessionStorage.getItem("krishisetu_pending_role") as UserRole | null;
  });
  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [resetEmail, setResetEmail]     = useState("");
  const [showReset, setShowReset]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);

  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  // ── Validate role selected before any auth attempt ────────────────────────
  const requireRole = (): boolean => {
    if (!selectedRole) {
      setError("Please select your role before continuing.");
      toast.error("Please select your role first.");
      return false;
    }
    return true;
  };

  // ── Google sign-in ────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    if (!requireRole()) return;
    setError(null);
    setSubmitting(true);
    try {
        await loginWithGoogle(selectedRole!);
        toast.success("Successfully logged in with Google!");
        setLocation("/dashboard");
      } catch (err: any) {
        setError(err.message || "Google login failed");
        toast.error(err.message || "Google login failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Email sign-in / sign-up ───────────────────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !requireRole()) return;
    setError(null);
    setSubmitting(true);
    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error("Name is required for sign up.");
        await registerWithEmail(email, password, name, selectedRole!);
        toast.success("Account created successfully!");
      } else {
        await loginWithEmail(email, password);
        toast.success("Successfully logged in!");
      }
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      toast.error(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Password reset ────────────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured || !auth) {
      setError("Firebase is not configured yet. Set the VITE_FIREBASE_* values in .env first.");
      toast.error("Firebase is not configured yet.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset email sent!");
      setShowReset(false);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading guard — shows while getRedirectResult() resolves ─────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Completing sign-in…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background font-sans px-4">
      <Toaster />
      <h1 className="text-4xl font-bold mb-2 text-center text-foreground">
        🌱 Sign {isSignUp ? "Up" : "In"} for KrishiSetu
      </h1>
      <p className="mb-6 text-center text-lg text-muted-foreground">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          className="text-primary font-semibold hover:underline"
          onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>

      <Card className="w-full max-w-md bg-card text-card-foreground shadow-md rounded-md">

        {/* ── Step 1: Role selection ── */}
        <CardContent className="pt-6 pb-2">
          <p className="text-sm font-semibold text-foreground mb-2">
            1. Select your role
            {!selectedRole && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">(required)</span>
            )}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-1">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => {
                  setSelectedRole(r.value);
                  sessionStorage.setItem("krishisetu_pending_role", r.value);
                  setError(null);
                }}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-colors
                  ${selectedRole === r.value
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
              >
                <span className="text-xl">{r.icon}</span>
                <span className="font-medium">{r.label}</span>
                <span className="text-xs text-muted-foreground leading-tight text-center">{r.desc}</span>
              </button>
            ))}
          </div>
        </CardContent>

        {/* ── Step 2: Sign-in method ── */}
        <CardHeader className="pb-0 pt-2">
          <p className="text-sm font-semibold text-foreground mb-2">2. Sign in</p>
          <div className="flex">
            <button
              className={`flex-1 py-2 font-medium border-b-2 transition-colors ${tab === "google"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
                }`}
              onClick={() => setTab("google")}
            >
              🌐 Google
            </button>
            <button
              className={`flex-1 py-2 font-medium border-b-2 transition-colors ${tab === "email"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
                }`}
              onClick={() => setTab("email")}
            >
              📧 Email
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">

          {/* ── Forgot password form ── */}
          {showReset && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your email and we'll send a reset link.
              </p>
              <Input
                type="email"
                placeholder="Your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Sending…" : "Send reset link"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowReset(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* ── Google tab ── */}
          {tab === "google" && !showReset && (
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
              onClick={handleGoogleLogin}
              disabled={submitting || !selectedRole}
              title={!selectedRole ? "Select a role above first" : undefined}
            >
              🌐 Sign {isSignUp ? "Up" : "In"} with Google
            </Button>
          )}

          {/* ── Email tab ── */}
          {tab === "email" && !showReset && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <Input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-green-700 transition-colors rounded-md py-2 font-semibold"
                disabled={submitting || (isSignUp && !selectedRole)}
              >
                {submitting ? "Please wait…" : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
              {!isSignUp && (
                <button
                  type="button"
                  className="text-sm text-accent hover:underline mt-1"
                  onClick={() => setShowReset(true)}
                >
                  Forgot password?
                </button>
              )}
            </form>
          )}

        </CardContent>
      </Card>

      {error && (
        <div className="text-destructive mt-4 text-center text-sm max-w-md">{error}</div>
      )}
    </div>
  );
}
