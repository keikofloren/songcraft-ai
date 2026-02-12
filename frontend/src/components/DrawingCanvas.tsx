import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Trash2, Eraser, Pen } from "lucide-react";

interface DrawingCanvasProps {
  onImageReady: (blob: Blob) => void;
  onError?: (error: string) => void;
}

export default function DrawingCanvas({ onImageReady }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  // Canvas dimensions
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 350;

  // Initialize canvas only once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up canvas
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    console.log("🎨 Canvas setup:", {
      width: canvas.width,
      height: canvas.height,
    });

    // Fill with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Set line properties
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000000";

    console.log("🎨 Canvas context setup complete:", {
      lineWidth: ctx.lineWidth,
      strokeStyle: ctx.strokeStyle,
      lineCap: ctx.lineCap,
    });
  }, []); // Only run once on mount

  // Handle drawing state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Update stroke style when eraser mode changes
    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 6;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#000000";
    }
  }, [isEraser]);

  // Auto-save drawing when user stops drawing
  const saveDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        console.log("💾 Auto-saving drawing:", blob.size, "bytes");
        onImageReady(blob);
      }
    }, "image/png");
  }, [onImageReady]);

  // Mouse events
  const handleMouseDown = (e: MouseEvent) => {
    console.log("🖱️ Mouse down event triggered");
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log("🖱️ Mouse position:", { x, y, isEraser });

    setIsDrawing(true);
    setLastPoint({ x, y });

    // Set drawing properties
    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 6;
      console.log("🧽 Eraser mode activated");
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#000000";
      console.log("✏️ Pen mode activated, strokeStyle:", ctx.strokeStyle);
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();

    console.log("🖱️ Drew initial point");
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing || !lastPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log("🖱️ Mouse move:", { x, y, isDrawing, lastPoint });

    // Ensure stroke style is set correctly
    if (!isEraser) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
    } else {
      ctx.lineWidth = 6;
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    console.log("🖱️ Drew line from", lastPoint, "to", { x, y });

    setLastPoint({ x, y });
    // Removed saveDrawing() call - only save when user finishes drawing
  };

  const handleMouseUp = () => {
    console.log("🖱️ Mouse up");
    setIsDrawing(false);
    setLastPoint(null);
    // Save drawing when user finishes drawing
    saveDrawing();
  };

  // Touch events
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    console.log("👆 Touch start event triggered");
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    console.log("👆 Touch position:", { x, y, isEraser });

    setIsDrawing(true);
    setLastPoint({ x, y });

    // Set drawing properties
    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 6;
      console.log("🧽 Eraser mode activated (touch)");
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#000000";
      console.log(
        "✏️ Pen mode activated (touch), strokeStyle:",
        ctx.strokeStyle
      );
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();

    console.log("👆 Drew initial point (touch)");
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !lastPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    console.log("👆 Touch move:", { x, y, isDrawing, lastPoint });

    // Ensure stroke style is set correctly
    if (!isEraser) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
    } else {
      ctx.lineWidth = 6;
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    console.log("👆 Drew line from", lastPoint, "to", { x, y });

    setLastPoint({ x, y });
    // Removed saveDrawing() call - only save when user finishes drawing
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    console.log("👆 Touch end");
    setIsDrawing(false);
    setLastPoint(null);
    // Save drawing when user finishes drawing
    saveDrawing();
  };

  // Add event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add event listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    // Cleanup
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDrawing, lastPoint, isEraser, saveDrawing]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Save empty canvas
    canvas.toBlob((blob) => {
      if (blob) {
        onImageReady(blob);
      }
    }, "image/png");
  };

  const toggleEraser = () => {
    setIsEraser(!isEraser);
  };

  const testCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    console.log("🧪 Testing canvas drawing...");

    // Draw a test line
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(150, 100);
    ctx.stroke();

    console.log("🧪 Test line drawn");

    // Save the test drawing
    canvas.toBlob((blob) => {
      if (blob) {
        console.log("🧪 Test blob created:", blob.size, "bytes");
        onImageReady(blob);
      }
    }, "image/png");
  };

  return (
    <div className="space-y-4">
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        {/* Toolbar */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button
            type="button"
            variant={!isEraser ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEraser(false)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Pen className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={isEraser ? "default" : "outline"}
            size="sm"
            onClick={toggleEraser}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Eraser className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={testCanvas}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-xs"
          >
            Test
          </Button>
        </div>

        {/* Canvas */}
        <div className="flex justify-center">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="border-2 border-gray-400 rounded shadow-lg cursor-crosshair bg-white"
              style={{
                maxWidth: "100%",
                height: "auto",
                touchAction: "none", // Prevent scrolling while drawing
                display: "block", // Ensure canvas is visible
              }}
            />
            {/* Debug info */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-1 rounded">
              {isDrawing ? "Drawing..." : "Ready"}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {isEraser
              ? "Eraser mode - tap to erase"
              : "Draw mode - tap to draw"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Draw a curve or shape that represents your musical idea
          </p>
        </div>
      </div>
    </div>
  );
}
