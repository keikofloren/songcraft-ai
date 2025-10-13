import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Music, LogOut, User } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import PatientForm from "./PatientForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type Patient = {
  id: number;
  therapist_id: number;
  first_name: string;
  last_name: string;
  notes: string;
  created_at?: string;
  last_song_date?: string | null;
};

type Song = {
  id: number;
  user_id: string; // Supabase auth UUID
  patient_id?: number | null;
  title: string;
  with_lyrics: boolean;
  form: "ABA" | "AB" | null;
  moods: string[];
  style: string;
  tempo_bpm: number | null;
  prompt: string;
  notes: string;
  vocal_gender: "m" | "f" | null;
  origin: string;
  created_at: string;
  audio_url?: string;
  task_id?: string;
  patient_name?: string; // To store the patient name
};

interface TherapistDashboardProps {
  onLogout: () => void;
  userId: string;
}

export default function TherapistDashboard({
  onLogout,
  userId,
}: TherapistDashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [therapistName, setTherapistName] = useState("");
  const [patientFilter, setPatientFilter] = useState<
    "recent" | "oldest" | "alphabetical"
  >("recent");

  const [recentSongs, setRecentSongs] = useState<Song[]>([]);

  useEffect(() => {
    const fetchPatients = async () => {
      // Fetch patients with their most recent song date
      const { data: patientsData, error } = await supabase
        .from("patients")
        .select("*")
        .eq("therapist_id", userId);

      if (error) {
        console.error("Error fetching patients:", error);
      } else {
        // For each patient, get their most recent song date
        const patientsWithLastSong = await Promise.all(
          patientsData.map(async (patient) => {
            const { data: songs } = await supabase
              .from("songs")
              .select("created_at")
              .eq("patient_id", patient.id)
              .order("created_at", { ascending: false })
              .limit(1);

            return {
              ...patient,
              last_song_date:
                songs && songs.length > 0 ? songs[0].created_at : null,
            };
          })
        );
        setPatients(patientsWithLastSong);
      }
    };
    fetchPatients();
  }, [showPatientForm, userId]);

  useEffect(() => {
    const fetchName = async () => {
      const { data, error } = await supabase
        .from("therapists")
        .select("*")
        .eq("id", userId);
      if (error) {
        console.error("Error fetching therapist name:", error);
      } else {
        setTherapistName(data[0].first_name + " " + data[0].last_name);
      }
    };
    fetchName();
  });

  useEffect(() => {
    const fetchRecentSongs = async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching recent songs:", error);
      } else {
        // Fetch patient names for each song
        const songsWithPatientNames = await Promise.all(
          data.map(async (song) => {
            if (song.patient_id) {
              const { data: patientData } = await supabase
                .from("patients")
                .select("first_name, last_name")
                .eq("id", song.patient_id)
                .single();

              return {
                ...song,
                patient_name: patientData
                  ? `${patientData.first_name} ${patientData.last_name}`
                  : undefined,
              };
            }
            return song;
          })
        );
        setRecentSongs(songsWithPatientNames);
      }
    };
    fetchRecentSongs();
  }, [userId, location.key]); // Triggers on navigation back

  // Sort patients based on filter
  const sortedPatients = useMemo(() => {
    const patientsCopy = [...patients];
    switch (patientFilter) {
      case "recent":
        // Sort by most recent song generated for them
        return patientsCopy.sort((a, b) => {
          const dateA = a.last_song_date
            ? new Date(a.last_song_date).getTime()
            : 0;
          const dateB = b.last_song_date
            ? new Date(b.last_song_date).getTime()
            : 0;
          return dateB - dateA; // Most recent song first
        });
      case "oldest":
        // Sort by oldest song generated for them
        return patientsCopy.sort((a, b) => {
          const dateA = a.last_song_date
            ? new Date(a.last_song_date).getTime()
            : 0;
          const dateB = b.last_song_date
            ? new Date(b.last_song_date).getTime()
            : 0;
          return dateA - dateB; // Oldest song first
        });
      case "alphabetical":
        return patientsCopy.sort((a, b) => {
          const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
          const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      default:
        return patientsCopy;
    }
  }, [patients, patientFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-25 to-amber-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-brown-200 bg-white/80 backdrop-blur-sm">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg shadow-md">
              <Music className="h-6 w-6 text-amber-100" />
            </div>
            <div>
              <h1
                onClick={() => navigate("/")}
                className="font-bold text-xl text-amber-950 cursor-pointer hover:text-amber-900 transition-colors"
              >
                SongCraft AI
              </h1>
              <p className="text-xs text-brown-600">Therapist Dashboard</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onLogout}
            className="text-brown-700 hover:text-brown-900"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Recent Songs */}
        <aside className="w-80 bg-white/80 backdrop-blur-sm border-r border-brown-200 flex-shrink-0">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-brown-900 mb-4 flex items-center gap-2">
              <Music className="h-5 w-5" />
              Recent Songs
            </h3>
            {recentSongs.length > 0 ? (
              <div className="space-y-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-950 scrollbar-track-amber-100 max-h-[calc(100vh-12rem)]">
                {recentSongs.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => {
                      // Navigate directly to the notes page for this song
                      if (song.patient_id) {
                        navigate(
                          `/patient/${song.patient_id}/song/${song.id}/notes`,
                          {
                            state: {
                              audioUrl: song.audio_url,
                            },
                          }
                        );
                      }
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-amber-50 border border-brown-100 hover:border-amber-300 transition-all"
                  >
                    {song.patient_name && (
                      <p className="font-bold text-brown-900 text-sm mb-1">
                        {song.patient_name}
                      </p>
                    )}
                    <p className="font-medium text-brown-900 text-sm truncate">
                      {song.title}
                    </p>
                    <p className="text-xs text-brown-600 mt-1">
                      {song.style || "No style"}
                    </p>
                    <p className="text-xs text-brown-500 mt-1">
                      {new Date(song.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-brown-500">
                <Music className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No songs yet</p>
                <p className="text-xs mt-1">
                  Songs you create will appear here
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-brown-900 mb-2">
                Welcome Back, {therapistName}!
              </h2>
              <p className="text-brown-600">
                Select a patient to create therapeutic songs
              </p>
            </div>

            {/* Patient Management - Enhanced Design */}
            <Card className="hover:shadow-2xl transition-all duration-300 border-[3px] border-amber-950 hover:border-amber-900 bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-950 to-amber-900 border-b-4 border-amber-950">
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg shadow-md">
                    <User className="h-5 w-5 text-amber-100" />
                  </div>
                  <span className="text-xl">Patient Management</span>
                </CardTitle>
                <p className="text-sm text-amber-100 mt-2 mb-5">
                  Manage your patients and view their therapeutic music journey
                </p>
              </CardHeader>
              {patients.length === 0 ? (
                <CardContent className="py-8">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-950/10 mb-4 border-4 border-amber-950">
                      <User className="h-8 w-8 text-amber-950" />
                    </div>
                    <p className="text-brown-900 mb-6 font-semibold">
                      No patients yet. Add your first patient to get started!
                    </p>
                    <Button
                      className="bg-gradient-to-r mb-3 from-amber-950 to-amber-900 hover:from-amber-900 hover:to-amber-800 text-white shadow-lg hover:shadow-xl transition-all px-8 py-3 text-base rounded-2xl border-2 border-amber-950"
                      onClick={() => setShowPatientForm(true)}
                    >
                      + Add Your First Patient
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <>
                  <CardContent className="pt-6">
                    <Button
                      className="w-full py-5 bg-gradient-to-r from-amber-950 to-amber-900 hover:from-amber-900 hover:to-amber-800 text-white shadow-md hover:shadow-lg transition-all mb-5 rounded-2xl border-2 border-amber-950"
                      onClick={() => setShowPatientForm(true)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Add New Patient
                    </Button>
                    <div className="py-5 mb-5">
                      <label className="text-sm font-bold text-amber-950 mb-2 block">
                        Sort Patients
                      </label>
                      <Select
                        value={patientFilter}
                        onValueChange={(value) =>
                          setPatientFilter(
                            value as "recent" | "oldest" | "alphabetical"
                          )
                        }
                      >
                        <SelectTrigger className="w-full border-2 border-amber-950 hover:border-amber-900 focus:border-amber-900 rounded-2xl">
                          <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">
                            📅 Most Recent Activity
                          </SelectItem>
                          <SelectItem value="oldest">
                            ⏰ Least Recent Activity
                          </SelectItem>
                          <SelectItem value="alphabetical">
                            🔤 Alphabetical Order
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <div className="max-h-[300px] overflow-y-auto px-6 pb-6">
                    <div className="space-y-3">
                      {sortedPatients.map((patient) => (
                        <button
                          key={patient.id}
                          style={{
                            borderWidth: 3,
                          }}
                          className="w-full text-left p-4 rounded-2xl border-amber-950 hover:border-amber-900 bg-white hover:bg-gradient-to-r hover:from-amber-100 hover:to-amber-50 transition-all duration-200 shadow-sm hover:shadow-lg group"
                          onClick={() =>
                            navigate(`/patient/${patient.id}/songs`)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-amber-950 to-amber-900 rounded-xl group-hover:from-amber-900 group-hover:to-amber-800 transition-all">
                              <User className="h-4 w-4 text-amber-100" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-amber-950 group-hover:text-amber-900">
                                {patient.first_name} {patient.last_name}
                              </p>
                              {patient.last_song_date && (
                                <p className="text-xs text-amber-900 mt-0.5">
                                  Last activity:{" "}
                                  {new Date(
                                    patient.last_song_date
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="text-amber-950 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              →
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </Card>

            {showPatientForm && (
              <PatientForm
                onClose={() => setShowPatientForm(false)}
                userId={userId}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
