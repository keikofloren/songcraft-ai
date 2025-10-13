import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, Loader2, Mic, Image as ImageIcon } from "lucide-react";
import AudioRecorder from "./AudioRecorder";
import DrawingUpload, { type ImageAnalysis } from "./DrawingUpload";
import { generateTrack, uploadAudio, uploadExtend } from "../api/suno.ts";
import { supabase } from "../lib/supabase";

interface LocationState {
  patientId?: string;
  songType: "lyrics" | "instrumental";
  // Lyrics data
  lyricTheme?: string;
  lyricKeywords?: string;
  excludeWords?: string;
  lyricMoods?: string;
  lyricForm?: "Two Part A B" | "Three Part A B A" | null;
  wordsPerPhrase?: number | "";
  vocalGender?: string;
  // Instrumental data
  instForm?: "Two Part A B" | "Three Part A B A" | null;
  instMoods?: string;
}

export default function MotifAndInstrumentation() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [userId, setUserId] = useState<string | null>(null);
  const [ideaUploadUrl, setIdeaUploadUrl] = useState<string | null>(null);
  const [ideaDurationSec, setIdeaDurationSec] = useState<number | null>(null);
  const [isUploadingIdea, setIsUploadingIdea] = useState(false);

  // Drawing analysis state
  const [drawingAnalysis, setDrawingAnalysis] = useState<ImageAnalysis | null>(
    null
  );
  const [inputMethod, setInputMethod] = useState<"audio" | "drawing" | null>(
    null
  );

  const [tempoBpm, setTempoBpm] = useState<number | "">("");
  const [style, setStyle] = useState("");
  const [instrumentation, setInstrumentation] = useState("");
  const [title, setTitle] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get userId from auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  async function computeAudioDuration(blob: Blob): Promise<number> {
    return await new Promise<number>((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio();
      audio.preload = "metadata";
      audio.src = url;
      audio.onloadedmetadata = () => {
        const d = Math.max(1, Math.floor(audio.duration || 0));
        URL.revokeObjectURL(url);
        resolve(d);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load audio metadata"));
      };
    });
  }

  async function handleAudioRecorded(blob: Blob) {
    try {
      setIsUploadingIdea(true);
      const dur = await computeAudioDuration(blob);
      setIdeaDurationSec(dur);
      const { uploadUrl } = await uploadAudio(blob, "idea.webm");
      setIdeaUploadUrl(uploadUrl);
    } catch (e: any) {
      setError(e?.message ?? "Failed to upload audio");
    } finally {
      setIsUploadingIdea(false);
    }
  }

  function handleDrawingAnalyzed(analysis: ImageAnalysis) {
    setDrawingAnalysis(analysis);

    // Auto-fill fields based on analysis
    if (analysis.musicalSuggestions.tempo) {
      setTempoBpm(analysis.musicalSuggestions.tempo);
    }
    if (analysis.musicalSuggestions.style && !style) {
      setStyle(analysis.musicalSuggestions.style);
    }
    if (analysis.musicalSuggestions.instrumentation && !instrumentation) {
      setInstrumentation(analysis.musicalSuggestions.instrumentation);
    }
  }

  function buildPrompt(): string {
    const parts: string[] = [];

    // Add drawing analysis context if available
    if (drawingAnalysis) {
      parts.push(`Based on visual analysis of a patient's drawing:`);
      parts.push(
        `The drawing has a ${drawingAnalysis.trajectory} trajectory (${drawingAnalysis.trajectoryDescription}), with peak ${drawingAnalysis.peakLocation} in the composition.`
      );
      if (drawingAnalysis.musicalSuggestions.structure) {
        parts.push(
          `Song structure: ${drawingAnalysis.musicalSuggestions.structure}.`
        );
      }
      if (drawingAnalysis.musicalSuggestions.dynamics) {
        parts.push(
          `Dynamic progression: ${drawingAnalysis.musicalSuggestions.dynamics}.`
        );
      }
      parts.push(
        `Visual characteristics: ${drawingAnalysis.patterns.join(", ")}.`
      );
      parts.push(
        `Drawing shows ${drawingAnalysis.curvature} curvature with ${drawingAnalysis.complexity} complexity.`
      );
      if (drawingAnalysis.musicalSuggestions.mood) {
        parts.push(
          `Suggested mood: ${drawingAnalysis.musicalSuggestions.mood}.`
        );
      }
    }

    if (state.songType === "lyrics") {
      parts.push("Write a song with lyrics.");
      if (state.lyricTheme) parts.push(`Theme: ${state.lyricTheme}.`);
      if (style) parts.push(`Style: ${style}.`);

      // Keywords to include
      const keywords = state.lyricKeywords
        ? state.lyricKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : [];
      if (keywords.length)
        parts.push(`Include keywords: ${keywords.join(", ")}.`);

      // Words to exclude
      const excludeWords = state.excludeWords
        ? state.excludeWords
            .split(",")
            .map((w) => w.trim())
            .filter(Boolean)
        : [];
      if (excludeWords.length)
        parts.push(`Avoid using: ${excludeWords.join(", ")}.`);

      // Moods
      const moodsArr = state.lyricMoods
        ? state.lyricMoods
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean)
        : [];
      if (moodsArr.length) parts.push(`Mood/emotions: ${moodsArr.join(", ")}.`);

      // Vocal Gender - CRITICAL for correct voice
      if (state.vocalGender) {
        const genderText = state.vocalGender === "Male" ? "male" : "female";
        parts.push(`Use ${genderText} vocals.`);
      }

      // Form
      const formShort =
        state.lyricForm === "Two Part A B"
          ? "AB"
          : state.lyricForm === "Three Part A B A"
          ? "ABA"
          : undefined;
      if (formShort) parts.push(`Use song form ${formShort}.`);

      // Words per phrase
      if (typeof state.wordsPerPhrase === "number")
        parts.push(
          `Constrain lyrics to about ${state.wordsPerPhrase} words per phrase.`
        );

      if (typeof tempoBpm === "number") parts.push(`Tempo: ${tempoBpm} BPM.`);
      parts.push("Ensure clear phrasing suitable for singing.");
    } else {
      // Instrumental
      parts.push("Generate an instrumental track with no vocals.");
      const formShort =
        state.instForm === "Two Part A B"
          ? "AB"
          : state.instForm === "Three Part A B A"
          ? "ABA"
          : undefined;
      if (formShort) parts.push(`Use song form ${formShort}.`);

      const moodsArr = state.instMoods
        ? state.instMoods
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean)
        : [];
      if (moodsArr.length) parts.push(`Mood/emotions: ${moodsArr.join(", ")}.`);

      if (typeof tempoBpm === "number") parts.push(`Tempo: ${tempoBpm} BPM.`);
      if (style) parts.push(`Style: ${style}.`);
      if (instrumentation)
        parts.push(`Primary instrumentation: ${instrumentation}.`);
      parts.push("Make it cohesive and suitable for therapeutic settings.");
    }

    return parts.join(" ");
  }

  async function handleGenerate() {
    // Validation
    if (!style.trim()) {
      setError("Please enter a musical style");
      return;
    }

    if (state.songType === "lyrics" && !state.vocalGender) {
      setError("Vocal gender was not set");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const promptStr = buildPrompt();
      console.log("[MotifAndInstrumentation] 🔍 Built prompt:", promptStr);
      console.log(
        "[MotifAndInstrumentation] 🔍 Vocal gender in state:",
        state.vocalGender
      );
      const formShort =
        state.songType === "lyrics"
          ? state.lyricForm === "Two Part A B"
            ? "AB"
            : state.lyricForm === "Three Part A B A"
            ? "ABA"
            : undefined
          : state.instForm === "Two Part A B"
          ? "AB"
          : state.instForm === "Three Part A B A"
          ? "ABA"
          : undefined;

      let taskId: string | null = null;

      if (ideaUploadUrl) {
        // Use upload-extend if audio was recorded
        console.log("[MotifAndInstrumentation] 🔍 Sending to uploadExtend:", {
          userId,
          patientId: state.patientId,
          title: title || "Untitled",
        });
        console.log("[MotifAndInstrumentation] 🔍 Full state object:", state);
        const data = await uploadExtend({
          uploadUrl: ideaUploadUrl,
          instrumental: state.songType !== "lyrics",
          prompt: promptStr,
          style: style || (state.songType === "lyrics" ? "Pop" : "Ambient"),
          title: title || "Untitled",
          model: "V5",
          continueAt: ideaDurationSec ?? undefined,
          vocalGender:
            state.songType === "lyrics" && state.vocalGender
              ? state.vocalGender === "Male"
                ? "m"
                : "f"
              : undefined,
          userId: userId || undefined,
          patientId: state.patientId || undefined,
        });
        taskId = data?.data?.taskId || data?.taskId || null;
      } else {
        // Generate from scratch
        // Convert moods string to array
        const moodsString =
          state.songType === "lyrics" ? state.lyricMoods : state.instMoods;
        const moodsArray = moodsString
          ? moodsString
              .split(",")
              .map((m) => m.trim())
              .filter(Boolean)
          : undefined;

        console.log("[MotifAndInstrumentation] 🔍 Sending to generateTrack:", {
          userId,
          patientId: state.patientId,
          title: title || "Untitled",
          moods: moodsArray,
        });
        console.log("[MotifAndInstrumentation] 🔍 Full state object:", state);
        const data = await generateTrack({
          prompt: promptStr,
          style: style || (state.songType === "lyrics" ? "Pop" : "Ambient"),
          title: title || "Untitled",
          customMode: false,
          instrumental: state.songType !== "lyrics",
          withLyrics: state.songType === "lyrics",
          vocalGender:
            state.songType === "lyrics" && state.vocalGender
              ? state.vocalGender === "Male"
                ? "m"
                : "f"
              : undefined,
          model: "V5",
          form: formShort,
          moods: moodsArray,
          userId: userId || undefined,
          patientId: state.patientId || undefined,
        });
        taskId =
          data?.data?.taskId || data?.taskId || data?.data?.task_id || null;
      }

      if (taskId) {
        // Navigate to loading/progress page
        navigate("/create-song/loading", {
          state: {
            taskId,
            patientId: state.patientId,
            songTitle: title || "Untitled",
          },
        });
      } else {
        throw new Error("No task ID returned from API");
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate song");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-25 to-amber-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">
              Motif & Instrumentation
            </CardTitle>
            <p className="text-center text-brown-600 mt-2">
              Add a melodic motif and finalize your song details
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Method Selection */}
            {!inputMethod && (
              <div className="space-y-2">
                <Label className="text-lg font-semibold">
                  Choose Input Method (Optional)
                </Label>
                <p className="text-sm text-brown-600 mb-4">
                  Add a personal touch by recording a melody or uploading a
                  drawing. You can also skip this and continue directly.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => setInputMethod("audio")}
                  >
                    <Mic className="h-8 w-8 text-blue-500" />
                    <span>Record Melody</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => setInputMethod("drawing")}
                  >
                    <ImageIcon className="h-8 w-8 text-purple-500" />
                    <span>Upload Drawing</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Audio Recorder for Melodic Motif */}
            {inputMethod === "audio" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">
                    Record Melodic Motif
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInputMethod(null);
                      setIdeaUploadUrl(null);
                    }}
                  >
                    Change Input
                  </Button>
                </div>
                <p className="text-sm text-brown-500 mb-3">
                  Hum or sing a melody that you'd like the song to incorporate
                </p>
                <AudioRecorder onRecorded={handleAudioRecorded} />
                {isUploadingIdea && (
                  <p className="text-sm text-blue-600 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading audio...
                  </p>
                )}
                {ideaUploadUrl && (
                  <p className="text-sm text-green-600">
                    ✓ Audio uploaded ({ideaDurationSec}s)
                  </p>
                )}
              </div>
            )}

            {/* Drawing Upload */}
            {inputMethod === "drawing" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">
                    Upload Drawing or Curve
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInputMethod(null);
                      setDrawingAnalysis(null);
                    }}
                  >
                    Change Input
                  </Button>
                </div>
                <DrawingUpload
                  onImageAnalyzed={handleDrawingAnalyzed}
                  onError={(err) => setError(err)}
                />
                {drawingAnalysis && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-semibold text-green-800 mb-2">
                      ✓ Drawing Analyzed!
                    </p>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>
                        <strong>Trajectory:</strong>{" "}
                        {drawingAnalysis.trajectory} -{" "}
                        {drawingAnalysis.trajectoryDescription}
                      </p>
                      <p>
                        <strong>Peak Location:</strong>{" "}
                        {drawingAnalysis.peakLocation} in the drawing
                      </p>
                      <p>
                        <strong>Curvature:</strong> {drawingAnalysis.curvature}
                      </p>
                      <p>
                        <strong>Complexity:</strong>{" "}
                        {drawingAnalysis.complexity}
                      </p>
                      <p>
                        <strong>Intensity:</strong> {drawingAnalysis.intensity}
                      </p>
                      {drawingAnalysis.musicalSuggestions.structure && (
                        <p className="mt-2 pt-2 border-t border-green-300">
                          <strong>Song Structure:</strong>{" "}
                          {drawingAnalysis.musicalSuggestions.structure}
                        </p>
                      )}
                      {drawingAnalysis.musicalSuggestions.dynamics && (
                        <p>
                          <strong>Dynamics:</strong>{" "}
                          {drawingAnalysis.musicalSuggestions.dynamics}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-green-600">
                        Fields below have been auto-filled based on your
                        drawing. Feel free to adjust them!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Motif Choice (for instrumental) */}
            {/* Removed motif fields for instrumental songs */}

            {/* Tempo */}
            <div className="space-y-2">
              <Label htmlFor="tempo" className="text-lg font-semibold">
                Tempo (BPM) - Optional
              </Label>
              <Input
                id="tempo"
                type="number"
                placeholder="e.g., 120"
                value={tempoBpm}
                onChange={(e) =>
                  setTempoBpm(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
              <p className="text-sm text-brown-500">
                60-80: Slow/Calm | 90-120: Moderate | 130+: Fast/Energetic
              </p>
            </div>

            {/* Style */}
            <div className="space-y-2">
              <Label htmlFor="style" className="text-lg font-semibold">
                Musical Style <span className="text-red-500">*</span>
              </Label>
              <Input
                id="style"
                placeholder="e.g., Pop, Ambient, Classical, Jazz..."
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                required
              />
            </div>

            {/* Instrumentation (for instrumental) */}
            {state.songType === "instrumental" && (
              <div className="space-y-2">
                <Label
                  htmlFor="instrumentation"
                  className="text-lg font-semibold"
                >
                  Instrumentation
                </Label>
                <Input
                  id="instrumentation"
                  placeholder="e.g., Piano, Strings, Guitar..."
                  value={instrumentation}
                  onChange={(e) => setInstrumentation(e.target.value)}
                />
              </div>
            )}

            {/* Song Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-lg font-semibold">
                Song Title (Optional)
              </Label>
              <Input
                id="title"
                placeholder="Give your song a name..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}

            <div className="pt-6">
              <Button
                onClick={handleGenerate}
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Song...
                  </>
                ) : (
                  "Generate Song"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
