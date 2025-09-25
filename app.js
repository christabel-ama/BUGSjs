const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// File upload setup
const upload = multer({ dest: 'uploads/' });

// SQLite setup
const db = new sqlite3.Database('./bugs.db');
db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, whatsapp TEXT, gender TEXT, checkin TEXT, checkout TEXT,
    apartment TEXT, people INTEGER, price INTEGER, status TEXT,
    user_email TEXT, receipt_url TEXT, created_at TEXT
)`);

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'josephchristabel22@gmail.com', // admin email
        pass: 'jvtgwgpn lykpmyox' // use Gmail app password
    }
});

// Booking endpoint
app.post('/api/book', (req, res) => {
    const { name, whatsapp, gender, checkin, checkout, apartment, people, price, user_email } = req.body;
    db.run(
        `INSERT INTO bookings (name, whatsapp, gender, checkin, checkout, apartment, people, price, status, user_email, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))`,
        [name, whatsapp, gender, checkin, checkout, apartment, people, price, user_email],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            // Send email to admin
            const mailOptions = {
                from: 'BUGS Booking <josephchristabel22@gmail.com>',
                to: 'josephchristabel22@gmail.com',
                subject: 'New Booking Request',
                html: `
                    <h2>New Booking Request</h2>
                    <p>Name: ${name}</p>
                    <p>WhatsApp: ${whatsapp}</p>
                    <p>Gender: ${gender}</p>
                    <p>Check-in: ${checkin}</p>
                    <p>Check-out: ${checkout}</p>
                    <p>Apartment: ${apartment}</p>
                    <p>People: ${people}</p>
                    <p>Price: ₦${price}</p>
                    <p>User Email: ${user_email}</p>
                    <form action="http://localhost:3000/api/confirm" method="POST">
                        <input type="hidden" name="booking_id" value="${this.lastID}" />
                        <button type="submit" style="background:green;color:white;padding:10px;border:none;border-radius:5px;">Confirm Booking</button>
                    </form>
                `
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) return res.status(500).json({ error: error.message });
                res.json({ success: true, booking_id: this.lastID });
            });
        }
    );
});

// Confirm booking endpoint
app.post('/api/confirm', (req, res) => {
    const { booking_id } = req.body;
    db.get(`SELECT * FROM bookings WHERE id = ?`, [booking_id], (err, booking) => {
        if (err || !booking) return res.status(404).json({ error: 'Booking not found' });
        db.run(`UPDATE bookings SET status = 'confirmed' WHERE id = ?`, [booking_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            // Send confirmation to user
            const mailOptions = {
                from: 'BUGS Booking <josephchristabel22@gmail.com>',
                to: booking.user_email,
                subject: 'Booking Confirmed',
                html: `<h2>Your booking is confirmed!</h2><p>Details: ...</p>`
            };
            transporter.sendMail(mailOptions, () => { });
            res.json({ success: true });
        });
    });
});

// Payment upload endpoint
app.post('/api/payment', upload.single('receipt'), (req, res) => {
    const { booking_id } = req.body;
    const receipt_url = req.file ? req.file.path : null;
    db.run(`UPDATE bookings SET receipt_url = ?, status = 'paid' WHERE id = ?`, [receipt_url, booking_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.get(`SELECT * FROM bookings WHERE id = ?`, [booking_id], (err, booking) => {
            if (err || !booking) return res.status(404).json({ error: 'Booking not found' });
            // Notify admin
            const mailOptions = {
                from: 'BUGS Booking <josephchristabel22@gmail.com>',
                to: 'josephchristabel22@gmail.com',
                subject: 'Payment Received',
                html: `<h2>Payment received for booking #${booking_id}</h2><p>User: ${booking.name}</p><p>Receipt: <a href="${receipt_url}">View</a></p>`
            };
            transporter.sendMail(mailOptions, () => { });
            res.json({ success: true });
        });
    });
});

// User dashboard endpoint
app.get('/api/user/:email', (req, res) => {
    db.all(`SELECT * FROM bookings WHERE user_email = ? ORDER BY created_at DESC`, [req.params.email], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin dashboard endpoint
app.get('/api/admin/bookings', (req, res) => {
    db.all(`SELECT * FROM bookings ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Serve uploaded receipts
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(3000, () => console.log('BUGS backend running on port 3000'));
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// SQLite setup
const db = new sqlite3.Database('./bugs.db');
db.run(`CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, whatsapp TEXT, gender TEXT, checkin TEXT, checkout TEXT,
  apartment TEXT, people INTEGER, price INTEGER, status TEXT,
  user_email TEXT, receipt_url TEXT, created_at TEXT
)`);

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'josephchristabel22@gmail.com', // admin email
        pass: 'YOUR_APP_PASSWORD' // use Gmail app password
    }
});

// Booking endpoint
app.post('/api/book', (req, res) => {
    const { name, whatsapp, gender, checkin, checkout, apartment, people, price, user_email } = req.body;
    db.run(
        `INSERT INTO bookings (name, whatsapp, gender, checkin, checkout, apartment, people, price, status, user_email, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))`,
        [name, whatsapp, gender, checkin, checkout, apartment, people, price, user_email],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Send email to admin
            const mailOptions = {
                from: 'BUGS Booking <josephchristabel22@gmail.com>',
                to: 'josephchristabel22@gmail.com',
                subject: 'New Booking Request',
                html: `
          <h2>New Booking Request</h2>
          <p>Name: ${name}</p>
          <p>WhatsApp: ${whatsapp}</p>
          <p>Gender: ${gender}</p>
          <p>Check-in: ${checkin}</p>
          <p>Check-out: ${checkout}</p>
          <p>Apartment: ${apartment}</p>
          <p>People: ${people}</p>
          <p>Price: ₦${price}</p>
          <p>User Email: ${user_email}</p>
          <form action="http://localhost:3000/api/confirm" method="POST">
            <input type="hidden" name="booking_id" value="${this.lastID}" />
            <button type="submit" style="background:green;color:white;padding:10px;border:none;border-radius:5px;">Confirm Booking</button>
          </form>
        `
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) return res.status(500).json({ error: error.message });
                res.json({ success: true, booking_id: this.lastID });
            });
        }
    );
});

// Confirm booking endpoint
app.post('/api/confirm', (req, res) => {
    const { booking_id } = req.body;
    db.get(`SELECT * FROM bookings WHERE id = ?`, [booking_id], (err, booking) => {
        if (err || !booking) return res.status(404).json({ error: 'Booking not found' });
        db.run(`UPDATE bookings SET status = 'confirmed' WHERE id = ?`, [booking_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            // Send confirmation to user
            const mailOptions = {
                from: 'BUGS Booking <josephchristabel22@gmail.com>',
                to: booking.user_email,
                subject: 'Booking Confirmed',
                html: `<h2>Your booking is confirmed!</h2><p>Details: ...</p>`
            };
            transporter.sendMail(mailOptions, () => { });
            res.json({ success: true });
        });
    });
});

// More endpoints for payment, dashboard, etc. can be added similarly

app.listen(3000, () => console.log('BUGS backend running on port 3000'));