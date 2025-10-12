import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Music, ArrowLeft } from "lucide-react";

interface AuthPagesProps {
  page: "signin" | "signup";
  onNavigate: (page: string) => void;
  onAuth: (userType: "therapist" | "student") => void;
}

export function AuthPages({ page, onNavigate, onAuth }: AuthPagesProps) {
  const [userType, setUserType] = useState<"therapist" | "student">("student");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    organization: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication
    onAuth(userType);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-25 to-amber-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-amber-200/40"></div>

      {/* Header */}
      <header className="border-b border-amber-200/50 bg-white/80 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-3 text-amber-700 hover:text-amber-800 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <div className="p-1.5 bg-gradient-to-br from-blue-300 to-blue-400 rounded-lg shadow-md">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent">
              SongCraft AI
            </span>
          </button>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 relative z-10">
        <Card className="w-full max-w-md shadow-2xl border-amber-200/50 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg w-fit">
              <Music className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-amber-900">
              {page === "signin" ? "Welcome Back" : "Join SongCraft AI"}
            </CardTitle>
            <CardDescription className="text-amber-600">
              {page === "signin"
                ? "Sign in to continue your musical journey"
                : "Create your account to start making music"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {page === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="userType">I am a...</Label>
                    <Select
                      value={userType}
                      onValueChange={(value: "therapist" | "student") =>
                        setUserType(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="therapist">Therapist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  {userType === "therapist" && (
                    <div className="space-y-2">
                      <Label htmlFor="organization">
                        Organization/Practice
                      </Label>
                      <Input
                        id="organization"
                        type="text"
                        value={formData.organization}
                        onChange={(e) =>
                          handleInputChange("organization", e.target.value)
                        }
                        placeholder="Your practice or organization name"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  required
                />
              </div>

              {page === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg"
                size="lg"
              >
                {page === "signin" ? "Sign In" : "Create Account"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() =>
                    onNavigate(page === "signin" ? "signup" : "signin")
                  }
                  className="text-sm text-amber-600 hover:text-amber-800 hover:underline transition-colors"
                >
                  {page === "signin"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
