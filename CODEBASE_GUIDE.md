# Human-AI Songwriter - Comprehensive Codebase Guide

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Workflows](#core-workflows)
6. [Component Guide](#component-guide)
7. [Backend API](#backend-api)
8. [Database Schema](#database-schema)
9. [Key Features](#key-features)
10. [Development Guide](#development-guide)

---

## 🎯 Project Overview

**Human-AI Songwriter** is a music therapy application that helps therapists create personalized songs for their patients using AI-powered music generation. The application combines:

- **Therapeutic Workflow**: Guided process for creating meaningful, patient-specific songs
- **AI Music Generation**: Powered by Suno AI API for high-quality music creation
- **Drawing Analysis**: Convert patient drawings into musical characteristics
- **Audio Recording**: Record patient vocals/sounds to extend into full songs
- **Patient Management**: Track patients and their song library

### Use Case

Music therapists use this application to:
1. Create personalized therapeutic songs based on patient input (drawings, vocals, preferences)
2. Manage multiple patients and their song collections
3. Add therapeutic notes to songs for session documentation
4. Generate both lyrical and instrumental pieces

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │ ◄─────► │  FastAPI Backend│ ◄─────► │   Supabase DB   │
│   (Vite + TS)   │         │    (Python)     │         │  (PostgreSQL)   │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         │                           │
         │                           │
         │                  ┌────────▼────────┐
         │                  │                 │
         └─────────────────►│   Suno AI API   │
                            │  (Music Gen)    │
                            │                 │
                            └─────────────────┘
```

### Data Flow

1. **Authentication**: Supabase Auth handles therapist login/signup
2. **Song Creation**: Frontend → Backend → Suno AI → Webhook → Database
3. **File Uploads**: Frontend → Backend (stores in `/uploads`) → Suno AI
4. **Audio Storage**: Suno URL → Backend downloads → Supabase Storage → Permanent URL

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS 4 + DaisyUI
- **UI Components**: Radix UI (headless components)
- **State Management**: Zustand (minimal usage)
- **Audio Visualization**: WaveSurfer.js
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.13)
- **CORS**: FastAPI CORS middleware
- **HTTP Client**: Requests library
- **Environment**: python-dotenv
- **Image Processing**: PIL (Pillow) + NumPy

### Database & Auth
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (audio files)
- **Real-time**: Supabase real-time subscriptions (auth state)

### External Services
- **Music Generation**: Suno AI API
- **Deployment**: 
  - Frontend: Vercel
  - Backend: AWS EC2 (or can use Elastic Beanstalk)

---

## 📁 Project Structure

```
human-ai-songwriter/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── HomePage.tsx          # Landing page
│   │   ├── TherapistLogin.tsx    # Auth (login/signup)
│   │   ├── TherapistDashboard.tsx # Patient list + management
│   │   ├── PatientForm.tsx       # Add/edit patient form
│   │   ├── PatientSongs.tsx      # View patient's songs
│   │   ├── CreateSongChoice.tsx  # Choose: lyrics vs instrumental
│   │   ├── GenerateLyrics.tsx    # Song creation (with vocals)
│   │   ├── GenerateNoLyrics.tsx  # Song creation (instrumental)
│   │   ├── MotifAndInstrumentation.tsx # Musical parameters
│   │   ├── LoadingSong.tsx       # Polling for song completion
│   │   ├── MakeNotes.tsx         # Add notes to completed songs
│   │   ├── DrawingCanvas.tsx     # Draw directly in browser
│   │   ├── DrawingUpload.tsx     # Upload drawing for analysis
│   │   ├── AudioRecorder.tsx     # Record audio in browser
│   │   └── ui/                   # Reusable UI components
│   ├── api/
│   │   └── suno.ts               # Frontend API wrapper
│   ├── lib/
│   │   └── supabase.ts           # Supabase client setup
│   ├── App.tsx                   # Main app with routing
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Global styles
│
├── backend/                      # Backend API
│   ├── main.py                   # FastAPI application
│   ├── requirements.txt          # Python dependencies
│   ├── uploads/                  # Temporary file storage
│   └── venv/                     # Python virtual environment
│
├── public/                       # Static assets
├── .env                          # Frontend environment variables (local)
├── .env.example                  # Frontend env template
├── backend/.env                  # Backend environment variables (local)
├── backend/.env.example          # Backend env template
├── package.json                  # Node dependencies
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind configuration
└── tsconfig.json                 # TypeScript configuration
```

---

## 🔄 Core Workflows

### 1. Therapist Authentication Flow

```
User visits / → Clicks "Login" → /therapist/login
                                      ↓
                    Enters credentials → Supabase Auth
                                      ↓
                    Success → Navigate to /therapist/dashboard
```

**Components**: `HomePage.tsx` → `TherapistLogin.tsx` → `TherapistDashboard.tsx`

### 2. Patient Management Flow

```
Dashboard → Click "Add Patient" → PatientForm modal
                                      ↓
                    Fill details → Submit → Insert to Supabase
                                      ↓
                    Dashboard refreshes with new patient
```

**Components**: `TherapistDashboard.tsx` + `PatientForm.tsx`

### 3. Song Creation Flow (With Lyrics)

```
Select Patient → Click "Create Song" → /create-song/choice
                                            ↓
            Choose "With Lyrics" → /create-song/lyrics
                                            ↓
    Option A: Upload Drawing    OR    Option B: Record Audio
         ↓                                     ↓
    Analyze Drawing              Record → Upload to backend
         ↓                                     ↓
    Get Musical Suggestions      Backend saves → Returns URL
         ↓                                     ↓
         └────────────────┬────────────────────┘
                          ↓
            /create-song/motif-instrumentation
                          ↓
         Set: Form, Moods, Tempo, Vocal Gender, Style
                          ↓
         Generate Prompt (AI-assisted or manual)
                          ↓
            Submit → POST /generate or /generate/upload-extend
                          ↓
            Backend → Suno AI (async generation)
                          ↓
            Navigate to /create-song/loading
                          ↓
         Poll backend for completion (check task_id)
                          ↓
         Suno calls webhook → Backend inserts song to DB
                          ↓
         Frontend detects completion → Shows success
                          ↓
         Navigate to patient's song list
```

**Components**: 
- `CreateSongChoice.tsx`
- `GenerateLyrics.tsx` (with `DrawingUpload.tsx` or `AudioRecorder.tsx`)
- `MotifAndInstrumentation.tsx`
- `LoadingSong.tsx`
- `PatientSongs.tsx`

### 4. Song Creation Flow (Instrumental)

Similar to above, but:
- Starts at `/create-song/instrumental` (`GenerateNoLyrics.tsx`)
- Uses drawing analysis for musical parameters
- Skips vocal gender selection
- Sets `instrumental: true` in API request

### 5. Drawing Analysis Flow

```
User uploads drawing → POST /analyze-drawing
                              ↓
         Backend analyzes image (color, curvature, complexity)
                              ↓
         Returns musical suggestions:
         - Tempo (BPM)
         - Mood
         - Style
         - Instrumentation
         - Dynamics
         - Structure
                              ↓
         Frontend pre-fills form with suggestions
```

**Backend Endpoint**: `/analyze-drawing` in `main.py`

### 6. Audio Extension Flow

```
User records audio → AudioRecorder captures → Convert to Blob
                              ↓
         POST /upload (backend) → Saves to /uploads/
                              ↓
         Returns uploadUrl
                              ↓
         POST /generate/upload-extend with uploadUrl
                              ↓
         Suno AI extends audio into full song
                              ↓
         Webhook → Database insert → Frontend polls
```

**Components**: `AudioRecorder.tsx` → Backend `/upload` & `/generate/upload-extend`

---

## 📦 Component Guide

### Core Page Components

#### `HomePage.tsx`
- **Purpose**: Landing page with navigation
- **Features**: Info about the app, login button
- **Props**: `onNavigate(page: string)`

#### `TherapistLogin.tsx`
- **Purpose**: Authentication (login & signup)
- **Features**: 
  - Email/password login
  - Sign-up with name and is_therapist flag
  - Stores user profile in `therapists` table
- **Props**: 
  - `onLoginSuccess(userId: string)`
  - `onNavigate(path: string)`
- **Authentication**: Supabase Auth

#### `TherapistDashboard.tsx`
- **Purpose**: Main dashboard showing patient list
- **Features**:
  - Display all patients for logged-in therapist
  - Add new patient
  - Edit existing patient
  - Delete patient
  - View patient's songs
  - Logout
- **Props**: 
  - `userId: string` (therapist's UUID)
  - `onLogout()`
- **Database Tables**: `patients`, `songs` (for counts)

#### `PatientForm.tsx`
- **Purpose**: Modal form for adding/editing patients
- **Fields**: Name, DOB, diagnoses, goals
- **Props**: 
  - `userId: string` (therapist UUID)
  - `existingPatient?: Patient` (for editing)
  - `onClose()`
  - `onSuccess()`

#### `PatientSongs.tsx`
- **Purpose**: View all songs for a specific patient
- **Features**:
  - List songs with audio players
  - Play/pause audio
  - View song metadata (moods, tempo, form, etc.)
  - Add notes to songs
  - Waveform visualization (WaveSurfer.js)
- **Route**: `/patient/:patientId/songs`
- **Database Tables**: `patients`, `songs`

#### `MakeNotes.tsx`
- **Purpose**: Add therapeutic notes to a completed song
- **Features**:
  - View song details
  - Audio player
  - Text area for notes
  - Save notes to database
- **Route**: `/patient/:patientId/song/:songId/notes`
- **Database**: Updates `songs.notes` field

### Song Creation Components

#### `CreateSongChoice.tsx`
- **Purpose**: Choose between lyrics vs instrumental song
- **Features**: Two large buttons with descriptions
- **Navigation**: 
  - "With Lyrics" → `/create-song/lyrics`
  - "Instrumental" → `/create-song/instrumental`

#### `GenerateLyrics.tsx`
- **Purpose**: Song creation with vocals
- **Features**:
  - Option A: Upload/draw a picture → analyze → get suggestions
  - Option B: Record audio → extend with Suno AI
- **Includes**:
  - `DrawingUpload` component
  - `AudioRecorder` component
- **Flow**: Sets up initial parameters → Navigate to motif page

#### `GenerateNoLyrics.tsx`
- **Purpose**: Instrumental song creation
- **Features**: Upload drawing → analyze → get musical parameters
- **Includes**: `DrawingUpload` or `DrawingCanvas`
- **Flow**: Similar to GenerateLyrics but instrumental only

#### `MotifAndInstrumentation.tsx`
- **Purpose**: Set detailed musical parameters
- **Features**:
  - Form selection (AB, ABA, ABAB, etc.)
  - Mood tags (happy, sad, calm, energetic, etc.)
  - Tempo (BPM slider)
  - Vocal gender (for lyrical songs)
  - Style (pop, rock, classical, etc.)
  - Prompt generation (manual or AI-assisted)
  - Custom lyrics (optional)
- **State**: Receives data from previous steps via `location.state`
- **Submission**: Calls `/generate` or `/generate/upload-extend` API
- **Navigation**: Goes to `/create-song/loading` with task ID

#### `LoadingSong.tsx`
- **Purpose**: Poll for song completion
- **Features**:
  - Shows loading animation
  - Polls backend every 5 seconds for task status
  - Detects completion by checking if song exists in database
  - Handles multiple song versions (Suno generates 2 variants)
- **Route**: `/create-song/loading?taskId=xxx&patientId=yyy`
- **Success**: Navigates to `/patient/:patientId/songs`

### Utility Components

#### `DrawingCanvas.tsx`
- **Purpose**: In-browser drawing canvas
- **Features**:
  - Canvas with pen tool
  - Color picker
  - Brush size adjustment
  - Clear canvas
  - Export as image
- **Usage**: Embedded in `GenerateNoLyrics.tsx`

#### `DrawingUpload.tsx`
- **Purpose**: Upload existing drawing/image
- **Features**:
  - File input (accepts images)
  - Preview uploaded image
  - Send to `/analyze-drawing` API
  - Display analysis results
- **Returns**: Musical suggestions object

#### `AudioRecorder.tsx`
- **Purpose**: Record audio in browser
- **Features**:
  - Start/stop recording
  - Live waveform visualization
  - Playback recorded audio
  - Export as WAV/WebM
  - Upload to backend
- **APIs Used**: 
  - `navigator.mediaDevices.getUserMedia()`
  - `MediaRecorder` API
  - WaveSurfer.js for visualization

### UI Component Library (`components/ui/`)

Reusable components built on Radix UI:
- `button.tsx` - Styled button variants
- `input.tsx` - Text inputs
- `textarea.tsx` - Multi-line text inputs
- `select.tsx` - Dropdown selects
- `slider.tsx` - Range sliders (for tempo, etc.)
- `dialog.tsx` - Modal dialogs
- `card.tsx` - Content cards
- `badge.tsx` - Status badges
- `progress.tsx` - Loading progress bars
- `tabs.tsx` - Tab navigation
- `accordion.tsx` - Collapsible sections
- And many more...

---

## 🔌 Backend API

### Endpoints

#### **POST /generate**
Generate a new song from text prompt.

**Request Body**:
```typescript
{
  prompt: string;              // Text description of song
  style?: string;              // e.g., "Pop", "Rock"
  title?: string;              // Song title
  customMode?: boolean;        // Use custom parameters
  instrumental?: boolean;      // No vocals
  model?: string;              // Default: "V4"
  vocalGender?: string;        // "m" | "f"
  styleWeight?: number;        // 0-1
  weirdnessConstraint?: number; // 0-1
  audioWeight?: number;        // 0-1
  callBackUrl?: string;        // Webhook URL
  
  // App metadata
  userId?: string;             // Therapist UUID
  patientId?: string;          // Patient UUID
  withLyrics?: boolean;        // Has vocals
  form?: string;               // "AB", "ABA", etc.
  moods?: string[];            // ["happy", "calm"]
  tempo_bpm?: number;          // BPM
  notes?: string;              // Free-form notes
}
```

**Response**: Suno API response with `task_id`

**Flow**:
1. Validates `SUNO_API_KEY` exists
2. Adds callback URL (from `PUBLIC_BASE_URL`)
3. Calls Suno AI API
4. Stores metadata in `pending_metadata` dict (keyed by task_id)
5. Returns Suno response to frontend

#### **POST /generate/upload-extend**
Extend uploaded audio into a full song.

**Request Body**:
```typescript
{
  uploadUrl: string;           // Public URL to audio file
  defaultParamFlag?: boolean;  // Use default params
  instrumental?: boolean;
  prompt?: string;             // Description for extension
  style?: string;
  title?: string;
  continueAt?: number;         // Time in seconds to start extending
  model?: string;              // Default: "V3_5"
  
  // Similar metadata fields as /generate
}
```

**Response**: Suno API response with `task_id`

#### **POST /upload**
Upload audio file for extension.

**Request**: `multipart/form-data` with file

**Response**:
```json
{
  "uploadUrl": "http://backend-url/uploads/uuid.webm"
}
```

**Purpose**: Temporarily store user-recorded audio before sending to Suno

#### **POST /analyze-drawing**
Analyze drawing image for musical characteristics.

**Request**: `multipart/form-data` with image file

**Response**:
```typescript
{
  imageUrl: string;
  curvature: "smooth" | "angular" | "mixed";
  complexity: "simple" | "moderate" | "complex";
  dominantColors: string[];  // ["red", "blue", "dark"]
  intensity: "low" | "medium" | "high";
  patterns: string[];        // ["flowing lines", "bold strokes"]
  trajectory: "rising" | "falling" | "stable";
  trajectoryDescription: string;
  peakLocation: "early" | "middle" | "late";
  musicalSuggestions: {
    tempo: number;           // BPM
    structure: string;       // "Build to climax", etc.
    dynamics: string;        // "Start soft, build to forte"
    style: string;           // "ambient, minimalist"
    mood: string;            // "peaceful, contemplative"
    instrumentation: string; // "piano, strings"
  };
}
```

**Analysis Includes**:
- Color analysis (dominant colors, brightness)
- Edge detection (smooth vs angular)
- Complexity (color variance)
- Trajectory analysis (does drawing rise/fall/stay level)
- Pattern detection

#### **POST /webhook**
Webhook receiver for Suno AI completion notifications.

**Called By**: Suno AI when song generation completes

**Flow**:
1. Receives payload with song data
2. Extracts `task_id` and `audio_url`
3. Looks up metadata from `pending_metadata[task_id]`
4. Downloads audio from Suno CDN
5. Uploads to Supabase Storage for permanent storage
6. Inserts song record into database with metadata
7. Cleans up `pending_metadata`

**Purpose**: Automatically save completed songs to database

#### **GET /result/:task_id**
Get webhook result for a specific task.

**Response**: Webhook payload (if received)

**Purpose**: Frontend polling to check if song is complete

#### **GET /webhook/status**
Debug endpoint to check last webhook received.

#### **GET /db/health**
Check database connection health.

**Response**:
```json
{
  "ok": true,
  "client": true,
  "count": 10
}
```

#### **GET /proxy-audio?url=...**
Proxy audio from external URLs (e.g., Suno CDN).

**Purpose**: 
- Bypass CORS issues
- Support Range requests for audio streaming
- Used for temporary Suno URLs before Supabase upload completes

#### **POST /debug/test-insert**
Debug endpoint to test database inserts.

#### **GET /debug/pending-metadata**
View pending songs awaiting webhook.

---

## 🗄️ Database Schema

### Tables

#### **`therapists`**
Stores therapist profiles.

```sql
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_therapist BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);
```

**Row Level Security (RLS)**: 
- Therapists can only see their own record
- `SELECT`: `auth.uid() = user_id`

#### **`patients`**
Stores patient information.

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES therapists(user_id) NOT NULL,
  name TEXT NOT NULL,
  dob DATE,
  diagnoses TEXT[],
  goals TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**RLS**:
- Therapists can only see their own patients
- `SELECT/UPDATE/DELETE`: `auth.uid() = user_id`

#### **`songs`**
Stores generated songs with metadata.

```sql
CREATE TABLE songs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES therapists(user_id) NOT NULL,
  patient_id UUID REFERENCES patients(id),
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  task_id TEXT,
  
  -- Musical characteristics
  with_lyrics BOOLEAN,
  form TEXT,                    -- "AB", "ABA", etc.
  moods TEXT[],                 -- ["happy", "energetic"]
  style TEXT,                   -- "Pop", "Classical"
  tempo_bpm INTEGER,
  prompt TEXT,                  -- Generation prompt
  vocal_gender TEXT,            -- "m" | "f"
  
  -- Metadata
  notes TEXT,                   -- Therapist notes
  origin TEXT CHECK (origin IN ('generated', 'upload_extend', 'webhook')),
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**RLS**:
- Therapists can only see songs they created
- `SELECT`: `auth.uid() = user_id`

**Indexes**:
- `user_id` (for therapist queries)
- `patient_id` (for patient song lists)
- `task_id` (for webhook lookups)

### Supabase Storage

#### **`songs` bucket**
Stores permanent audio files.

**Structure**: `song_{id}_{uuid}.mp3`

**Purpose**: Move audio from temporary Suno CDN to permanent storage

**Access**: Public read, authenticated write

---

## ⭐ Key Features

### 1. Drawing-to-Music Analysis

**How It Works**:
1. User uploads or draws image
2. Backend analyzes:
   - **Color**: Dominant colors → Mood mapping
   - **Curvature**: Smooth lines vs angular shapes → Style
   - **Complexity**: Number of elements → Instrumentation density
   - **Trajectory**: Does drawing rise/fall → Song dynamics & structure
   - **Intensity**: Stroke weight → Energy level
3. Returns musical suggestions that map visual → audio

**Mapping Examples**:
- Red colors → "passionate" mood
- Blue colors → "peaceful, calm" mood
- Smooth curves → "flowing, ambient" style
- Angular shapes → "rhythmic, energetic" style
- Rising trajectory → "Build to climactic ending"
- Falling trajectory → "Start strong, resolve gently"

### 2. Audio Extension

**How It Works**:
1. User records audio (vocals, sounds, humming)
2. Frontend captures using `MediaRecorder` API
3. Upload to backend `/upload` endpoint
4. Backend saves to `/uploads/` directory
5. Send `uploadUrl` to Suno AI's upload-extend endpoint
6. Suno AI analyzes audio and extends it into full song
7. Result comes back via webhook

**Use Cases**:
- Patient hums a melody → Full orchestration
- Patient speaks → Song with their voice as foundation
- Patient plays instrument → Extended composition

### 3. Prompt Engineering

**Automatic Prompt Generation**:
```typescript
const generatePrompt = () => {
  let prompt = "";
  
  // Add form structure
  if (form) prompt += `Song structure: ${form}. `;
  
  // Add moods
  if (moods.length > 0) {
    prompt += `Mood: ${moods.join(", ")}. `;
  }
  
  // Add tempo
  if (tempo) prompt += `Tempo: ${tempo} BPM. `;
  
  // Add style
  if (style) prompt += `Style: ${style}. `;
  
  // Add vocal gender
  if (vocalGender) {
    prompt += `${vocalGender === "m" ? "Male" : "Female"} vocals. `;
  }
  
  // Add instrumentation from drawing analysis
  if (musicalSuggestions) {
    prompt += musicalSuggestions.instrumentation;
  }
  
  return prompt;
};
```

**Manual Override**: Users can edit generated prompts

### 4. Multi-Version Generation

Suno AI generates **2 versions** of each song:
- Frontend creates separate entries for each
- Titles: "Song Title (v1)" and "Song Title (v2)"
- Therapist can choose preferred version

### 5. Polling Architecture

**Why Polling?**
- Song generation takes 30-60 seconds
- Frontend needs to know when complete

**How It Works**:
```typescript
// LoadingSong.tsx
useEffect(() => {
  const interval = setInterval(async () => {
    // Check if song exists in database
    const { data } = await supabase
      .from("songs")
      .select("*")
      .eq("task_id", taskId);
    
    if (data && data.length > 0) {
      // Song complete!
      navigate(`/patient/${patientId}/songs`);
    }
  }, 5000); // Every 5 seconds
  
  return () => clearInterval(interval);
}, [taskId]);
```

**Alternative**: Could use Supabase real-time subscriptions

---

## 💻 Development Guide

### Prerequisites

- Node.js 18+
- Python 3.13+
- Supabase account
- Suno AI API key

### Local Setup

See `SETUP.md` for detailed instructions.

**Quick Start**:

```bash
# Frontend
npm install
npm run dev

# Backend (in separate terminal)
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Environment Variables

**Frontend** (`.env`):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Backend** (`backend/.env`):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUNO_API_KEY=your_suno_key
PUBLIC_BASE_URL=http://localhost:8000
```

### Adding a New Component

1. Create in `src/components/`
2. Follow naming convention: PascalCase
3. Use TypeScript interfaces for props
4. Import from `ui/` for styled elements
5. Add to routing in `App.tsx` if it's a page

### Adding a New API Endpoint

1. Add route in `backend/main.py`
2. Use Pydantic models for request validation
3. Add error handling with try/catch
4. Return consistent response format
5. Document in this guide

### Database Changes

1. Make changes in Supabase dashboard
2. Update RLS policies if needed
3. Test with actual user authentication
4. Update schema documentation here

### Debugging Tips

**Frontend**:
- Check browser console for errors
- Use React DevTools
- Verify environment variables: `console.log(import.meta.env)`

**Backend**:
- Backend logs to console (print statements)
- Check `/webhook/status` for webhook debugging
- Use `/debug/pending-metadata` to see what's stored
- Test database with `/db/health`

**Common Issues**:
- **"Supabase client not initialized"**: Check backend `.env` file
- **CORS errors**: Verify backend `allow_origins` includes your frontend URL
- **Song not appearing**: Check webhook received (`/webhook/status`)
- **Audio not playing**: Check CORS, try audio proxy endpoint

---

## 🚀 Deployment

### Frontend (Vercel)

```bash
# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

### Backend (AWS EC2)

See `AWS_DEPLOYMENT_GUIDE.md` for detailed instructions.

**Key Steps**:
1. Launch EC2 instance
2. Install Python and dependencies
3. Set up environment variables
4. Run with `uvicorn` or `systemd` service
5. Configure security groups for port 8000
6. Set `PUBLIC_BASE_URL` to EC2 public IP/domain

### Database (Supabase)

Already hosted - just configure:
1. Row Level Security policies
2. Storage buckets
3. Auth providers

---

## 📝 Code Style

### TypeScript
- Use functional components with hooks
- Prefer `const` over `let`
- Use TypeScript interfaces for data structures
- Avoid `any` type

### Python
- Follow PEP 8
- Use type hints
- Descriptive variable names
- Add docstrings to functions

### Naming Conventions
- **Components**: PascalCase (`PatientForm.tsx`)
- **Functions**: camelCase (`generatePrompt`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Files**: Match component name

---

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes with clear commit messages
3. Test thoroughly
4. Update documentation
5. Submit pull request

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Suno AI API**: https://sunoapi.org
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **React Router**: https://reactrouter.com
- **Tailwind CSS**: https://tailwindcss.com
- **Radix UI**: https://www.radix-ui.com

---

## 🐛 Known Issues / TODOs

- [ ] Add real-time updates instead of polling
- [ ] Implement song editing (re-generate with tweaks)
- [ ] Add song sharing/export features
- [ ] Improve error handling for failed generations
- [ ] Add more drawing analysis parameters
- [ ] Implement song versioning/history
- [ ] Add collaborative features (multiple therapists)
- [ ] Optimize Supabase Storage usage
- [ ] Add comprehensive testing

---

**Last Updated**: January 2026

**Questions?** Contact the development team or check `SETUP.md` for help.

