import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  Music,
  CheckCircle,
  Loader2,
  Play,
  Pause,
  Volume2,
  Scissors,
} from "lucide-react";
import { getResult } from "../api/suno.ts";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";
import { supabase } from "../lib/supabase";

interface LocationState {
  taskId: string;
  patientId?: string;
  songTitle: string;
}

export default function LoadingSong() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"generating" | "completed" | "error">(
    "generating"
  );
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // WaveSurfer refs
  const waveformRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wavesurferInstances = useRef<(WaveSurfer | null)[]>([]);
  const regionsPlugins = useRef<any[]>([]);

  // Player state for each track
  const [playingStates, setPlayingStates] = useState<boolean[]>([]);
  const [volumes, setVolumes] = useState<number[]>([1.0, 1.0]);
  const [currentTimes, setCurrentTimes] = useState<string[]>(["0:00", "0:00"]);
  const [durations, setDurations] = useState<string[]>(["0:00", "0:00"]);
  const [cropRegions, setCropRegions] = useState<
    { start: number; end: number }[]
  >([]);
  const [waveformsReady, setWaveformsReady] = useState<boolean[]>([]);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | null>(
    null
  );

  // Estimate: Songs typically take 30-40 seconds
  const ESTIMATED_DURATION = 35; // seconds
  const POLL_INTERVAL = 2000; // 2 seconds

  useEffect(() => {
    if (!state?.taskId) {
      navigate("/therapist/dashboard");
      return;
    }

    // Timer for elapsed time
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    // Progress simulation (reaches ~90% at estimated time)
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const increment = (90 / ESTIMATED_DURATION) * (POLL_INTERVAL / 1000);
        return Math.min(prev + increment, 90);
      });
    }, POLL_INTERVAL);

    // Poll for result
    let cancelled = false;
    const pollInterval = setInterval(async () => {
      try {
        const res = await getResult(state.taskId);
        if (cancelled) return;

        // Extract audio URLs
        const items = res?.data?.data ?? res?.data ?? [];
        const urls: string[] = [];
        if (Array.isArray(items)) {
          for (const item of items) {
            if (typeof item?.audio_url === "string") urls.push(item.audio_url);
            if (typeof item?.stream_audio_url === "string")
              urls.push(item.stream_audio_url);
          }
        }

        if (urls.length > 0) {
          // Filter to only 2nd and 4th URLs (indices 1 and 3)
          const filteredUrls = [urls[1], urls[3]].filter(Boolean);
          setAudioUrls(filteredUrls);
          setProgress(100);
          setStatus("completed");
          clearInterval(pollInterval);
          clearInterval(progressTimer);
          clearInterval(timer);
        }
      } catch (error: any) {
        if (cancelled) return;

        // 404 means song is still generating - keep polling
        if (
          error.message?.includes("404") ||
          error.message?.includes("Result not found")
        ) {
          console.log(`[LoadingSong] Polling... (${elapsedTime}s elapsed)`);
          return; // Keep polling
        }

        // Only stop on real errors (not 404)
        console.error("[LoadingSong] Fatal error:", error);
        setErrorMessage(error.message || "Failed to fetch song");
        setStatus("error");
        clearInterval(pollInterval);
        clearInterval(progressTimer);
        clearInterval(timer);
      }
    }, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      clearInterval(progressTimer);
      clearInterval(timer);
    };
  }, [state?.taskId, navigate]);

  // Initialize WaveSurfer when audioUrls are available
  useEffect(() => {
    if (audioUrls.length === 0) return;

    // Cleanup previous instances
    wavesurferInstances.current.forEach((ws) => ws?.destroy());
    wavesurferInstances.current = [];
    regionsPlugins.current = [];

    // Initialize states
    setPlayingStates(new Array(audioUrls.length).fill(false));
    setVolumes(new Array(audioUrls.length).fill(1.0));
    setWaveformsReady(new Array(audioUrls.length).fill(false));

    // Create WaveSurfer instances for each URL
    audioUrls.forEach((url, idx) => {
      const container = waveformRefs.current[idx];
      if (!container) return;

      // Create regions plugin for cropping
      const regions = RegionsPlugin.create();
      regionsPlugins.current[idx] = regions;

      const wavesurfer = WaveSurfer.create({
        container,
        waveColor: "#93c5fd",
        progressColor: "#3b82f6",
        cursorColor: "#1e40af",
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 2,
        height: 80,
        barGap: 2,
        plugins: [regions],
      });

      // Event listeners
      wavesurfer.on("ready", () => {
        const duration = wavesurfer.getDuration();
        setDurations((prev) => {
          const newDurations = [...prev];
          newDurations[idx] = formatTime(Math.floor(duration));
          return newDurations;
        });
        setWaveformsReady((prev) => {
          const newReady = [...prev];
          newReady[idx] = true;
          return newReady;
        });
      });

      wavesurfer.on("play", () => {
        setPlayingStates((prev) => {
          const newStates = [...prev];
          newStates[idx] = true;
          return newStates;
        });
      });

      wavesurfer.on("pause", () => {
        setPlayingStates((prev) => {
          const newStates = [...prev];
          newStates[idx] = false;
          return newStates;
        });
      });

      wavesurfer.on("audioprocess", () => {
        const currentTime = wavesurfer.getCurrentTime();
        setCurrentTimes((prev) => {
          const newTimes = [...prev];
          newTimes[idx] = formatTime(Math.floor(currentTime));
          return newTimes;
        });
      });

      wavesurfer.on("finish", () => {
        setPlayingStates((prev) => {
          const newStates = [...prev];
          newStates[idx] = false;
          return newStates;
        });
      });

      wavesurfer.load(url);
      wavesurferInstances.current[idx] = wavesurfer;
    });

    return () => {
      wavesurferInstances.current.forEach((ws) => ws?.destroy());
    };
  }, [audioUrls]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlay = (idx: number) => {
    const ws = wavesurferInstances.current[idx];
    if (ws) ws.play();
  };

  const handlePause = (idx: number) => {
    const ws = wavesurferInstances.current[idx];
    if (ws) ws.pause();
  };

  const handleVolumeChange = (idx: number, value: number) => {
    const ws = wavesurferInstances.current[idx];
    if (ws) {
      ws.setVolume(value);
      setVolumes((prev) => {
        const newVolumes = [...prev];
        newVolumes[idx] = value;
        return newVolumes;
      });
    }
  };

  const handleAddCropRegion = (idx: number) => {
    const ws = wavesurferInstances.current[idx];
    const regions = regionsPlugins.current[idx];
    if (!ws || !regions) return;

    const duration = ws.getDuration();
    // Clear existing regions
    regions.clearRegions();

    // Add a new region (middle 50% of the track by default)
    const region = regions.addRegion({
      start: duration * 0.25,
      end: duration * 0.75,
      color: "rgba(255, 165, 0, 0.3)", // Orange with transparency
      drag: true,
      resize: true,
    });

    setCropRegions((prev) => {
      const newRegions = [...prev];
      newRegions[idx] = { start: region.start, end: region.end };
      return newRegions;
    });

    // Update crop region on change
    region.on("update", () => {
      setCropRegions((prev) => {
        const newRegions = [...prev];
        newRegions[idx] = { start: region.start, end: region.end };
        return newRegions;
      });
    });
  };

  const handleClearCropRegion = (idx: number) => {
    const regions = regionsPlugins.current[idx];
    if (regions) {
      regions.clearRegions();
      setCropRegions((prev) => {
        const newRegions = [...prev];
        newRegions[idx] = { start: 0, end: 0 };
        return newRegions;
      });
    }
  };

  const handleDownload = async (url: string, idx: number) => {
    try {
      // Fetch the audio file
      const response = await fetch(url);
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${state?.songTitle || "song"}_v${idx + 1}.mp3`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-25 to-amber-100 flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            {status === "generating" && (
              <div className="p-4 bg-gradient-to-br from-blue-300 to-blue-400 rounded-full animate-pulse">
                <Music className="h-12 w-12 text-white" />
              </div>
            )}
            {status === "completed" && (
              <div className="p-4 bg-gradient-to-br from-green-300 to-green-400 rounded-full">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            )}
            {status === "error" && (
              <div className="p-4 bg-gradient-to-br from-red-300 to-red-400 rounded-full">
                <Loader2 className="h-12 w-12 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-3xl text-center">
            {status === "generating" && "Creating Your Song..."}
            {status === "completed" && "Song Ready!"}
            {status === "error" && "Something Went Wrong"}
          </CardTitle>
          <p className="text-center text-brown-600 mt-2">
            {status === "generating" &&
              `Generating "${state?.songTitle || "Untitled"}"`}
            {status === "completed" &&
              "Your therapeutic song is ready to listen"}
            {status === "error" && errorMessage}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "generating" && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-brown-600">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between text-xs text-brown-500">
                  <span>Elapsed: {formatTime(elapsedTime)}</span>
                  <span>Est. {ESTIMATED_DURATION}s total</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-brown-900 mb-2">
                  What's Happening?
                </h3>
                <ul className="text-sm text-brown-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                    <span>AI is analyzing your specifications...</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                    <span>Composing melodies and harmonies...</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                    <span>Rendering final audio...</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {status === "completed" && audioUrls.length > 0 && (
            <>
              {selectedTrackIndex === null ? (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-brown-700">
                    💡 <strong>Choose a version:</strong> Listen to both
                    versions below and select the one you prefer. The other
                    version will be discarded.
                  </p>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓{" "}
                    <strong>Version {selectedTrackIndex + 1} selected.</strong>{" "}
                    The other version has been discarded.
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {audioUrls.map((url, idx) =>
                  selectedTrackIndex === null || selectedTrackIndex === idx ? (
                    <div
                      key={idx}
                      className="border border-brown-200 rounded-lg p-4 bg-white space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-brown-700">
                          Version {idx + 1}
                        </p>
                        <p className="text-xs text-brown-500">
                          {currentTimes[idx]} / {durations[idx]}
                        </p>
                      </div>

                      {/* Waveform */}
                      <div className="relative">
                        <div
                          ref={(el) => {
                            waveformRefs.current[idx] = el;
                          }}
                          className="w-full"
                        />
                        {!waveformsReady[idx] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-brown-50/80 rounded">
                            <p className="text-sm text-brown-600">
                              Loading waveform...
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Playback Controls */}
                      <div className="flex gap-2 items-center">
                        {playingStates[idx] ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePause(idx)}
                            className="w-20"
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePlay(idx)}
                            className="w-20"
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
                            value={volumes[idx] || 1.0}
                            onChange={(e) =>
                              handleVolumeChange(
                                idx,
                                parseFloat(e.target.value)
                              )
                            }
                            className="flex-1"
                          />
                          <span className="text-xs text-brown-600 w-10">
                            {Math.round((volumes[idx] || 1.0) * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Crop Controls */}
                      <div className="flex gap-2 pt-2 border-t border-brown-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddCropRegion(idx)}
                          className="flex-1"
                        >
                          <Scissors className="h-4 w-4 mr-1" />
                          Select Region to Crop
                        </Button>
                        {cropRegions[idx] && cropRegions[idx].end > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClearCropRegion(idx)}
                          >
                            Clear
                          </Button>
                        )}
                      </div>

                      {cropRegions[idx] && cropRegions[idx].end > 0 && (
                        <div className="text-xs text-brown-600 bg-amber-50 p-2 rounded">
                          Selected:{" "}
                          {formatTime(Math.floor(cropRegions[idx].start))} -{" "}
                          {formatTime(Math.floor(cropRegions[idx].end))}
                          <p className="text-[10px] mt-1">
                            Drag edges to adjust. This selection can be used for
                            exporting.
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {selectedTrackIndex === null ? (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={async () => {
                              // Set the selected track
                              setSelectedTrackIndex(idx);

                              // Find and delete the other version(s) from the database
                              const otherUrls = audioUrls.filter(
                                (_, i) => i !== idx
                              );
                              for (const otherUrl of otherUrls) {
                                const { error } = await supabase
                                  .from("songs")
                                  .delete()
                                  .eq("audio_url", otherUrl);

                                if (error) {
                                  console.error(
                                    "Error deleting unselected song:",
                                    error
                                  );
                                } else {
                                  console.log(
                                    "Deleted unselected version from database"
                                  );
                                }
                              }
                            }}
                          >
                            Select This Version
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={async () => {
                              // Find the song that was inserted by the webhook
                              // It should have this audio_url
                              const { data: songData, error } = await supabase
                                .from("songs")
                                .select("*")
                                .eq("audio_url", url)
                                .order("created_at", { ascending: false })
                                .limit(1)
                                .single();

                              if (error) {
                                console.error("Error finding song:", error);
                                alert(
                                  "Song not found in database. Please wait a moment and try again."
                                );
                              } else if (songData) {
                                // Navigate to make notes page with the existing song
                                navigate(
                                  `/patient/${state.patientId}/song/${songData.id}/notes`,
                                  {
                                    state: {
                                      audioUrl: url,
                                      selectedIndex: idx,
                                    },
                                  }
                                );
                              }
                            }}
                          >
                            Continue to Notes
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleDownload(url, idx)}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : null
                )}
              </div>

              {selectedTrackIndex !== null && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedTrackIndex(null)}
                    className="text-sm"
                  >
                    ← Show Both Versions Again
                  </Button>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => navigate("/therapist/dashboard")}
                  className="flex-1"
                >
                  Back to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/create-song/choice")}
                  className="flex-1"
                >
                  Create Another Song
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <p>{errorMessage || "An unexpected error occurred"}</p>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => navigate("/therapist/dashboard")}
                  className="flex-1"
                >
                  Back to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {status === "generating" && (
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to cancel? The song generation will continue in the background."
                    )
                  ) {
                    navigate("/therapist/dashboard");
                  }
                }}
              >
                Cancel and Return to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
