import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { HomePage } from "./components/HomePage.tsx";
import TherapistDashboard from "./components/TherapistDashboard.tsx";
import TherapistLogin from "./components/TherapistLogin.tsx";
import CreateSongChoice from "./components/CreateSongChoice.tsx";
import GenerateLyrics from "./components/GenerateLyrics.tsx";
import GenerateNoLyrics from "./components/GenerateNoLyrics.tsx";
import MotifAndInstrumentation from "./components/MotifAndInstrumentation.tsx";
import LoadingSong from "./components/LoadingSong.tsx";
import PatientSongs from "./components/PatientSongs.tsx";
import MakeNotes from "./components/MakeNotes.tsx";
import { supabase } from "./lib/supabase";

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("hs_user_id");
    setUserId(null);
    navigate("/");
  };

  const handleLoginSuccess = (newUserId: string) => {
    setUserId(newUserId);
    navigate("/therapist/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Protected Route wrapper component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return userId ? (
      <>{children}</>
    ) : (
      <Navigate to="/therapist/login" replace />
    );
  };

  return (
    <Routes>
      {/* Home */}
      <Route
        path="/"
        element={
          <HomePage
            onNavigate={(page: string) => {
              window.location.href = page;
            }}
          />
        }
      />

      {/* Therapist Login */}
      <Route
        path="/therapist/login"
        element={
          userId ? (
            <Navigate to="/therapist/dashboard" replace />
          ) : (
            <TherapistLogin 
              onLoginSuccess={handleLoginSuccess}
              onNavigate={(path) => navigate(path)}
            />
          )
        }
      />

      {/* Therapist Dashboard - Protected Route */}
      <Route
        path="/therapist/dashboard"
        element={
          <ProtectedRoute>
            <TherapistDashboard onLogout={handleLogout} userId={userId!} />
          </ProtectedRoute>
        }
      />

      {/* Create Song Flow - All Protected */}
      <Route
        path="/create-song/choice"
        element={
          <ProtectedRoute>
            <CreateSongChoice />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-song/lyrics"
        element={
          <ProtectedRoute>
            <GenerateLyrics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-song/instrumental"
        element={
          <ProtectedRoute>
            <GenerateNoLyrics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-song/motif-instrumentation"
        element={
          <ProtectedRoute>
            <MotifAndInstrumentation />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-song/loading"
        element={
          <ProtectedRoute>
            <LoadingSong />
          </ProtectedRoute>
        }
      />

      {/* Patient Songs - Protected */}
      <Route
        path="/patient/:patientId/songs"
        element={
          <ProtectedRoute>
            <PatientSongs />
          </ProtectedRoute>
        }
      />

      {/* Make Notes - Protected */}
      <Route
        path="/patient/:patientId/song/:songId/notes"
        element={
          <ProtectedRoute>
            <MakeNotes />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route → Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
