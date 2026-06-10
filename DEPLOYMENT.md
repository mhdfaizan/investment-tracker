# Deployment Guide

## Prerequisites

1. **Google Cloud Project** with Sheets API enabled
2. **Google Service Account** with JSON key
3. **Google Spreadsheet** shared with the service account email
4. **GitHub** account to host the code

## Step 1: Set Up Google Sheets Access

### 1.1 Create a Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable the **Google Sheets API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API" and enable it

### 1.2 Create a Service Account
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Give it a name (e.g., "investment-tracker")
4. Grant role: "Editor" (or "Viewer" if read-only)
5. Click "Done"

### 1.3 Get the JSON Key
1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key" > "JSON"
4. Download the JSON file
5. **Copy the entire contents** of this file

### 1.4 Get Your Spreadsheet ID
1. Open your Google Spreadsheet in a browser
2. The URL looks like: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Copy the `SPREADSHEET_ID` part

### 1.5 Share Your Spreadsheet
1. Open your Google Spreadsheet
2. Click "Share"
3. Add the service account email (found in the JSON key as `client_email`)
4. Give it "Editor" access

## Step 2: Deploy to Render (Recommended)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/investment-tracker.git
   git push -u origin main
   ```

2. Go to [render.com](https://render.com) and sign up/log in

3. Click "New" > "Web Service"

4. Connect your GitHub repository

5. Configure:
   - **Name**: `investment-tracker`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

6. Add Environment Variables (under "Environment" tab):
   - `GOOGLE_SHEET_ID`: Your spreadsheet ID
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: The entire JSON key content (minified to one line)
   - `NODE_ENV`: `production`

7. Click "Create Web Service"

8. Wait for the build to complete. Your app will be live at `https://investment-tracker.onrender.com`

## Step 3: Alternative - Deploy to Railway

1. Push code to GitHub (same as above)

2. Go to [railway.app](https://railway.app) and sign up/log in

3. Click "New Project" > "Deploy from GitHub repo"

4. Select your repository

5. Add Environment Variables:
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_KEY`
   - `NODE_ENV`: `production`

6. Railway auto-detects the `Procfile` and deploys

## Step 4: Alternative - Deploy with Docker

1. Build the image:
   ```bash
   docker build -t investment-tracker .
   ```

2. Run the container:
   ```bash
   docker run -p 3001:3001 \
     -e GOOGLE_SHEET_ID=your_id \
     -e GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}' \
     -e NODE_ENV=production \
     investment-tracker
   ```

3. Access at `http://localhost:3001`

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_SHEET_ID` | Yes | The ID from your spreadsheet URL |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Yes | Full JSON key from Google Cloud |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Set to `production` for production |
| `ALLOWED_ORIGIN` | No | CORS allowed origin in production |

## Troublesheet

- **"The caller does not have permission"**: Make sure you shared the spreadsheet with the service account email
- **"Unable to parse the key"**: Make sure the JSON key is valid and properly escaped
- **Build fails**: Check that `GOOGLE_SERVICE_ACCOUNT_KEY` doesn't contain line breaks (minify it first)
