const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadsDir));

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Initialize SQLite database
const db = new sqlite3.Database('posts.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Database connected');
    }
});

// Create post_music table to map nsuna posts to music tracks
db.run(`
    CREATE TABLE IF NOT EXISTS post_music (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id TEXT NOT NULL UNIQUE,
        track_id TEXT NOT NULL,
        track_title TEXT,
        track_artist TEXT,
        track_album TEXT,
        track_album_art TEXT,
        created_at INTEGER NOT NULL
    )
`, (err) => {
    if (err) {
        console.error('Error creating post_music table:', err);
    } else {
        console.log('Database initialized');
    }
});

// API Routes

// Get all post-music mappings
app.get('/api/post-music', (req, res) => {
    db.all('SELECT * FROM post_music ORDER BY created_at DESC', [], (err, mappings) => {
        if (err) {
            console.error('Error fetching post-music mappings:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, mappings });
    });
});

// Get music for a specific post
app.get('/api/post-music/:postId', (req, res) => {
    const { postId } = req.params;
    db.get('SELECT * FROM post_music WHERE post_id = ?', [postId], (err, mapping) => {
        if (err) {
            console.error('Error fetching post music:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, mapping });
    });
});

// Add or update music for a post
app.post('/api/post-music', (req, res) => {
    const {
        post_id,
        track_id,
        track_title,
        track_artist,
        track_album,
        track_album_art
    } = req.body;

    // Validate required fields
    if (!post_id || !track_id) {
        return res.status(400).json({ success: false, error: 'post_id and track_id are required' });
    }

    const created_at = Date.now();

    const sql = `
        INSERT OR REPLACE INTO post_music (
            post_id, track_id, track_title, track_artist,
            track_album, track_album_art, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
        post_id,
        track_id,
        track_title || null,
        track_artist || null,
        track_album || null,
        track_album_art || null,
        created_at
    ], function(err) {
        if (err) {
            console.error('Error adding music to post:', err);
            return res.status(500).json({ success: false, error: err.message });
        }

        // Get the newly created mapping
        db.get('SELECT * FROM post_music WHERE post_id = ?', [post_id], (err, mapping) => {
            if (err) {
                console.error('Error fetching mapping:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true, mapping });
        });
    });
});

// Delete music from a post
app.delete('/api/post-music/:postId', (req, res) => {
    const { postId } = req.params;

    db.run('DELETE FROM post_music WHERE post_id = ?', [postId], (err) => {
        if (err) {
            console.error('Error deleting post music:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Open your browser and navigate to http://localhost:3000');
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
});
