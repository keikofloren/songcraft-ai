import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Music, ArrowLeft, Edit, Pencil, Check, X, User } from "lucide-react";
import { Input } from "./ui/input";
import { supabase } from "../lib/supabase";

type Song = {
  id: number;
  user_id: string;
  patient_id: number;
  title: string;
  with_lyrics: boolean;
  form: "AB" | "ABA" | null;
  moods: string[];
  style: string;
  tempo_bpm: number | null;
  prompt: string;
  notes: string;
  vocal_gender: "m" | "f" | null;
  origin: string;
  created_at: string;
  audio_url?: string;
};

type Patient = {
  id: number;
  first_name: string;
  last_name: string;
  notes: string;
};

export default function PatientSongs() {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSongId, setEditingSongId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    const fetchPatientAndSongs = async () => {
      if (!patientId) return;

      try {
        // Fetch patient details
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("*")
          .eq("id", patientId)
          .single();

        if (patientError) {
          console.error("Error fetching patient:", patientError);
        } else {
          setPatient(patientData);
        }

        // Fetch songs for this patient
        const { data: songsData, error: songsError } = await supabase
          .from("songs")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false });

        if (songsError) {
          console.error("Error fetching songs:", songsError);
        } else {
          setSongs(songsData || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientAndSongs();
  }, [patientId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSaveTitle = async (songId: number) => {
    if (!editingTitle.trim()) {
      alert("Title cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("songs")
        .update({ title: editingTitle })
        .eq("id", songId);

      if (error) {
        console.error("Error updating title:", error);
        alert("Failed to update title");
      } else {
        // Update local state
        setSongs(
          songs.map((s) =>
            s.id === songId ? { ...s, title: editingTitle } : s
          )
        );
        setEditingSongId(null);
        setEditingTitle("");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update title");
    }
  };

  const handleCancelEdit = () => {
    setEditingSongId(null);
    setEditingTitle("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-25 to-amber-100 flex items-center justify-center">
        <p className="text-brown-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-25 to-amber-100">
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
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/therapist/dashboard")}
            className="text-brown-700 hover:text-brown-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Patient Info */}
          {patient && (
            <Card className="mb-16 border-[3px] border-amber-950 hover:border-amber-900 bg-white rounded-3xl overflow-hidden shadow-xl">
              <CardHeader className="bg-gradient-to-r from-amber-950 to-amber-900 border-b-4 border-amber-950">
                <div className="flex items-center gap-3">
                  <div className="p-2 mb-4 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg shadow-md">
                    <User className="h-5 w-5 text-amber-100" />
                  </div>
                  <CardTitle className="mb-4 text-xl text-white">
                    Patient Information
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-amber-950 font-semibold text-lg">
                  <strong>Name:</strong> {patient.first_name}{" "}
                  {patient.last_name}
                </p>
                {patient.notes && (
                  <p className="text-amber-900 mt-3 p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                    <strong className="text-amber-950">Notes:</strong>{" "}
                    {patient.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Songs List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-brown-900">
                Songs ({songs.length})
              </h2>
              <Button
                onClick={() =>
                  navigate("/create-song/choice", {
                    state: {
                      patientId,
                      patientName: patient
                        ? `${patient.first_name} ${patient.last_name}`
                        : undefined,
                    },
                  })
                }
                className="bg-gradient-to-r from-amber-950 to-amber-900 hover:from-amber-900 hover:to-amber-800 text-white shadow-md hover:shadow-lg transition-all rounded-2xl border-2 border-amber-950"
              >
                <Music className="mr-2 h-4 w-4" />
                Create New Song
              </Button>
            </div>

            {songs.length === 0 ? (
              <Card className="border-[6px] border-amber-950 bg-white rounded-3xl overflow-hidden shadow-xl">
                <CardContent className="py-12">
                  <div className="text-center text-amber-950">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-950/10 mb-4 border-4 border-amber-950">
                      <Music className="h-8 w-8 text-amber-950" />
                    </div>
                    <p className="text-lg mb-2 font-bold">No songs yet</p>
                    <p className="text-sm text-amber-900">
                      Songs created for this patient will appear here
                    </p>
                    <Button
                      onClick={() =>
                        navigate("/create-song/choice", {
                          state: { patientId },
                        })
                      }
                      className="mt-4 bg-gradient-to-r from-amber-950 to-amber-900 hover:from-amber-900 hover:to-amber-800 text-white shadow-md hover:shadow-lg transition-all rounded-2xl border-2 border-amber-950"
                    >
                      Create First Song
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              songs.map((song) => (
                <Card
                  key={song.id}
                  className="hover:shadow-xl transition-all duration-200 border-4 border-amber-950 hover:border-amber-900 bg-white rounded-2xl"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {editingSongId === song.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="text-xl font-semibold"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveTitle(song.id);
                                } else if (e.key === "Escape") {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveTitle(song.id)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">
                              {song.title || "Untitled"}
                            </CardTitle>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingSongId(song.id);
                                setEditingTitle(song.title || "Untitled");
                              }}
                            >
                              <Pencil className="h-4 w-4 text-brown-600" />
                            </Button>
                          </div>
                        )}
                        <p className="text-sm text-brown-500 mt-1">
                          Created on {formatDate(song.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/patient/${patientId}/song/${song.id}/notes`
                          )
                        }
                        className="border-2 border-amber-950 hover:border-amber-900 rounded-xl hover:bg-amber-100"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Notes
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-brown-600">
                          <strong>Type:</strong>{" "}
                          {song.with_lyrics ? "With Lyrics" : "Instrumental"}
                        </p>
                        {song.style && (
                          <p className="text-brown-600">
                            <strong>Style:</strong> {song.style}
                          </p>
                        )}
                        {song.form && (
                          <p className="text-brown-600">
                            <strong>Form:</strong> {song.form}
                          </p>
                        )}
                      </div>
                      <div>
                        {song.tempo_bpm && (
                          <p className="text-brown-600">
                            <strong>Tempo:</strong> {song.tempo_bpm} BPM
                          </p>
                        )}
                        {song.moods && song.moods.length > 0 && (
                          <p className="text-brown-600">
                            <strong>Moods:</strong> {song.moods.join(", ")}
                          </p>
                        )}
                        {song.vocal_gender && (
                          <p className="text-brown-600">
                            <strong>Vocal:</strong>{" "}
                            {song.vocal_gender === "m" ? "Male" : "Female"}
                          </p>
                        )}
                      </div>
                    </div>
                    {song.prompt && (
                      <div className="pt-2 border-t border-brown-100">
                        <p className="text-sm text-brown-700">
                          <strong>Prompt:</strong> {song.prompt}
                        </p>
                      </div>
                    )}
                    {song.notes && (
                      <div className="pt-2 border-t border-brown-100">
                        <p className="text-sm text-brown-700">
                          <strong>Notes:</strong> {song.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
