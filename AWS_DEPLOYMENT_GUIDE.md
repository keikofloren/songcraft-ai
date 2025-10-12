# AWS Deployment Guide for SongCraft AI

## Overview

This guide will help you deploy your SongCraft AI application on AWS with a React frontend and FastAPI backend.

## Architecture

- **Frontend**: React app hosted on AWS Amplify or S3 + CloudFront
- **Backend**: FastAPI on AWS EC2 or AWS Elastic Beanstalk
- **Database**: Supabase (already configured)

---

## Option 1: Quick Deployment (Recommended for Beginners)

### Frontend Deployment - AWS Amplify

#### Step 1: Prepare Your Repository

1. Initialize git repository (if not already done):

```bash
git init
git add .
git commit -m "Initial commit"
```

2. Push to GitHub:

```bash
# Create a new repository on GitHub first
git remote add origin https://github.com/yourusername/human-ai-songwriter.git
git branch -M main
git push -u origin main
```

#### Step 2: Deploy with AWS Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Select "GitHub" and authorize AWS Amplify
4. Choose your repository
5. Configure build settings:
   - Build command: `npm run build`
   - Base directory: `/` (root)
   - Output directory: `dist`
6. Add environment variables (if needed):
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
7. Click "Save and deploy"

**Cost**: Free tier includes 1000 build minutes/month

---

### Backend Deployment - AWS EC2

#### Step 1: Launch EC2 Instance

1. Go to [EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click "Launch Instance"
3. Configuration:
   - **Name**: SongCraft-Backend
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.micro (free tier) or t2.small
   - **Key pair**: Create new or use existing
   - **Security Group**: Create new with rules:
     - SSH (22) - Your IP
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0
     - Custom TCP (8000) - 0.0.0.0/0 (for FastAPI)
4. Launch instance

#### Step 2: Connect to EC2 Instance

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

#### Step 3: Setup Backend on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3-pip python3-venv -y

# Install nginx
sudo apt install nginx -y

# Clone your repository (or upload files)
git clone https://github.com/yourusername/human-ai-songwriter.git
cd human-ai-songwriter/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
nano .env
```

#### Step 4: Configure .env File

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUNO_API_KEY=your_suno_api_key
PORT=8000
```

#### Step 5: Setup Systemd Service

```bash
sudo nano /etc/systemd/system/songcraft-api.service
```

Add this content:

```ini
[Unit]
Description=SongCraft API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/human-ai-songwriter/backend
Environment="PATH=/home/ubuntu/human-ai-songwriter/backend/venv/bin"
ExecStart=/home/ubuntu/human-ai-songwriter/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl start songcraft-api
sudo systemctl enable songcraft-api
sudo systemctl status songcraft-api
```

#### Step 6: Configure Nginx as Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/songcraft
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or EC2 IP

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/songcraft /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 7: Setup SSL (Optional but Recommended)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

**Backend URL**: `http://your-ec2-ip` or `https://your-domain.com`

---

## Option 2: Advanced Deployment

### Frontend - S3 + CloudFront

#### Step 1: Build Your App

```bash
npm run build
```

#### Step 2: Create S3 Bucket

1. Go to [S3 Console](https://console.aws.amazon.com/s3/)
2. Create bucket: `songcraft-frontend`
3. Uncheck "Block all public access"
4. Upload `dist/` folder contents

#### Step 3: Enable Static Website Hosting

1. Go to bucket → Properties → Static website hosting
2. Enable it
3. Index document: `index.html`
4. Error document: `index.html` (for SPA routing)

#### Step 4: Set Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::songcraft-frontend/*"
    }
  ]
}
```

#### Step 5: Setup CloudFront

1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Create distribution
3. Origin domain: Select your S3 bucket
4. Viewer protocol policy: Redirect HTTP to HTTPS
5. Cache policy: Managed-CachingOptimized
6. Create distribution

**Frontend URL**: Your CloudFront URL (e.g., `https://d123abc.cloudfront.net`)

---

### Backend - Elastic Beanstalk (Alternative to EC2)

#### Step 1: Install EB CLI

```bash
pip install awsebcli
```

#### Step 2: Initialize EB

```bash
cd backend
eb init -p python-3.11 songcraft-api --region us-east-1
```

#### Step 3: Create Environment

```bash
eb create songcraft-production
```

#### Step 4: Configure Environment Variables

```bash
eb setenv SUPABASE_URL=your_url SUPABASE_KEY=your_key SUNO_API_KEY=your_key
```

#### Step 5: Deploy

```bash
eb deploy
```

---

## Post-Deployment Configuration

### Update Frontend to Use Backend API

Update your frontend environment variables:

**In Amplify Console:**

- Go to App Settings → Environment variables
- Add: `VITE_API_URL` = `https://your-backend-domain.com`

**Update your API calls** in `src/api/suno.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
```

---

## Cost Estimation (Monthly)

### Option 1 (Amplify + EC2):

- **AWS Amplify**: Free tier (first 12 months) or ~$0.01/build minute
- **EC2 t2.micro**: Free tier (first 12 months) or ~$8.50/month
- **EC2 t2.small**: ~$17/month
- **Data Transfer**: ~$0.09/GB
- **Total**: $0-25/month

### Option 2 (S3 + CloudFront + Elastic Beanstalk):

- **S3**: ~$0.023/GB storage
- **CloudFront**: ~$0.085/GB data transfer
- **Elastic Beanstalk**: Free (just pay for EC2)
- **Total**: $10-30/month

---

## Domain Setup (Optional)

### Using Route 53

1. Register domain in Route 53 (~$12/year)
2. Create hosted zone
3. Point A record to:
   - CloudFront distribution (frontend)
   - EC2 Elastic IP (backend)

---

## Monitoring & Maintenance

### CloudWatch Logs

```bash
# View backend logs
sudo journalctl -u songcraft-api -f

# Or use CloudWatch
aws logs tail /aws/elasticbeanstalk/songcraft-production/var/log/eb-engine.log --follow
```

### Auto-Scaling (Optional)

For production traffic, configure:

- EC2 Auto Scaling Groups
- Application Load Balancer
- RDS for database (instead of Supabase)

---

## Troubleshooting

### Frontend Issues

- Check Amplify build logs
- Verify environment variables
- Check browser console for errors

### Backend Issues

```bash
# Check service status
sudo systemctl status songcraft-api

# View logs
sudo journalctl -u songcraft-api -n 50

# Restart service
sudo systemctl restart songcraft-api
```

### CORS Issues

Update `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Security Best Practices

1. **Never commit .env files** to git
2. **Use AWS Secrets Manager** for sensitive data
3. **Enable HTTPS** everywhere (SSL certificates)
4. **Restrict Security Group** rules to necessary IPs
5. **Regular updates**: `sudo apt update && sudo apt upgrade`
6. **Use IAM roles** instead of access keys
7. **Enable CloudWatch** monitoring
8. **Setup backup strategy** for databases

---

## Quick Commands Reference

```bash
# Frontend - Amplify
amplify publish

# Backend - EC2
sudo systemctl restart songcraft-api
sudo systemctl status songcraft-api
sudo journalctl -u songcraft-api -f

# Backend - Elastic Beanstalk
eb deploy
eb status
eb logs

# Update code
git pull
# Then restart service or redeploy
```

---

## Support

For AWS-specific issues:

- [AWS Documentation](https://docs.aws.amazon.com/)
- [AWS Support](https://console.aws.amazon.com/support/)
- [AWS Free Tier](https://aws.amazon.com/free/)

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Deploy frontend with Amplify
3. ✅ Launch EC2 instance for backend
4. ✅ Configure domain (optional)
5. ✅ Setup SSL certificates
6. ✅ Test end-to-end functionality
7. ✅ Setup monitoring and alerts
