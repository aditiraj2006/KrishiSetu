import { useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Successfully logged in with Google!");
      setLocation("/dashboard"); 
    } catch (err: any) {
      setError(err.message || "Google login failed");
      toast.error(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background font-sans">
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
        <CardHeader>
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

        <CardContent>
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
                onChange={e => setEmail(e.target.value)}
                required
                />
                <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
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

          {tab === "google" && (
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
