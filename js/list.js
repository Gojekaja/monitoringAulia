// Pengendali Halaman List
// Mengelola Pencarian Dan Filter

document.addEventListener('DOMContentLoaded', async () => {
    // Validasi Sesi Dan Logout
    const loggedInRole = localStorage.getItem('loggedInRole');
    if (!loggedInRole) {
        window.location.href = 'login.html';
        return;
    }
    window.loggedInRole = loggedInRole;

    const navLogout = document.getElementById('nav-logout');
    if (navLogout) {
        navLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Apakah Anda yakin ingin keluar?')) {
                localStorage.removeItem('loggedInRole');
                window.location.href = 'login.html';
            }
        });
    }

    // Inisialisasi Filter Pencarian Data
    let searchTerm = '';
    let currentStatusFilter = 'Semua';
    let currentSort = 'created_desc';
    let filterStartDate = '';
    let filterEndDate = '';

    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const sortFilter = document.getElementById('sortFilter');

    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            searchTerm = e.target.value.toLowerCase();
            await renderTable();
        });
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', async (e) => {
            currentStatusFilter = e.target.value;
            await renderTable();
        });
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', async (e) => {
            currentSort = e.target.value;
            await renderTable();
        });
    }

    // Pengaturan Kalender Rentang Tanggal
    const dateInput = document.getElementById('dateRangePicker');
    const clearDateBtn = document.getElementById('clearDateBtn');

    if (dateInput) {
        const fp = flatpickr(dateInput, {
            mode: "range",
            dateFormat: "Y-m-d",
            onChange: async function(selectedDates, dateStr, instance) {
                if (selectedDates.length === 2) {
                    filterStartDate = instance.formatDate(selectedDates[0], "Y-m-d");
                    filterEndDate = instance.formatDate(selectedDates[1], "Y-m-d");
                    if (clearDateBtn) clearDateBtn.style.display = 'inline-block';
                    await renderTable();
                } else if (selectedDates.length === 1) {
                    filterStartDate = instance.formatDate(selectedDates[0], "Y-m-d");
                    filterEndDate = filterStartDate;
                    if (clearDateBtn) clearDateBtn.style.display = 'inline-block';
                    await renderTable();
                } else {
                    filterStartDate = '';
                    filterEndDate = '';
                    if (clearDateBtn) clearDateBtn.style.display = 'none';
                    await renderTable();
                }
            }
        });

        if (clearDateBtn) {
            clearDateBtn.addEventListener('click', () => {
                fp.clear();
            });
        }
    }

    // Tampilkan Tabel Pemantauan Detail
    async function renderTable() {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        const formatDateTime = (isoStr) => {
            if (!isoStr) return '-';
            try {
                const date = new Date(isoStr);
                if (isNaN(date.getTime())) return isoStr;
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `<div style="white-space: nowrap; font-weight: 500;">${day}/${month}/${year}</div><div style="font-size: 12px; color: var(--color-text-light); margin-top: 4px;"><i class="far fa-clock" style="font-size: 11px; margin-right: 4px;"></i>${hours}:${minutes}</div>`;
            } catch (e) {
                return isoStr;
            }
        };

        const products = await window.db.getProducts();

        // Penyaringan Dan Pengurutan Data
        let filteredProducts = [...products];
        filteredProducts = products.filter(p => {
            const matchesSearch = p.client.toLowerCase().includes(searchTerm) || p.product.toLowerCase().includes(searchTerm);
            const matchesStatus = currentStatusFilter === 'Semua' || p.status === currentStatusFilter;
            
            let matchesDate = true;
            if (filterStartDate && filterEndDate) {
                matchesDate = p.date >= filterStartDate && p.date <= filterEndDate;
            } else if (filterStartDate) {
                matchesDate = p.date === filterStartDate;
            } else if (filterEndDate) {
                matchesDate = p.date === filterEndDate;
            }
            return matchesSearch && matchesStatus && matchesDate;
        });

        filteredProducts.sort((a, b) => {
            if (currentSort === 'created_desc') return new Date(b.date) - new Date(a.date);
            if (currentSort === 'created_asc') return new Date(a.date) - new Date(b.date);
            if (currentSort === 'updated_desc') return new Date(b.lastUpdated) - new Date(a.lastUpdated);
            if (currentSort === 'updated_asc') return new Date(a.lastUpdated) - new Date(b.lastUpdated);
            return 0;
        });

        // Gambar Baris Data Tabel
        filteredProducts.forEach((p, index) => {
            let statusClass = 'status-rnd';
            if (p.status === 'Selesai') statusClass = 'status-selesai';
            else if (p.status === 'Gagal') statusClass = 'status-gagal';
            else if (p.status === 'Menunggu') statusClass = 'status-menunggu';
            else if (p.status === 'Pengerjaan RnD') statusClass = 'status-rnd';
            else if (p.status === 'Pengerjaan Registrasi') statusClass = 'status-registrasi';

            const cleanDate = p.date ? (p.date.includes('T') ? p.date.split('T')[0] : p.date) : '-';

            let highlightRnD = false;
            let highlightReg = false;

            if (p.status !== 'Gagal') {
                if (p.rnd !== 'Menunggu' && p.rnd !== 'Selesai') {
                    highlightRnD = true;
                } else if (p.rnd === 'Selesai') {
                    if (p.reg !== 'Menunggu') {
                        highlightReg = true;
                    } else {
                        highlightRnD = true;
                    }
                }
            }

            const rndHtml = highlightRnD 
                ? `<div style="border-left: 3px solid #3b82f6; padding-left: 8px; font-weight: 600; color: #1d4ed8;">${p.rnd}</div>`
                : `<div style="padding-left: 11px; color: var(--color-text-light);">${p.rnd}</div>`;
                
            const regHtml = highlightReg 
                ? `<div style="border-left: 3px solid #8b5cf6; padding-left: 8px; font-weight: 600; color: #7c3aed;">${p.reg}</div>`
                : `<div style="padding-left: 11px; color: var(--color-text-light);">${p.reg}</div>`;

            // Tombol Aksi Sesuai Peran
            let uploadBriefBtnHtml = '';
            let editBtnHtml = '';
            let cancelOrResumeBtn = '';
            let deleteBtnHtml = '';

            if (window.loggedInRole === 'Marketing') {
                if (p.rnd === 'Selesai' && !p.productBrief && p.status !== 'Gagal') {
                    uploadBriefBtnHtml = `
                        <button class="icon-btn btn-edit" style="background-color: #f3e8ff; color: #9333ea;" title="Upload Product Brief" onclick="window.triggerBriefUpload(${p.id})">
                             <i class="fas fa-upload"></i>
                        </button>
                    `;
                }
                
                if (p.status === 'Gagal') {
                    cancelOrResumeBtn = `
                        <button class="icon-btn btn-resume" title="Lanjutkan Proses" onclick="window.resumeProduct(${p.id})">
                            <i class="fas fa-undo"></i>
                        </button>
                    `;
                } else {
                    cancelOrResumeBtn = `
                        <button class="icon-btn btn-cancel" title="Batalkan Produk" onclick="window.cancelProduct(${p.id})">
                            <i class="fas fa-times-circle"></i>
                        </button>
                    `;
                }

                deleteBtnHtml = `
                    <button class="icon-btn btn-delete" title="Hapus Produk" onclick="window.deleteProduct(${p.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
            }

            if (window.loggedInRole === 'RnD' || window.loggedInRole === 'Registrasi') {
                if (p.status !== 'Gagal') {
                    if (p.rnd === 'Selesai' && p.reg === 'Selesai') {
                        // Keduanya selesai, tampilkan ikon centang
                        editBtnHtml = `
                            <span style="color: #10b981; font-size: 18px; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px;" title="Kedua Fase Selesai">
                                <i class="fas fa-check-circle"></i>
                            </span>
                        `;
                    } else if (window.loggedInRole === 'RnD' && p.rnd === 'Selesai') {
                        // RnD selesai, RnD tidak bisa edit lagi (centang hijau)
                        editBtnHtml = `
                            <button class="icon-btn" style="color: #10b981; background-color: #ecfdf5; cursor: not-allowed;" title="Fase RnD sudah selesai" disabled>
                                <i class="fas fa-check-circle"></i>
                            </button>
                        `;
                    } else if (window.loggedInRole === 'Registrasi' && p.reg === 'Selesai') {
                        // Registrasi selesai, Registrasi tidak bisa edit lagi (centang hijau)
                        editBtnHtml = `
                            <button class="icon-btn" style="color: #10b981; background-color: #ecfdf5; cursor: not-allowed;" title="Fase Registrasi sudah selesai" disabled>
                                <i class="fas fa-check-circle"></i>
                            </button>
                        `;
                    } else if (window.loggedInRole === 'Registrasi' && p.rnd !== 'Selesai') {
                        // Terkunci jika RnD belum Selesai
                        editBtnHtml = `
                            <button class="icon-btn" style="color: #94a3b8; background-color: #f1f5f9; cursor: not-allowed;" title="Fase RnD belum selesai" disabled>
                                <i class="fas fa-lock"></i>
                            </button>
                        `;
                    } else {
                        editBtnHtml = `
                            <button class="icon-btn btn-edit" title="Update Status" onclick="window.openModal(${p.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                        `;
                    }
                }
            }

            const tr = document.createElement('tr');
            tr.id = `product-row-${p.id}`;
            tr.innerHTML = `
                <td>${(index + 1).toString().padStart(2, '0')}</td>
                <td>${p.client}</td>
                <td style="white-space: nowrap;">${cleanDate}</td>
                <td>${p.product}</td>
                <td>
                    ${p.document 
                        ? `<button class="action-btn" onclick="window.viewDocument(${p.id})" style="color: var(--color-progress); margin-bottom: ${p.productBrief ? '5px' : '0'}; display: block;"><i class="fas fa-file-image"></i> Awal</button>` 
                        : '<span style="color: #ccc; display: block;">-</span>'}
                    ${p.productBrief
                        ? `<button class="action-btn" onclick="window.viewBrief(${p.id})" style="color: #9333ea; display: block;"><i class="fas fa-file-image"></i> Final</button>`
                        : ''}
                </td>
                <td>
                    <div class="status-indicator ${statusClass}">
                        <span class="dot"></span>
                        ${p.status}
                    </div>
                </td>
                <td>${rndHtml}</td>
                <td>${regHtml}</td>
                <td>${formatDateTime(p.lastUpdated)}</td>
                <td>
                    <div class="action-group" style="display: flex; gap: 8px; align-items: center;">
                        ${uploadBriefBtnHtml}
                        ${editBtnHtml}
                        ${cancelOrResumeBtn}
                        ${deleteBtnHtml}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Render Awal Tabel Produk
    await renderTable();

    // Jalankan highlight jika parameter 'highlight' ditemukan di URL
    const urlParams = new URLSearchParams(window.location.search);
    const highlightId = urlParams.get('highlight');
    if (highlightId) {
        const targetRow = document.getElementById(`product-row-${highlightId}`);
        if (targetRow) {
            // Gulir secara halus ke baris data tersebut
            targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Beri sorotan warna latar kuning lembut secara sementara
            targetRow.style.backgroundColor = '#fef08a';
            targetRow.style.transition = 'background-color 0.5s';
            
            // Hilangkan sorotan secara perlahan setelah 3 detik
            setTimeout(() => {
                targetRow.style.backgroundColor = '';
            }, 3000);
        }
    }

    // Tangani Modal Update Status
    const updateModal = document.getElementById('updateModal');
    const closeBtn = document.querySelector('.close');

    if (closeBtn) closeBtn.onclick = () => updateModal.style.display = 'none';

    window.openModal = async function(id) {
        const products = await window.db.getProducts();
        const p = products.find(x => x.id === id);
        if (!p) return;

        document.getElementById('updateId').value = p.id;
        document.getElementById('rndStatus').value = p.rnd === 'Batal' ? 'Menunggu' : p.rnd;
        document.getElementById('regStatus').value = p.reg === 'Batal' ? 'Menunggu' : p.reg;
        
        document.getElementById('rndStatus').disabled = (window.loggedInRole !== 'RnD');
        document.getElementById('regStatus').disabled = (window.loggedInRole !== 'Registrasi');
        
        updateModal.style.display = 'block';
    };

    const updateForm = document.getElementById('updateForm');
    if (updateForm) {
        updateForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const id = parseInt(document.getElementById('updateId').value);
            const rndStatusVal = document.getElementById('rndStatus').value;
            const regStatusVal = document.getElementById('regStatus').value;

            // Verifikasi tambahan sebelum menyelesaikan fase
            const products = await window.db.getProducts();
            const p = products.find(x => x.id === id);
            if (p) {
                if (rndStatusVal === 'Selesai' && p.rnd !== 'Selesai') {
                    if (!confirm('Apakah Anda yakin ingin menyelesaikan Fase RnD? Setelah diselesaikan, Anda tidak dapat mengubah status fase ini lagi.')) {
                        return;
                    }
                }
                if (regStatusVal === 'Selesai' && p.reg !== 'Selesai') {
                    if (!confirm('Apakah Anda yakin ingin menyelesaikan Fase Registrasi? Setelah diselesaikan, Anda tidak dapat mengubah status fase ini lagi.')) {
                        return;
                    }
                }
            }

            await window.db.updateProduct(id, rndStatusVal, regStatusVal);
            await renderTable();
            updateModal.style.display = 'none';
        });
    }

    // Aksi Dan Unggah Brief
    window.deleteProduct = async function(id) {
        if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
            await window.db.deleteProduct(id);
            await renderTable();
        }
    };

    window.cancelProduct = async function(id) {
        if (confirm("Apakah Anda yakin ingin membatalkan produk ini? Status akan diubah menjadi Gagal/Batal.")) {
            await window.db.cancelProduct(id);
            await renderTable();
        }
    };

    window.resumeProduct = async function(id) {
        if (confirm("Apakah Anda yakin ingin memulihkan produk ini? Status akan dikembalikan menjadi 'Menunggu'.")) {
            await window.db.resumeProduct(id);
            await renderTable();
        }
    };

    let currentUploadId = null;
    const hiddenBriefUpload = document.getElementById('hiddenBriefUpload');

    window.triggerBriefUpload = function(id) {
        currentUploadId = id;
        if (hiddenBriefUpload) hiddenBriefUpload.click();
    };

    if (hiddenBriefUpload) {
        hiddenBriefUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && currentUploadId !== null) {
                const reader = new FileReader();
                reader.onload = async function(event) {
                    await window.db.uploadBrief(currentUploadId, event.target.result);
                    await renderTable();
                    currentUploadId = null;
                    hiddenBriefUpload.value = '';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Pratinjau Dokumen Dan Zoom
    const docModal = document.getElementById('docModal');
    const closeDocBtn = document.querySelector('.close-doc');

    if (closeDocBtn) closeDocBtn.onclick = () => docModal.style.display = 'none';

    window.onclick = function(event) {
        if (event.target == updateModal) updateModal.style.display = 'none';
        if (event.target == docModal) docModal.style.display = 'none';
    };

    let currentDocZoom = 100;
    const fullSizeImage = document.getElementById('fullSizeImage');

    window.viewDocument = async function(id) {
        const products = await window.db.getProducts();
        const p = products.find(x => x.id === id);
        if (p && p.document) {
            if (fullSizeImage) {
                fullSizeImage.src = p.document;
                currentDocZoom = 100;
                fullSizeImage.style.width = currentDocZoom + '%';
            }
            const downloadBtn = document.getElementById('downloadDocBtn');
            if (downloadBtn) {
                downloadBtn.href = p.document;
                downloadBtn.download = `Dokumen_${p.product.replace(/\s+/g, '_')}.png`;
            }
            if (docModal) docModal.style.display = 'block';
        }
    };

    window.viewBrief = async function(id) {
        const products = await window.db.getProducts();
        const p = products.find(x => x.id === id);
        if (p && p.productBrief) {
            if (fullSizeImage) {
                fullSizeImage.src = p.productBrief;
                currentDocZoom = 100;
                fullSizeImage.style.width = currentDocZoom + '%';
            }
            const downloadBtn = document.getElementById('downloadDocBtn');
            if (downloadBtn) {
                downloadBtn.href = p.productBrief;
                downloadBtn.download = `ProductBrief_${p.product.replace(/\s+/g, '_')}.png`;
            }
            if (docModal) docModal.style.display = 'block';
        }
    };

    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');

    if (zoomInBtn && fullSizeImage) {
        zoomInBtn.addEventListener('click', () => {
            currentDocZoom += 25;
            fullSizeImage.style.width = currentDocZoom + '%';
        });
    }
    if (zoomOutBtn && fullSizeImage) {
        zoomOutBtn.addEventListener('click', () => {
            currentDocZoom = Math.max(25, currentDocZoom - 25);
            fullSizeImage.style.width = currentDocZoom + '%';
        });
    }
});
