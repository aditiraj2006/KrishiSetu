import { useState, useEffect } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  getRedirectResult,
  onAuthStateChanged,
} from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import toast, { Toaster } from "react-hot-toast";
import { useLocation } from "wouter";

export default function LoginPage() {
  const [tab, setTab] = useState<"email" | "google">("email");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!auth) return;

    setLoading(true);
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          toast.success("Successfully logged in with Google!");
          setLocation("/dashboard");
        }
      })
      .catch((err: any) => {
        console.error("Redirect login error:", err);
        const message = err?.message || "Google login failed";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLocation("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [setLocation]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      const message = "Firebase is not configured.";
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error("Name is required for sign up.");
        await createUserWithEmailAndPassword(auth, email, password);
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: name });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      toast.success(`Successfully ${isSignUp ? "signed up" : "logged in"}!`);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      const message = "Firebase is not configured.";
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Successfully logged in with Google!");
      setLocation("/dashboard");
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        return; // Do nothing if user intentionally closes popup
      }

      const isPopupBlocked = err?.code === "auth/popup-blocked";

      if (isPopupBlocked) {
        try {
          await signInWithRedirect(auth!, googleProvider);
          return;
        } catch (redirectErr: any) {
          console.error("Google redirect fallback failed:", redirectErr);
        }
      }

      const message = err?.message || "Google login failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      const message = "Firebase is not configured.";
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset email sent!");
      setShowReset(false);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

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
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>

      <Card className="w-full max-w-md bg-card text-card-foreground shadow-md rounded-md border border-border">
        <CardHeader className="pb-0 pt-2">
          <div className="flex justify-center mb-2">
            <button
              className={`flex-1 py-2 font-medium border-b-2 transition-colors ${
                tab === "email"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              }`}
              onClick={() => setTab("email")}
            >
              📧 Email
            </button>
            <button
              className={`flex-1 py-2 font-medium border-b-2 transition-colors ${
                tab === "google"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              }`}
              onClick={() => setTab("google")}
            >
              🌐 Google
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {showReset && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your email and we&apos;ll send a reset link.
              </p>
              <Input
                type="email"
                placeholder="Your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
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

          {tab === "email" && !showReset && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <Input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                disabled={loading}
              >
                {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
              {!isSignUp && (
                <button
                  type="button"
                  className="text-sm text-accent hover:underline mt-2"
                  onClick={() => setShowReset(true)}
                >
                  Forgot password?
                </button>
              )}
            </form>
          )}

          {tab === "google" && !showReset && (
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              🌐 Sign {isSignUp ? "Up" : "In"} with Google
            </Button>
          )}
        </CardContent>
      </Card>

      {error && <div className="text-destructive mt-4 text-center">{error}</div>}
    </div>
  );
}
