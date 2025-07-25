const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load SQL query from file
function loadQuery(name) {
    return fs.readFileSync(path.join(__dirname, 'queries', `${name}.sql`), 'utf8');
}

// Database connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Lazer_XY_12',
    database: 'complaint_system'
});

// Get areas list
app.get('/api/areas', async (req, res) => {
    try {
        const sql = loadQuery('get_areas');
        const [areas] = await pool.query(sql);
        res.json(areas);
    } catch (err) {
        console.error('Error loading areas:', err);
        res.status(500).json({ error: 'Failed to load areas' });
    }
});

// Register user
app.post('/api/register', async (req, res) => {
    const { username, email, password, full_name, area_id } = req.body;
    if (!username || !email || !password || !full_name || !area_id) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const [existing] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hash = await bcrypt.hash(password, 10);
        const sql = loadQuery('register');
        const [result] = await pool.query(sql, [username, email, hash, full_name, area_id]);

        res.status(201).json({ message: 'User registered successfully', user_id: result.insertId });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user or corporator
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const corpSql = loadQuery('login_corporator');
        const [corporators] = await pool.query(corpSql, [email]);

        if (corporators.length > 0) {
            const corporator = corporators[0];
            const match = await bcrypt.compare(password, corporator.password_hash);

            if (match) {
                return res.json({
                    corporator_id: corporator.corporator_id,
                    full_name: corporator.full_name,
                    area_id: corporator.area_id,
                    role: 'corporator'
                });
            } else {
                return res.status(401).json({ error: 'Incorrect password' });
            }
        }

        const userSql = loadQuery('login');
        const [users] = await pool.query(userSql, [email]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) return res.status(401).json({ error: 'Incorrect password' });

        res.json({
            user_id: user.user_id,
            username: user.username,
            area_id: user.area_id,
            role: 'user'
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Add complaint
app.post('/api/complaints', async (req, res) => {
    const { user_id, title, description } = req.body;

    if (!user_id || !title || !description) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const [userRows] = await pool.query('SELECT area_id FROM Users WHERE user_id = ?', [user_id]);

        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const area_id = userRows[0].area_id;
        const sql = loadQuery('file_complaint');
        const [result] = await pool.query(sql, [user_id, title, description, area_id]);

        res.status(201).json({ message: 'Complaint filed successfully', complaint_id: result.insertId });
    } catch (err) {
        console.error('Error filing complaint:', err);
        res.status(500).json({ error: 'Failed to file complaint' });
    }
});

app.get('/api/complaints/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const sql = loadQuery('get_user_complaints');
        const [complaints] = await pool.query(sql, [user_id]);
        res.json(complaints);
    } catch (err) {
        console.error('Error fetching user complaints:', err);
        res.status(500).json({ error: 'Failed to load complaints' });
    }
});

app.get('/api/area-complaints/:area_id', async (req, res) => {
    const { area_id } = req.params;
    const { corporator_id } = req.query; // <--- NEW

    if (!corporator_id) {
        return res.status(400).json({ error: 'Corporator ID required' });
    }

    try {
        const sql = loadQuery('get_area_complaints');
        const [complaints] = await pool.query(sql, [area_id, corporator_id]);
        res.json(complaints);
    } catch (err) {
        console.error('Error fetching area complaints:', err);
        res.status(500).json({ error: 'Failed to load area complaints' });
    }
});


// Fetch feedback for corporator (limit 5 most recent)
app.get('/api/corporator-feedback/:corporator_id', async (req, res) => {
    const { corporator_id } = req.params;
    console.log('Fetching feedback for corporator ID:', corporator_id);

    try {
        const sql = loadQuery('get_feedback_by_corporator');
        console.log('Loaded SQL query:', sql);

        const [rows] = await pool.query(sql, [corporator_id]);
        console.log('Fetched feedback rows:', rows);

        res.json(rows);
    } catch (err) {
        console.error('🔥 Error fetching feedback:', err.message);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

app.post('/api/feedback/:feedback_id/close', async (req, res) => {
  const { feedback_id } = req.params;

  try {
    const sql = `UPDATE Feedback SET closed = TRUE WHERE feedback_id = ?`;
    await pool.query(sql, [feedback_id]);

    res.json({ message: 'Feedback marked as closed' });
  } catch (err) {
    console.error('Error updating feedback status:', err);
    res.status(500).json({ error: 'Failed to update feedback status' });
  }
});


app.put('/api/complaints/:complaint_id/status', async (req, res) => {
    const { complaint_id } = req.params;
    const { status, description, corporator_id } = req.body;

    if (!status || !description || !corporator_id) {
        return res.status(400).json({ error: 'Status, description and corporator ID are required' });
    }

    try {
        const sql = loadQuery('update_complaint_status');
        const [result] = await pool.query(sql, [status, description, corporator_id, complaint_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        res.json({ message: 'Complaint status updated successfully' });
    } catch (err) {
        console.error('Error updating complaint status:', err);
        res.status(500).json({ error: 'Failed to update complaint status' });
    }
});

app.post('/api/complaints/:complaint_id/close', async (req, res) => {
  const { complaint_id } = req.params;

  try {
    const sql = `UPDATE Complaints SET closed = TRUE WHERE complaint_id = ?`;
    await pool.query(sql, [complaint_id]);

    res.json({ message: 'Complaint marked as closed' });
  } catch (err) {
    console.error('Error updating complaint status:', err);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
});

// Submit feedback for a resolved/rejected complaint
app.post('/api/feedback', async (req, res) => {
    const { complaint_id, user_id, feedback_text, rating } = req.body;

    if (!complaint_id || !user_id || !feedback_text || !rating) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const sql = loadQuery('submit_feedback');
        const [result] = await pool.query(sql, [complaint_id, user_id, feedback_text, rating]);
        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (err) {
        console.error('Error submitting feedback:', err);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});


// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
