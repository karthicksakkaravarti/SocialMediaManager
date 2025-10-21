# Video Generator Feature - Complete Implementation

## 🎯 Overview

A complete video automation system that generates AI-powered videos from scripts and publishes them to all your linked YouTube channels with optional approval workflows.

---

## ✅ What's Been Built

### **Database Layer** (4 New Models)
- ✅ **VideoScript** - Stores video generation scripts with scheduling
- ✅ **VideoJob** - Tracks external API job status and progress
- ✅ **VideoPublish** - Multi-channel publish tracking per social account
- ✅ **PublishConfig** - Per-brand approval and auto-publish settings

### **Backend API** (14 Routes)
- ✅ Script Management (CRUD operations)
- ✅ Video Generation (submit jobs to external API)
- ✅ Job Monitoring (real-time status polling)
- ✅ Multi-Channel Publishing
- ✅ Approval Workflow
- ✅ Retry Failed Uploads
- ✅ Configuration Management
- ✅ Cron Job for Scheduled Scripts

### **Library Functions**
- ✅ `lib/video-generator.ts` - External API client
- ✅ `lib/video-publisher.ts` - Multi-channel publishing logic

### **UI Components** (6 Components)
- ✅ `VideoScriptForm` - Create/edit scripts with JSON editor
- ✅ `VideoScriptsTable` - List scripts with filters and actions
- ✅ `VideoJobStatus` - Real-time job monitoring with progress bar
- ✅ `VideoPublishManager` - Approval interface for pending publishes
- ✅ `VideoPublishStatus` - Per-channel publish status display
- ✅ `VideoConfigForm` - Brand-level configuration settings

### **Pages** (4 Pages)
- ✅ `/dashboard/video-generator` - Main dashboard with tabs
- ✅ `/dashboard/video-generator/scripts/new` - Create new script
- ✅ `/dashboard/video-generator/scripts/[id]` - View script details
- ✅ `/dashboard/video-generator/scripts/[id]/edit` - Edit script

### **Cron Job**
- ✅ Vercel cron configuration (`vercel.json`)
- ✅ Processes scheduled scripts every 5 minutes
- ✅ Protected with `CRON_SECRET` environment variable

---

## 🚀 How It Works

### **Flow 1: Create & Schedule Script**

1. Navigate to **Video Generator** in dashboard
2. Click **"Create Script"**
3. Enter video title
4. Paste your script JSON (example provided below)
5. Choose:
   - **Save as Draft** - Save for later
   - **Schedule Generation** - Pick a date/time for auto-generation
   - **Generate Now** - Start generation immediately

### **Flow 2: Automatic Generation (Cron)**

1. Cron runs every 5 minutes
2. Finds scripts where `scheduledAt <= now` and status is "scheduled"
3. Submits each to external API: `POST http://localhost:8080/api/v1/generate`
4. Creates a `VideoJob` record with the returned `job_id`
5. Updates script status to "processing"

### **Flow 3: Monitor Job Progress**

1. Navigate to script detail page
2. Page auto-polls job status every 5 seconds
3. Shows:
   - Progress bar (0-100%)
   - Current scene / total scenes
   - Status updates in real-time
4. When completed:
   - Shows video preview/download link
   - Enables "Publish to Channels" button

### **Flow 4: Publish with Approval**

**When `requireApproval = true`:**

1. Click **"Publish to Channels"**
2. System creates `VideoPublish` records for each YouTube channel
3. Status: `pending_approval`
4. Approval interface shows:
   - List of all connected channels
   - Checkboxes to select channels
5. Click **"Approve Selected"**
6. System:
   - Downloads video from external API
   - Uploads to each approved YouTube channel
   - Updates status to `published`
   - Saves YouTube video IDs

### **Flow 5: Auto-Publish**

**When `requireApproval = false` AND `autoPublish = true`:**

1. Job completes → Video URL becomes available
2. System automatically:
   - Downloads video
   - Creates `VideoPublish` records (status: `approved`)
   - Uploads to ALL YouTube channels
   - Updates status to `published`
3. No manual approval needed

---

## 📝 Script JSON Format

Your video script should follow this format:

```json
{
  "title": "Your Video Title",
  "background_music": "music_file.mp3",
  "scenes": [
    {
      "image": "AI image prompt describing the scene",
      "voiceover": "Text to be spoken in the scene",
      "zoom": "in",
      "zoom_ratio": 0.3,
      "watermark": "Your Brand"
    }
  ],
  "media": [
    {
      "youtube": {
        "title": "Full YouTube Video Title",
        "description": "Video description with details...",
        "hashtags": [
          "#YourTag1",
          "#YourTag2"
        ]
      }
    }
  ]
}
```

**Key Sections:**
- **scenes[]** - Used for video generation (sent to external API)
- **media.youtube** - Used for YouTube publishing (title, description, tags)

---

## ⚙️ Configuration

### **Environment Variables**

Already added to `.env.local`:

```env
# Video Generator API
VIDEO_GENERATOR_API_URL="http://localhost:8080"

# Cron job secret
CRON_SECRET="change-this-to-random-secret-in-production"
```

### **Brand Settings**

Access via: `/dashboard/video-generator` → **Settings Tab**

**Two Options:**

1. **Require Approval** (Default: ON)
   - Manually approve each video before publishing
   - Shows approval interface
   - You select which channels to publish to

2. **Auto-Publish** (Default: OFF)
   - Automatically publish when generation completes
   - Only works when "Require Approval" is OFF
   - Publishes to ALL linked channels

**Recommended Settings:**
- **Production**: Approval ON, Auto-Publish OFF
- **Testing**: Approval OFF, Auto-Publish ON

---

## 🎬 Using the System

### **1. Access Video Generator**

Navigate to: `/dashboard/video-generator?brand={brandId}`

You'll see:
- **Scripts Tab** - List of all scripts
- **Settings Tab** - Configuration options

### **2. Create Your First Script**

1. Click **"Create Script"**
2. Enter title (e.g., "Dhanushkodi Ghost Town Story")
3. Paste your script JSON
4. Choose scheduling:
   - **Now** - Generate immediately
   - **Later** - Pick date/time for automatic generation
5. Click **"Generate Now"** or **"Schedule Generation"**

### **3. Monitor Generation**

1. Click on your script in the table
2. View job status:
   - Real-time progress bar
   - Current scene being processed
   - Estimated completion
3. Wait for "Completed" status

### **4. Publish to Channels**

**Option A: With Approval**
1. Click **"Publish to Channels"**
2. Review list of connected YouTube channels
3. Select channels (or "Select All")
4. Click **"Approve Selected"**
5. Videos upload to each channel

**Option B: Auto-Publish**
1. Enable in Settings
2. Videos automatically publish when ready
3. Check "Publish Status" to see results

### **5. View Published Videos**

On the script detail page:
- See status per channel
- Click "View on YouTube" to see published videos
- Check for any errors

### **6. Retry Failed Uploads**

If a video upload fails:
1. Navigate to the script detail page
2. Scroll to **Publish Status** section
3. Find the failed channel (shows red "Failed" badge)
4. Review the error message displayed
5. Click **"Retry Upload"** button
6. System will:
   - Reset status to "approved"
   - Re-download video from external API
   - Re-upload to the failed channel with correct credentials
7. Status updates automatically when retry completes

**Common Reasons for Failures:**
- Expired OAuth tokens (re-authenticate the channel)
- Network timeout during upload
- YouTube API quota exceeded
- Invalid video metadata (check script JSON format)

---

## 🔄 API Endpoints Reference

### **Scripts**
```
GET    /api/video-generator/scripts?brandId=xxx
POST   /api/video-generator/scripts
GET    /api/video-generator/scripts/{id}
PATCH  /api/video-generator/scripts/{id}
DELETE /api/video-generator/scripts/{id}
```

### **Generation**
```
POST   /api/video-generator/generate
       Body: { scriptId }

GET    /api/video-generator/jobs/{jobId}
       Returns: { status, progress, videoUrl, ... }
```

### **Publishing**
```
POST   /api/video-generator/publish
       Body: { scriptId }

GET    /api/video-generator/publish?scriptId=xxx
       Returns: { publishes: [...] }

POST   /api/video-generator/approve
       Body: { publishIds: [...] }

POST   /api/video-generator/retry
       Body: { publishIds: [...] }
```

### **Configuration**
```
GET    /api/video-generator/config?brandId=xxx
POST   /api/video-generator/config
       Body: { brandId, requireApproval, autoPublish }
```

### **Cron (Protected)**
```
GET    /api/video-generator/cron?secret={CRON_SECRET}
```

---

## 📊 Database Models

### **VideoScript**
```typescript
{
  id: string
  brandId: string
  title: string
  scriptJson: Json  // Full script object
  status: "draft" | "scheduled" | "processing" | "completed" | "failed"
  scheduledAt?: DateTime
  videoUrl?: string
  createdAt: DateTime
}
```

### **VideoJob**
```typescript
{
  id: string
  scriptId: string
  jobId: string  // External API job ID
  status: "pending" | "processing" | "completed" | "failed"
  progress: number  // 0-100
  currentScene?: number
  totalScenes?: number
  videoUrl?: string
  errorMessage?: string
}
```

### **VideoPublish**
```typescript
{
  id: string
  scriptId: string
  socialAccountId: string
  status: "pending_approval" | "approved" | "publishing" | "published" | "failed"
  youtubeVideoId?: string
  publishedAt?: DateTime
  errorMessage?: string
}
```

### **PublishConfig**
```typescript
{
  id: string
  brandId: string
  requireApproval: boolean  // Default: true
  autoPublish: boolean      // Default: false
}
```

---

## 🛠️ Troubleshooting

### **External API Not Responding**
- Check `VIDEO_GENERATOR_API_URL` in `.env.local`
- Ensure external API is running on `http://localhost:8080`
- Test: `curl http://localhost:8080/health`

### **Cron Not Running**
- **Local Development**: Cron doesn't run automatically in dev
  - Manually trigger: `curl http://localhost:3000/api/video-generator/cron?secret=your-secret`
- **Production (Vercel)**: Cron runs automatically every 5 minutes

### **YouTube Upload Error: "Invalid or Empty Video Title"**

**FIXED**: This was caused by using the wrong YouTube credentials when publishing to multiple channels.

**Root Cause**:
- The old code used `getYouTubeClient(brandId)` which always used the FIRST YouTube channel's access tokens
- When publishing to multiple channels, all uploads used the first channel's credentials
- This caused authentication and metadata issues

**Fix Applied**:
- Created `getYouTubeClientForAccount(socialAccountId)` function
- Updated `uploadToYouTube()` to use specific channel credentials
- Each channel now uses its own access token for uploads

**Debug Logs Added**:
- Script JSON structure logging in `extractYouTubeMetadata()`
- Metadata extraction logging showing title, description, tags
- YouTube API request body logging in `uploadToYouTube()`
- Per-channel upload success/failure logging

**To Debug Issues**:
1. Check server logs (console output) when publishing
2. Look for `=== EXTRACTING YOUTUBE METADATA ===` to see script structure
3. Verify metadata shows correct title/description/tags
4. Check `=== UPLOADING TO YOUTUBE ===` for API request details
5. Review error messages in publish status UI

### **Video Not Publishing**
- Check YouTube credentials are configured for the brand
- Verify ALL YouTube channels you want to publish to are connected
- Each channel must have valid OAuth tokens
- Check publish status for error messages in the UI
- Review server console logs for detailed error information
- Ensure video completed generation successfully

### **Script JSON Format Issues**
- Ensure `media` array exists in script JSON
- YouTube metadata must be in `media[].youtube` format:
  ```json
  {
    "media": [
      {
        "youtube": {
          "title": "Your Video Title",
          "description": "Your description",
          "hashtags": ["#tag1", "#tag2"]
        }
      }
    ]
  }
  ```

**YouTube Metadata Limits (Enforced by API):**
- ✅ **Title**: Maximum **100 characters** (STRICTLY ENFORCED)
  - Titles exceeding 100 chars will be auto-truncated with "..."
  - **Example**: "Very Long Title..." (truncated from 127 chars)
- ✅ **Description**: Maximum **5,000 characters**
  - Descriptions exceeding this will be auto-truncated
- ✅ **Tags**: Maximum **500 tags**, each tag max **30 characters**
  - Tags exceeding limits will be filtered/truncated
  - # symbol is automatically removed from hashtags

**Common Issues:**
- Title cannot be empty or undefined
- Tamil/Unicode characters count as 1 character each
- Pipe characters `|` and special characters are allowed
- Description defaults to empty string if not provided
- Hashtags are optional

**Best Practices:**
- Keep titles under 70 characters for better visibility
- Use description for longer explanations
- Put important keywords first in title
- Test your script JSON before scheduling

### **Job Stuck in Processing**
- External API may have failed
- Check job status directly: `curl http://localhost:8080/api/v1/status/{job_id}`
- If failed, job status will update on next poll

---

## 🎯 Next Steps

### **Optional Enhancements**

1. **Webhook Support**
   - External API supports `webhook_url` parameter
   - Add webhook handler to receive completion notifications
   - Reduces need for polling

2. **Video Preview**
   - Embed video player in job status component
   - Preview before publishing

3. **Batch Operations**
   - Create multiple scripts at once
   - Bulk approve/reject publishes

4. **Analytics**
   - Track video performance
   - View stats per channel
   - Compare engagement rates

5. **Templates**
   - Save script templates
   - Reuse common structures

6. **Error Retry**
   - Automatic retry on failed jobs
   - Configurable retry count

---

## 📚 External API Documentation

Your external video generator API provides these endpoints:

```
POST   /api/v1/generate         - Submit video generation job
GET    /api/v1/status/{job_id}  - Get job status
GET    /api/v1/download/{job_id} - Download generated video
POST   /api/v1/jobs/{job_id}/cancel - Cancel job
DELETE /api/v1/jobs/{job_id}    - Delete job
```

See OpenAPI spec for full details.

---

## ✨ Summary

You now have a **complete video automation pipeline**:

1. ✅ Create scripts with scheduling
2. ✅ Automatic generation via cron jobs
3. ✅ Real-time progress monitoring
4. ✅ Multi-channel publishing
5. ✅ Optional approval workflow
6. ✅ Per-brand configuration
7. ✅ Error tracking and status reports
8. ✅ **One-click retry for failed uploads**

**Everything is ready to use!** 🚀

Start by creating your first script and watch the magic happen.
