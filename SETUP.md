# Human-AI Songwriter Setup Guide

This guide will help you set up the Human-AI Songwriter application locally.

## Prerequisites

- Node.js (v18 or higher)
- Python 3.13 or higher
- A Supabase account and project
- A Suno API key

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/human-ai-songwriter.git
cd human-ai-songwriter
```

### 2. Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a Python virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Create environment file:
```bash
cp .env.example .env
```

5. Edit `backend/.env` and add your credentials:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUNO_API_KEY=your-suno-api-key-here
PUBLIC_BASE_URL=http://localhost:8000
```

6. Start the backend server:
```bash
python main.py
```

The backend will be available at `http://localhost:8000`

## Getting API Keys

### Supabase

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to Project Settings > API
4. Copy the Project URL and anon/public key for the frontend
5. Copy the service_role key for the backend

### Suno API

1. Visit [Suno API documentation](https://sunoapi.org) for information on obtaining an API key
2. Add the key to your `backend/.env` file

## Database Setup

The application uses Supabase for authentication and data storage. You'll need to set up the following tables in your Supabase project:

- `songs` - Stores generated songs
- `patients` - Stores patient information
- (Add other tables as needed)

Refer to the database schema in the project documentation for more details.

## Troubleshooting

### Frontend Issues

- **Module not found errors**: Run `npm install` again
- **Supabase connection errors**: Check your `.env` file has the correct keys
- **Port already in use**: The default port is 5173, you can change it in `vite.config.ts`

### Backend Issues

- **Import errors**: Make sure your virtual environment is activated and dependencies are installed
- **Supabase connection errors**: Verify your `backend/.env` has the correct service role key
- **Port already in use**: The default port is 8000, you can change it in `main.py`

## Production Deployment

Refer to `AWS_DEPLOYMENT_GUIDE.md` for instructions on deploying to production environments.

## Contributing

Please ensure you never commit sensitive information like API keys or passwords. All sensitive data should be in `.env` files which are excluded from git.

