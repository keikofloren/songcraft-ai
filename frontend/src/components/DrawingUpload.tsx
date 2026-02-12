import { useState, useRef } from "react";
import { Button } from "./ui/button";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  Palette,
  FileImage,
} from "lucide-react";
import DrawingCanvas from "./DrawingCanvas";

interface DrawingUploadProps {
  onImageAnalyzed: (analysis: ImageAnalysis) => void;
  onError?: (error: string) => void;
}

export interface ImageAnalysis {
  imageUrl: string;
  curvature: "smooth" | "angular" | "mixed";
  complexity: "simple" | "moderate" | "complex";
  dominantColors: string[];
  intensity: "low" | "medium" | "high";
  patterns: string[];
  trajectory: "rising" | "falling" | "stable";
  trajectoryDescription: string;
  peakLocation: "early" | "middle" | "late";
  musicalSuggestions: {
    tempo?: number;
    style?: string;
    mood?: string;
    instrumentation?: string;
    structure?: string;
    dynamics?: string;
  };
}

export default function DrawingUpload({
  onImageAnalyzed,
  onError,
}: DrawingUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [inputMode, setInputMode] = useState<"upload" | "draw">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      onError?.("Please upload a PNG or JPG image");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError?.("Image size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload and analyze
    await analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    try {
      setAnalyzing(true);

      // Upload image to backend
      const formData = new FormData();
      formData.append("image", file);

      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE}/analyze-drawing`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const analysis: ImageAnalysis = await response.json();
      onImageAnalyzed(analysis);
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      onError?.(error?.message || "Failed to analyze image");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCanvasImage = async (blob: Blob) => {
    try {
      // Create a preview URL from the blob
      const previewUrl = URL.createObjectURL(blob);
      setPreview(previewUrl);

      // Convert blob to File for analysis
      const file = new File([blob], "drawing.png", { type: "image/png" });
      await analyzeImage(file);
    } catch (error: any) {
      onError?.(error?.message || "Failed to process drawing");
    }
  };

  const handleClear = () => {
    // Clean up preview URL if it exists
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setInputMode("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      {!preview && (
        <div className="flex justify-center gap-2">
          <Button
            variant={inputMode === "upload" ? "default" : "outline"}
            size="sm"
            onClick={() => setInputMode("upload")}
            className="flex items-center gap-2"
          >
            <FileImage className="h-4 w-4" />
            Upload Image
          </Button>
          <Button
            variant={inputMode === "draw" ? "default" : "outline"}
            size="sm"
            onClick={() => setInputMode("draw")}
            className="flex items-center gap-2"
          >
            <Palette className="h-4 w-4" />
            Draw Here
          </Button>
        </div>
      )}

      <div className="border-2 border-dashed border-brown-300 rounded-lg p-6 bg-amber-50/30">
        {!preview ? (
          inputMode === "upload" ? (
            <div className="text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 text-brown-400" />
              <p className="text-sm text-brown-700 mb-4">
                Upload a drawing or curve to analyze its musical characteristics
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={analyzing}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Image
              </Button>
              <p className="text-xs text-brown-500 mt-2">PNG or JPG, max 5MB</p>
            </div>
          ) : (
            <DrawingCanvas onImageReady={handleCanvasImage} onError={onError} />
          )
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={preview}
                alt="Drawing preview"
                className="max-h-64 mx-auto rounded border border-brown-200"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClear}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {analyzing && (
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-brown-600">
                  Analyzing drawing characteristics...
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-brown-900 text-sm mb-2">
          💡 What we analyze:
        </h4>
        <ul className="text-xs text-brown-700 space-y-1">
          <li>
            • <strong>Trajectory:</strong> Rising curve → build to climax,
            Falling → resolve and calm
          </li>
          <li>
            • <strong>Curvature:</strong> Smooth curves → flowing melodies,
            Angular → rhythmic patterns
          </li>
          <li>
            • <strong>Complexity:</strong> Simple → minimalist, Complex →
            layered arrangements
          </li>
          <li>
            • <strong>Colors:</strong> Bright → upbeat, Dark → contemplative
          </li>
          <li>
            • <strong>Intensity:</strong> Light strokes → soft dynamics, Heavy →
            powerful sound
          </li>
        </ul>
      </div>
    </div>
  );
}
