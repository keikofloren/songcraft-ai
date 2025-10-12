import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Music } from "lucide-react";

interface TherapistLoginProps {
  onLoginSuccess: (userId: string) => void;
  onNavigate: (page: string) => void;
}

export default function TherapistLogin({
  onLoginSuccess,
  onNavigate,
}: TherapistLoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Save userId to localStorage for backwards compatibility
        localStorage.setItem("hs_user_id", data.user.id);
        onLoginSuccess(data.user.id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      console.log("[Signup] Starting signup process...");

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      console.log("[Signup] Auth response:", { data, error });

      if (error) {
        console.error("[Signup] Auth error:", error);
        throw error;
      }

      if (data.user) {
        console.log("[Signup] User created:", data.user.id);

        // Create therapist profile
        const { error: profileError } = await supabase
          .from("therapists")
          .insert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
          });

        if (profileError) {
          console.error("[Signup] Profile creation error:", profileError);
          // Don't throw - user account was created successfully
        } else {
          console.log("[Signup] Profile created successfully");
        }

        setMessage(
          "Account created! Please check your email to verify your account."
        );

        // Auto-login if email confirmation is disabled
        if (data.session) {
          console.log("[Signup] Auto-login successful");
          localStorage.setItem("hs_user_id", data.user.id);
          onLoginSuccess(data.user.id);
        } else {
          console.log("[Signup] Email confirmation required - no session");
        }
      }
    } catch (err: any) {
      console.error("[Signup] Error:", err);
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-25 to-amber-100 flex items-center justify-center p-4">
      {/* Logo/Header */}
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg shadow-md">
          <Music className="h-6 w-6 text-amber-100" />
        </div>
        <span
          onClick={() => onNavigate("/")}
          className="font-bold text-xl text-amber-950 cursor-pointer hover:text-amber-900 transition-colors"
        >
          SongCraft AI
        </span>
      </div>

      <Card className="w-full max-w-md border-2 border-amber-950 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-950 to-amber-900 border-b-2 border-amber-950">
          <CardTitle className="text-2xl text-white">
            {isSignUp ? "Create Therapist Account" : "Therapist Login"}
          </CardTitle>
          <CardDescription className="text-amber-100 mb-4">
            {isSignUp
              ? "Sign up to start creating therapeutic music for your patients"
              : "Sign in to your therapist account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <form
            onSubmit={isSignUp ? handleSignUp : handleLogin}
            className="space-y-5"
          >
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-amber-950 font-bold"
                    >
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="border-2 border-amber-950 rounded-2xl focus:border-amber-900 focus:ring-amber-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-amber-950 font-bold"
                    >
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="border-2 border-amber-950 rounded-2xl focus:border-amber-900 focus:ring-amber-900"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-amber-950 font-bold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-2 border-amber-950 rounded-2xl focus:border-amber-900 focus:ring-amber-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-amber-950 font-bold">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-2 border-amber-950 rounded-2xl focus:border-amber-900 focus:ring-amber-900"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="border-2 rounded-xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="border-2 border-green-500 rounded-xl">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-950 to-amber-900 hover:from-amber-900 hover:to-amber-800 text-white shadow-md hover:shadow-lg transition-all rounded-2xl border-2 border-amber-950 py-6"
              disabled={loading}
            >
              {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
            </Button>

            <div className="text-center text-sm text-amber-900">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-amber-950 font-bold hover:underline"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-amber-950 font-bold hover:underline"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
