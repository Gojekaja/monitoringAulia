let products = [
    { id: 1, client: 'Alex Noman', product: 'Serum Vitamin C', rnd: 'Selesai', reg: 'Selesai', status: 'Selesai', date: '2023-10-01', lastUpdated: '2023-10-10T10:00:00', document: null },
    { id: 2, client: 'Razib Rahman', product: 'Sunscreen Gel', rnd: 'F2', reg: 'Menunggu', status: 'Pengerjaan RnD', date: '2023-10-15', lastUpdated: '2023-10-20T14:30:00', document: null },
    { id: 3, client: 'Luke Norton', product: 'Acne Cream', rnd: 'Menunggu', reg: 'Menunggu', status: 'Menunggu', date: '2023-11-05', lastUpdated: '2023-11-05T09:15:00', document: null },
    { id: 4, client: 'Sarah Smith', product: 'Brightening Toner', rnd: 'F1', reg: 'Menunggu', status: 'Pengerjaan RnD', date: '2023-11-20', lastUpdated: '2023-11-25T11:45:00', document: null },
    { id: 5, client: 'John Doe', product: 'Night Lotion', rnd: 'Selesai', reg: 'Draft', status: 'Pengerjaan Registrasi', date: '2023-12-01', lastUpdated: '2023-12-05T16:20:00', document: null },
    { id: 6, client: 'Jane Roe', product: 'Hair Oil', rnd: 'Batal', reg: 'Batal', status: 'Gagal', date: '2023-12-10', lastUpdated: '2023-12-12T08:00:00', document: null },
];

let myChart = null;
let searchTerm = '';
let currentStatusFilter = 'Semua';
let currentSort = 'created_desc';
let filterStartDate = '';
let filterEndDate = '';
let loggedInRole = '';

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    const isDashboard = document.getElementById('nav-dashboard').classList.contains('active');
    const hideAksi = isDashboard;
    
    const actionHeader = document.getElementById('actionHeader');
    if (actionHeader) {
        actionHeader.style.display = hideAksi ? 'none' : '';
    }

    const filteredProducts = products.filter(p => {
        if (isDashboard) return true; // Ignore filters on dashboard

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
        if (isDashboard) {
            return new Date(b.lastUpdated) - new Date(a.lastUpdated);
        } else {
            if (currentSort === 'created_desc') {
                return new Date(b.date) - new Date(a.date);
            } else if (currentSort === 'created_asc') {
                return new Date(a.date) - new Date(b.date);
            } else if (currentSort === 'updated_desc') {
                return new Date(b.lastUpdated) - new Date(a.lastUpdated);
            } else if (currentSort === 'updated_asc') {
                return new Date(a.lastUpdated) - new Date(b.lastUpdated);
            }
        }
        return 0;
    });

    filteredProducts.forEach((p, index) => {
        let statusDot = 'dot-progress';
        let statusText = p.status;
        let inlineColor = '';
        
        if (p.status === 'Selesai') statusDot = 'dot-completed';
        else if (p.status === 'Gagal') statusDot = 'dot-failed';
        else if (p.status === 'Menunggu') { statusDot = ''; inlineColor = '#f59e0b'; }
        else if (p.status === 'Pengerjaan RnD') { statusDot = ''; inlineColor = '#3b82f6'; }
        else if (p.status === 'Pengerjaan Registrasi') { statusDot = ''; inlineColor = '#8b5cf6'; }

        const dotHtml = inlineColor ? `<span class="dot" style="background-color: ${inlineColor};"></span>` : `<span class="dot ${statusDot}"></span>`;

        let cancelOrResumeBtn = '';
        let editBtnHtml = '';
        let deleteBtnHtml = '';
        let uploadBriefBtnHtml = '';
        
        if (loggedInRole === 'Marketing') {
            if (p.rnd === 'Selesai' && !p.productBrief && p.status !== 'Gagal' && p.status !== 'Gagal/Batal') {
                uploadBriefBtnHtml = `
                    <button class="icon-btn btn-edit" style="background-color: #f3e8ff; color: #9333ea;" title="Upload Product Brief" onclick="triggerBriefUpload(${p.id})">
                        <i class="fas fa-upload"></i>
                    </button>
                `;
            }
            
            if (p.status === 'Gagal' || p.status === 'Gagal/Batal') {
                cancelOrResumeBtn = `
                    <button class="icon-btn btn-resume" title="Lanjutkan Proses" onclick="resumeProduct(${p.id})">
                        <i class="fas fa-undo"></i>
                    </button>
                `;
            } else {
                cancelOrResumeBtn = `
                    <button class="icon-btn btn-cancel" title="Batalkan Produk" onclick="cancelProduct(${p.id})">
                        <i class="fas fa-times-circle"></i>
                    </button>
                `;
            }
            deleteBtnHtml = `
                <button class="icon-btn btn-delete" title="Hapus Produk" onclick="deleteProduct(${p.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
        }
        
        if (loggedInRole === 'RnD' || loggedInRole === 'Registrasi') {
            if (p.status !== 'Gagal' && p.status !== 'Gagal/Batal') {
                if (loggedInRole === 'RnD' && p.productBrief) {
                    // Do not show edit button if Marketing has already uploaded the final brief
                } else {
                    editBtnHtml = `
                        <button class="icon-btn btn-edit" title="Update Status" onclick="openModal(${p.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    `;
                }
            }
        }

        const actionHtml = hideAksi ? '' : `
            <td>
                <div class="action-group" style="display: flex; gap: 8px; align-items: center;">
                    ${uploadBriefBtnHtml}
                    ${editBtnHtml}
                    ${cancelOrResumeBtn}
                    ${deleteBtnHtml}
                </div>
            </td>
        `;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${(index + 1).toString().padStart(2, '0')}</td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.client)}&background=random&rounded=true&size=32" alt="avatar">
                    ${p.client}
                </div>
            </td>
            <td>${p.date}</td>
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
                <div class="status-indicator">
                    ${dotHtml}
                    ${statusText}
                </div>
            </td>
            <td>${p.rnd}</td>
            <td>${p.reg}</td>
            ${actionHtml}
        `;
        tbody.appendChild(tr);
    });
    updateChart();
}

function updateChart() {
    const total = products.length;
    let waiting = 0, rnd = 0, reg = 0, completed = 0, failed = 0;

    products.forEach(p => {
        if (p.status === 'Selesai') completed++;
        else if (p.status === 'Gagal') failed++;
        else if (p.status === 'Menunggu') waiting++;
        else if (p.status === 'Pengerjaan RnD') rnd++;
        else if (p.status === 'Pengerjaan Registrasi') reg++;
    });

    document.getElementById('totalProducts').innerText = total;

    const pWait = total ? Math.round((waiting / total) * 100) : 0;
    const pRnd = total ? Math.round((rnd / total) * 100) : 0;
    const pReg = total ? Math.round((reg / total) * 100) : 0;
    const pComp = total ? Math.round((completed / total) * 100) : 0;
    const pFail = total ? Math.round((failed / total) * 100) : 0;

    const legends = document.querySelectorAll('.legend-percent');
    if (legends.length >= 5) {
        legends[0].innerHTML = `${pWait}%`;
        legends[1].innerHTML = `${pRnd}%`;
        legends[2].innerHTML = `${pReg}%`;
        legends[3].innerHTML = `${pComp}%`;
        legends[4].innerHTML = `${pFail}%`;
    }

    if (myChart) {
        myChart.data.datasets[0].data = [waiting, rnd, reg, completed, failed];
        myChart.update();
    } else {
        const ctx = document.getElementById('statusChart').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Menunggu', 'Pengerjaan RnD', 'Pengerjaan Registrasi', 'Selesai', 'Gagal/Batal'],
                datasets: [{
                    data: [waiting, rnd, reg, completed, failed],
                    backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#4ade80', '#ef4444'],
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Modal handling
const modal = document.getElementById('updateModal');
const closeBtn = document.querySelector('.close');
const docModal = document.getElementById('docModal');
const closeDocBtn = document.querySelector('.close-doc');

closeBtn.onclick = function() {
    modal.style.display = 'none';
}

closeDocBtn.onclick = function() {
    docModal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
    if (event.target == docModal) {
        docModal.style.display = 'none';
    }
}

let currentDocZoom = 100;

window.viewDocument = function(id) {
    const p = products.find(x => x.id === id);
    if (p && p.document) {
        document.getElementById('fullSizeImage').src = p.document;
        
        currentDocZoom = 100;
        document.getElementById('fullSizeImage').style.width = currentDocZoom + '%';
        
        const downloadBtn = document.getElementById('downloadDocBtn');
        downloadBtn.href = p.document;
        downloadBtn.download = `Dokumen_${p.product.replace(/\s+/g, '_')}`;
        
        docModal.style.display = 'block';
    }
}

document.getElementById('zoomInBtn').addEventListener('click', () => {
    currentDocZoom += 25;
    document.getElementById('fullSizeImage').style.width = currentDocZoom + '%';
});

document.getElementById('zoomOutBtn').addEventListener('click', () => {
    currentDocZoom = Math.max(25, currentDocZoom - 25);
    document.getElementById('fullSizeImage').style.width = currentDocZoom + '%';
});

function openModal(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('updateId').value = p.id;
    document.getElementById('rndStatus').value = p.rnd === 'Batal' ? 'Menunggu' : p.rnd;
    document.getElementById('regStatus').value = p.reg === 'Batal' ? 'Menunggu' : p.reg;
    
    document.getElementById('rndStatus').disabled = (loggedInRole !== 'RnD');
    document.getElementById('regStatus').disabled = (loggedInRole !== 'Registrasi');
    
    modal.style.display = 'block';
}

window.deleteProduct = function(id) {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
        products = products.filter(p => p.id !== id);
        renderTable();
    }
};

window.cancelProduct = function(id) {
    if (confirm("Apakah Anda yakin ingin membatalkan produk ini? Status akan diubah menjadi Gagal/Batal.")) {
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index].rnd = 'Batal';
            products[index].reg = 'Batal';
            products[index].status = 'Gagal';
            products[index].lastUpdated = new Date().toISOString();
            renderTable();
        }
    }
};

window.resumeProduct = function(id) {
    if (confirm("Apakah Anda yakin ingin memulihkan produk ini? Status akan dikembalikan menjadi 'Menunggu'.")) {
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index].rnd = 'Menunggu';
            products[index].reg = 'Menunggu';
            products[index].status = 'Menunggu';
            products[index].lastUpdated = new Date().toISOString();
            renderTable();
        }
    }
};

document.getElementById('updateForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('updateId').value);
    const p = products.find(x => x.id === id);
    if (p) {
        if (loggedInRole === 'RnD') {
            p.rnd = document.getElementById('rndStatus').value;
        }
        if (loggedInRole === 'Registrasi') {
            p.reg = document.getElementById('regStatus').value;
        }
        
        // updated 5-point logic to determine overall status
        if (p.rnd === 'Batal' || p.reg === 'Batal') {
            p.status = 'Gagal';
        } else if (p.rnd === 'Selesai' && p.reg === 'Selesai') {
            p.status = 'Selesai';
        } else if (p.rnd === 'Menunggu' && p.reg === 'Menunggu') {
            p.status = 'Menunggu';
        } else if (p.rnd !== 'Selesai') {
            p.status = 'Pengerjaan RnD';
        } else {
            p.status = 'Pengerjaan Registrasi';
        }
        
        p.lastUpdated = new Date().toISOString();
        
        renderTable();
        modal.style.display = 'none';
    }
});

// Marketing Form handling
let uploadedFileBase64 = null;
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const hint = document.getElementById('previewHint');
const uploadPrompt = document.getElementById('uploadPrompt');
const removePreviewBtn = document.getElementById('removePreviewBtn');
const documentUpload = document.getElementById('documentUpload');

documentUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            uploadedFileBase64 = evt.target.result;
            previewImage.src = uploadedFileBase64;
            previewImage.style.width = '100%';
            previewImage.style.cursor = 'zoom-in';
            
            uploadPrompt.style.display = 'none';
            previewContainer.style.display = 'block';
            hint.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

removePreviewBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    uploadedFileBase64 = null;
    documentUpload.value = '';
    previewContainer.style.display = 'none';
    hint.style.display = 'none';
    uploadPrompt.style.display = 'flex';
});

// Drag to pan logic + click to zoom
let isDragging = false;
let startX, startY, scrollLeft, scrollTop;

previewContainer.addEventListener('mousedown', (e) => {
    isDragging = false;
    if (previewImage.style.width === 'auto') {
        previewContainer.style.cursor = 'grabbing';
        startX = e.pageX - previewContainer.offsetLeft;
        startY = e.pageY - previewContainer.offsetTop;
        scrollLeft = previewContainer.scrollLeft;
        scrollTop = previewContainer.scrollTop;
    }
});

previewContainer.addEventListener('mousemove', (e) => {
    if (e.buttons !== 1) return; // Must hold left click
    if (previewImage.style.width === 'auto') {
        isDragging = true;
        e.preventDefault();
        const x = e.pageX - previewContainer.offsetLeft;
        const y = e.pageY - previewContainer.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        previewContainer.scrollLeft = scrollLeft - walkX;
        previewContainer.scrollTop = scrollTop - walkY;
    }
});

previewContainer.addEventListener('mouseup', () => {
    if (previewImage.style.width === 'auto') {
        previewContainer.style.cursor = 'grab';
    }
});

previewContainer.addEventListener('mouseleave', () => {
    if (previewImage.style.width === 'auto') {
        previewContainer.style.cursor = 'default';
    }
});

previewImage.addEventListener('click', function(e) {
    if (isDragging) {
        return; // Was dragging, so don't toggle zoom
    }
    
    if (this.style.width === '100%') {
        this.style.width = 'auto'; // Zoom in
        this.style.cursor = 'grab';
        previewContainer.style.cursor = 'grab';
    } else {
        this.style.width = '100%'; // Zoom out
        this.style.cursor = 'zoom-in';
        previewContainer.style.cursor = 'default';
    }
});

document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const client = document.getElementById('clientName').value;
    const product = document.getElementById('productName').value;

    if (!client || !product) {
        alert("Mohon isi Nama Pemesan dan Nama Produk");
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        client: client,
        product: product,
        rnd: 'Menunggu',
        reg: 'Menunggu',
        status: 'Menunggu',
        date: today,
        lastUpdated: now,
        document: uploadedFileBase64
    };

    products.unshift(newProduct);
    renderTable();
    this.reset();
    previewContainer.style.display = 'none';
    hint.style.display = 'none';
    uploadPrompt.style.display = 'flex';
    uploadedFileBase64 = null;
});

// Init
renderTable();

// Navigation logic
const navDashboard = document.getElementById('nav-dashboard');
const navList = document.getElementById('nav-list');
const topControls = document.getElementById('topControls');
const sidebar = document.getElementById('sidebar');
const contentGrid = document.getElementById('contentGrid');

navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    navDashboard.classList.add('active');
    navList.classList.remove('active');
    topControls.style.display = 'none';
    document.getElementById('sidebar').style.display = 'flex';
    
    if (loggedInRole === 'Marketing') {
        document.getElementById('bottomRowContainer').style.display = 'block';
    } else {
        document.getElementById('bottomRowContainer').style.display = 'none';
    }
    
    document.getElementById('topRowGrid').style.gridTemplateColumns = '2.5fr 1fr';
    document.getElementById('tableWrapper').style.maxHeight = '420px';
    renderTable();
});

navList.addEventListener('click', (e) => {
    e.preventDefault();
    navList.classList.add('active');
    navDashboard.classList.remove('active');
    topControls.style.display = 'flex';
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('bottomRowContainer').style.display = 'none';
    document.getElementById('topRowGrid').style.gridTemplateColumns = '1fr';
    document.getElementById('tableWrapper').style.maxHeight = 'none';
    renderTable();
});

// Search and Filter logic
document.getElementById('searchInput').addEventListener('input', function(e) {
    searchTerm = e.target.value.toLowerCase();
    renderTable();
});

document.getElementById('statusFilter').addEventListener('change', function(e) {
    currentStatusFilter = e.target.value;
    renderTable();
});

document.getElementById('sortFilter').addEventListener('change', function(e) {
    currentSort = e.target.value;
    renderTable();
});

// Flatpickr initialization for simple and functional Date Range / Single Date picking
const dateInput = document.getElementById('dateRangePicker');
const clearDateBtn = document.getElementById('clearDateBtn');

const fp = flatpickr(dateInput, {
    mode: "range",
    dateFormat: "Y-m-d",
    onChange: function(selectedDates, dateStr, instance) {
        if (selectedDates.length === 2) {
            filterStartDate = instance.formatDate(selectedDates[0], "Y-m-d");
            filterEndDate = instance.formatDate(selectedDates[1], "Y-m-d");
            clearDateBtn.style.display = 'inline-block';
            renderTable();
        } else if (selectedDates.length === 1) {
            filterStartDate = instance.formatDate(selectedDates[0], "Y-m-d");
            filterEndDate = filterStartDate; // Set end to start so "Only Date C" finds exact matches
            clearDateBtn.style.display = 'inline-block';
            renderTable();
        } else {
            filterStartDate = '';
            filterEndDate = '';
            clearDateBtn.style.display = 'none';
            renderTable();
        }
    }
});

clearDateBtn.addEventListener('click', () => {
    fp.clear(); // Automatically triggers onChange with empty selection to reset the filter
});

// Login Handling
const togglePassword = document.getElementById('togglePassword');
if (togglePassword) {
    togglePassword.addEventListener('click', function() {
        const pwdInput = document.getElementById('loginPassword');
        if (pwdInput.type === 'password') {
            pwdInput.type = 'text';
            this.classList.remove('fa-eye-slash');
            this.classList.add('fa-eye');
        } else {
            pwdInput.type = 'password';
            this.classList.remove('fa-eye');
            this.classList.add('fa-eye-slash');
        }
    });
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const usernameRaw = document.getElementById('loginUsername').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const errorMsg = document.getElementById('loginError');
    
    let validRole = '';
    if (usernameRaw === 'marketing') validRole = 'Marketing';
    else if (usernameRaw === 'rnd') validRole = 'RnD';
    else if (usernameRaw === 'registrasi' || usernameRaw === 'registration') validRole = 'Registrasi';
    
    if (!validRole) {
        errorMsg.textContent = 'Username tidak terdaftar';
        errorMsg.style.display = 'block';
        return;
    }
    
    if (password === 'admin') {
        loggedInRole = validRole;
        errorMsg.style.display = 'none';
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        
        applyRoleRestrictions();
    } else {
        errorMsg.textContent = 'Password salah!';
        errorMsg.style.display = 'block';
    }
});

function applyRoleRestrictions() {
    const bottomRow = document.getElementById('bottomRowContainer');
    
    if (loggedInRole === 'Marketing') {
        bottomRow.style.display = 'block'; // Marketing can input
    } else {
        bottomRow.style.display = 'none'; // RnD and Reg cannot input
    }
    
    // Switch to Dashboard by default on login to apply initial layouts correctly
    document.getElementById('nav-dashboard').click();
}

document.getElementById('nav-logout').addEventListener('click', function(e) {
    e.preventDefault();
    loggedInRole = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
});

// Product Brief Upload Logic
let currentUploadId = null;

window.triggerBriefUpload = function(id) {
    currentUploadId = id;
    document.getElementById('hiddenBriefUpload').click();
};

const hiddenBriefUpload = document.getElementById('hiddenBriefUpload');
if (hiddenBriefUpload) {
    hiddenBriefUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && currentUploadId !== null) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const p = products.find(x => x.id === currentUploadId);
                if (p) {
                    p.productBrief = event.target.result;
                    p.lastUpdated = new Date().toISOString();
                    renderTable();
                }
                currentUploadId = null;
                hiddenBriefUpload.value = '';
            };
            reader.readAsDataURL(file);
        }
    });
}

window.viewBrief = function(id) {
    const p = products.find(x => x.id === id);
    if (p && p.productBrief) {
        document.getElementById('fullSizeImage').src = p.productBrief;
        
        currentDocZoom = 100;
        document.getElementById('fullSizeImage').style.width = currentDocZoom + '%';
        
        const downloadBtn = document.getElementById('downloadDocBtn');
        downloadBtn.href = p.productBrief;
        downloadBtn.download = `ProductBrief_${p.product.replace(/\s+/g, '_')}`;
        
        docModal.style.display = 'block';
    }
};
