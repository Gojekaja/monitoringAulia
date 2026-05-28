// Akses Basis Data Sistem
// Digunakan Bersama Kontroler Lain

const db = {
    async getProducts() {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Gagal memuat produk dari server');
            return await response.json();
        } catch (error) {
            console.error('getProducts error:', error);
            return [];
        }
    },

    async addProduct(client, product, docBase64) {
        const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).split(' ')[0]; // Mengambil Tanggal Lokal Sekarang
        const now = new Date().toISOString();
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client,
                    product,
                    date: today,
                    lastUpdated: now,
                    document: docBase64 || null
                })
            });
            if (!response.ok) throw new Error('Gagal menyimpan produk baru');
            return await response.json();
        } catch (error) {
            console.error('addProduct error:', error);
            return null;
        }
    },

    async updateProduct(id, rndStatus, regStatus) {
        try {
            const products = await this.getProducts();
            const p = products.find(x => x.id === id);
            if (!p) throw new Error('Produk tidak ditemukan');

            let finalRnd = rndStatus !== undefined ? rndStatus : p.rnd;
            let finalReg = regStatus !== undefined ? regStatus : p.reg;
            let newStatus = 'Menunggu';
            
            if (finalRnd === 'Batal' || finalReg === 'Batal') {
                newStatus = 'Gagal';
            } else if (finalRnd === 'Selesai' && finalReg === 'Selesai') {
                newStatus = 'Selesai';
            } else if (finalRnd === 'Menunggu' && finalReg === 'Menunggu') {
                newStatus = 'Menunggu';
            } else if (finalRnd !== 'Selesai') {
                newStatus = 'Pengerjaan RnD';
            } else {
                newStatus = 'Pengerjaan Registrasi';
            }

            const now = new Date().toISOString();
            const response = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rnd: finalRnd,
                    reg: finalReg,
                    status: newStatus,
                    lastUpdated: now
                })
            });
            if (!response.ok) throw new Error('Gagal memperbarui status produk');
            return { id, rnd: finalRnd, reg: finalReg, status: newStatus, lastUpdated: now };
        } catch (error) {
            console.error('updateProduct error:', error);
            return null;
        }
    },

    async deleteProduct(id) {
        try {
            const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Gagal menghapus produk');
            return true;
        } catch (error) {
            console.error('deleteProduct error:', error);
            return false;
        }
    },

    async cancelProduct(id) {
        const now = new Date().toISOString();
        try {
            const response = await fetch(`/api/products/${id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lastUpdated: now })
            });
            if (!response.ok) throw new Error('Gagal membatalkan produk');
            return true;
        } catch (error) {
            console.error('cancelProduct error:', error);
            return false;
        }
    },

    async resumeProduct(id) {
        const now = new Date().toISOString();
        try {
            const response = await fetch(`/api/products/${id}/resume`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lastUpdated: now })
            });
            if (!response.ok) throw new Error('Gagal memulihkan produk');
            return true;
        } catch (error) {
            console.error('resumeProduct error:', error);
            return false;
        }
    },

    async uploadBrief(id, briefBase64) {
        const now = new Date().toISOString();
        try {
            const response = await fetch(`/api/products/${id}/brief`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productBrief: briefBase64,
                    lastUpdated: now
                })
            });
            if (!response.ok) throw new Error('Gagal mengunggah product brief');
            return true;
        } catch (error) {
            console.error('uploadBrief error:', error);
            return false;
        }
    }
};

window.db = db;
