const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Batasi Ukuran Body Json
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rute Utama Halaman Login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Sajikan Berkas Statis Frontend
app.use(express.static(__dirname));

// Konfigurasi Koneksi Database MySQL
const db = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '', // Kata Sandi Default Kosong
    database: 'monitoring_aulia', // Buat Database Di phpMyAdmin
    waitForConnections: true,
    queueLimit: 0
});

// Uji Koneksi Saat Memulai
db.getConnection((err, connection) => {
    if (err) {
        console.error('Gagal terhubung ke MySQL localhost database:', err.message);
        console.warn('PENTING: Pastikan XAMPP (MySQL) sudah aktif dan database "monitoring_aulia" sudah dibuat di phpMyAdmin!');
    } else {
        console.log('Terhubung dengan sukses ke MySQL database "monitoring_aulia" di localhost!');
        connection.release();
    }
});

// Endpoint Untuk Autentikasi Pengguna
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username dan Password wajib diisi!' });
    }

    db.query(
        'SELECT * FROM users WHERE LOWER(username) = ? AND password = ?',
        [username.trim().toLowerCase(), password],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
            if (results && results.length > 0) {
                res.json({ success: true, role: results[0].role });
            } else {
                res.status(401).json({ success: false, message: 'Username atau Password salah!' });
            }
        }
    );
});

// Ambil Seluruh Data Produk
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products ORDER BY id DESC', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Tambah Data Produk Baru
app.post('/api/products', (req, res) => {
    const { client, product, date, lastUpdated, document } = req.body;
    if (!client || !product) {
        return res.status(400).json({ error: 'Client and Product name are required!' });
    }

    db.query(
        `INSERT INTO products (client, product, rnd, reg, status, date, lastUpdated, document) 
         VALUES (?, ?, 'Menunggu', 'Menunggu', 'Menunggu', ?, ?, ?)`,
        [client, product, date, lastUpdated, document || null],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: result.insertId, client, product, rnd: 'Menunggu', reg: 'Menunggu', status: 'Menunggu', date, lastUpdated });
        }
    );
});

// Perbarui Status Pemantauan Produk
app.put('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const { rnd, reg, status, lastUpdated } = req.body;

    db.query(
        'UPDATE products SET rnd = ?, reg = ?, status = ?, lastUpdated = ? WHERE id = ?',
        [rnd, reg, status, lastUpdated, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        }
    );
});

// Batalkan Proses Pemantauan Produk
app.post('/api/products/:id/cancel', (req, res) => {
    const id = req.params.id;
    const { lastUpdated } = req.body;

    db.query(
        "UPDATE products SET rnd = 'Batal', reg = 'Batal', status = 'Gagal', lastUpdated = ? WHERE id = ?",
        [lastUpdated, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        }
    );
});

// Lanjutkan Kembali Proses Pemantauan
app.post('/api/products/:id/resume', (req, res) => {
    const id = req.params.id;
    const { lastUpdated } = req.body;

    db.query(
        "UPDATE products SET rnd = 'Menunggu', reg = 'Menunggu', status = 'Menunggu', lastUpdated = ? WHERE id = ?",
        [lastUpdated, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        }
    );
});

// Hapus Data Produk Terpilih
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;

    db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// Unggah Berkas Dokumen Final
app.post('/api/products/:id/brief', (req, res) => {
    const id = req.params.id;
    const { productBrief, lastUpdated } = req.body;

    db.query(
        'UPDATE products SET productBrief = ?, lastUpdated = ? WHERE id = ?',
        [productBrief, lastUpdated, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        }
    );
});

// Tangani Permintaan Halaman Lain
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint not found' });
    }
    next();
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
