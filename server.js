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

// Create posts table
db.run(`
    CREATE TABLE IF NOT EXISTS posts (
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
    )
`, (err) => {
    if (err) {
        console.error('Error creating table:', err);
    } else {
        console.log('Database initialized');
    }
});

// API Routes

// Get all posts (newest first)
app.get('/api/posts', (req, res) => {
    db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, posts) => {
        if (err) {
            console.error('Error fetching posts:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, posts });
    });
});

// Create a new post
app.post('/api/posts', upload.single('image'), (req, res) => {
    const {
        username,
        caption,
        track_id,
        track_title,
        track_artist,
        track_album,
        track_preview_url,
        track_album_art
    } = req.body;

    // Validate required fields
    if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const created_at = Date.now();

    const sql = `
        INSERT INTO posts (
            username, caption, image_url, track_id, track_title,
            track_artist, track_album, track_preview_url, track_album_art, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
        username,
        caption || null,
        image_url,
        track_id || null,
        track_title || null,
        track_artist || null,
        track_album || null,
        track_preview_url || null,
        track_album_art || null,
        created_at
    ], function(err) {
        if (err) {
            console.error('Error creating post:', err);
            return res.status(500).json({ success: false, error: err.message });
        }

        // Get the newly created post
        db.get('SELECT * FROM posts WHERE id = ?', [this.lastID], (err, post) => {
            if (err) {
                console.error('Error fetching new post:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true, post });
        });
    });
});

// Like a post
app.post('/api/posts/:id/like', (req, res) => {
    const { id } = req.params;

    db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Error liking post:', err);
            return res.status(500).json({ success: false, error: err.message });
        }

        db.get('SELECT * FROM posts WHERE id = ?', [id], (err, post) => {
            if (err) {
                console.error('Error fetching post:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true, post });
        });
    });
});

// Delete a post
app.delete('/api/posts/:id', (req, res) => {
    const { id } = req.params;

    // Get post to delete image file
    db.get('SELECT * FROM posts WHERE id = ?', [id], (err, post) => {
        if (err) {
            console.error('Error fetching post:', err);
            return res.status(500).json({ success: false, error: err.message });
        }

        if (post && post.image_url) {
            const imagePath = path.join(__dirname, post.image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        db.run('DELETE FROM posts WHERE id = ?', [id], (err) => {
            if (err) {
                console.error('Error deleting post:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true });
        });
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
