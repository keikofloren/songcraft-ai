# 🎵 Human-AI Songwriter

An AI-powered music therapy application that helps therapists create personalized, therapeutic songs for their patients using advanced AI music generation, drawing analysis, and audio recording capabilities.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Human-AI Songwriter** bridges the gap between music therapy and artificial intelligence. It provides therapists with an intuitive platform to create meaningful, personalized songs for patients by:

- Converting patient drawings into musical characteristics
- Extending recorded vocals or sounds into full compositions
- Generating songs from therapeutic prompts and parameters
- Managing patient profiles and their song libraries
- Adding therapeutic notes and documentation

### Use Case

Music therapists can:
1. **Create personalized songs** based on patient input (drawings, vocals, preferences)
2. **Manage multiple patients** and track their song collections
3. **Document sessions** with therapeutic notes attached to songs
4. **Generate both lyrical and instrumental pieces** tailored to therapeutic goals

---

## ✨ Key Features

### 🎨 Drawing-to-Music Conversion
- Upload or draw images that represent emotions or concepts
- AI analyzes visual characteristics (color, curvature, trajectory, complexity)
- Automatically generates musical suggestions (tempo, mood, style, dynamics)

### 🎤 Audio Extension
- Record patient vocals, humming, or sounds directly in the browser
- Extend short audio clips into full-length songs using AI
- Preserve the patient's voice or musical ideas in the final composition

### 🎹 Comprehensive Musical Control
- Song structure/form (AB, ABA, ABAB, etc.)
- Mood selection (happy, sad, calm, energetic, and more)
- Tempo control (BPM)
- Vocal gender selection
- Genre/style specification
- Custom or AI-generated prompts

### 👥 Patient Management
- Secure therapist authentication
- Add, edit, and manage patient profiles
- Track diagnoses, goals, and date of birth
- View complete song history per patient

### 📝 Therapeutic Documentation
- Add notes to each song for session documentation
- Track which songs work best for which patients
- Build a library of effective therapeutic interventions

### 🎧 Audio Player with Visualization
- Waveform visualization for each song
- Play/pause controls
- Multiple song versions (AI generates 2 variants per request)

---

## 🛠️ Technology Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite 7** (build tool)
- **React Router v7** (routing)
- **Tailwind CSS 4** + **DaisyUI** (styling)
- **Radix UI** (accessible component primitives)
- **WaveSurfer.js** (audio visualization)
- **Supabase** (auth & database client)

### Backend
- **FastAPI** (Python 3.13)
- **Supabase** (PostgreSQL database, auth, storage)
- **Suno AI API** (music generation)
- **PIL + NumPy** (image analysis)
- **Requests** (HTTP client)

### Infrastructure
- **Frontend**: Deployed on Vercel
- **Backend**: AWS EC2 (or Elastic Beanstalk)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (audio files)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **Python** 3.13 or higher
- **Supabase** account (free tier works)
- **Suno AI API** key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/human-ai-songwriter.git
   cd human-ai-songwriter
   ```

2. **Set up environment variables**
   ```bash
   # Frontend
   cp .env.example .env
   # Edit .env and add your Supabase credentials
   
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env and add all required credentials
   ```

3. **Install frontend dependencies**
   ```bash
   npm install
   ```

4. **Install backend dependencies**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

5. **Run the development servers**
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend
   cd backend
   source venv/bin/activate
   python main.py
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000

For detailed setup instructions, see **[SETUP.md](./SETUP.md)**.

---

## 📚 Documentation

We've prepared comprehensive documentation to help you understand and work with this project:

### Essential Reading

- **[🚨 URGENT_DO_NOT_PUSH.md](./URGENT_DO_NOT_PUSH.md)** - **READ FIRST!** Critical security information
- **[📖 SETUP.md](./SETUP.md)** - Complete local development setup guide
- **[🔐 SECURITY_CLEANUP.md](./SECURITY_CLEANUP.md)** - How to clean secrets from git history
- **[🐙 GITHUB_SETUP.md](./GITHUB_SETUP.md)** - Safe GitHub repository setup

### Understanding the Codebase

- **[📘 CODEBASE_GUIDE.md](./CODEBASE_GUIDE.md)** - **Comprehensive technical documentation**
  - Architecture overview
  - Complete component guide
  - API documentation
  - Database schema
  - Workflows and data flows
  - Development guide

### Quick Reference

- **[⚡ QUICK_START.md](./QUICK_START.md)** - Quick overview of changes and next steps
- **[🔑 README_FIRST.md](./README_FIRST.md)** - Security checklist and important info

### Deployment

- **[☁️ AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)** - AWS deployment instructions
- **[📝 REFACTOR_SUMMARY.md](./REFACTOR_SUMMARY.md)** - Project refactoring notes

---

## 📁 Project Structure

```
human-ai-songwriter/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   │   ├── HomePage.tsx          # Landing page
│   │   ├── TherapistLogin.tsx    # Authentication
│   │   ├── TherapistDashboard.tsx # Patient management
│   │   ├── PatientSongs.tsx      # Song library viewer
│   │   ├── CreateSongChoice.tsx  # Song type selection
│   │   ├── GenerateLyrics.tsx    # Vocal song creation
│   │   ├── GenerateNoLyrics.tsx  # Instrumental creation
│   │   ├── MotifAndInstrumentation.tsx # Musical parameters
│   │   ├── LoadingSong.tsx       # Generation progress
│   │   ├── DrawingCanvas.tsx     # In-browser drawing
│   │   ├── DrawingUpload.tsx     # Image upload & analysis
│   │   ├── AudioRecorder.tsx     # Audio recording
│   │   └── ui/                   # Reusable UI components
│   ├── api/                      # API client code
│   ├── lib/                      # Utility libraries
│   └── App.tsx                   # Main application router
│
├── backend/                      # FastAPI backend
│   ├── main.py                   # API server
│   ├── requirements.txt          # Python dependencies
│   └── uploads/                  # Temporary file storage
│
├── public/                       # Static assets
├── .env.example                  # Frontend env template
├── backend/.env.example          # Backend env template
├── package.json                  # Node dependencies
├── vite.config.ts                # Vite configuration
└── [Documentation files]         # *.md guides
```

---

## 🖼️ Screenshots

### Therapist Dashboard
Manage patients and access their song libraries.

### Song Creation Flow
1. Choose between lyrical or instrumental
2. Upload drawing or record audio
3. Set musical parameters (mood, tempo, style)
4. Wait for AI generation
5. Listen to results and add therapeutic notes

### Drawing Analysis
Upload artwork → AI analyzes visual properties → Musical suggestions

### Patient Song Library
View all songs for a patient with audio players and waveform visualization.

---

## 🏗️ How It Works

### 1. Authentication Flow
```
Login → Supabase Auth → Dashboard
```

### 2. Song Creation Flow
```
Select Patient → Choose Type (Lyrics/Instrumental)
     ↓
Option A: Upload Drawing → Analyze → Musical Suggestions
Option B: Record Audio → Upload → Extend with AI
     ↓
Set Parameters (Form, Mood, Tempo, Style, Vocals)
     ↓
Generate → Suno AI (async) → Webhook → Database
     ↓
Poll for Completion → Success → View in Library
```

### 3. Drawing-to-Music Analysis
The backend analyzes uploaded images for:
- **Color**: Mood mapping (red→passionate, blue→calm)
- **Curvature**: Style (smooth→flowing, angular→rhythmic)
- **Complexity**: Instrumentation density
- **Trajectory**: Song dynamics (rising→crescendo, falling→decrescendo)
- **Intensity**: Energy level

### 4. Audio Extension
- Records audio using Web Audio API
- Uploads to backend
- Suno AI extends short clip into full song
- Preserves original characteristics

See **[CODEBASE_GUIDE.md](./CODEBASE_GUIDE.md)** for detailed technical explanations.

---

## 🔒 Security Note

⚠️ **This repository contains security-sensitive setup requirements.**

Before pushing to GitHub or sharing this code:
1. Read **[URGENT_DO_NOT_PUSH.md](./URGENT_DO_NOT_PUSH.md)**
2. Follow **[SECURITY_CLEANUP.md](./SECURITY_CLEANUP.md)**
3. Never commit `.env` files
4. Rotate API keys if exposed

All sensitive credentials should be in `.env` files (excluded by `.gitignore`).

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Keep commits atomic and well-described

See **[CODEBASE_GUIDE.md](./CODEBASE_GUIDE.md)** for detailed development guidelines.

---

## 🐛 Known Issues

- Audio proxy may have CORS issues on some browsers
- Song generation takes 30-60 seconds (Suno AI limitation)
- Multiple versions created per generation (Suno generates 2)
- Polling architecture could be replaced with real-time subscriptions

See the "Known Issues / TODOs" section in **[CODEBASE_GUIDE.md](./CODEBASE_GUIDE.md)**.

---

## 📖 API Documentation

### Frontend API

The frontend communicates with the backend through these main endpoints:

- `POST /generate` - Generate song from text prompt
- `POST /generate/upload-extend` - Extend uploaded audio
- `POST /upload` - Upload audio file
- `POST /analyze-drawing` - Analyze image for musical characteristics
- `POST /webhook` - Suno AI callback (internal)
- `GET /result/:task_id` - Check generation status

Full API documentation in **[CODEBASE_GUIDE.md](./CODEBASE_GUIDE.md#-backend-api)**.

---

## 🧪 Testing

```bash
# Run frontend tests (if implemented)
npm test

# Run backend tests (if implemented)
cd backend
pytest
```

*Note: Comprehensive test suite is a TODO item*

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **Development Team** - Initial work and ongoing development

---

## 🙏 Acknowledgments

- **Supabase** for providing an excellent backend-as-a-service platform
- **Suno AI** for powerful music generation capabilities
- **Radix UI** for accessible component primitives
- **The music therapy community** for inspiration and use case guidance

---

## 📞 Support

For questions or issues:

1. Check the **[CODEBASE_GUIDE.md](./CODEBASE_GUIDE.md)** for technical details
2. Review **[SETUP.md](./SETUP.md)** for setup issues
3. Open an issue on GitHub
4. Contact the development team

---

## 🗺️ Roadmap

- [ ] Real-time updates instead of polling
- [ ] Song editing/regeneration with tweaks
- [ ] Song sharing and export features
- [ ] Enhanced drawing analysis parameters
- [ ] Collaborative features (multiple therapists)
- [ ] Mobile app version
- [ ] Comprehensive test suite
- [ ] Song history/versioning
- [ ] Advanced audio effects and mixing

---

## 📊 Project Status

**Current Version**: 1.0.0 (Active Development)

**Last Updated**: January 2026

This project is actively maintained and under continuous development.

---

<div align="center">

**Built with ❤️ for music therapists**

[Report Bug](https://github.com/YOUR_USERNAME/human-ai-songwriter/issues) · [Request Feature](https://github.com/YOUR_USERNAME/human-ai-songwriter/issues)

</div>
