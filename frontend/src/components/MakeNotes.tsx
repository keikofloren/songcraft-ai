import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { ArrowLeft, Save, Play, Pause, Volume2, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import WaveSurfer from "wavesurfer.js";

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
  stream_audio_url?: string;
};

interface LocationState {
  audioUrl?: string;
  selectedIndex?: number;
}

export default function MakeNotes() {
  const navigate = useNavigate();
  const { patientId, songId } = useParams<{
    patientId: string;
    songId: string;
  }>();
  const location = useLocation();
  const state = location.state as LocationState;

  const [song, setSong] = useState<Song | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Waveform state
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSong = async () => {
      if (!songId) return;

      try {
        const { data, error } = await supabase
          .from("songs")
          .select("*")
          .eq("id", songId)
          .single();

        if (error) {
          console.error("Error fetching song:", error);
        } else {
          setSong(data);
          setNotes(data.notes || "");

          const candidateFromState = state?.audioUrl;
          const candidateFromDb = data.audio_url as string | undefined;
          const candidateStream = (data as any).stream_audio_url as string | undefined;

          const isRemoveAI = (u?: string) => !!u && u.includes("musicfile.removeai.ai");

          let rawUrl =
            candidateFromState ||
            (candidateFromDb && !isRemoveAI(candidateFromDb) ? candidateFromDb : undefined) ||
            (candidateStream && !isRemoveAI(candidateStream) ? candidateStream : undefined);

          // If still nothing playable, don't load WaveSurfer
          if (!rawUrl) {
            console.warn("[MakeNotes] No playable audio URL found (removeai is not supported for playback).");
            setAudioUrl(null);
            return;
          }

          console.log("[MakeNotes] picked rawUrl:", rawUrl);
          const proxiedUrl = `/api/proxy-audio?url=${encodeURIComponent(rawUrl)}`;
          setAudioUrl(proxiedUrl);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [songId, state?.audioUrl]);

  // Initialize WaveSurfer when audioUrl is available
  useEffect(() => {
    if (!audioUrl || !waveformRef.current) return;

    console.log("[MakeNotes] Loading audio URL:", audioUrl);

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      // Force WebAudio backend to avoid MediaElement Range quirks
      backend: "WebAudio",
      waveColor: "#93c5fd",
      progressColor: "#3b82f6",
      cursorColor: "#1e40af",
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 100,
      barGap: 2,
    });

    wavesurfer.on("ready", () => {
      const dur = wavesurfer.getDuration();
      setDuration(formatTime(Math.floor(dur)));
      console.log("[MakeNotes] Audio loaded successfully");
    });

    wavesurfer.on("play", () => setPlaying(true));
    wavesurfer.on("pause", () => setPlaying(false));

    wavesurfer.on("audioprocess", () => {
      const time = wavesurfer.getCurrentTime();
      setCurrentTime(formatTime(Math.floor(time)));
    });

    wavesurfer.on("finish", () => setPlaying(false));

    wavesurfer.on("error", (err) => {
      console.error("[MakeNotes] WaveSurfer error:", err);
    });

    let cancelled = false;

    (async () => {
      try {
        // Fetch the proxied audio and load as Blob
        const resp = await fetch(audioUrl, {
          // Optional: force fresh
          cache: "no-store",
        });

        if (!resp.ok) {
          throw new Error(`Audio fetch failed: ${resp.status}`);
        }

        const blob = await resp.blob();
        if (cancelled) return;

        // Prefer loadBlob when available (WaveSurfer v7)
        const anyWs = wavesurfer as any;
        if (typeof anyWs.loadBlob === "function") {
          anyWs.loadBlob(blob);
        } else {
          // Fallback: create an object URL and load it
          const objUrl = URL.createObjectURL(blob);
          anyWs.load(objUrl);
        }
      } catch (e) {
        console.error("[MakeNotes] Failed to load audio:", e);
      }
    })();

    wavesurferRef.current = wavesurfer;

    return () => {
      cancelled = true;
      wavesurfer.destroy();
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlay = () => {
    wavesurferRef.current?.play();
  };

  const handlePause = () => {
    wavesurferRef.current?.pause();
  };

  const handleVolumeChange = (value: number) => {
    wavesurferRef.current?.setVolume(value);
    setVolume(value);
  };

  const handleSaveNotes = async () => {
    if (!songId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("songs")
        .update({ notes })
        .eq("id", songId);

      if (error) {
        console.error("Error saving notes:", error);
        alert("Failed to save notes. Please try again.");
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save notes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-25 to-amber-100 flex items-center justify-center">
        <p className="text-brown-600">Loading...</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-25 to-amber-100 flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <p className="text-brown-600 mb-4">Song not found</p>
            <Button onClick={() => navigate("/therapist/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-25 to-amber-100">
      {/* Header */}
      <header className="border-b border-brown-200 bg-white/80 backdrop-blur-sm">
        <div className="px-8 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(`/patient/${patientId}/songs`)}
            className="text-brown-700 hover:text-brown-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patient Songs
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Song Info Card */}
          <Card className="border-[3px] border-amber-950 hover:border-amber-900 bg-white rounded-3xl overflow-hidden shadow-xl">
            <CardHeader className="bg-gradient-to-r from-amber-950 to-amber-900 border-b-4 border-amber-950">
              <CardTitle className="text-2xl text-white">
                {song.title}
              </CardTitle>
              <p className="mb-4 text-sm text-amber-100">
                Created on {new Date(song.created_at).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
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
                </div>
                <div>
                  {song.tempo_bpm && (
                    <p className="text-brown-600">
                      <strong>Tempo:</strong> {song.tempo_bpm} BPM
                    </p>
                  )}
                  {song.form && (
                    <p className="text-brown-600">
                      <strong>Form:</strong> {song.form}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audio Player Card */}
          {audioUrl && (
            <Card className="border-[3px] border-amber-950 hover:border-amber-900 bg-white rounded-3xl overflow-hidden shadow-xl">
              <CardHeader className="bg-gradient-to-r from-amber-950 mb-4 to-amber-900 border-b-4 border-amber-950">
                <CardTitle className="text-xl text-white">
                  Audio Player
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-brown-600 mb-2">
                  <span>Playback</span>
                  <span>
                    {currentTime} / {duration}
                  </span>
                </div>

                {/* Waveform */}
                <div ref={waveformRef} className="w-full" />

                {/* Playback Controls */}
                <div className="flex gap-2 items-center">
                  {playing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePause}
                      className="w-24"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePlay}
                      className="w-24"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Play
                    </Button>
                  )}

                  {/* Volume Control */}
                  <div className="flex items-center gap-2 flex-1">
                    <Volume2 className="h-4 w-4 text-brown-600" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) =>
                        handleVolumeChange(parseFloat(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="text-xs text-brown-600 w-10">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Card */}
          <Card className="border-[3px] border-amber-950 hover:border-amber-900 bg-white rounded-3xl overflow-hidden shadow-xl">
            <CardHeader className="bg-gradient-to-r from-amber-950 to-amber-900 border-b-4 border-amber-950">
              <CardTitle className="text-xl text-white">
                Session Notes
              </CardTitle>
              <p className="mb-4 text-sm text-amber-100">
                Add notes about this song and the patient's session
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={8}
                  placeholder="Enter your notes about this song and patient session..."
                  className="resize-none border-4 border-amber-950 rounded-2xl focus:border-amber-900 focus:ring-amber-900"
                />
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-amber-950 to-amber-900 hover:from-amber-900 hover:to-amber-800 text-white shadow-md hover:shadow-lg transition-all rounded-2xl border-2 border-amber-950 py-6"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Notes
                    </>
                  )}
                </Button>

                {saveSuccess && (
                  <p className="text-sm text-green-600">
                    ✓ Notes saved successfully!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
