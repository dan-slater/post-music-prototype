# Deezer Social

A social media app for sharing and discovering music! Search for tracks on Deezer, create posts with images and music, and explore what others are sharing.

## Features

### Feed
- **Social Feed**: Browse posts from other users
- **Create Posts**: Share your thoughts with optional images and music
- **Like Posts**: Show appreciation for posts you enjoy
- **Play Music**: Click on music attachments to hear 30-second previews

### Music Search
- **Search Deezer**: Find any track, artist, or album
- **Preview Playback**: Listen to 30-second previews
- **Add to Posts**: Attach music to your posts with one click
- **Audio Fade Effects**: Smooth fade in/out with seamless looping

### Audio Player
- Fixed bottom player with play/pause controls
- Progress bar with time display and seek functionality
- Automatic fade in (1.5s) when playback starts
- Fade out (1.5s) starting 3 seconds before track ends
- Seamless looping with fade effects

## Deployment (Railway)

This app is ready to deploy on Railway!

### Quick Deploy Steps:

1. **Push to GitHub** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect the Node.js app and deploy!

3. **That's it!** Railway will:
   - Install dependencies automatically
   - Set the PORT environment variable
   - Provide a public URL
   - Handle persistent storage for database and uploads

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## How to Use

### Creating a Post
1. Click the **"+ Create Post"** button on the Feed tab
2. Enter your username
3. Add a caption (optional)
4. Upload an image (optional, max 5MB)
5. To add music:
   - Use the search box directly in the modal
   - Type your search query and press Enter or click Search
   - Click **"Select"** on any track from the results
   - Your selected track will appear at the top
   - (Alternative: Use the "Search Music" tab and click "Add to Post")
6. Click **"Post"** to share!

### Searching for Music
1. Go to the **"Search Music"** tab
2. Type your search query (artist, track, or album name)
3. Press Enter or click Search
4. Click any track card to play the preview
5. Click **"Add to Post"** to attach it to a new post

### Interacting with Posts
- Click the ❤ button to like a post
- Click on music attachments to play them
- Use the bottom player to control playback

## Technical Details

### Backend
- **Framework**: Express.js
- **Database**: SQLite3
- **File Upload**: Multer (max 5MB images)
- **API Endpoints**:
  - `GET /api/posts` - Fetch all posts
  - `POST /api/posts` - Create new post
  - `POST /api/posts/:id/like` - Like a post
  - `DELETE /api/posts/:id` - Delete a post

### Frontend
- **No Framework**: Pure HTML/CSS/JavaScript
- **Deezer API**: Public search API with JSONP for CORS handling
- **Responsive Design**: Works on desktop and mobile
- **Real-time Features**: Feed updates, audio playback with fade effects

## File Structure

```
deezer-preview-app/
├── index.html          # Frontend (HTML + CSS + JavaScript)
├── server.js           # Express backend with SQLite
├── package.json        # Dependencies
├── posts.db            # SQLite database (created on first run)
├── uploads/            # User uploaded images (created on first run)
└── README.md          # This file
```

## Database Schema

```sql
CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    caption TEXT,
    image_url TEXT,
    track_id TEXT,
    track_title TEXT,
    track_artist TEXT,
    track_album TEXT,
    track_preview_url TEXT,
    track_album_art TEXT,
    created_at INTEGER NOT NULL,
    likes INTEGER DEFAULT 0
);
```

## Dependencies

```json
{
  "express": "^4.18.2",
  "sqlite3": "^5.1.7",
  "multer": "^1.4.5-lts.1",
  "cors": "^2.8.5"
}
```

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Limitations

- 30-second previews only (Deezer API restriction)
- Single-user system (no authentication)
- Local database (posts not shared across servers)
- Max 5MB image uploads

## Future Enhancements

- User authentication
- Comments on posts
- User profiles
- Search posts by music/username
- Cloud database for persistent storage
- Real-time updates with WebSockets

## License

Free to use and modify for personal or educational purposes.
