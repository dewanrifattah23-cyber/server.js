<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal Ujian CBT Pro</title>
    
    <!-- Tailwind CSS untuk Desain -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- KaTeX untuk Rendering Rumus Tampilan Akhir / Siswa -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>

    <!-- MathLive: Untuk Pengetikan Rumus Visual Satu Kolom -->
    <script src="https://unpkg.com/mathlive@0.98.6/dist/mathlive.min.js"></script>

    <!-- React & ReactDOM -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <!-- Babel untuk kompilasi JSX di Browser -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <style>
        .editor-content { outline: none; }
        .editor-content b { font-weight: bold; }
        .editor-content i { font-style: italic; }
        .editor-content u { text-decoration: underline; }
        
        math-field {
            font-size: 1.1em;
            display: inline-block;
            vertical-align: middle;
            margin: 0 4px;
            padding: 2px 4px;
            border-radius: 4px;
            border: 1px dashed #cbd5e1;
            background-color: #f8fafc;
            min-width: 30px;
            transition: all 0.2s;
        }
        math-field:focus-within { border: 1px solid #3b82f6; background-color: #fff; outline: none; }
        math-field::part(virtual-keyboard-toggle) { display: none !important; }
        math-field::part(menu-toggle) { display: none !important; }

        .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 font-sans">
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useRef } = React;

        // ==========================================
        // 1. DATA & UTILITAS DASAR
        // ==========================================
        const MATH_TEMPLATES = {
            dasar: [
                { label: 'Pecahan', tex: '\\frac{a}{b}', insert: '\\frac{a}{b}' },
                { label: 'Akar', tex: '\\sqrt{x}', insert: '\\sqrt{x}' },
                { label: 'Akar ke-n', tex: '\\sqrt[n]{x}', insert: '\\sqrt[n]{x}' },
                { label: 'Pangkat', tex: 'x^{y}', insert: '^{}' },
                { label: 'Subskrip', tex: 'x_{y}', insert: '_{}' }
            ],
            kalkulus: [
                { label: 'Integral', tex: '\\int_{a}^{b}', insert: '\\int_{a}^{b} x \\,dx' },
                { label: 'Sigma', tex: '\\sum_{i=1}^{n}', insert: '\\sum_{i=1}^{n} x_i' },
                { label: 'Limit', tex: '\\lim_{x \\to \\infty}', insert: '\\lim_{x \\to \\infty} f(x)' },
                { label: 'Matriks', tex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}', insert: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' }
            ],
            simbol: [
                { tex: '\\alpha', insert: '\\alpha' }, { tex: '\\beta', insert: '\\beta' }, { tex: '\\pi', insert: '\\pi' },
                { tex: '\\infty', insert: '\\infty' }, { tex: '\\neq', insert: '\\neq' }, { tex: '\\leq', insert: '\\leq' },
                { tex: '\\geq', insert: '\\geq' }, { tex: '\\pm', insert: '\\pm' }, { tex: '\\times', insert: '\\times' }, { tex: '\\div', insert: '\\div' }
            ]
        };

        const Icon = ({ name, className, title }) => {
            return <i className={"fas fa-" + name + " " + (className || "")} title={title}></i>;
        };

        const MathText = ({ text, className }) => {
            const containerRef = useRef(null);
            useEffect(() => {
                if (window.katex && containerRef.current) {
                    try { window.katex.render(text, containerRef.current, { throwOnError: false }); } catch(e) {}
                }
            }, [text]);
            return <span ref={containerRef} className={className} />;
        };

        const DisplayHtml = ({ html, className }) => {
            const containerRef = useRef(null);
            useEffect(() => {
                if (containerRef.current && window.katex) {
                    const mfs = containerRef.current.querySelectorAll('math-field');
                    mfs.forEach(mf => {
                        const tex = mf.value || mf.textContent;
                        const span = document.createElement('span');
                        span.className = "inline-block mx-1 align-middle text-[1.1em]";
                        window.katex.render(tex, span, { throwOnError: false });
                        mf.parentNode.replaceChild(span, mf);
                    });

                    if (window.renderMathInElement) {
                        window.renderMathInElement(containerRef.current, {
                            delimiters: [ {left: "$$", right: "$$", display: true}, {left: "$", right: "$", display: false} ],
                            throwOnError: false
                        });
                    }
                }
            }, [html]);
            return <div ref={containerRef} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
        };

        const CustomModal = ({ isOpen, type, title, message, onConfirm, onCancel }) => {
            if (!isOpen) return null;
            return (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative transform transition-all animate-fade-in border border-slate-100">
                        <div className={"w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner border-2 " + (type === 'warning' ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100')}>
                            <Icon name={type === 'warning' ? 'exclamation-triangle' : 'question-circle'} className="text-3xl" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-3">{title}</h3>
                        <p className="text-slate-600 font-medium leading-relaxed mb-8">{message}</p>
                        <div className="flex justify-end gap-3">
                            {type === 'confirm' && (
                                <button onClick={onCancel} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">Batal</button>
                            )}
                            <button onClick={type === 'confirm' ? onConfirm : (onConfirm || onCancel)} className={"px-6 py-3 rounded-xl font-bold text-white shadow-lg transition flex items-center gap-2 cursor-pointer " + (type === 'warning' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200')}>
                                {type === 'confirm' ? 'Ya, Lanjutkan' : 'Saya Mengerti'} <Icon name="check" />
                            </button>
                        </div>
                    </div>
                </div>
            );
        };

        const SidebarBtn = ({ iconName, label, active, onClick, isStudent=false }) => {
            const activeClass = isStudent ? "bg-white text-blue-700 shadow-lg" : "bg-blue-600 text-white shadow-lg";
            const hoverClass = isStudent ? "text-blue-100 hover:bg-blue-600 hover:text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200";
            return (
                <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition cursor-pointer ${active ? activeClass : hoverClass}`}>
                    <Icon name={iconName} className={"text-lg w-6 text-center"} />
                    <span className="font-medium">{label}</span>
                </button>
            );
        };

        const StatCard = ({ title, value, iconName, iconColor, bg }) => {
            return (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition">
                    <div className={"p-4 rounded-xl " + bg}><Icon name={iconName} className={"text-3xl " + iconColor} /></div>
                    <div><p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{title}</p><p className="text-4xl font-black text-slate-800 mt-1">{value}</p></div>
                </div>
            );
        };

        // ==========================================
        // 2. KOMPONEN EDITOR UTAMA
        // ==========================================
        const SmartEditor = ({ value, onChange, placeholder, minHeight = "120px", isOption = false, optionLabel = "", isCorrect = false, onMarkCorrect = null }) => {
            const editorRef = useRef(null);
            const lastValue = useRef(value);
            const [showAdvancedTools, setShowAdvancedTools] = useState(false);

            useEffect(() => {
                if (editorRef.current && value !== lastValue.current) {
                    editorRef.current.innerHTML = value || '';
                    lastValue.current = value || '';
                }
            }, [value]);

            const handleInput = () => {
                if (editorRef.current) {
                    const currentHtml = editorRef.current.innerHTML;
                    lastValue.current = currentHtml;
                    onChange(currentHtml);
                }
            };

            const formatText = (e, command) => {
                e.preventDefault();
                document.execCommand(command, false, null);
                editorRef.current.focus();
                handleInput();
            };

            const insertMath = (e, latexTemplate) => {
                e.preventDefault();
                const mf = document.createElement('math-field');
                mf.value = latexTemplate; 
                mf.setAttribute('math-virtual-keyboard-policy', 'manual');
                
                const spaceNode = document.createTextNode('\u00A0'); 
                
                const selection = window.getSelection();
                if (selection.getRangeAt && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    if (editorRef.current.contains(range.commonAncestorContainer)) {
                        range.deleteContents();
                        range.insertNode(spaceNode);
                        range.insertNode(mf);
                        range.setStartAfter(spaceNode);
                        range.setEndAfter(spaceNode);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } else {
                        editorRef.current.appendChild(mf);
                        editorRef.current.appendChild(spaceNode);
                    }
                } else {
                    editorRef.current.appendChild(mf);
                    editorRef.current.appendChild(spaceNode);
                }
                
                mf.addEventListener('input', handleInput);
                mf.focus();
                handleInput();
            };

            useEffect(() => {
                if (editorRef.current) {
                    const mathFields = editorRef.current.querySelectorAll('math-field');
                    mathFields.forEach(mf => {
                        mf.removeEventListener('input', handleInput);
                        mf.addEventListener('input', handleInput);
                        mf.setAttribute('math-virtual-keyboard-policy', 'manual');
                    });
                }
            });

            return (
                <div className={"bg-white rounded-xl shadow-sm border transition-all duration-200 flex flex-col overflow-visible " + (isCorrect ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500")}>
                    <div className={"px-3 py-2 border-b flex flex-wrap items-center gap-2 rounded-t-xl " + (isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-slate-100 border-slate-200")}>
                        {isOption && (
                            <button onClick={onMarkCorrect} title="Jadikan Kunci Jawaban Benar" className={"w-9 h-9 rounded-lg font-black flex items-center justify-center transition-all cursor-pointer " + (isCorrect ? "bg-emerald-500 text-white shadow-md" : "bg-white border-2 border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-500")}>
                                {isCorrect ? <Icon name="check" className="text-sm" /> : optionLabel}
                            </button>
                        )}
                        {isOption && <div className="w-px h-6 bg-slate-300 mx-1"></div>}

                        <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                            <button onMouseDown={(e) => formatText(e, 'bold')} className="w-8 h-8 rounded hover:bg-slate-100 text-slate-700 font-bold cursor-pointer" title="Tebal">B</button>
                            <button onMouseDown={(e) => formatText(e, 'italic')} className="w-8 h-8 rounded hover:bg-slate-100 text-slate-700 italic cursor-pointer" title="Miring">I</button>
                            <button onMouseDown={(e) => formatText(e, 'underline')} className="w-8 h-8 rounded hover:bg-slate-100 text-slate-700 underline cursor-pointer" title="Garis Bawah">U</button>
                        </div>
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <button onClick={() => setShowAdvancedTools(!showAdvancedTools)} className={"px-3 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-2 border shadow-sm cursor-pointer " + (showAdvancedTools ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50')}>
                            <Icon name="square-root-alt" /> {showAdvancedTools ? 'Tutup Rumus' : 'Sisipkan Rumus & Simbol'}
                        </button>
                    </div>

                    {showAdvancedTools && (
                        <div className="p-4 bg-blue-50/50 border-b border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-inner z-10">
                            <div>
                                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 border-b border-blue-200 pb-1">Pecahan & Pangkat</div>
                                <div className="grid grid-cols-5 gap-1">
                                    {MATH_TEMPLATES.dasar.map((t, i) => (
                                        <button key={i} onMouseDown={(e) => insertMath(e, t.insert)} className="p-1 rounded bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition flex justify-center items-center h-10 cursor-pointer" title={t.label}><MathText text={t.tex} className="text-sm pointer-events-none" /></button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 border-b border-purple-200 pb-1">Kalkulus & Matriks</div>
                                <div className="grid grid-cols-4 gap-1">
                                    {MATH_TEMPLATES.kalkulus.map((t, i) => (
                                        <button key={i} onMouseDown={(e) => insertMath(e, t.insert)} className="p-1 rounded bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50 transition flex justify-center items-center h-10 cursor-pointer" title={t.label}><MathText text={t.tex} className="text-sm pointer-events-none" /></button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 border-b border-emerald-200 pb-1">Simbol</div>
                                <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto custom-scroll">
                                    {MATH_TEMPLATES.simbol.map((sym, i) => (
                                        <button key={'s'+i} onMouseDown={(e) => insertMath(e, sym.insert)} className="w-8 h-8 rounded bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition flex justify-center items-center cursor-pointer" title="Sisipkan Simbol"><MathText text={sym.tex} className="text-sm pointer-events-none" /></button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="relative flex-1">
                        <div 
                            ref={editorRef} contentEditable="true" onInput={handleInput} onBlur={handleInput} style={{ minHeight: minHeight }}
                            className={"editor-content w-full py-4 px-5 outline-none resize-y font-medium text-slate-800 leading-relaxed text-[15px] " + (isCorrect ? "bg-emerald-50/40" : "bg-white")}
                            data-placeholder={placeholder}
                        ></div>
                        {!value && <div className="absolute top-4 left-5 text-slate-400 pointer-events-none italic text-[15px]">{placeholder}</div>}
                    </div>
                </div>
            );
        };

        const QuestionEditor = ({ initialData, onSave, onCancel }) => {
            const [formData, setFormData] = useState(initialData);
            useEffect(() => { setFormData(initialData); }, [initialData]);

            return (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-200 pb-4 gap-4">
                        <h4 className="font-black text-lg text-slate-800 flex items-center gap-2"><Icon name="edit" className="text-blue-600"/> Smart Editor Soal</h4>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                <label className="text-[10px] font-black uppercase text-slate-500">Jenis Soal:</label>
                                <select 
                                    value={formData.type || 'single'} 
                                    onChange={e => {
                                        const newType = e.target.value;
                                        let newAnswer = formData.answer;
                                        if (newType === 'multiple' && !Array.isArray(newAnswer)) newAnswer = typeof newAnswer === 'number' ? [newAnswer] : [];
                                        if (newType === 'single' && Array.isArray(newAnswer)) newAnswer = newAnswer[0] || 0;
                                        setFormData({...formData, type: newType, answer: newAnswer});
                                    }} 
                                    className="font-bold text-blue-600 outline-none focus:bg-blue-50 rounded text-sm cursor-pointer"
                                >
                                    <option value="single">Pilihan Ganda (1 Benar)</option>
                                    <option value="multiple">Pilihan Ganda (Lebih Dari 1 Benar)</option>
                                    <option value="essay">Esai (Jawaban Singkat)</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                <label className="text-[10px] font-black uppercase text-slate-500">Bobot Poin:</label>
                                <input type="number" value={formData.points} onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})} className="w-16 text-center font-bold text-blue-600 outline-none focus:bg-blue-50 rounded text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase ml-1 flex items-center gap-2"><Icon name="question-circle" className="text-blue-500"/> Isi Pertanyaan</label>
                        <SmartEditor value={formData.text} onChange={(val) => setFormData({...formData, text: val})} placeholder="Ketik soal Anda di sini..." minHeight="150px" />
                    </div>

                    {formData.type !== 'essay' ? (
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <label className="block text-sm font-bold text-slate-700 uppercase flex items-center gap-2"><Icon name="list-ul" className="text-blue-500"/> Pilihan Jawaban</label>
                                <span className="text-xs font-bold text-slate-500">{formData.type === 'multiple' ? 'Klik huruf untuk menandai banyak jawaban benar' : 'Klik huruf untuk menandai Kunci Jawaban'}</span>
                            </div>
                            <div className="flex flex-col gap-4">
                                {formData.options.map((opt, idx) => {
                                    const isCorrect = formData.type === 'multiple' ? (formData.answer || []).includes(idx) : formData.answer === idx;
                                    const handleMarkCorrect = () => {
                                        if (formData.type === 'multiple') {
                                            const currentAns = formData.answer || [];
                                            const newAns = currentAns.includes(idx) ? currentAns.filter(i => i !== idx) : [...currentAns, idx];
                                            setFormData({...formData, answer: newAns});
                                        } else {
                                            setFormData({...formData, answer: idx});
                                        }
                                    };
                                    return (
                                        <SmartEditor 
                                            key={idx} isOption={true} optionLabel={String.fromCharCode(65 + idx)} isCorrect={isCorrect} onMarkCorrect={handleMarkCorrect}
                                            value={opt} onChange={(val) => { const newOpts = [...formData.options]; newOpts[idx] = val; setFormData({ ...formData, options: newOpts }); }}
                                            placeholder={`Ketik opsi ${String.fromCharCode(65 + idx)} di sini...`} minHeight="60px"
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
                            <label className="block text-sm font-bold text-emerald-700 mb-2 uppercase flex items-center gap-2"><Icon name="key"/> Kunci Jawaban Esai Singkat</label>
                            <input 
                                type="text" value={formData.essayAnswer || ''} onChange={e => setFormData({...formData, essayAnswer: e.target.value})} 
                                className="w-full border-2 border-emerald-300 py-4 px-5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800 text-lg shadow-inner" 
                                placeholder="Ketik jawaban pasti di sini (Contoh: 15 atau Soekarno)" 
                            />
                        </div>
                    )}
                    
                    <div className="mt-8 pt-6 border-t-2 border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase ml-1 flex items-center gap-2"><Icon name="lightbulb" className="text-amber-500"/> Uraian Pembahasan</label>
                        <SmartEditor value={formData.explanation || ''} onChange={(val) => setFormData({...formData, explanation: val})} placeholder="Ketik alasan mengapa kunci jawaban tersebut benar..." minHeight="100px" />
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                        <button onClick={onCancel} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition cursor-pointer">Batal Edit</button>
                        <button onClick={() => onSave(formData)} className="px-8 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md flex items-center gap-2 cursor-pointer"><Icon name="save" /> Simpan Soal</button>
                    </div>
                </div>
            );
        };

        const SubTestEditor = ({ initialData, onSaveAndReturn, onSaveAndGoToQuestion }) => {
            const [tempSt, setTempSt] = useState(initialData);
            useEffect(() => { setTempSt(initialData); }, [initialData]);

            return (
                <>
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                            <label className="block text-xs font-black text-slate-500 mb-2 uppercase">Judul Sub-Tes (Mapel)</label>
                            <input type="text" value={tempSt.title} onChange={e => setTempSt({...tempSt, title: e.target.value})} className="w-full border-2 border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800" />
                        </div>
                        <div className="w-48">
                            <label className="block text-xs font-black text-slate-500 mb-2 uppercase">Waktu (Menit)</label>
                            <input type="number" value={tempSt.duration} onChange={e => setTempSt({...tempSt, duration: parseInt(e.target.value) || 0})} className="w-full border-2 border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800" />
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 mt-8 pt-6 border-t border-slate-200">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2"><Icon name="list-ol" className="text-purple-500"/> Daftar Soal di Sub-Tes Ini</h4>
                        <button onClick={() => onSaveAndGoToQuestion(tempSt, 'NEW')} className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 cursor-pointer"><Icon name="plus" /> Ketik Soal Baru</button>
                    </div>

                    <div className="space-y-3 mb-8">
                        {tempSt.questions.map((q, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-purple-300 transition items-center">
                                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-black flex items-center justify-center shrink-0">{idx + 1}</div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex gap-2 mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">{q.type === 'multiple' ? 'Lebih dari 1 Benar' : q.type === 'essay' ? 'Esai' : '1 Benar'}</span>
                                    </div>
                                    <DisplayHtml html={q.text} className="font-medium text-slate-700 line-clamp-1 text-sm" />
                                    <div className="text-xs font-bold text-emerald-600 mt-2">Kunci: {q.type === 'essay' ? q.essayAnswer : (q.type === 'multiple' ? (q.answer||[]).map(a => String.fromCharCode(65+a)).join(', ') : String.fromCharCode(65 + q.answer))} | Poin: {q.points}</div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <button onClick={() => onSaveAndGoToQuestion(tempSt, idx)} className="p-2 text-slate-500 hover:text-blue-600 bg-white rounded shadow-sm border border-slate-200 cursor-pointer"><Icon name="edit" /></button>
                                    <button onClick={() => { if(window.confirm('Hapus soal ini?')) setTempSt({...tempSt, questions: tempSt.questions.filter((_, i) => i !== idx)}) }} className="p-2 text-slate-500 hover:text-red-600 bg-white rounded shadow-sm border border-slate-200 cursor-pointer"><Icon name="trash" /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button onClick={() => onSaveAndReturn(tempSt)} className="px-6 py-2.5 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-900 shadow-md cursor-pointer">Simpan Sub-Tes & Kembali</button>
                    </div>
                </>
            );
        };

        const PaketEditor = ({ initialData, packageCategories, onSave, onCancel }) => {
            const [pkgData, setPkgData] = useState(initialData || { title: '', categoryId: packageCategories[0]?.id, active: true, maxScore: 1000, subTests: [] });
            const [currentView, setCurrentView] = useState('package');
            const [activeSubTestIdx, setActiveSubTestIdx] = useState(null);
            const [activeQuestionIdx, setActiveQuestionIdx] = useState(null);

            const handleSaveSubTestAndReturn = (newSubTest) => {
                const newSubTests = [...pkgData.subTests];
                if (activeSubTestIdx !== null && activeSubTestIdx !== 'NEW') newSubTests[activeSubTestIdx] = newSubTest;
                else newSubTests.push(newSubTest);
                setPkgData({...pkgData, subTests: newSubTests});
                setCurrentView('package');
            };

            const handleSaveSubTestAndGoToQuestion = (newSubTest, qIdx) => {
                const newSubTests = [...pkgData.subTests];
                let newActiveSubTestIdx = activeSubTestIdx;
                if (activeSubTestIdx !== null && activeSubTestIdx !== 'NEW') {
                    newSubTests[activeSubTestIdx] = newSubTest;
                } else {
                    newSubTests.push(newSubTest);
                    newActiveSubTestIdx = newSubTests.length - 1;
                    setActiveSubTestIdx(newActiveSubTestIdx);
                }
                setPkgData({...pkgData, subTests: newSubTests});
                setActiveQuestionIdx(qIdx);
                setCurrentView('question');
            };

            const handleSaveQuestion = (newQuestion) => {
                if (activeSubTestIdx === null || activeSubTestIdx === 'NEW') return; 
                const updatedSubTest = {...pkgData.subTests[activeSubTestIdx]};
                if (activeQuestionIdx !== null && activeQuestionIdx !== 'NEW') updatedSubTest.questions[activeQuestionIdx] = newQuestion;
                else updatedSubTest.questions.push({...newQuestion, id: Date.now()}); 
                const newSubTests = [...pkgData.subTests];
                newSubTests[activeSubTestIdx] = updatedSubTest;
                setPkgData({...pkgData, subTests: newSubTests});
                setCurrentView('subtest');
            };

            return (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-6 bg-slate-100 px-4 py-2 rounded-lg">
                        <button onClick={() => setCurrentView('package')} className={"hover:text-blue-600 transition cursor-pointer " + (currentView === 'package' ? "text-blue-600" : "")}>Paket Utama</button>
                        {currentView !== 'package' && <><Icon name="chevron-right" className="text-xs" /><button onClick={() => setCurrentView('subtest')} className={"hover:text-blue-600 transition cursor-pointer " + (currentView === 'subtest' ? "text-blue-600" : "")}>{pkgData.subTests[activeSubTestIdx]?.title || 'Sub-Tes Baru'}</button></>}
                        {currentView === 'question' && <><Icon name="chevron-right" className="text-xs" /><span className="text-blue-600">Editor Soal</span></>}
                    </div>
                    
                    {currentView === 'package' && (
                        <div className="animate-fade-in">
                            <h3 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-3"><Icon name="cogs" className="text-blue-500" /> Pengaturan Paket Ujian</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase">Judul Paket Ujian</label>
                                    <input type="text" value={pkgData.title} onChange={e => setPkgData({...pkgData, title: e.target.value})} className="w-full border-2 border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 mb-4" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 mb-2 uppercase">Kategori</label>
                                            <select value={pkgData.categoryId} onChange={e => setPkgData({...pkgData, categoryId: parseInt(e.target.value)})} className="w-full border-2 border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 bg-white cursor-pointer">
                                                {packageCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 mb-2 uppercase">Skor Maksimal</label>
                                            <input type="number" value={pkgData.maxScore} onChange={e => setPkgData({...pkgData, maxScore: parseInt(e.target.value) || 0})} className="w-full border-2 border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase">Status Publikasi</label>
                                    <select value={pkgData.active ? 'true' : 'false'} onChange={e => setPkgData({...pkgData, active: e.target.value === 'true'})} className="w-full border-2 border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 bg-white mb-4 cursor-pointer">
                                        <option value="true">Aktif (Terlihat)</option><option value="false">Draft (Sembunyi)</option>
                                    </select>
                                    <div className="bg-blue-100 text-blue-700 p-4 rounded-xl text-sm font-medium border border-blue-200">Paket ujian membutuhkan minimal 1 Sub-Tes agar bisa dikerjakan.</div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2"><Icon name="layer-group" className="text-emerald-500"/> Daftar Sub-Tes</h4>
                                <button onClick={() => { setActiveSubTestIdx('NEW'); setCurrentView('subtest'); }} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 cursor-pointer"><Icon name="plus" /> Tambah Sub-Tes</button>
                            </div>
                            
                            <div className="space-y-3 mb-8">
                                {pkgData.subTests.map((st, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-white border-2 border-slate-100 rounded-xl hover:border-blue-300 transition">
                                        <div>
                                            <h5 className="font-black text-lg text-slate-800">{st.title}</h5>
                                            <div className="text-sm font-bold text-slate-500 flex gap-4 mt-1"><span>{st.questions.length} Soal</span> <span>{st.duration} Menit</span></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setActiveSubTestIdx(idx); setCurrentView('subtest'); }} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold rounded-lg transition text-sm cursor-pointer">Buka & Edit Soal</button>
                                            <button onClick={() => { if(window.confirm('Hapus Sub-Tes ini?')) setPkgData({...pkgData, subTests: pkgData.subTests.filter((_, i) => i !== idx)}) }} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition cursor-pointer"><Icon name="trash" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                                <button onClick={onCancel} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">Kembali</button>
                                <button onClick={() => onSave(pkgData)} className="px-8 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg flex items-center gap-2 cursor-pointer"><Icon name="save" /> Simpan Paket</button>
                            </div>
                        </div>
                    )}

                    {currentView === 'subtest' && <div className="animate-fade-in"><SubTestEditor initialData={activeSubTestIdx === 'NEW' ? { title: '', duration: 30, questions: [] } : pkgData.subTests[activeSubTestIdx]} onSaveAndReturn={handleSaveSubTestAndReturn} onSaveAndGoToQuestion={handleSaveSubTestAndGoToQuestion} /></div>}
                    {currentView === 'question' && activeSubTestIdx !== null && activeSubTestIdx !== 'NEW' && <div className="animate-fade-in"><QuestionEditor initialData={activeQuestionIdx === 'NEW' ? { type: 'single', text: '', options: ['', '', '', '', ''], answer: 0, points: 10, explanation: '', essayAnswer: '' } : pkgData.subTests[activeSubTestIdx].questions[activeQuestionIdx]} onSave={handleSaveQuestion} onCancel={() => setCurrentView('subtest')} /></div>}
                </div>
            );
        };

        // ==========================================
        // 3. TAMPILAN ADMIN & SISWA
        // ==========================================
        const ReviewDetailViewer = ({ result, onBack }) => {
            return (
                <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-12">
                    <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                        <button onClick={onBack} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer"><Icon name="arrow-left"/> Kembali</button>
                        <div className="text-right">
                            <h2 className="text-xl font-black text-slate-800 leading-tight">{result.packageTitle}</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{result.studentName}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-blue-200 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute top-0 w-full h-2 bg-blue-500"></div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1 mt-2">Skor Akhir</span>
                            <span className="text-6xl font-black text-blue-600 mb-2">{result.score}</span>
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">Maks: {result.maxScore}</span>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-emerald-200 flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shrink-0"><Icon name="check-circle" /></div>
                            <div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1 block">Poin Didapat / Benar</span>
                                <span className="text-4xl font-black text-emerald-600">{result.earnedPoints}</span><span className="text-slate-400 font-bold ml-2 text-sm">/ {result.correct} Soal</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-red-200 flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-3xl shrink-0"><Icon name="times-circle" /></div>
                            <div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1 block">Salah / Kosong</span>
                                <span className="text-4xl font-black text-red-600">{result.wrong}</span><span className="text-slate-400 font-bold ml-2 text-sm">Soal</span>
                            </div>
                        </div>
                    </div>

                    {result.subTestScores && result.subTestScores.length > 0 && (
                        <div className="mb-8">
                            <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3"><Icon name="layer-group"/> Detail Skor Sub-Tes</h4>
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scroll">
                                {result.subTestScores.map((st, i) => (
                                    <div key={i} className="min-w-[220px] p-5 rounded-2xl border-2 border-slate-200 bg-white shadow-sm shrink-0">
                                        <div className="text-xs font-black text-slate-400 uppercase mb-2 truncate">{st.title}</div>
                                        <div className="text-3xl font-black text-slate-800">{st.score} <span className="text-sm text-slate-400">/ {result.maxScore}</span></div>
                                        <div className="text-[10px] font-bold text-emerald-600 mt-2 bg-emerald-50 px-2 py-1 rounded inline-block border border-emerald-100">Poin: {st.earned} / {st.total}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <h3 className="text-xl font-black text-slate-800 border-b-2 border-slate-200 pb-3 flex items-center gap-3 mt-8"><Icon name="list-alt" className="text-blue-500"/> Analisis Pembahasan Ujian</h3>
                    <div className="space-y-6">
                        {result.questionsSnapshot.map((q, idx) => {
                            const studentAnsRaw = result.answers[q.id];
                            let isAnswered = false; let isCorrect = false;

                            if (q.type === 'multiple') {
                                const ansArr = Array.isArray(studentAnsRaw) ? studentAnsRaw : [];
                                const corrArr = Array.isArray(q.answer) ? q.answer : [];
                                isAnswered = ansArr.length > 0;
                                isCorrect = ansArr.length === corrArr.length && corrArr.every(val => ansArr.includes(val));
                            } else if (q.type === 'essay') {
                                const studentAns = String(studentAnsRaw || "").trim().toLowerCase();
                                const correctAns = String(q.essayAnswer || "").trim().toLowerCase();
                                isAnswered = studentAns !== '';
                                isCorrect = isAnswered && studentAns === correctAns;
                            } else {
                                isAnswered = studentAnsRaw !== undefined;
                                isCorrect = studentAnsRaw === q.answer;
                            }

                            return (
                                <div key={idx} className={"p-6 rounded-3xl border-2 shadow-sm relative overflow-hidden " + (isCorrect ? "border-emerald-200 bg-white" : "border-red-200 bg-white")}>
                                    <div className={"absolute top-0 left-0 w-1.5 h-full " + (isCorrect ? "bg-emerald-500" : "bg-red-500")}></div>
                                    <div className="flex flex-col md:flex-row gap-6 pl-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm">{idx + 1}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{q.subTestTitle}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">Poin: {q.points}</span>
                                            </div>
                                            <DisplayHtml html={q.text} className="text-lg font-medium text-slate-800 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner" />
                                            
                                            <div className="space-y-3 mb-6">
                                                {q.type !== 'essay' ? (
                                                    q.options.map((opt, oIdx) => {
                                                        const isStudentChoice = q.type === 'multiple' ? (result.answers[q.id] || []).includes(oIdx) : result.answers[q.id] === oIdx;
                                                        const isCorrectChoice = q.type === 'multiple' ? (q.answer || []).includes(oIdx) : q.answer === oIdx;
                                                        let bgClass = "border-slate-200 bg-white opacity-60"; let icon = null;
                                                        if (isCorrectChoice) {
                                                            bgClass = "border-emerald-500 bg-emerald-50 opacity-100 shadow-sm";
                                                            icon = <div className="bg-emerald-500 text-white text-[10px] px-2 py-1 rounded font-black uppercase flex items-center gap-1"><Icon name="check"/> Kunci</div>;
                                                        } else if (isStudentChoice && !isCorrectChoice) {
                                                            bgClass = "border-red-400 bg-red-50 opacity-100";
                                                            icon = <div className="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-black uppercase flex items-center gap-1"><Icon name="times"/> Anda</div>;
                                                        } else if (isStudentChoice && isCorrectChoice) {
                                                             icon = <div className="bg-emerald-600 text-white text-[10px] px-2 py-1 rounded font-black uppercase flex items-center gap-1"><Icon name="check-double"/> Tepat</div>;
                                                        }
                                                        return (
                                                            <div key={oIdx} className={`p-4 rounded-xl border-2 flex items-center gap-4 transition ${bgClass}`}>
                                                                <span className={"w-8 h-8 rounded-lg border flex items-center justify-center font-bold shrink-0 " + (isCorrectChoice || isStudentChoice ? "bg-white border-transparent" : "bg-slate-100 border-slate-300 text-slate-500")}>{String.fromCharCode(65 + oIdx)}</span>
                                                                <DisplayHtml html={opt} className="flex-1 font-medium text-slate-800 text-[15px]" />
                                                                {icon}
                                                            </div>
                                                        )
                                                    })
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50 shadow-inner">
                                                            <div className="text-xs font-black text-blue-600 mb-2 uppercase tracking-widest">Jawaban Anda:</div>
                                                            <div className="font-medium text-slate-800 text-lg">{result.answers[q.id] || <span className="text-slate-400 italic">Kosong</span>}</div>
                                                        </div>
                                                        <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 shadow-inner">
                                                            <div className="text-xs font-black text-emerald-600 mb-2 uppercase tracking-widest flex items-center gap-1"><Icon name="check-circle"/> Kunci Benar:</div>
                                                            <div className="font-medium text-slate-800 text-lg">{q.essayAnswer}</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-5 rounded-2xl border-2 border-blue-100 bg-blue-50/50 relative mt-2">
                                                <div className="text-[10px] font-black uppercase tracking-widest mb-3 text-blue-600 flex items-center gap-2"><Icon name="lightbulb" className="text-amber-500 text-sm"/> Uraian Pembahasan:</div>
                                                {q.explanation && q.explanation.trim() !== '' ? (
                                                    <DisplayHtml html={q.explanation} className="text-blue-900 font-medium leading-relaxed" />
                                                ) : <div className="text-blue-400/80 italic font-medium text-sm mt-1">Belum ada pembahasan yang ditambahkan.</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            );
        };

        const AdminDashboard = ({ packages, students, testResults }) => {
            const totalSubTests = packages.reduce((acc, p) => acc + p.subTests.length, 0);
            return (
                <div className="space-y-6 max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Paket Ujian" value={packages.length} iconName="layer-group" iconColor="text-blue-600" bg="bg-blue-100" />
                        <StatCard title="Total Sub-Tes" value={totalSubTests} iconName="tasks" iconColor="text-emerald-600" bg="bg-emerald-100" />
                        <StatCard title="Ujian Selesai" value={testResults.length} iconName="clipboard-check" iconColor="text-purple-600" bg="bg-purple-100" />
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2"><Icon name="rocket" className="text-blue-500"/> Update Sistem CBT V3 Selesai</h3>
                        <p className="text-slate-600 leading-relaxed max-w-3xl">Pembaruan telah berhasil! Fitur analisis pembahasan soal, pengaturan jenis soal, dan skor per sub-tes telah dioptimalkan secara utuh.</p>
                    </div>
                </div>
            );
        };

        const PaketManager = ({ packages, setPackages, packageCategories }) => {
            const [editingPkgId, setEditingPkgId] = useState(null);
            if (editingPkgId) {
                const pkgToEdit = editingPkgId === 'NEW' ? null : packages.find(p => p.id === editingPkgId);
                return <PaketEditor initialData={pkgToEdit} packageCategories={packageCategories} onCancel={() => setEditingPkgId(null)} onSave={(newPkg) => {
                    if (editingPkgId === 'NEW') setPackages([{...newPkg, id: Date.now()}, ...packages]);
                    else setPackages(packages.map(p => p.id === editingPkgId ? newPkg : p));
                    setEditingPkgId(null);
                }} />;
            }
            return (
                <div className="space-y-6 max-w-6xl mx-auto">
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 ml-2 uppercase tracking-wide">Daftar Paket Ujian</h3>
                        <button onClick={() => setEditingPkgId('NEW')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-md shadow-blue-200 cursor-pointer"><Icon name="plus-circle" /> Buat Paket Baru</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {packages.map(pkg => {
                            const totalDuration = pkg.subTests.reduce((acc, st) => acc + st.duration, 0);
                            const totalQuestions = pkg.subTests.reduce((acc, st) => acc + st.questions.length, 0);
                            return (
                                <div key={pkg.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                                    <div className={"absolute top-0 left-0 w-full h-1.5 " + (pkg.active ? "bg-emerald-500" : "bg-slate-300")}></div>
                                    <h4 className="text-xl font-black text-slate-800 mb-3 leading-tight mt-2">{pkg.title}</h4>
                                    <div className="mb-4"><span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-blue-100 uppercase tracking-widest">{packageCategories.find(c => c.id === pkg.categoryId)?.name || 'Umum'}</span></div>
                                    <div className="flex items-center gap-4 text-sm font-bold text-slate-600 mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <span className="flex items-center gap-2"><div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600"><Icon name="clock" /></div> {totalDuration} Mnt</span>
                                        <span className="flex items-center gap-2"><div className="bg-purple-100 p-1.5 rounded-lg text-purple-600"><Icon name="list-ol"/></div> {totalQuestions} Soal</span>
                                        <span className="flex items-center gap-2"><div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Icon name="layer-group"/></div> {pkg.subTests.length} Modul</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-6 pt-5 border-t border-slate-100">
                                        <span className={"px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest " + (pkg.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>{pkg.active ? '● Aktif' : '○ Draft'}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingPkgId(pkg.id)} className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition cursor-pointer">Kelola Paket</button>
                                            <button onClick={() => { if(window.confirm('Hapus seluruh paket ini beserta soalnya?')) setPackages(packages.filter(p => p.id !== pkg.id)) }} className="px-3 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition cursor-pointer"><Icon name="trash"/></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };

        const HasilTesAdmin = ({ testResults }) => {
            const [selectedResult, setSelectedResult] = useState(null);
            if (selectedResult) return <ReviewDetailViewer result={selectedResult} onBack={() => setSelectedResult(null)} />;
            return (
                <div className="space-y-6 max-w-6xl mx-auto">
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 ml-2 uppercase tracking-wide"><Icon name="clipboard-check" className="text-purple-500 mr-2"/> Review Hasil Ujian Siswa</h3>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-600 font-black text-xs uppercase tracking-widest border-b border-slate-200">
                                <tr><th className="py-4 px-6">Nama Siswa</th><th className="py-4 px-6">Paket Ujian</th><th className="py-4 px-6 text-center">Poin Didapat</th><th className="py-4 px-6 text-center">Nilai Akhir</th><th className="py-4 px-6 text-center">Aksi</th></tr>
                            </thead>
                            <tbody className="text-slate-700 font-medium">
                                {testResults.map((r, i) => (
                                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-4 px-6 font-bold text-slate-800">{r.studentName}</td>
                                        <td className="py-4 px-6 text-sm">{r.packageTitle}</td>
                                        <td className="py-4 px-6 text-center font-mono">{r.earnedPoints} / {r.totalPoints}</td>
                                        <td className="py-4 px-6 text-center"><span className={"px-3 py-1 rounded-lg font-black " + (r.score >= (r.maxScore * 0.7) ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>{r.score}</span></td>
                                        <td className="py-4 px-6 text-center"><button onClick={() => setSelectedResult(r)} className="px-4 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer">Lihat Detail</button></td>
                                    </tr>
                                ))}
                                {testResults.length === 0 && <tr><td colSpan="5" className="py-12 text-center text-slate-400">Belum ada siswa yang menyelesaikan ujian.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        };

        const HasilTesSiswa = ({ testResults, studentId }) => {
            const [selectedResult, setSelectedResult] = useState(null);
            const myResults = testResults.filter(r => r.studentId === studentId);
            if (selectedResult) return <ReviewDetailViewer result={selectedResult} onBack={() => setSelectedResult(null)} />;
            return (
                <div className="max-w-5xl mx-auto mt-4">
                    <h2 className="text-2xl font-black mb-6 text-slate-800 border-b pb-4"><Icon name="award" className="text-blue-500 mr-2"/> Riwayat Ujian Saya</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myResults.map((r, i) => (
                            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="font-bold text-slate-800 mb-1">{r.packageTitle}</h4>
                                        <p className="text-xs text-slate-400 font-mono">{new Date(r.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                    <div className={"w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner shrink-0 " + (r.score >= (r.maxScore * 0.7) ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200")}>{r.score}</div>
                                </div>
                                <button onClick={() => setSelectedResult(r)} className="w-full py-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 font-bold rounded-xl transition text-sm cursor-pointer border border-blue-100">Review Pembahasan Soal</button>
                            </div>
                        ))}
                        {myResults.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200 font-medium">Anda belum menyelesaikan ujian apapun.</div>}
                    </div>
                </div>
            );
        };

        const PengaturanAdmin = ({ admins, setAdmins, students, setStudents, packageCategories, setPackageCategories }) => {
            const [activeTab, setActiveTab] = useState('siswa');
            const [visiblePasswords, setVisiblePasswords] = useState({});

            const togglePasswordVisibility = (id) => { setVisiblePasswords(prev => ({...prev, [id]: !prev[id]})); };
            const handleDeleteStudent = (id) => { if(window.confirm('Hapus akun siswa ini secara permanen?')) setStudents(students.filter(s => s.id !== id)); };

            const handleAddAdmin = () => {
                const name = prompt("Masukkan Username Staff/Admin baru:");
                if (name && name.trim() !== '') setAdmins([...admins, { id: Date.now(), username: name, role: 'Co-Admin' }]);
            };
            const handleAddPackageCategory = () => {
                const name = prompt("Masukkan nama Jenis Paket Ujian baru:");
                if (name) setPackageCategories([...packageCategories, { id: Date.now(), name }]);
            };
            const handleDeletePackageCategory = (id) => {
                if(window.confirm('Hapus jenis paket ujian ini?')) setPackageCategories(packageCategories.filter(c => c.id !== id));
            };

            return (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-slate-100 pb-6">
                        <h3 className="text-2xl font-black flex items-center gap-3 text-slate-800"><div className="bg-blue-100 text-blue-600 p-2 rounded-xl"><Icon name="cogs" /></div> Pusat Pengaturan</h3>
                        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner gap-1">
                            <button onClick={() => setActiveTab('siswa')} className={"px-4 py-2 rounded-lg font-bold text-sm transition " + (activeTab === 'siswa' ? "bg-white text-blue-700 shadow-sm" : "text-slate-500")}>Akun Siswa</button>
                            <button onClick={() => setActiveTab('admin')} className={"px-4 py-2 rounded-lg font-bold text-sm transition " + (activeTab === 'admin' ? "bg-white text-purple-700 shadow-sm" : "text-slate-500")}>Staff Admin</button>
                            <button onClick={() => setActiveTab('kategori')} className={"px-4 py-2 rounded-lg font-bold text-sm transition " + (activeTab === 'kategori' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500")}>Klasifikasi Ujian</button>
                        </div>
                    </div>

                    {activeTab === 'siswa' && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm border border-blue-100">Total: {students.length} Terdaftar</span>
                                <button className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm text-sm cursor-pointer"><Icon name="user-plus" /> Tambah Siswa</button>
                            </div>
                            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 text-slate-500 font-black text-xs uppercase border-b border-slate-200">
                                        <tr><th className="py-4 px-6">Identitas Siswa</th><th className="py-4 px-6">NIS</th><th className="py-4 px-6">Kata Sandi</th><th className="py-4 px-6 text-center">Aksi</th></tr>
                                    </thead>
                                    <tbody className="text-slate-700 font-medium bg-white">
                                        {students.map(student => (
                                            <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="py-4 px-6 flex items-center gap-4"><div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">{student.name.charAt(0)}</div><span className="font-bold text-slate-800">{student.name}</span></td>
                                                <td className="py-4 px-6"><span className="font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">{student.nis}</span></td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3 bg-white border border-slate-200 px-3 py-1 rounded-lg w-max">
                                                        <span className="font-mono text-sm min-w-[80px] font-bold">{visiblePasswords[student.id] ? student.password : '••••••••'}</span>
                                                        <button onClick={() => togglePasswordVisibility(student.id)} className={"p-1 rounded transition cursor-pointer " + (visiblePasswords[student.id] ? "text-red-500" : "text-blue-500")}><Icon name={visiblePasswords[student.id] ? "eye-slash" : "eye"} /></button>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center"><button onClick={() => handleDeleteStudent(student.id)} className="text-red-500 hover:underline font-bold text-sm cursor-pointer">Hapus</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'admin' && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <span className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-bold text-sm border border-purple-100">Daftar Admin Sistem</span>
                                <button onClick={handleAddAdmin} className="bg-purple-600 text-white hover:bg-purple-700 px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm text-sm cursor-pointer"><Icon name="user-plus" /> Tambah Staff Co-Admin</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {admins.map(admin => (
                                    <div key={admin.id} className="flex justify-between items-center p-4 border-2 border-slate-100 bg-slate-50 rounded-xl hover:border-purple-300 transition">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white border border-purple-200 w-12 h-12 flex items-center justify-center rounded-xl"><Icon name="user-shield" className="text-purple-600" /></div>
                                            <div><p className="font-black text-slate-800">{admin.username}</p><span className="text-[10px] font-black text-purple-600 uppercase bg-purple-100 px-2 py-0.5 rounded">{admin.role}</span></div>
                                        </div>
                                        {admin.role !== 'Super Admin' && <button onClick={() => { if(window.confirm('Hapus Admin ini?')) setAdmins(admins.filter(a => a.id !== admin.id)) }} className="text-red-500 hover:underline font-bold text-sm cursor-pointer p-2">Hapus</button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'kategori' && (
                        <div className="animate-fade-in max-w-xl">
                            <div className="flex justify-between items-center mb-4">
                                <span className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm border border-emerald-100">Kategori Paket Ujian</span>
                                <button onClick={handleAddPackageCategory} className="bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm text-sm cursor-pointer"><Icon name="plus" /> Tambah Baru</button>
                            </div>
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                {packageCategories.map(c => (
                                    <div key={c.id} className="flex justify-between items-center p-4 border-b border-slate-100 hover:bg-slate-50">
                                        <span className="font-bold text-slate-700">{c.name}</span>
                                        <button onClick={() => handleDeletePackageCategory(c.id)} className="text-red-400 hover:text-red-600 p-2 cursor-pointer"><Icon name="trash" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const StudentPortal = ({ packages, onStartTest, packageCategories }) => {
            return (
                <div className="max-w-6xl mx-auto mt-4">
                    <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl mb-8 flex items-center justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black mb-2">Papan Ujian Aktif</h2>
                            <p className="text-blue-100 font-medium text-lg">Pilih dan kerjakan ujian yang telah dijadwalkan untuk Anda.</p>
                        </div>
                        <Icon name="laptop-code" className="text-8xl text-white opacity-10 absolute -right-4 -bottom-4 transform -rotate-12" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {packages.filter(p => p.active).map(pkg => {
                            const totalDuration = pkg.subTests.reduce((acc, st) => acc + st.duration, 0);
                            const totalQs = pkg.subTests.reduce((acc, st) => acc + st.questions.length, 0);
                            return (
                                <div key={pkg.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                                    <div className={"absolute top-0 left-0 w-full h-1.5 bg-emerald-500"}></div>
                                    <div className="flex-1">
                                        <h4 className="text-xl font-black text-slate-800 mb-3 leading-tight mt-2">{pkg.title}</h4>
                                        <div className="mb-4">
                                            <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-blue-100 uppercase tracking-widest">{packageCategories?.find(c => c.id === pkg.categoryId)?.name || 'Umum'}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-600 mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <span className="flex items-center gap-2"><div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600"><Icon name="clock" /></div> {totalDuration} Mnt</span>
                                            <span className="flex items-center gap-2"><div className="bg-purple-100 p-1.5 rounded-lg text-purple-600"><Icon name="list-ol"/></div> {totalQs} Soal</span>
                                            <span className="flex items-center gap-2"><div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Icon name="layer-group"/></div> {pkg.subTests.length} Modul</span>
                                        </div>
                                    </div>
                                    <button onClick={() => onStartTest(pkg)} className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-black text-lg transition shadow-lg shadow-blue-200/50 cursor-pointer">MULAI TES SEKARANG</button>
                                </div>
                            )
                        })}
                        {packages.filter(p => p.active).length === 0 && <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200 font-medium">Belum ada ujian yang tersedia.</div>}
                    </div>
                </div>
            );
        };

        const TestRunner = ({ pkg, student, onFinish }) => {
            const [currentSubTestIdx, setCurrentSubTestIdx] = useState(0);
            const [currentIdx, setCurrentIdx] = useState(0);
            const [answers, setAnswers] = useState({});
            const [doubtful, setDoubtful] = useState({});
            const [modal, setModal] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null });
            
            const currentSubTest = pkg.subTests[currentSubTestIdx];
            const questions = currentSubTest ? currentSubTest.questions : [];
            const q = questions[currentIdx];

            const [timeLeft, setTimeLeft] = useState(currentSubTest ? currentSubTest.duration * 60 : 0);

            const answersRef = useRef(answers);
            const doubtfulRef = useRef(doubtful);

            useEffect(() => {
                answersRef.current = answers;
                doubtfulRef.current = doubtful;
            }, [answers, doubtful]);

            useEffect(() => {
                if (currentSubTest) setTimeLeft(currentSubTest.duration * 60);
            }, [currentSubTestIdx, currentSubTest]);

            useEffect(() => {
                const timer = setInterval(() => {
                    setTimeLeft(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            handleNextSubTest(true); 
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
                return () => clearInterval(timer);
            }, [currentSubTestIdx]);

            const formatTime = (seconds) => {
                const m = Math.floor(seconds / 60);
                const s = seconds % 60;
                return `${m}:${s.toString().padStart(2, '0')}`;
            };

            const toggleDoubtful = () => {
                setDoubtful(prev => ({ ...prev, [q.id]: !prev[q.id] }));
            };

            const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

            const handleAnswerChange = (qId, optionIdx, qType) => {
                let currentAns = answers[qId];
                if (qType === 'multiple') {
                    currentAns = currentAns || [];
                    const newAns = currentAns.includes(optionIdx) ? currentAns.filter(i => i !== optionIdx) : [...currentAns, optionIdx];
                    setAnswers({ ...answers, [qId]: newAns });
                } else if (qType === 'essay') {
                    setAnswers({ ...answers, [qId]: optionIdx });
                } else {
                    setAnswers({ ...answers, [qId]: optionIdx });
                }
            };

            const proceedToNext = (nextAnswersObj) => {
                if (currentSubTestIdx < pkg.subTests.length - 1) {
                    setCurrentSubTestIdx(prev => prev + 1);
                    setCurrentIdx(0);
                } else {
                    calculateFinalScore(nextAnswersObj);
                }
            };

            const handleNextSubTest = (isTimeUp = false) => {
                const currentQuestions = pkg.subTests[currentSubTestIdx].questions;
                let nextAnswers = { ...answersRef.current };
                let currentDoubtful = doubtfulRef.current;

                if (isTimeUp) {
                    currentQuestions.forEach(qs => {
                        if (currentDoubtful[qs.id]) delete nextAnswers[qs.id];
                    });
                    setModal({
                        isOpen: true, type: 'warning', title: 'Waktu Habis!',
                        message: 'Waktu pengerjaan untuk modul ini telah habis. Jawaban ragu-ragu otomatis dihapus. Melanjutkan ke bagian berikutnya...',
                        onConfirm: () => { 
                            setAnswers(nextAnswers);
                            setDoubtful(prev => {
                                const newDoubtful = { ...prev };
                                currentQuestions.forEach(qs => delete newDoubtful[qs.id]);
                                return newDoubtful;
                            });
                            closeModal(); 
                            proceedToNext(nextAnswers); 
                        }
                    });
                } else {
                    const hasDoubtful = currentQuestions.some(qs => currentDoubtful[qs.id]);
                    if (hasDoubtful) {
                        setModal({
                            isOpen: true, type: 'warning', title: 'Terdapat Soal Ragu-ragu',
                            message: 'TIDAK BISA MELANJUTKAN: Anda masih memiliki soal yang ditandai Ragu-ragu di modul ini. Silakan hilangkan tanda Ragu-ragu terlebih dahulu.',
                            onConfirm: closeModal
                        });
                        return; 
                    }
                    setModal({
                        isOpen: true, type: 'confirm', title: 'Konfirmasi Penyelesaian',
                        message: 'Selesai dengan bagian ini dan lanjut? Anda TIDAK BISA kembali mengecek atau mengubah jawaban pada modul ini lagi.',
                        onConfirm: () => { closeModal(); proceedToNext(nextAnswers); }
                    });
                }
            };

            const calculateFinalScore = (finalAnswersOverride = null) => {
                const finalAnswers = finalAnswersOverride || answersRef.current;
                let earnedPoints = 0; let totalPoints = 0; let correctCount = 0; let wrongCount = 0; let totalQuestions = 0;
                const subTestScores = []; const allQuestionsSnapshot = [];

                pkg.subTests.forEach(st => {
                    let stEarned = 0; let stTotal = 0;
                    st.questions.forEach(qs => {
                        totalPoints += qs.points; stTotal += qs.points; totalQuestions++;
                        allQuestionsSnapshot.push({...qs, subTestTitle: st.title});
                        
                        let isCorrect = false;
                        const studentAns = finalAnswers[qs.id];
                        
                        if (qs.type === 'multiple') {
                            const ansArr = Array.isArray(studentAns) ? studentAns : [];
                            const corrArr = Array.isArray(qs.answer) ? qs.answer : [];
                            if (ansArr.length === corrArr.length && corrArr.every(val => ansArr.includes(val))) isCorrect = true;
                        } else if (qs.type === 'essay') {
                            const ansStr = String(studentAns || "").trim().toLowerCase();
                            const corrStr = String(qs.essayAnswer || "").trim().toLowerCase();
                            if (ansStr !== '' && ansStr === corrStr) isCorrect = true;
                        } else {
                            if (studentAns === qs.answer) isCorrect = true;
                        }

                        if (isCorrect) { earnedPoints += qs.points; stEarned += qs.points; correctCount++; } else { wrongCount++; }
                    });
                    subTestScores.push({ title: st.title, score: stTotal > 0 ? Math.round((stEarned / stTotal) * (pkg.maxScore || 1000)) : 0, earned: stEarned, total: stTotal });
                });

                const maxScoreTarget = pkg.maxScore || 1000;
                const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * maxScoreTarget) : 0;
                
                onFinish({ 
                    id: Date.now(), studentId: student.id, studentName: student.name, packageId: pkg.id, packageTitle: pkg.title, 
                    score: finalScore, maxScore: maxScoreTarget, earnedPoints, totalPoints, correct: correctCount, wrong: wrongCount, total: totalQuestions,
                    date: new Date().toISOString(), answers: finalAnswers, questionsSnapshot: allQuestionsSnapshot, subTestScores: subTestScores
                });
            };

            if(!q) return <div className="p-12 text-center text-red-500 font-bold bg-red-50 rounded-xl min-h-screen">Modul Ujian Kosong. Hubungi pengawas/admin.</div>;

            return (
                <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100 relative">
                    <CustomModal isOpen={modal.isOpen} type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={closeModal} />
                    <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center shrink-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white p-2.5 rounded-lg"><Icon name="laptop-code" /></div>
                            <div><h2 className="text-lg font-black text-slate-800 leading-tight">{pkg.title}</h2><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{student.name} ({student.nis})</p></div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-sm font-black border border-purple-200">Modul {currentSubTestIdx + 1}/{pkg.subTests.length}: {currentSubTest.title}</div>
                            <div className={"px-5 py-2.5 rounded-xl font-black flex items-center gap-2 border-2 tracking-widest text-lg shadow-sm transition-colors " + (timeLeft < 300 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-white text-slate-700 border-slate-200")}><Icon name="clock" /> {formatTime(timeLeft)}</div>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
                            <div className="flex-1">
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                                    <div className="flex justify-between items-end mb-6 pb-4 border-b-2 border-slate-100">
                                        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4"><span className="bg-slate-900 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-md text-lg">{currentIdx + 1}</span><span className="text-slate-400 text-base">dari {questions.length} Soal Modul Ini</span></h3>
                                    </div>
                                    <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                        <DisplayHtml html={q.text} className="text-lg text-slate-800 leading-relaxed font-medium" />
                                        <div className="mt-4 flex justify-end"><span className="text-[10px] font-black uppercase text-slate-400 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">Bobot: {q.points} Poin</span></div>
                                    </div>
                                    <div className="space-y-3 relative z-10">
                                        {q.type !== 'essay' ? (
                                            q.options.map((opt, idx) => {
                                                const isSelected = q.type === 'multiple' ? (answers[q.id] || []).includes(idx) : answers[q.id] === idx;
                                                return (
                                                    <button key={idx} onClick={() => handleAnswerChange(q.id, idx, q.type)} className={"w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center cursor-pointer " + (isSelected ? "border-blue-500 bg-blue-50 text-blue-900 font-black shadow-md transform scale-[1.01]" : "border-slate-200 hover:border-blue-400 text-slate-700 hover:bg-slate-50 font-bold")}>
                                                        <span className={"shrink-0 inline-block w-8 h-8 text-center leading-8 rounded-lg mr-4 font-black text-base " + (isSelected ? "bg-blue-600 text-white shadow-inner" : "bg-white border-2 border-slate-200 text-slate-400")}>{String.fromCharCode(65 + idx)}</span> 
                                                        <DisplayHtml html={opt} className="text-base flex-1 pointer-events-none" />
                                                    </button>
                                                )
                                            })
                                        ) : (
                                            <div className="p-4 rounded-2xl border-2 border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Jawaban Anda:</label>
                                                <input type="text" value={answers[q.id] || ''} onChange={e => handleAnswerChange(q.id, e.target.value, 'essay')} className="w-full py-3 px-4 rounded-xl border border-slate-300 outline-none font-bold text-slate-800 focus:border-blue-500" placeholder="Ketik jawaban singkat di sini..." />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col md:flex-row justify-between items-center mt-10 pt-6 border-t-2 border-slate-100 gap-4 relative z-20">
                                        <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)} className="w-full md:w-auto px-6 py-3 rounded-xl font-black text-slate-500 bg-white border-2 border-slate-200 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"><Icon name="arrow-left" /> Sebelumnya</button>
                                        <button onClick={toggleDoubtful} className={"w-full md:w-auto px-6 py-3 rounded-xl font-black flex items-center justify-center gap-2 text-sm border-2 transition-colors cursor-pointer " + (doubtful[q.id] ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600 shadow-md" : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100")}><Icon name="question-circle" /> {doubtful[q.id] ? 'Hapus Ragu-ragu' : 'Tandai Ragu-ragu'}</button>
                                        {currentIdx < questions.length - 1 ? (
                                            <button onClick={() => setCurrentIdx(currentIdx + 1)} className="w-full md:w-auto px-6 py-3 rounded-xl font-black bg-slate-800 text-white hover:bg-slate-900 flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer">Selanjutnya <Icon name="arrow-right" /></button>
                                        ) : (
                                            <button onClick={() => handleNextSubTest(false)} className="w-full md:w-auto px-8 py-3 rounded-xl font-black bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-200 cursor-pointer">{currentSubTestIdx < pkg.subTests.length - 1 ? 'Selesai Modul Ini' : 'Kumpulkan Ujian Akhir'} <Icon name="check-circle" /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="w-full lg:w-72 shrink-0 relative z-20">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 sticky top-6">
                                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-base border-b pb-3"><Icon name="th-large" className="text-blue-500"/> Navigasi Peta Soal</h4>
                                    <div className="grid grid-cols-5 gap-2">
                                        {questions.map((_, idx) => {
                                            const qId = questions[idx].id;
                                            const isAnswered = questions[idx].type === 'essay' ? (answers[qId] !== undefined && String(answers[qId]).trim() !== '') : (questions[idx].type === 'multiple' ? (answers[qId] && answers[qId].length > 0) : answers[qId] !== undefined);
                                            const isDoubtful = doubtful[qId];
                                            let btnClass = "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100";
                                            if (currentIdx === idx) btnClass = "ring-2 ring-blue-200 bg-white border-blue-600 text-blue-700 transform scale-110 z-10 relative shadow-sm";
                                            else if (isDoubtful) btnClass = "bg-orange-500 border-orange-600 text-white shadow-inner";
                                            else if (isAnswered) btnClass = "bg-emerald-500 border-emerald-600 text-white shadow-inner";
                                            return <button key={idx} onClick={() => setCurrentIdx(idx)} className={"w-full aspect-square rounded-lg font-black text-xs flex items-center justify-center transition-all border-2 cursor-pointer " + btnClass}>{idx + 1}</button>
                                        })}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600 font-bold bg-slate-50 p-3 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded shadow-inner bg-emerald-500 border border-emerald-600"></div> Dijawab</div> 
                                            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{questions.filter(qs => { const isAns = qs.type === 'essay' ? (answers[qs.id] && String(answers[qs.id]).trim() !== '') : (qs.type === 'multiple' ? (answers[qs.id] && answers[qs.id].length > 0) : answers[qs.id] !== undefined); return isAns && !doubtful[qs.id]; }).length}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded shadow-inner bg-orange-500 border border-orange-600"></div> Ragu-ragu</div> 
                                            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{questions.filter(qs => doubtful[qs.id]).length}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded shadow-inner bg-slate-50 border border-slate-300"></div> Kosong</div> 
                                            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{questions.length - questions.filter(qs => { const isAns = qs.type === 'essay' ? (answers[qs.id] && String(answers[qs.id]).trim() !== '') : (qs.type === 'multiple' ? (answers[qs.id] && answers[qs.id].length > 0) : answers[qs.id] !== undefined); return isAns || doubtful[qs.id]; }).length}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleNextSubTest(false)} className="w-full mt-6 py-3 rounded-xl bg-red-50 text-red-600 font-black hover:bg-red-600 hover:text-white border-2 border-red-200 transition duration-300 text-sm cursor-pointer">{currentSubTestIdx < pkg.subTests.length - 1 ? 'LANJUT MODUL BERIKUTNYA' : 'KUMPULKAN UJIAN SEKARANG'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // ==========================================
        // 4. MAIN APP ROOT (KOMPONEN TERAKHIR)
        // ==========================================
        function App() {
            const [currentUser, setCurrentUser] = useState(null); 
            const [view, setView] = useState('dashboard');
            
            const [packageCategories, setPackageCategories] = useState([
                { id: 1, name: 'Ujian Tengah Semester' },
                { id: 2, name: 'Tryout Nasional' }
            ]);

            const [packages, setPackages] = useState([
                { 
                    id: 1, title: 'Ujian Tengah Semester - Ganjil', categoryId: 1, active: true, maxScore: 1000,
                    subTests: [
                        {
                            id: 101, title: 'Matematika Terapan', duration: 45,
                            questions: [
                                { id: 1, type: 'single', text: 'Berapakah hasil dari <math-field>\\sqrt{144}</math-field> ditambah <math-field>\\frac{10}{2}</math-field> ?', options: ['15', '16', '17', '18', '19'], answer: 2, points: 10, explanation: '<b>Akar 144 adalah 12</b>.<br>10 dibagi 2 adalah 5.<br>Maka 12 + 5 = 17.' },
                                { id: 2, type: 'multiple', text: 'Manakah dari bilangan berikut yang merupakan bilangan genap? (Pilih lebih dari satu)', options: ['12', '15', '20', '25', '30'], answer: [0, 2, 4], points: 15, explanation: 'Bilangan genap adalah bilangan yang habis dibagi 2. Maka jawabannya 12, 20, dan 30.' },
                                { id: 4, type: 'essay', text: 'Sebutkan presiden pertama Republik Indonesia!', options: [], essayAnswer: 'Soekarno', points: 20, explanation: 'Ir. Soekarno adalah proklamator sekaligus presiden pertama RI.' }
                            ]
                        },
                        {
                            id: 102, title: 'Bahasa Indonesia', duration: 30,
                            questions: [
                                { id: 3, type: 'single', text: 'Manakah dari kata berikut yang bersinonim dengan kata <b>Eksklusif</b>?', options: ['Umum', 'Khusus', 'Biasa', 'Kecuali', 'Murah'], answer: 1, points: 10, explanation: 'Eksklusif memiliki makna terpisah dari yang lain, atau <b>khusus</b>.' }
                            ]
                        }
                    ]
                }
            ]);

            const [testResults, setTestResults] = useState([
                { 
                    id: 1, studentId: 1, studentName: 'Andi Saputra', packageTitle: 'Ujian Tengah Semester - Ganjil', 
                    score: 1000, maxScore: 1000, earnedPoints: 55, totalPoints: 55, correct: 4, wrong: 0, total: 4, 
                    date: '2024-05-10T10:00:00Z',
                    answers: { 1: 2, 2: [0, 2, 4], 4: 'soekarno', 3: 1 },
                    subTestScores: [
                        { title: 'Matematika Terapan', score: 1000, earned: 45, total: 45 },
                        { title: 'Bahasa Indonesia', score: 1000, earned: 10, total: 10 }
                    ],
                    questionsSnapshot: [
                        { id: 1, type: 'single', subTestTitle: 'Matematika Terapan', text: 'Berapakah hasil dari <math-field>\\sqrt{144}</math-field> ditambah <math-field>\\frac{10}{2}</math-field> ?', options: ['15', '16', '17', '18', '19'], answer: 2, points: 10, explanation: '<b>Akar 144 adalah 12</b>.<br>10 dibagi 2 adalah 5.<br>Maka 12 + 5 = 17.' },
                        { id: 2, type: 'multiple', subTestTitle: 'Matematika Terapan', text: 'Manakah dari bilangan berikut yang merupakan bilangan genap? (Pilih lebih dari satu)', options: ['12', '15', '20', '25', '30'], answer: [0, 2, 4], points: 15, explanation: 'Bilangan genap adalah bilangan yang habis dibagi 2. Maka jawabannya 12, 20, dan 30.' },
                        { id: 4, type: 'essay', subTestTitle: 'Matematika Terapan', text: 'Sebutkan presiden pertama Republik Indonesia!', options: [], essayAnswer: 'Soekarno', points: 20, explanation: 'Ir. Soekarno adalah proklamator sekaligus presiden pertama RI.' },
                        { id: 3, type: 'single', subTestTitle: 'Bahasa Indonesia', text: 'Manakah dari kata berikut yang bersinonim dengan kata <b>Eksklusif</b>?', options: ['Umum', 'Khusus', 'Biasa', 'Kecuali', 'Murah'], answer: 1, points: 10, explanation: 'Eksklusif memiliki makna terpisah dari yang lain, atau <b>khusus</b>.' }
                    ]
                }
            ]);

            const [admins, setAdmins] = useState([{ id: 1, username: 'admin_utama', role: 'Super Admin' }]);
            const [students, setStudents] = useState([{ id: 1, name: 'Andi Saputra', nis: '102938', password: 'password123' }, { id: 2, name: 'Budi Santoso', nis: '102939', password: 'rahasia321' }]);

            if (!currentUser) {
                return (
                    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-blue-600">
                            <div className="text-center mb-8">
                                <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200 transform rotate-3"><Icon name="book-open" className="text-white text-3xl -rotate-3" /></div>
                                <h1 className="text-2xl font-bold text-gray-800">CBT System Pro</h1>
                                <p className="text-gray-500 font-medium">Platform Ujian Berbasis Komputer</p>
                            </div>
                            <div className="space-y-4">
                                <button onClick={() => setCurrentUser({ name: 'Admin Utama', role: 'admin' })} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-3 shadow-md cursor-pointer"><Icon name="cog" className="text-lg" /> Masuk sebagai Admin</button>
                                <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink-0 mx-4 text-slate-400 text-sm">atau</span><div className="flex-grow border-t border-slate-200"></div></div>
                                <button onClick={() => setCurrentUser({ id: students[0].id, name: students[0].name, role: 'student', nis: students[0].nis })} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-3 shadow-md shadow-blue-200 cursor-pointer"><Icon name="users" className="text-lg" /> Simulasi Login Siswa</button>
                            </div>
                        </div>
                    </div>
                );
            }

            if (view && view.type === 'test') {
                return <TestRunner pkg={view.pkg} student={currentUser} onFinish={(result) => { 
                    setTestResults([result, ...testResults]); 
                    setView('hasilTes'); 
                }} />;
            }

            const getTitle = (v) => {
                if(v === 'paketSoal') return 'Manajemen Paket Ujian';
                if(v === 'hasilTes') return 'Review Hasil Ujian';
                if(v === 'pengaturan') return 'Pengaturan Sistem';
                return 'Dashboard';
            };

            return (
                <div className="min-h-screen bg-slate-50 flex text-slate-800">
                    {currentUser.role === 'admin' && (
                        <div className="w-64 bg-slate-900 text-white flex flex-col shrink-0 shadow-xl z-20">
                            <div className="p-6 flex items-center gap-3 bg-slate-950">
                                <Icon name="graduation-cap" className="text-blue-500 text-2xl" />
                                <span className="text-xl font-bold tracking-wide">CBT Admin</span>
                            </div>
                            <div className="flex-1 py-6 space-y-2 px-4 overflow-y-auto">
                                <SidebarBtn iconName="chart-pie" label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
                                <SidebarBtn iconName="layer-group" label="Paket Ujian" active={view === 'paketSoal'} onClick={() => setView('paketSoal')} />
                                <SidebarBtn iconName="clipboard-check" label="Hasil Tes" active={view === 'hasilTes'} onClick={() => setView('hasilTes')} />
                                <SidebarBtn iconName="cogs" label="Pengaturan" active={view === 'pengaturan'} onClick={() => setView('pengaturan')} />
                            </div>
                            <div className="p-4 bg-slate-950">
                                <button onClick={() => setCurrentUser(null)} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-red-500 hover:text-white text-red-400 font-medium transition cursor-pointer">
                                    <Icon name="power-off" className="text-lg" /> Keluar Sistem
                                </button>
                            </div>
                        </div>
                    )}

                    {currentUser.role === 'student' && (
                        <div className="w-64 bg-blue-700 text-white flex flex-col shrink-0 shadow-xl z-20">
                            <div className="p-6 flex items-center gap-3 bg-blue-800">
                                <Icon name="user-graduate" className="text-white text-2xl" />
                                <span className="text-xl font-bold tracking-wide">Siswa Area</span>
                            </div>
                            <div className="flex-1 py-6 space-y-2 px-4 overflow-y-auto">
                                <SidebarBtn iconName="laptop-code" label="Ujian Tersedia" active={view === 'dashboard'} onClick={() => setView('dashboard')} isStudent={true} />
                                <SidebarBtn iconName="award" label="Review Hasil Tes" active={view === 'hasilTes'} onClick={() => setView('hasilTes')} isStudent={true} />
                            </div>
                            <div className="p-4 bg-blue-800">
                                <button onClick={() => setCurrentUser(null)} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-red-500 hover:text-white text-red-100 font-medium transition cursor-pointer">
                                    <Icon name="power-off" className="text-lg" /> Logout
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col h-screen overflow-hidden">
                        <header className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center z-10 shrink-0">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">{getTitle(view)}</h2>
                            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                <div className="text-right">
                                    <div className="font-bold text-slate-800 leading-tight">{currentUser.name}</div>
                                    <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">{currentUser.role === 'student' ? 'NIS: ' + currentUser.nis : currentUser.role}</div>
                                </div>
                            </div>
                        </header>

                        <main className="flex-1 overflow-y-auto p-8 bg-slate-50 relative">
                            {currentUser.role === 'admin' ? (
                                <React.Fragment>
                                    {view === 'dashboard' && <AdminDashboard packages={packages} students={students} testResults={testResults} />}
                                    {view === 'paketSoal' && <PaketManager packages={packages} setPackages={setPackages} packageCategories={packageCategories} />}
                                    {view === 'hasilTes' && <HasilTesAdmin testResults={testResults} />}
                                    {view === 'pengaturan' && <PengaturanAdmin admins={admins} setAdmins={setAdmins} students={students} setStudents={setStudents} packageCategories={packageCategories} setPackageCategories={setPackageCategories} />}
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    {view === 'dashboard' && <StudentPortal packages={packages} packageCategories={packageCategories} onStartTest={(pkg) => {
                                        if(!pkg.subTests || pkg.subTests.length === 0) { alert("Paket ini belum memiliki modul tes."); return; }
                                        setView({type: 'test', pkg});
                                    }} />}
                                    {view === 'hasilTes' && <HasilTesSiswa testResults={testResults} studentId={currentUser.id} />}
                                </React.Fragment>
                            )}
                        </main>
                    </div>
                </div>
            );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
