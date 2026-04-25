/**
 * ==========================================
 * APLIKASI CBT PRO - SINGLE FILE NODE.JS
 * ==========================================
 * Panduan Deployment untuk Hostinger / GitHub:
 * 1. Upload file ini ke GitHub Anda dengan nama `server.js`
 * 2. Di panel Hostinger, buat Aplikasi Node.js baru dan hubungkan ke GitHub Anda.
 * 3. File ini menggunakan modul bawaan Node.js (http), sehingga akan 
 * langsung berjalan tanpa perlu "npm install" library yang berat.
 */

const http = require('http');

// ==========================================
// KODE FRONTEND (HTML, CSS, React UI)
// ==========================================
// Catatan: Seluruh kode tampilan (UI) yang mudah diedit ada di bawah ini.
const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal Ujian CBT Pro</title>
    <!-- Tailwind CSS untuk Desain -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- React & ReactDOM -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <!-- Babel untuk kompilasi JSX di Browser -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="bg-slate-50 text-slate-800 font-sans">
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect } = React;

        // Komponen Ikon (Menggantikan Lucide dengan FontAwesome agar bisa via CDN)
        function Icon({ name, className }) {
            return <i className={"fas fa-" + name + " " + (className || "")}></i>;
        }

        function App() {
            // --- STATE MANAJEMEN ---
            const [currentUser, setCurrentUser] = useState(null); 
            const [view, setView] = useState('dashboard');
            
            const [categories, setCategories] = useState([
                { id: 1, name: 'Matematika' },
                { id: 2, name: 'Bahasa Indonesia' },
                { id: 3, name: 'Bahasa Inggris' }
            ]);

            const [questions, setQuestions] = useState([
                { id: 1, categoryId: 1, text: 'Berapakah hasil dari 25 x 4?', options: ['80', '90', '100', '110', '120'], answer: 2 },
                { id: 2, categoryId: 2, text: 'Sinonim dari kata "Eksklusif" adalah...', options: ['Umum', 'Khusus', 'Biasa', 'Terkecuali', 'Murah'], answer: 1 },
            ]);

            const [packages, setPackages] = useState([
                { id: 1, title: 'Ujian Tengah Semester - Ganjil', duration: 60, questionIds: [1, 2], active: true }
            ]);

            const [admins, setAdmins] = useState([
                { id: 1, username: 'admin_utama', role: 'Super Admin' }
            ]);

            // Helper format judul
            const getTitle = (v) => {
                if(v === 'bankSoal') return 'Bank Soal';
                if(v === 'paketSoal') return 'Paket Soal';
                if(v === 'pengaturan') return 'Pengaturan Co-Admin';
                return 'Dashboard';
            };

            // --- KOMPONEN LOGIN ---
            if (!currentUser) {
                return (
                    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                            <div className="text-center mb-8">
                                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icon name="book-open" className="text-white text-3xl" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-800">CBT System Pro</h1>
                                <p className="text-gray-500">Silakan login untuk melanjutkan</p>
                            </div>
                            
                            <div className="space-y-4">
                                <button 
                                    onClick={() => setCurrentUser({ name: 'Budi (Admin)', role: 'admin' })}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2"
                                >
                                    <Icon name="cog" className="text-lg" /> Login sebagai Admin
                                </button>
                                <button 
                                    onClick={() => setCurrentUser({ name: 'Andi (Siswa)', role: 'student', nis: '102938' })}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2"
                                >
                                    <Icon name="users" className="text-lg" /> Login sebagai Siswa
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            // --- ROUTING HALAMAN ---
            return (
                <div className="min-h-screen bg-slate-50 flex text-slate-800">
                    {/* Sidebar (Admin) */}
                    {currentUser.role === 'admin' && view !== 'test' && (
                        <div className="w-64 bg-slate-900 text-white flex flex-col">
                            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                                <Icon name="book-open" className="text-blue-400 text-xl" />
                                <span className="text-xl font-bold">CBT Admin</span>
                            </div>
                            <div className="flex-1 py-6 space-y-2 px-4">
                                <SidebarBtn iconName="cog" label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
                                <SidebarBtn iconName="file-alt" label="Bank Soal" active={view === 'bankSoal'} onClick={() => setView('bankSoal')} />
                                <SidebarBtn iconName="book-open" label="Paket Soal" active={view === 'paketSoal'} onClick={() => setView('paketSoal')} />
                                <SidebarBtn iconName="users" label="Pengaturan Co-Admin" active={view === 'pengaturan'} onClick={() => setView('pengaturan')} />
                            </div>
                            <div className="p-4 border-t border-slate-800">
                                <button onClick={() => setCurrentUser(null)} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-red-500/20 text-red-400 transition">
                                    <Icon name="sign-out-alt" className="text-lg" /> Keluar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Area Konten Utama */}
                    <div className="flex-1 flex flex-col h-screen overflow-hidden">
                        <header className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center z-10">
                            <h2 className="text-xl font-semibold text-slate-700 capitalize">
                                {currentUser.role === 'student' ? 'Portal Ujian Siswa' : getTitle(view)}
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="font-semibold text-slate-800">{currentUser.name}</div>
                                    <div className="text-xs text-slate-500 uppercase">{currentUser.role}</div>
                                </div>
                                {currentUser.role === 'student' && (
                                    <button onClick={() => setCurrentUser(null)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100">
                                        <Icon name="sign-out-alt" className="text-lg" />
                                    </button>
                                )}
                            </div>
                        </header>

                        <main className="flex-1 overflow-y-auto p-8">
                            {currentUser.role === 'admin' ? (
                                <React.Fragment>
                                    {view === 'dashboard' && <AdminDashboard packages={packages} questions={questions} admins={admins} />}
                                    {view === 'bankSoal' && <BankSoal categories={categories} questions={questions} setQuestions={setQuestions} setCategories={setCategories} />}
                                    {view === 'paketSoal' && <PaketSoal packages={packages} questions={questions} setPackages={setPackages} />}
                                    {view === 'pengaturan' && <PengaturanAdmin admins={admins} setAdmins={setAdmins} />}
                                </React.Fragment>
                            ) : (
                                <StudentPortal packages={packages} questions={questions} />
                            )}
                        </main>
                    </div>
                </div>
            );
        }

        // --- SUB COMPONENTS ---

        function SidebarBtn({ iconName, label, active, onClick }) {
            return (
                <button 
                    onClick={onClick}
                    className={"w-full flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 " + (active ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200")}
                >
                    <Icon name={iconName} className="text-lg w-6" />
                    <span className="font-medium">{label}</span>
                </button>
            );
        }

        function AdminDashboard({ packages, questions, admins }) {
            return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Soal" value={questions.length} iconName="file-alt" iconColor="text-blue-500" bg="bg-blue-50" />
                        <StatCard title="Paket Ujian" value={packages.length} iconName="book-open" iconColor="text-emerald-500" bg="bg-emerald-50" />
                        <StatCard title="Total Admin" value={admins.length} iconName="users" iconColor="text-purple-500" bg="bg-purple-50" />
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold mb-4">Selamat Datang di Panel Admin</h3>
                        <p className="text-slate-600">Gunakan menu di sebelah kiri untuk mengelola bank soal, merakit paket ujian, dan mengatur hak akses administrator pendamping (co-admin).</p>
                    </div>
                </div>
            );
        }

        function StatCard({ title, value, iconName, iconColor, bg }) {
            return (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className={"p-4 rounded-xl " + bg}>
                        <Icon name={iconName} className={"text-3xl " + iconColor} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">{title}</p>
                        <p className="text-3xl font-bold text-slate-800">{value}</p>
                    </div>
                </div>
            );
        }

        function BankSoal({ categories, questions, setQuestions, setCategories }) {
            const [isAdding, setIsAdding] = useState(false);
            const [filterCat, setFilterCat] = useState('all');

            const filteredQuestions = filterCat === 'all' ? questions : questions.filter(q => q.categoryId === parseInt(filterCat));

            return (
                <div className="space-y-6">
                    {!isAdding ? (
                        <React.Fragment>
                            <div className="flex justify-between items-center">
                                <div className="flex gap-4 items-center">
                                    <select 
                                        className="bg-white border border-slate-200 text-slate-700 py-2 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
                                    >
                                        <option value="all">Semua Klasifikasi (Kategori)</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <button 
                                    onClick={() => setIsAdding(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-lg shadow-blue-200"
                                >
                                    <Icon name="plus" /> Tambah Soal Baru
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                            <th className="py-4 px-6 font-medium">Soal</th>
                                            <th className="py-4 px-6 font-medium">Kategori</th>
                                            <th className="py-4 px-6 font-medium text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredQuestions.map((q) => (
                                            <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                                                <td className="py-4 px-6">
                                                    <div className="font-medium text-slate-800 line-clamp-2">{q.text}</div>
                                                    <div className="text-sm text-slate-500 mt-1">{"Jawaban: Opsi " + String.fromCharCode(65 + q.answer)}</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold">
                                                        {categories.find(c => c.id === q.categoryId)?.name || 'Umum'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button className="p-2 text-slate-400 hover:text-blue-500"><Icon name="edit" /></button>
                                                    <button className="p-2 text-slate-400 hover:text-red-500"><Icon name="trash" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredQuestions.length === 0 && (
                                            <tr><td colSpan="3" className="py-8 text-center text-slate-500">Belum ada soal di kategori ini.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </React.Fragment>
                    ) : (
                        <SoalEditor 
                            categories={categories} 
                            onSave={(newQ) => { setQuestions([...questions, { ...newQ, id: Date.now() }]); setIsAdding(false); }}
                            onCancel={() => setIsAdding(false)} 
                        />
                    )}
                </div>
            );
        }

        function SoalEditor({ categories, onSave, onCancel }) {
            const [formData, setFormData] = useState({
                categoryId: categories[0]?.id || 1,
                text: '',
                options: ['', '', '', '', ''],
                answer: 0
            });

            const handleOptionChange = (index, value) => {
                const newOptions = [...formData.options];
                newOptions[index] = value;
                setFormData({ ...formData, options: newOptions });
            };

            return (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Icon name="edit" className="text-blue-500" /> Editor Soal Interaktif
                    </h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Klasifikasi (Kategori) Soal</label>
                            <select 
                                value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: parseInt(e.target.value)})}
                                className="w-full border border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Pertanyaan</label>
                            <div className="border border-slate-200 rounded-t-xl bg-slate-50 p-2 flex gap-2">
                                <button className="p-2 hover:bg-slate-200 rounded text-slate-600"><Icon name="bold" /></button>
                                <button className="p-2 hover:bg-slate-200 rounded text-slate-600"><Icon name="italic" /></button>
                                <button className="p-2 hover:bg-slate-200 rounded text-slate-600"><Icon name="list" /></button>
                                <div className="w-px bg-slate-300 mx-1"></div>
                                <button className="p-2 hover:bg-slate-200 rounded text-slate-600 flex items-center gap-1 text-xs font-medium"><Icon name="image" /> Sisipkan Gambar</button>
                            </div>
                            <textarea 
                                value={formData.text} onChange={(e) => setFormData({...formData, text: e.target.value})}
                                className="w-full border-x border-b border-slate-200 py-3 px-4 rounded-b-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[150px]"
                                placeholder="Ketikkan pertanyaan di sini..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-4">Pilihan Jawaban & Kunci</label>
                            <div className="space-y-3">
                                {formData.options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <input 
                                            type="radio" name="correctAnswer" checked={formData.answer === idx}
                                            onChange={() => setFormData({...formData, answer: idx})}
                                            className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="font-bold text-slate-500 w-6">{String.fromCharCode(65 + idx) + "."}</span>
                                        <input 
                                            type="text" value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)}
                                            className={"flex-1 border py-2 px-4 rounded-lg outline-none transition " + (formData.answer === idx ? "border-emerald-400 bg-emerald-50" : "border-slate-200 focus:border-blue-400")}
                                            placeholder={"Ketik opsi " + String.fromCharCode(65 + idx) + "..."}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <button onClick={onCancel} className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition">Batal</button>
                            <button onClick={() => onSave(formData)} className="px-6 py-2.5 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                                Simpan ke Bank Soal
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        function PaketSoal({ packages, questions, setPackages }) {
            const [isCreating, setIsCreating] = useState(false);

            return (
                <div className="space-y-6">
                    {!isCreating ? (
                        <React.Fragment>
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Daftar Paket Ujian</h3>
                                <button 
                                    onClick={() => setIsCreating(true)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-lg shadow-emerald-200"
                                >
                                    <Icon name="plus" /> Rakit Paket Baru
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {packages.map(pkg => (
                                    <div key={pkg.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                                        <div className={"absolute top-0 left-0 w-full h-1 " + (pkg.active ? "bg-emerald-400" : "bg-slate-300")}></div>
                                        <h4 className="text-lg font-bold text-slate-800 mb-2">{pkg.title}</h4>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                            <span className="flex items-center gap-1"><Icon name="clock" /> {pkg.duration} Menit</span>
                                            <span className="flex items-center gap-1"><Icon name="file-alt" /> {pkg.questionIds.length} Soal</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
                                            <span className={"px-3 py-1 rounded-full text-xs font-bold " + (pkg.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500")}>
                                                {pkg.active ? 'Aktif' : 'Draft'}
                                            </span>
                                            <div className="flex gap-2">
                                                <button className="text-slate-400 hover:text-blue-500"><Icon name="edit" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </React.Fragment>
                    ) : (
                        <PaketEditor 
                            questions={questions}
                            onSave={(newPkg) => { setPackages([...packages, {...newPkg, id: Date.now()}]); setIsCreating(false); }}
                            onCancel={() => setIsCreating(false)}
                        />
                    )}
                </div>
            );
        }

        function PaketEditor({ questions, onSave, onCancel }) {
            const [title, setTitle] = useState('');
            const [duration, setDuration] = useState(60);
            const [selectedQs, setSelectedQs] = useState([]);

            const toggleQ = (id) => {
                if (selectedQs.includes(id)) setSelectedQs(selectedQs.filter(q => q !== id));
                else setSelectedQs([...selectedQs, id]);
            };

            return (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold mb-6">Rakit Paket Soal Baru</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Paket Ujian</label>
                            <input 
                                type="text" value={title} onChange={e => setTitle(e.target.value)}
                                className="w-full border border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Contoh: Tryout Ujian Nasional"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Durasi (Menit)</label>
                            <input 
                                type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value))}
                                className="w-full border border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <label className="block text-sm font-semibold text-slate-700 mb-3">{"Tarik Soal dari Bank Soal (" + selectedQs.length + " terpilih)"}</label>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                        {questions.map(q => (
                            <div key={q.id} onClick={() => toggleQ(q.id)} className={"p-4 border-b border-slate-100 flex gap-4 cursor-pointer hover:bg-slate-50 transition " + (selectedQs.includes(q.id) ? "bg-blue-50/50" : "")}>
                                <input type="checkbox" checked={selectedQs.includes(q.id)} readOnly className="mt-1 w-5 h-5 text-blue-600 rounded" />
                                <div>
                                    <p className="text-slate-800 font-medium line-clamp-2">{q.text}</p>
                                    <p className="text-xs text-slate-500 mt-1">{"ID Soal: " + q.id}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                        <button onClick={onCancel} className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100">Batal</button>
                        <button onClick={() => onSave({ title, duration, questionIds: selectedQs, active: true })} className="px-6 py-2.5 rounded-xl font-medium bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200">
                            Simpan Paket
                        </button>
                    </div>
                </div>
            );
        }

        function PengaturanAdmin({ admins, setAdmins }) {
            return (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-3xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Kelola Akses Co-Admin</h3>
                        <button className="bg-blue-100 text-blue-600 hover:bg-blue-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition">
                            <Icon name="plus" className="text-sm" /> Tambah Admin
                        </button>
                    </div>
                    <div className="space-y-4">
                        {admins.map(admin => (
                            <div key={admin.id} className="flex justify-between items-center p-4 border border-slate-200 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-100 p-3 rounded-full"><Icon name="users" className="text-slate-500" /></div>
                                    <div>
                                        <p className="font-bold text-slate-800">{admin.username}</p>
                                        <p className="text-sm text-slate-500">{admin.role}</p>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-red-500"><Icon name="trash" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        function StudentPortal({ packages, questions }) {
            const [activeTest, setActiveTest] = useState(null);
            const [testResult, setTestResult] = useState(null);

            if (testResult) {
                return (
                    <div className="max-w-2xl mx-auto text-center mt-12 bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                        <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icon name="check-circle" className="text-emerald-500 text-5xl" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Ujian Selesai!</h2>
                        <p className="text-slate-500 mb-8">{"Terima kasih telah menyelesaikan " + testResult.pkg.title}</p>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                            <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Skor Anda</p>
                            <p className="text-5xl font-black text-blue-600">{testResult.score}</p>
                            <p className="text-sm text-slate-500 mt-2">{"Menjawab benar " + testResult.correct + " dari " + testResult.total + " soal."}</p>
                        </div>
                        <button onClick={() => setTestResult(null)} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition">
                            Kembali ke Beranda
                        </button>
                    </div>
                );
            }

            if (activeTest) {
                const testQuestions = activeTest.questionIds.map(id => questions.find(q => q.id === id)).filter(Boolean);
                return <TestRunner pkg={activeTest} questions={testQuestions} onFinish={(result) => { setActiveTest(null); setTestResult(result); }} />;
            }

            return (
                <div className="max-w-5xl mx-auto space-y-6 mt-4">
                    <h2 className="text-2xl font-bold text-slate-800">Daftar Ujian Tersedia</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packages.filter(p => p.active).map(pkg => (
                            <div key={pkg.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition">
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-slate-800 mb-2">{pkg.title}</h4>
                                    <div className="space-y-2 mt-4 text-sm text-slate-600">
                                        <p className="flex items-center gap-2"><Icon name="clock" className="text-blue-500" /> {pkg.duration} Menit</p>
                                        <p className="flex items-center gap-2"><Icon name="file-alt" className="text-blue-500" /> {pkg.questionIds.length} Soal Pilihan Ganda</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setActiveTest(pkg)}
                                    className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-blue-200"
                                >
                                    Mulai Kerjakan
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        function TestRunner({ pkg, questions, onFinish }) {
            const [currentIdx, setCurrentIdx] = useState(0);
            const [answers, setAnswers] = useState({});

            const q = questions[currentIdx];

            const handleFinish = () => {
                let correct = 0;
                questions.forEach(qs => {
                    if (answers[qs.id] === qs.answer) correct++;
                });
                const score = Math.round((correct / questions.length) * 100);
                onFinish({ pkg, score, correct, total: questions.length });
            };

            return (
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 mt-4">
                    {/* Area Soal */}
                    <div className="flex-1">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800">{"Soal No. " + (currentIdx + 1)}</h3>
                                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full font-bold flex items-center gap-2">
                                    <Icon name="clock" /> {pkg.duration + ":00"}
                                </div>
                            </div>
                            
                            <p className="text-lg text-slate-800 mb-8 leading-relaxed">{q.text}</p>
                            
                            <div className="space-y-3">
                                {q.options.map((opt, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setAnswers({...answers, [q.id]: idx})}
                                        className={"w-full text-left p-4 rounded-xl border-2 transition " + (answers[q.id] === idx ? "border-blue-500 bg-blue-50 text-blue-800 font-medium" : "border-slate-200 hover:border-blue-300 text-slate-600")}
                                    >
                                        <span className="inline-block w-8 font-bold">{String.fromCharCode(65 + idx) + "."}</span> {opt}
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                                <button 
                                    disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)}
                                    className="px-6 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition"
                                >
                                    Sebelumnya
                                </button>
                                {currentIdx < questions.length - 1 ? (
                                    <button 
                                        onClick={() => setCurrentIdx(currentIdx + 1)}
                                        className="px-6 py-2.5 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                                    >
                                        Selanjutnya
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleFinish}
                                        className="px-6 py-2.5 rounded-xl font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition"
                                    >
                                        Selesai Ujian
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Navigasi Nomor */}
                    <div className="w-full md:w-64">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-4">
                            <h4 className="font-bold text-slate-800 mb-4">Navigasi Soal</h4>
                            <div className="grid grid-cols-4 gap-2">
                                {questions.map((_, idx) => (
                                    <button 
                                        key={idx} onClick={() => setCurrentIdx(idx)}
                                        className={"w-full aspect-square rounded-lg font-bold flex items-center justify-center transition " + (currentIdx === idx ? "ring-2 ring-blue-500 bg-blue-100 text-blue-700" : (answers[questions[idx].id] !== undefined ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"))}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Sudah Dijawab</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200"></div> Belum Dijawab</div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Render Aplikasi
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>`;

// ==========================================
// KODE BACKEND NODE.JS SERVER
// ==========================================

const server = http.createServer((req, res) => {
    // 1. Route utama: Memuat HTML dan UI Frontend
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlContent);
    } 
    // 2. Route API Contoh: Jika nanti butuh koneksi MySQL/MongoDB Hostinger
    else if (req.url === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: "success", 
            message: "Node.js Backend CBT berjalan sempurna!" 
        }));
    } 
    // 3. Fallback Route
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Halaman Tidak Ditemukan');
    }
});

// Port otomatis yang diatur Hostinger, atau 3000 untuk komputer lokal
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server Aplikasi CBT berjalan pada port " + PORT);
});
