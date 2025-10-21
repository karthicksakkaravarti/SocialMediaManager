# YouTube Video Categories

When uploading videos to YouTube, you can specify a category ID. Here are the available categories:

## Category IDs

| ID | Category Name |
|----|---------------|
| 1  | Film & Animation |
| 2  | Autos & Vehicles |
| 10 | Music |
| 15 | Pets & Animals |
| 17 | Sports |
| 19 | Travel & Events |
| 20 | Gaming |
| 22 | People & Blogs |
| 23 | Comedy |
| 24 | Entertainment |
| 25 | News & Politics |
| 26 | Howto & Style |
| 27 | Education |
| 28 | Science & Technology |
| 29 | Nonprofits & Activism |

## Default Category

Currently, videos are uploaded with category ID **22 (People & Blogs)**.

## How to Change

To change the category for your videos, you can either:

1. **Update the default in code** - Edit `lib/video-publisher.ts` line 76:
   ```typescript
   categoryId: '27', // Change to Education, Travel & Events (19), etc.
   ```

2. **Add to script JSON** - Include category in your video script metadata:
   ```json
   {
     "media": [{
       "youtube": {
         "title": "Your Title",
         "description": "Your description",
         "hashtags": ["#tag1", "#tag2"],
         "categoryId": "27"
       }
     }]
   }
   ```

## Current Upload Settings

- **Made for Kids**: `false` (not for children)
- **Self-Declared Made for Kids**: `false`
- **Contains Synthetic Media**: `true` (marked as AI-generated/altered content)
- **Category**: `22` (People & Blogs)
- **Privacy Status**: `private` (uploads as private by default)

These settings comply with YouTube's policies for AI-generated content and ensure your videos are properly categorized.
