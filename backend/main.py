from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os
import requests
from dotenv import load_dotenv
from typing import Any, Dict, List, Optional
import time
import uuid
from starlette.staticfiles import StaticFiles
from supabase import create_client, Client
import io 

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Initialize Supabase client after loading env vars
SUPABASE_URL = os.getenv("SUPABASE_URL")
# Use service role key for backend inserts (bypasses RLS)
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

supabase: Client | None = None
try:
    if SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"[startup] ✅ Supabase client initialized successfully")
    else:
        print(f"[startup] ⚠️ Supabase client NOT initialized - missing env vars")
        print(f"[startup]    SUPABASE_URL: {'✓' if SUPABASE_URL else '✗'}")
        print(f"[startup]    SUPABASE_KEY: {'✓' if SUPABASE_KEY else '✗'}")
except Exception as _e:
    print(f"[startup] ❌ Error initializing Supabase: {_e}")
    supabase = None

app = FastAPI()
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/debug/version")
def debug_version():
    return {
        "version": "2026-02-18-force-v4-1",
        "default_model_generate": GenerateRequest.model_fields["model"].default,
        "default_model_upload_extend": UploadExtendRequest.model_fields["model"].default,
    }


def upload_audio_to_supabase(audio_url: str, key_prefix: str = "songs") -> str:
    """
    Download audio from external URL and upload to Supabase Storage.
    Returns public URL. Falls back to original URL if upload fails.
    """
    try:
        if not supabase:
            print("[upload_audio] ⚠️ Supabase client not initialized, returning original URL")
            return audio_url

        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": "*/*",
        }

        print(f"[upload_audio] Downloading audio from: {audio_url}")
        r = requests.get(
            audio_url,
            headers=headers,
            timeout=60,
            allow_redirects=True,
            stream=True,
        )
        r.raise_for_status()

        ct = r.headers.get("Content-Type", "").lower()
        if "text/html" in ct:
            raise Exception(f"Upstream returned HTML instead of audio. content-type={ct}")

        # read bytes once
        audio_bytes = r.content

        # filename
        filename = f"{key_prefix}/{uuid.uuid4().hex}.mp3"

        print(f"[upload_audio] Uploading to Supabase Storage: {filename}")
        supabase.storage.from_("songs").upload(
            filename,
            audio_bytes,
            file_options={"content-type": "audio/mpeg"},
        )

        public_url = supabase.storage.from_("songs").get_public_url(filename)
        print(f"[upload_audio] ✅ Upload successful: {public_url}")
        return public_url

    except Exception as e:
        print(f"[upload_audio] ❌ Error: {e}")
        return audio_url

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "https://main.d179o01l4o00ke.amplifyapp.com",  # Production Amplify (deprecated)
        "https://songcraft-ai.vercel.app",  # Production Vercel frontend
        "http://52.62.46.27:8000",  # Backend itself (EC2)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Text prompt for generation")
    style: str | None = Field(None, description="Style tag, e.g., 'Classical'")
    title: str | None = Field(None, description="Optional track title")
    customMode: bool | None = Field(None)
    instrumental: bool | None = Field(None)
    model: str | None = Field("V5")
    negativeTags: str | None = Field(None)
    vocalGender: str | None = Field(None)
    styleWeight: float | None = Field(None)
    weirdnessConstraint: float | None = Field(None)
    audioWeight: float | None = Field(None)
    callBackUrl: str | None = Field(None)
    # App metadata for persistence
    userId: Optional[str] = Field(None, description="Supabase auth user id (UUID)")
    patientId: Optional[str] = Field(None, description="Patient ID if generating for a specific patient")
    withLyrics: Optional[bool] = Field(None, description="If true, song includes vocals")
    form: Optional[str] = Field(None, description="Song form, e.g., 'AB' or 'ABA'")
    moods: Optional[List[str]] = Field(None, description="Array of mood tags")
    tempo_bpm: Optional[int] = Field(None, description="Tempo in BPM")
    notes: Optional[str] = Field(None, description="Free-form notes")


class UploadExtendRequest(BaseModel):
    uploadUrl: str = Field(..., description="Publicly accessible URL to uploaded audio")
    defaultParamFlag: bool = Field(True, description="Enable custom parameter mode")
    instrumental: Optional[bool] = Field(None)
    prompt: Optional[str] = Field(None)
    style: Optional[str] = Field(None)
    title: Optional[str] = Field(None)
    continueAt: Optional[int] = Field(None)
    model: Optional[str] = Field("V5")
    negativeTags: Optional[str] = Field(None)
    vocalGender: Optional[str] = Field(None)
    styleWeight: Optional[float] = Field(None)
    weirdnessConstraint: Optional[float] = Field(None)
    audioWeight: Optional[float] = Field(None)
    callBackUrl: Optional[str] = Field(None)
    # App metadata for persistence
    userId: Optional[str] = Field(None, description="Supabase auth user id (UUID)")
    patientId: Optional[str] = Field(None, description="Patient ID if generating for a specific patient")
    notes: Optional[str] = Field(None, description="Free-form notes")


# In-memory store for webhook results keyed by task id
results_store: Dict[str, Any] = {}
webhook_status: Dict[str, Any] = {"last_hit": None, "last_payload": None}

# Store metadata for pending songs keyed by task_id
# This will be used to insert into DB when webhook is received
pending_metadata: Dict[str, Dict[str, Any]] = {}


def _extract_task_id(payload: dict) -> str | None:
    """Try to extract a single task id from various possible payload shapes."""
    try:
        data = payload.get("data") or {}
        if isinstance(data, dict):
            return data.get("taskId") or data.get("task_id") or data.get("id")
    except Exception as e:
        print(f"[extract_task_id] Error extracting task id: {e}")
    return None

def _extract_all_task_ids(payload: dict) -> list[str]:
    ids: set[str] = set()

    def add(v):
        if v:
            ids.add(str(v))

    try:
        data = payload.get("data")

        # If dict, check possible ids + also nested "data"
        if isinstance(data, dict):
            for k in ("task_id", "taskId", "id"):
                add(data.get(k))

            nested = data.get("data")
            if isinstance(nested, list):
                for item in nested:
                    if isinstance(item, dict):
                        for k in ("task_id", "taskId", "id"):
                            add(item.get(k))

        # If list, check items
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    for k in ("task_id", "taskId", "id"):
                        add(item.get(k))

    except Exception:
        pass

    for k in ("task_id", "taskId", "id"):
        add(payload.get(k))

    for k in ("task_ids", "taskIds", "ids"):
        arr = payload.get(k)
        if isinstance(arr, list):
            for v in arr:
                add(v)

    if not ids:
        ids.add("unknown")
    return list(ids)


@app.post("/generate/upload-extend")
def upload_extend(body: UploadExtendRequest):
    # DEBUG: Log incoming userId
    print(f"[upload-extend] 🔍 Received request with userId={body.userId}")
    print(f"[upload-extend] ✅ body.model = {body.model!r}")
    
    api_key = os.getenv("SUNO_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing SUNO_API_KEY environment variable")
    url = "https://api.sunoapi.org/api/v1/generate/upload-extend"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = body.model_dump(exclude_none=True)
    payload.setdefault("model", "V5")
    if "style" in payload and isinstance(payload["style"], str):
        s = payload["style"].strip()
        if "BPM of" in s:
            s = s.replace("BPM of", "").strip()
        if not s:
            payload.pop("style", None)
        else:
            payload["style"] = s
    if not payload.get("callBackUrl"):
        public_base = os.getenv("PUBLIC_BASE_URL")
        if public_base:
            payload["callBackUrl"] = public_base.rstrip("/") + "/webhook"
        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Suno requires callBackUrl. Pass it in the request body or set PUBLIC_BASE_URL in backend/.env to your public server URL (e.g., https://<ngrok-id>.ngrok.io)."
                ),
            )
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=60)
        resp.raise_for_status()
        out = resp.json()
        
        # DEBUG: Log full response structure
        print("[upload-extend] Full response:", out)
        print("[upload-extend] response keys:", list(out.keys()))
        
        task_id = _extract_task_id(out)
        all_ids = _extract_all_task_ids(out)

        print("[upload-extend] 🔍 Extracted task_id:", task_id)
        print("[upload-extend] 🔍 All possible task_ids:", all_ids)

        if task_id:
            meta = {
                "user_id": body.userId,
                "patient_id": body.patientId,
                "title": body.title or "Untitled",
                "with_lyrics": not body.instrumental if body.instrumental is not None else None,
                "form": None,
                "moods": None,
                "style": body.style,
                "tempo_bpm": None,
                "prompt": body.prompt,
                "notes": body.notes or f"uploadUrl={body.uploadUrl}, continueAt={body.continueAt}",
                "vocal_gender": body.vocalGender,
                "origin": "upload_extend"
            }

            for tid in set([task_id] + all_ids):
                if tid != "unknown":
                    pending_metadata[tid] = meta

            print(f"[upload-extend] ✅ Stored metadata under ids: {set([task_id] + all_ids)}")
        else:
            print(f"[upload-extend] ⚠️ Could not extract task_id from response")
        
        return out
    except requests.HTTPError as e:
        detail = e.response.text if e.response is not None else str(e)
        raise HTTPException(status_code=e.response.status_code if e.response else 502, detail=detail)
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Accepts an audio file and returns a public uploadUrl served from /uploads."""
    try:
        ext = os.path.splitext(file.filename or "")[1] or ".webm"
        fname = f"{uuid.uuid4().hex}{ext}"
        dest_path = os.path.join(UPLOAD_DIR, fname)
        with open(dest_path, "wb") as out:
            out.write(await file.read())
        public_base = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")
        upload_url = public_base.rstrip("/") + "/uploads/" + fname
        return {"uploadUrl": upload_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/proxy-audio")
async def proxy_audio(request: Request, url: str):
    try:
        print(f"[proxy-audio] Proxying URL: {url}")

        range_header = request.headers.get("range")
        headers = {
            "User-Agent": request.headers.get("user-agent")
                or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
            "Accept": request.headers.get("accept") or "*/*",
            "Accept-Encoding": "identity",
            "Referer": os.getenv("PUBLIC_BASE_URL", "http://localhost:8000"),
        }

        if range_header:
            headers["Range"] = range_header
            print(f"[proxy-audio] Range request: {range_header}")

        upstream = requests.get(
            url,
            headers=headers,
            stream=True,
            timeout=30,
            allow_redirects=True,
        )

        content_type = upstream.headers.get("Content-Type", "audio/mpeg")

        # Prepare passthrough headers
        resp_headers = {"Content-Type": content_type}

        # If upstream really supports ranges, it will return 206 and Content-Range
        if upstream.status_code == 206 and upstream.headers.get("Content-Range"):
            resp_headers["Accept-Ranges"] = "bytes"
            resp_headers["Content-Range"] = upstream.headers["Content-Range"]
            if upstream.headers.get("Content-Length"):
                resp_headers["Content-Length"] = upstream.headers["Content-Length"]
        else:
            # If client asked for Range but upstream ignored it (200), don't claim range support
            # This prevents the browser/wavesurfer from assuming seeking will work.
            if not range_header:
                # Only advertise ranges when client didn't ask and upstream says it can
                if upstream.headers.get("Accept-Ranges") == "bytes":
                    resp_headers["Accept-Ranges"] = "bytes"
            if upstream.headers.get("Content-Length"):
                resp_headers["Content-Length"] = upstream.headers["Content-Length"]

        def iterfile():
            for chunk in upstream.iter_content(chunk_size=1024 * 64):
                if chunk:
                    yield chunk

        return StreamingResponse(
            iterfile(),
            status_code=upstream.status_code,
            headers=resp_headers
        )

    except Exception as e:
        print(f"[proxy-audio] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to proxy audio: {str(e)}")


@app.post("/generate")
def generate_music(body: GenerateRequest):
    # DEBUG: Log incoming userId
    print(f"[generate] 🔍 Received request with userId={body.userId}")
    print("[generate] ✅ RAW request body:", body.model_dump())
    print(f"[generate] ✅ body.model = {body.model!r}")
    
    api_key = os.getenv("SUNO_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing SUNO_API_KEY environment variable")

    url = "https://api.sunoapi.org/api/v1/generate"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    # Convert Pydantic model to dict and drop None fields
    payload = body.model_dump(exclude_none=True)
    payload.setdefault("model", "V5")

    if "style" in payload and isinstance(payload["style"], str):
        s = payload["style"].strip()
        if "BPM of" in s:
            s = s.replace("BPM of", "").strip()
        if not s:
            payload.pop("style", None)
        else:
            payload["style"] = s
    
    # DEBUG: Log what we're sending to Suno
    print(f"[generate] 🔍 Sending to Suno API:")
    print(f"[generate] 🔍   vocalGender: {payload.get('vocalGender')}")
    print(f"[generate] 🔍   prompt: {payload.get('prompt')[:100]}...")
    print(f"[generate] 🔍   Full payload: {payload}")
    
    # Suno API requires a callback URL; derive it if not provided
    if not payload.get("callBackUrl"):
        public_base = os.getenv("PUBLIC_BASE_URL")
        if public_base:
            payload["callBackUrl"] = public_base.rstrip("/") + "/webhook"
        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Suno requires callBackUrl. Pass it in the request body or set PUBLIC_BASE_URL in backend/.env to your public server URL (e.g., https://<ngrok-id>.ngrok.io)."
                ),
            )

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=60)
        resp.raise_for_status()
        result_payload = resp.json()
        
        # DEBUG: Log full response structure
        print("[generate] Full response:", result_payload)
        print("[generate] response keys:", list(result_payload.keys()))
        
        # Store metadata for later DB insert when webhook is called
        task_id = _extract_task_id(result_payload)
        all_ids = _extract_all_task_ids(result_payload)

        print("[generate] 🔍 Extracted task_id:", task_id)
        print("[generate] 🔍 All possible task_ids:", all_ids)

        if task_id:
            meta = {
                "user_id": body.userId,
                "patient_id": body.patientId,
                "title": body.title or "Untitled",
                "with_lyrics": body.withLyrics if body.withLyrics is not None else (not body.instrumental if body.instrumental is not None else True),
                "form": body.form,
                "moods": body.moods,
                "style": body.style,
                "tempo_bpm": body.tempo_bpm,
                "prompt": body.prompt,
                "notes": body.notes,
                "vocal_gender": body.vocalGender,
                "origin": "generated"
            }

            # 🔥 store under ALL ids (fixes "Song not found")
            for tid in set([task_id] + all_ids):
                if tid != "unknown":
                    pending_metadata[tid] = meta

            print(f"[generate] ✅ Stored metadata under ids: {set([task_id] + all_ids)}")
        else:
            print(f"[generate] ⚠️ Could not extract task_id from response")
        
        return result_payload
    except requests.HTTPError as e:
        detail = e.response.text if e.response is not None else str(e)
        raise HTTPException(status_code=e.response.status_code if e.response else 502, detail=detail)
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=str(e))


if __name__ == "__main__":
    # Enable running with: python main.py
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

@app.get("/db/health")
def db_health(): 
    try: 
        if supabase is None: 
            return {"ok": False, "client": False, "error": "Supabase client not initialized"}
        res = supabase.table("songs").select("id", count="exact").limit(1).execute()
        count = getattr(res, "count", None)
        return {"ok": True, "client": True, "count": count}
    except Exception as e: 
        return {"ok": False, "client": True, "error": str(e)}

@app.get("/debug/pending-metadata")
def get_pending_metadata():
    """Debug endpoint to check what metadata is stored for pending songs"""
    return {
        "pending_count": len(pending_metadata),
        "task_ids": list(pending_metadata.keys()),
        "metadata": pending_metadata
    }

@app.post("/debug/test-insert")
def test_insert(user_id: str, patient_id: Optional[str] = None):
    """Test endpoint to manually insert a song and verify database connection"""
    try:
        if supabase is None:
            return {"ok": False, "error": "Supabase client not initialized"}
        
        test_data = {
            "user_id": user_id,
            "patient_id": patient_id,
            "title": "Test Song",
            "with_lyrics": True,
            "form": "AB",
            "moods": ["happy", "energetic"],
            "style": "Pop",
            "tempo_bpm": 120,
            "prompt": "Test prompt",
            "notes": "Test insert from debug endpoint",
            "vocal_gender": "f",
            "origin": "generated",  # Changed from "debug_test" to match check constraint
            "audio_url": "https://example.com/test.mp3",
            "task_id": "test_task_123"
        }
        
        print(f"[test-insert] Attempting to insert: {test_data}")
        result = supabase.table("songs").insert(test_data).execute()
        print(f"[test-insert] Success! Result: {result}")
        
        return {
            "ok": True,
            "message": "Successfully inserted test song",
            "data": result.data
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[test-insert] ❌ Error: {error_details}")
        return {
            "ok": False,
            "error": str(e),
            "details": error_details
        }

@app.post("/analyze-drawing")
async def analyze_drawing(image: UploadFile = File(...)):
    """
    Analyze an uploaded drawing/curve image and extract musical characteristics.
    Returns musical suggestions based on visual features.
    """
    try:
        # Read and process image
        from PIL import Image
        import io
        import numpy as np
        from collections import Counter
        
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize for consistent analysis (max 800px)
        max_size = 800
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            new_size = tuple(int(dim * ratio) for dim in img.size)
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Convert to numpy array for analysis
        img_array = np.array(img)
        height, width = img_array.shape[:2]
        
        # --- CURVATURE ANALYSIS ---
        # Detect edges and analyze smoothness
        gray = np.mean(img_array, axis=2).astype(np.uint8)
        edges = np.abs(np.diff(gray, axis=0)).sum() + np.abs(np.diff(gray, axis=1)).sum()
        edge_density = edges / (height * width)
        
        if edge_density < 20:
            curvature = "smooth"
        elif edge_density > 50:
            curvature = "angular"
        else:
            curvature = "mixed"
        
        # --- COMPLEXITY ANALYSIS ---
        # Count distinct color regions
        flat_colors = img_array.reshape(-1, 3)
        unique_colors = len(np.unique(flat_colors, axis=0))
        color_complexity = unique_colors / (height * width)
        
        if color_complexity < 0.001 or unique_colors < 10:
            complexity = "simple"
        elif color_complexity > 0.01 or unique_colors > 100:
            complexity = "complex"
        else:
            complexity = "moderate"
        
        # --- COLOR ANALYSIS ---
        # Find dominant colors
        pixels = flat_colors.tolist()
        color_counts = Counter(tuple(p) for p in pixels)
        top_colors = color_counts.most_common(5)
        
        dominant_colors = []
        for (r, g, b), count in top_colors:
            # Skip white/near-white backgrounds
            if r > 240 and g > 240 and b > 240:
                continue
            # Categorize colors
            brightness = (r + g + b) / 3
            if r > g and r > b:
                dominant_colors.append("red")
            elif b > r and b > g:
                dominant_colors.append("blue")
            elif g > r and g > b:
                dominant_colors.append("green")
            elif brightness < 85:
                dominant_colors.append("dark")
            elif brightness > 170:
                dominant_colors.append("light")
            else:
                dominant_colors.append("neutral")
        
        dominant_colors = list(set(dominant_colors[:3]))  # Unique, max 3
        
        # --- INTENSITY ANALYSIS ---
        # Based on stroke weight/darkness
        non_white_pixels = sum(1 for (r, g, b), _ in top_colors if r < 240 or g < 240 or b < 240)
        avg_darkness = np.mean([255 - np.mean([r, g, b]) for (r, g, b), _ in top_colors[:3]])
        
        if avg_darkness < 50:
            intensity = "low"
        elif avg_darkness > 150:
            intensity = "high"
        else:
            intensity = "medium"
        
        # --- TRAJECTORY ANALYSIS ---
        # Analyze vertical direction: does the drawing rise, fall, or stay stable?
        # This maps to emotional arc and song dynamics
        
        # Find non-white pixels (actual drawing content)
        threshold = 240
        non_white_mask = (gray < threshold)
        
        if non_white_mask.sum() > 0:  # If there's any drawing content
            # Get y-coordinates of drawing pixels (weighted by darkness)
            y_coords, x_coords = np.where(non_white_mask)
            darkness_values = 255 - gray[non_white_mask]  # Darker = more weight
            
            # Split into thirds (beginning, middle, end)
            num_pixels = len(x_coords)
            sorted_indices = np.argsort(x_coords)  # Sort by x position (left to right)
            
            # Calculate weighted average y-position for each third
            third_size = num_pixels // 3
            if third_size > 0:
                start_third = sorted_indices[:third_size]
                middle_third = sorted_indices[third_size:2*third_size]
                end_third = sorted_indices[2*third_size:]
                
                # Weighted average y-position (lower y = top of image = "high")
                avg_y_start = np.average(y_coords[start_third], weights=darkness_values[start_third])
                avg_y_end = np.average(y_coords[end_third], weights=darkness_values[end_third])
                
                # Calculate trajectory (negative because y increases downward in images)
                trajectory_change = avg_y_start - avg_y_end
                trajectory_ratio = trajectory_change / height
                
                if trajectory_ratio > 0.1:  # Curve goes UP (starts low, ends high)
                    trajectory = "rising"
                    trajectory_description = "ascending from lower to higher"
                elif trajectory_ratio < -0.1:  # Curve goes DOWN (starts high, ends low)
                    trajectory = "falling"
                    trajectory_description = "descending from higher to lower"
                else:
                    trajectory = "stable"
                    trajectory_description = "maintaining consistent level"
                
                # Find peak location (highest point in the drawing)
                highest_y = y_coords[darkness_values.argmax()]  # Y of darkest/most prominent point
                peak_position_ratio = np.mean(x_coords[y_coords == highest_y]) / width
                
                if peak_position_ratio < 0.33:
                    peak_location = "early"
                elif peak_position_ratio > 0.66:
                    peak_location = "late"
                else:
                    peak_location = "middle"
            else:
                trajectory = "stable"
                trajectory_description = "maintaining consistent level"
                peak_location = "middle"
        else:
            trajectory = "stable"
            trajectory_description = "maintaining consistent level"
            peak_location = "middle"
        
        # --- PATTERN DETECTION ---
        patterns = []
        if curvature == "smooth":
            patterns.append("flowing lines")
        if curvature == "angular":
            patterns.append("geometric shapes")
        if complexity == "complex":
            patterns.append("layered elements")
        if "red" in dominant_colors or "dark" in dominant_colors:
            patterns.append("bold strokes")
        
        # Add trajectory to patterns
        if trajectory == "rising":
            patterns.append("upward trajectory")
        elif trajectory == "falling":
            patterns.append("downward trajectory")
        
        # --- MUSICAL SUGGESTIONS ---
        musical_suggestions = {}
        
        # Tempo based on complexity and curvature
        if curvature == "smooth" and intensity == "low":
            musical_suggestions["tempo"] = 70  # Slow, flowing
        elif curvature == "angular" and intensity == "high":
            musical_suggestions["tempo"] = 130  # Fast, energetic
        else:
            musical_suggestions["tempo"] = 100  # Moderate
        
        # Song structure and dynamics based on trajectory
        if trajectory == "rising":
            if peak_location == "late":
                musical_suggestions["structure"] = "Build gradually to climactic ending, crescendo throughout"
                musical_suggestions["dynamics"] = "Start soft (p), build to powerful finale (ff)"
            elif peak_location == "middle":
                musical_suggestions["structure"] = "Ascending to mid-point climax, then sustain energy"
                musical_suggestions["dynamics"] = "Gradual crescendo to middle, maintain intensity"
            else:
                musical_suggestions["structure"] = "Early peak with sustained elevation"
                musical_suggestions["dynamics"] = "Quick rise, sustained forte"
        
        elif trajectory == "falling":
            if peak_location == "early":
                musical_suggestions["structure"] = "Strong opening, gradually resolve and calm"
                musical_suggestions["dynamics"] = "Start powerful (ff), diminuendo to gentle ending (p)"
            elif peak_location == "middle":
                musical_suggestions["structure"] = "Rise to middle climax, then descend to resolution"
                musical_suggestions["dynamics"] = "Crescendo then decrescendo, ending softly"
            else:
                musical_suggestions["structure"] = "Descending resolution with late moment of intensity"
                musical_suggestions["dynamics"] = "Gradual decrescendo with subtle late emphasis"
        
        else:  # stable
            musical_suggestions["structure"] = "Maintain consistent energy and emotional level"
            musical_suggestions["dynamics"] = "Balanced dynamics throughout (mf)"
        
        # Style based on characteristics
        if curvature == "smooth" and complexity == "simple":
            musical_suggestions["style"] = "ambient, minimalist"
        elif curvature == "angular" and complexity == "complex":
            musical_suggestions["style"] = "modern classical, rhythmic"
        elif "blue" in dominant_colors:
            musical_suggestions["style"] = "calm, contemplative"
        else:
            musical_suggestions["style"] = "expressive, melodic"
        
        # Mood based on colors and intensity
        mood_parts = []
        if "blue" in dominant_colors:
            mood_parts.append("peaceful")
        if "red" in dominant_colors:
            mood_parts.append("passionate")
        if "dark" in dominant_colors:
            mood_parts.append("introspective")
        if "light" in dominant_colors:
            mood_parts.append("uplifting")
        if intensity == "high":
            mood_parts.append("energetic")
        elif intensity == "low":
            mood_parts.append("gentle")
        
        musical_suggestions["mood"] = ", ".join(mood_parts) if mood_parts else "expressive"
        
        # Instrumentation based on complexity
        if complexity == "simple":
            musical_suggestions["instrumentation"] = "piano, strings"
        elif complexity == "complex":
            musical_suggestions["instrumentation"] = "full orchestra, layered synthesizers"
        else:
            musical_suggestions["instrumentation"] = "acoustic ensemble, light percussion"
        
        # Save image temporarily and return URL
        filename = f"{uuid.uuid4().hex}.{image.filename.split('.')[-1]}"
        filepath = os.path.join(BASE_DIR, "uploads", filename)
        with open(filepath, "wb") as f:
            f.write(contents)
        
        image_url = f"http://localhost:8000/uploads/{filename}"
        
        return {
            "imageUrl": image_url,
            "curvature": curvature,
            "complexity": complexity,
            "dominantColors": dominant_colors,
            "intensity": intensity,
            "patterns": patterns,
            "trajectory": trajectory,
            "trajectoryDescription": trajectory_description,
            "peakLocation": peak_location,
            "musicalSuggestions": musical_suggestions
        }
        
    except Exception as e:
        import traceback
        print(f"[analyze-drawing] ❌ Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/webhook")
async def suno_webhook(request: Request):
    try:
        payload = await request.json()
    except Exception:
        payload = {"raw": await request.body()}
    webhook_status["last_hit"] = int(time.time())
    webhook_status["last_payload"] = payload
    all_ids = _extract_all_task_ids(payload)
    true_task_id = (
        (payload.get("data") or {}).get("task_id")
        or (payload.get("data") or {}).get("taskId")
        or _extract_task_id(payload)
        or all_ids[0]
    )

    task_id = true_task_id

    try:
        print(f"[webhook] stored under ids: {all_ids}")
    except Exception:
        pass
  
    # DEBUG: Log what we have
    print(f"[webhook DEBUG] task_id={task_id}")
    print(f"[webhook DEBUG] task_id in pending_metadata? {task_id in pending_metadata}")
    print(f"[webhook DEBUG] supabase is None? {supabase is None}")
    print(f"[webhook DEBUG] All pending_metadata keys: {list(pending_metadata.keys())}")
    
    # DEBUG: Print FULL webhook payload to see what Suno is sending
    import json
    print(f"[webhook DEBUG] 🔍 FULL WEBHOOK PAYLOAD:")
    print(json.dumps(payload, indent=2))
    
    # Extract audio URLs from payload
    audio_items = []  # list of {"audio_url": ..., "stream_audio_url": ...}

    try:
        data = payload.get("data")
        print(f"[webhook DEBUG] 🔍 data type: {type(data)}")

        # Handle nested structure: payload.data.data is the actual list
        if isinstance(data, dict):
            data = data.get("data")
            print(f"[webhook DEBUG] 🔍 Nested data type: {type(data)}")

        if isinstance(data, list):
            for i, item in enumerate(data):
                print(f"[webhook DEBUG] 🔍 data[{i}] keys: {list(item.keys()) if isinstance(item, dict) else 'not a dict'}")
                if not isinstance(item, dict):
                    continue

                # Always define clip_id first (prevents 'unbound local' crash)
                clip_id = item.get("id")  # Suno per-clip id (unique for v1/v2)

                primary_audio = item.get("audio_url") or None         # aiquickdraw (sometimes empty)
                stream_audio = item.get("stream_audio_url") or None   # removeai

                print(f"[webhook DEBUG] 🔍 data[{i}] id: {clip_id}")
                print(f"[webhook DEBUG] 🔍 data[{i}] audio_url: {primary_audio}")
                print(f"[webhook DEBUG] 🔍 data[{i}] stream_audio_url: {stream_audio}")

                # Only append if we have at least one URL
                if primary_audio or stream_audio:
                    audio_items.append({
                        "clip_id": str(clip_id) if clip_id else None,
                        "audio_url": primary_audio,
                        "stream_audio_url": stream_audio,
                    })
                    print(f"[webhook DEBUG] ✅ Added audio item #{i}: {audio_items[-1]}")

    except Exception as e:
        print(f"[webhook] ⚠️  Error extracting audio URLs: {e}")
        import traceback
        traceback.print_exc()

    
    # Find matching metadata by ANY plausible id
    matched_id = None
    for tid in all_ids:
        if tid in pending_metadata:
            matched_id = tid
            break

    if matched_id and supabase is not None:
        try:
            metadata = pending_metadata[matched_id]
            print(f"[webhook DEBUG] ✅ matched pending_metadata id: {matched_id}")
            print(f"[webhook DEBUG] metadata={metadata}")
            print(f"[webhook DEBUG] extracted audio_items={audio_items}")

            # ✅ ALSO store webhook payload under ALL pending_metadata keys that reference this same meta
            meta_keys = [k for k, v in pending_metadata.items() if v is metadata]
            for k in set(all_ids + meta_keys):
                if k != "unknown":
                    results_store[k] = payload

            print(f"[webhook DEBUG] ✅ Stored results under ids: {set(all_ids + meta_keys)}")


            if not metadata.get("user_id"):
                print(f"[webhook] ❌ Skipping insert - no user_id")
                return {"ok": True, "task_id": task_id}

            if len(audio_items) == 0:
                print(f"[webhook] ⏳ No audio URLs yet, keeping metadata for next webhook call")
                return {"ok": True, "task_id": task_id}

            for i, audio in enumerate(audio_items):
                clip_id = audio.get("clip_id")
                primary_audio = audio.get("audio_url")
                stream_audio = audio.get("stream_audio_url")

                # Prefer primary audio_url. If only stream_audio_url exists, wait for a later webhook.
                if not primary_audio and stream_audio:
                    print(f"[webhook] ⏳ Only stream_audio_url present (clip_id={clip_id}); waiting for primary audio_url.")
                    continue

                chosen_audio_url = primary_audio
                stable_url = upload_audio_to_supabase(chosen_audio_url)

                insert_data = {
                    "user_id": metadata["user_id"],
                    "patient_id": metadata.get("patient_id"),
                    "title": metadata.get("title", "Untitled") + (f" (v{i+1})" if len(audio_items) > 1 else ""),
                    "with_lyrics": metadata.get("with_lyrics"),
                    "form": metadata.get("form"),
                    "moods": metadata.get("moods"),
                    "style": metadata.get("style"),
                    "tempo_bpm": metadata.get("tempo_bpm"),
                    "prompt": metadata.get("prompt"),
                    "notes": metadata.get("notes"),
                    "vocal_gender": metadata.get("vocal_gender"),
                    "origin": metadata.get("origin", "webhook"),
                    "audio_url": stable_url,
                    "stream_audio_url": stream_audio,
                    "task_id": task_id,     # the webhook's task id (grouping)
                    "suno_clip_id": clip_id, # unique per clip
                }

                print(f"[webhook DEBUG] Attempting insert #{i+1} with data: {insert_data}")
                result = supabase.table("songs").insert(insert_data).execute()
                print(f"[webhook] ✅ Successfully inserted song #{i+1} (clip_id={clip_id})")

            # Clean up metadata: delete ALL keys that reference the SAME meta dict
            meta_keys = [k for k, v in pending_metadata.items() if v is metadata]
            for k in meta_keys:
                del pending_metadata[k]
            print(f"[webhook] 🗑️ Cleaned up metadata keys: {meta_keys}")

        except Exception as e:
            print(f"[webhook] ❌ Error inserting song: {e}")
            import traceback
            traceback.print_exc()
    else:
        if not matched_id:
            print(f"[webhook] ⚠️ No metadata found for any of these ids: {all_ids}")
        if supabase is None:
            print(f"[webhook] ⚠️ Supabase client is None")


    return {"ok": True, "task_id": task_id}

@app.get("/webhook/status")
def webhook_status_endpoint():
    return webhook_status   


@app.get("/result/{task_id}")
def get_result(task_id: str):
    if task_id in results_store:
        return results_store[task_id]
    raise HTTPException(status_code=404, detail="Result not found")

