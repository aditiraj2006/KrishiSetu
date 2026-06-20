import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import toast, { Toaster } from "react-hot-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail, loading } = useAuth();

  const [tab, setTab]                   = useState<"email" | "google">("google");
  const [isSignUp, setIsSignUp]         = useState(false);
  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [resetEmail, setResetEmail]     = useState("");
  const [showReset, setShowReset]       = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  // these just track whether each password box shows dots or plain text
  const [showPassword, setShowPassword]           = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  // Google Sign In
  const handleGoogleLogin = async () => {
    setSubmitting(true);
    try {
        // We pass undefined as any because role selection is now handled on the dashboard
        await loginWithGoogle(undefined as any);
        toast.success("Successfully logged in with Google!");
        setLocation("/dashboard");
      } catch (err: any) {
        if (err.code && err.code.includes("auth/invalid-credential")) {
          toast.error("Incorrect email or password.");
        } else if (err.code && err.code.includes("auth/email-already-in-use")) {
          toast.error("This email is already registered. Please sign in.");
        } else {
          toast.error("Authentication failed. Please try again.");
        }
    } finally {
      setSubmitting(false);
    }
  };

  // Email signin/signup
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const trimmedEmail    = email.trim();
    const trimmedName     = name.trim();

    try {
      if (isSignUp) {
        if (!trimmedName) throw new Error("Name is required for sign up.");
        // We pass undefined as any because role selection is now handled on the dashboard
        await registerWithEmail(trimmedEmail, password, trimmedName, undefined as any);
        toast.success("Account created successfully!");
      } else {
        await loginWithEmail(trimmedEmail, password);
        toast.success("Successfully logged in!");
      }
      setLocation("/dashboard");
    } catch (err: any) {
      const errorText = (err.code || "") + " " + (err.message || "");
      if (errorText.includes("auth/invalid-credential")) {
        toast.error("Incorrect email or password.");
      } else if (errorText.includes("auth/email-already-in-use")) {
        toast.error("This email is already registered. Please sign in.");
      } else {
        toast.error("Authentication failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured || !auth) {
      toast.error("Firebase is not configured yet.");
      return;
    }

    setSubmitting(true);
    const trimmedResetEmail = resetEmail.trim();

    try {
      await sendPasswordResetEmail(auth, trimmedResetEmail);
      toast.success("Password reset email sent!");
      setShowReset(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading guard shows while getRedirectResult() resolves
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
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>

      <Card className="w-full max-w-md bg-card text-card-foreground shadow-md rounded-md">
        <CardHeader className="pb-0 pt-4">
          <p className="text-sm font-semibold text-foreground mb-2 text-center">
            {isSignUp ? "Sign Up" : "Sign In"}
          </p>
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

          {tab === "google" && !showReset && (
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
              onClick={handleGoogleLogin}
              disabled={submitting}
            >
              🌐 Sign {isSignUp ? "Up" : "In"} with Google
            </Button>
          )}

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
              
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-green-700 transition-colors rounded-md py-2 font-semibold"
                disabled={submitting}
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
    </div>
  );
}