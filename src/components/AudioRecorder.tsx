import React, { useState, useRef } from "react";

type Props = {
  onRecorded?: (blob: Blob) => void;
};

export default function AudioRecorder({ onRecorded }: Props) {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        if (onRecorded) onRecorded(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Error accessing mic:", err);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={recording ? stopRecording : startRecording}
        className="px-4 py-2 rounded bg-blue-500 text-white"
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>

      {audioURL && (
        <audio controls src={audioURL} className="mt-3 w-64">
          Your browser does not support audio playback.
        </audio>
      )}
    </div>
  );
}
