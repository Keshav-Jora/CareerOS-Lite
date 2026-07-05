import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Plus, X, Upload, Calendar, Compass, ShieldAlert, Eye, Trash2, Sparkles, ShieldCheck, Lock, Unlock, Zap } from 'lucide-react';
import { Certificate } from '../types';

interface CertificatesViewProps {
  theme: 'light' | 'dark';
  certificates: Certificate[];
  onSaveCertificate: (cert: Certificate) => void;
  onDeleteCertificate: (id: string) => void;
}

export default function CertificatesView({
  theme,
  certificates,
  onSaveCertificate,
  onDeleteCertificate,
}: CertificatesViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeCert, setActiveCert] = useState<Certificate | null>(null);
  const [unlockedAchievementName, setUnlockedAchievementName] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Uploader Base64 Parser
  const handleFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Only images and PDF files are supported for credential tracking.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Generate beautiful default vector credential matching details if no file is uploaded
  const generateVectorCredential = (title: string, issuer: string, dateStr: string) => {
    const cleanTitle = title.replace(/[<>&"]/g, '');
    const cleanIssuer = issuer.replace(/[<>&"]/g, '');
    const cleanDate = dateStr.replace(/[<>&"]/g, '');
    const idSeed = Math.floor(10000 + Math.random() * 90000);

    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280"><rect width="100%" height="100%" fill="%23090d16"/><rect x="15" y="15" width="370" height="250" fill="none" stroke="%236366f1" stroke-width="1.5" rx="4"/><circle cx="200" cy="80" r="30" fill="%236366f1" fill-opacity="0.2" stroke="%236366f1" stroke-width="1"/><text x="200" y="88" fill="%23818cf8" font-family="sans-serif" font-size="24" text-anchor="middle" font-weight="bold">✓</text><text x="200" y="150" fill="%23f1f5f9" font-family="sans-serif" font-size="16" text-anchor="middle" font-weight="bold">${cleanTitle}</text><text x="200" y="175" fill="%2394a3b8" font-family="sans-serif" font-size="12" text-anchor="middle">${cleanIssuer}</text><text x="200" y="200" fill="%2310b981" font-family="sans-serif" font-size="10" text-anchor="middle" font-weight="bold" letter-spacing="1">VERIFIED CREDENTIAL</text><text x="200" y="230" fill="%23475569" font-family="sans-serif" font-size="9" text-anchor="middle">Earned: ${cleanDate} • ID: COS-${idSeed}-Z</text></svg>`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !platform) return;

    // Generate fallback SVG if nothing was uploaded
    const finalFileUrl = fileUrl || generateVectorCredential(name, platform, date);

    const newCert: Certificate = {
      id: `cert-${Date.now()}`,
      name,
      platform,
      date,
      category: category || 'General Tech',
      notes,
      fileUrl: finalFileUrl,
    };

    onSaveCertificate(newCert);
    setUnlockedAchievementName(name); // triggers achievement unlock alert
    setIsFormOpen(false);

    // Reset
    setName('');
    setPlatform('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('');
    setNotes('');
    setFileUrl(undefined);
  };

  // Evaluate achievements state based on certificates logged
  const hasFirstBlood = certificates.length >= 1;
  const hasSpecialist = certificates.length >= 3;
  const hasDSAElite = certificates.some(c => 
    c.name.toLowerCase().includes('dsa') || 
    c.name.toLowerCase().includes('algorithm') || 
    c.name.toLowerCase().includes('data structure') ||
    c.category.toLowerCase().includes('dsa') ||
    c.category.toLowerCase().includes('algorithm')
  );
  const hasCloudPractitioner = certificates.some(c => 
    c.name.toLowerCase().includes('cloud') || 
    c.name.toLowerCase().includes('aws') || 
    c.name.toLowerCase().includes('google') || 
    c.name.toLowerCase().includes('azure') || 
    c.name.toLowerCase().includes('web') ||
    c.category.toLowerCase().includes('cloud') ||
    c.category.toLowerCase().includes('web')
  );

  const totalUnlockedCount = [hasFirstBlood, hasSpecialist, hasDSAElite, hasCloudPractitioner].filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-1 pb-32 md:pb-6 relative">
      
      {/* Floating Confetti Achievement Unlock Banner */}
      <AnimatePresence>
        {unlockedAchievementName && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-4 bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 rounded-2xl border border-white/20 shadow-2xl flex items-center justify-between gap-4 text-white"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 animate-bounce">
                <Sparkles className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <h4 className="font-display font-black text-xs uppercase tracking-widest text-amber-200">Achievement Unlocked!</h4>
                <p className="text-[11px] font-semibold text-white/90 truncate max-w-[240px]">{unlockedAchievementName}</p>
                <span className="text-[8px] font-mono text-emerald-200 block uppercase font-bold mt-0.5">✓ Registered to Credential Vault</span>
              </div>
            </div>
            <button
              onClick={() => setUnlockedAchievementName(null)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
            Credential Vault
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Store, audit, and showcase your verified achievements and platform certifications.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-1.5 shadow-md glow-blue transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Register Certificate
        </button>
      </div>

      {/* Gamification Achievements Grid Panel */}
      <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'} space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/20">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="font-display font-bold text-sm text-slate-200">Unlockable Career Milestones</h3>
              <p className="text-[11px] text-slate-500">Earn credentials to gain experience points and secure platform badges.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-indigo-400">
            {totalUnlockedCount} / 4 BADGES UNLOCKED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Badge 1: First Blood */}
          <div className={`p-4 rounded-xl border relative overflow-hidden transition-all duration-300 ${
            hasFirstBlood 
              ? 'bg-indigo-500/5 border-indigo-500/30 text-indigo-200' 
              : 'bg-slate-950/40 border-slate-900 text-slate-500'
          }`}>
            <div className="flex items-start justify-between">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${
                hasFirstBlood ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}>
                {hasFirstBlood ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                hasFirstBlood ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-900 text-slate-600'
              }`}>Bronze Tier</span>
            </div>
            <div className="mt-3">
              <h4 className="font-display font-bold text-xs text-slate-200">First Blood</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">Unlocked by registering your very first certified credential.</p>
            </div>
          </div>

          {/* Badge 2: Specialist */}
          <div className={`p-4 rounded-xl border relative overflow-hidden transition-all duration-300 ${
            hasSpecialist 
              ? 'bg-purple-500/5 border-purple-500/30 text-purple-200' 
              : 'bg-slate-950/40 border-slate-900 text-slate-500'
          }`}>
            <div className="flex items-start justify-between">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${
                hasSpecialist ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}>
                {hasSpecialist ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                hasSpecialist ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-900 text-slate-600'
              }`}>Silver Tier</span>
            </div>
            <div className="mt-3">
              <h4 className="font-display font-bold text-xs text-slate-200">Specialist</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">Unlocked by registering 3 or more verified certifications.</p>
            </div>
          </div>

          {/* Badge 3: DSA Elite */}
          <div className={`p-4 rounded-xl border relative overflow-hidden transition-all duration-300 ${
            hasDSAElite 
              ? 'bg-amber-500/5 border-amber-500/30 text-amber-200' 
              : 'bg-slate-950/40 border-slate-900 text-slate-500'
          }`}>
            <div className="flex items-start justify-between">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${
                hasDSAElite ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}>
                {hasDSAElite ? <Sparkles className="h-4 w-4 text-amber-400" /> : <Lock className="h-4 w-4" />}
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                hasDSAElite ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-900 text-slate-600'
              }`}>Gold Tier</span>
            </div>
            <div className="mt-3">
              <h4 className="font-display font-bold text-xs text-slate-200">DSA Elite</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">Register any Algorithmic or Data Structures credential.</p>
            </div>
          </div>

          {/* Badge 4: Cloud Practitioner */}
          <div className={`p-4 rounded-xl border relative overflow-hidden transition-all duration-300 ${
            hasCloudPractitioner 
              ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-200' 
              : 'bg-slate-950/40 border-slate-900 text-slate-500'
          }`}>
            <div className="flex items-start justify-between">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${
                hasCloudPractitioner ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}>
                {hasCloudPractitioner ? <ShieldCheck className="h-4 w-4 text-emerald-400" /> : <Lock className="h-4 w-4" />}
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                hasCloudPractitioner ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-900 text-slate-600'
              }`}>Platinum Tier</span>
            </div>
            <div className="mt-3">
              <h4 className="font-display font-bold text-xs text-slate-200">Cloud Architect</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">Register any Web, Cloud Architecture or Cloud vendor credential.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      {certificates.length === 0 ? (
        <div className={`p-10 rounded-2xl border text-center ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
          <div className="h-12 w-12 bg-slate-800/40 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Award className="h-5 w-5 text-slate-500" />
          </div>
          <h4 className="font-bold text-sm text-slate-200">No certificates logged yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Register your Coursera, AWS, or hackathon certifications with images/PDF uploads. Your achievements represent critical leverage for applications!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <motion.div
              key={cert.id}
              whileHover={{ y: -5 }}
              className={`rounded-2xl border overflow-hidden flex flex-col justify-between ${
                theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
              }`}
            >
              {/* Certificate preview area */}
              <div className="aspect-video bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800/20 relative group">
                {cert.fileUrl ? (
                  <img
                    src={cert.fileUrl}
                    alt={cert.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-slate-700 font-bold text-4xl">🏆</div>
                )}
                {/* Overlay hover controls */}
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setActiveCert(cert)}
                    className="p-2 bg-slate-800 text-white hover:bg-slate-700 transition-colors rounded-xl flex items-center gap-1 text-xs font-semibold shadow-md"
                  >
                    <Eye className="h-3.5 w-3.5" /> Inspect Verification
                  </button>
                </div>
              </div>

              {/* Certificate content info */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                    {cert.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium font-mono">{cert.date}</span>
                </div>
                <h3 className="font-display font-bold text-sm text-slate-100 truncate">{cert.name}</h3>
                <p className="text-xs text-slate-400">{cert.platform}</p>

                {cert.notes && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic pt-1.5 border-t border-slate-800/10">
                    &ldquo;{cert.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-4 pb-4 pt-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Calendar className="h-3.5 w-3.5" /> Logged: {cert.date}
                </div>
                <button
                  onClick={() => onDeleteCertificate(cert.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Remove Certification"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Certificate Dialog */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            />

            {/* Dialog Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl p-6 ${
                theme === 'dark'
                  ? 'bg-slate-900/95 border-slate-800 text-slate-100'
                  : 'bg-white/95 border-slate-200 text-slate-800'
              } backdrop-blur-md z-10 max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-display font-bold text-lg">Register Academic Certification</h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className={`p-1.5 rounded-lg hover:bg-slate-800/30 transition-all ${
                    theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* drag drop zone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Upload Certificate File (Image or PDF)
                  </label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-indigo-500 bg-indigo-600/5'
                        : fileUrl
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/20'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,application/pdf"
                    />
                    {fileUrl ? (
                      <div className="space-y-2">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                          <Eye className="h-5 w-5 text-emerald-400" />
                        </div>
                        <h4 className="font-bold text-xs text-emerald-400">File Received and Formatted!</h4>
                        <p className="text-[10px] text-slate-500">Click to replace files or drop another</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-slate-500 mx-auto animate-bounce" />
                        <h4 className="font-bold text-xs text-slate-200">Drag &amp; drop certificate image here</h4>
                        <p className="text-[10px] text-slate-500">Supports PNG, JPG, WebP, SVG or PDF</p>
                        <p className="text-[10px] text-indigo-400 underline font-semibold">Or click to select files from device</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Certificate Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google Cloud Certified Associate Cloud Engineer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                        : 'bg-white border-slate-200'
                    }`}
                  />
                </div>

                {/* Platform */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Platform / Issuer *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Coursera, AWS, Tech University"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                          : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cloud Computing, Frontend"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                          : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-300 focus:border-indigo-500/50'
                        : 'bg-white border-slate-200'
                    }`}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Study Notes / Topics Covered
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe main components, credentials parameters, verification links..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-950/40 border-slate-800 text-slate-100 focus:border-indigo-500/50'
                        : 'bg-white border-slate-200'
                    }`}
                  />
                </div>

                {/* Footer */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      theme === 'dark'
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-xs shadow-md hover:from-indigo-500 hover:to-purple-500 transition-all glow-blue"
                  >
                    Register Certificate
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Magnified Certificate Inspect Modal */}
      <AnimatePresence>
        {activeCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCert(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Dialog Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl p-6 ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-800'
              } z-10 max-h-[90vh] overflow-y-auto`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-display font-bold text-lg">Verified Academic Credential</h3>
                </div>
                <button
                  onClick={() => setActiveCert(null)}
                  className="p-1 rounded-lg hover:bg-slate-800/30 text-slate-400 hover:text-white transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body: credential display */}
              <div className="space-y-4">
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/60 shadow-inner flex items-center justify-center">
                  {activeCert.fileUrl ? (
                    <img
                      src={activeCert.fileUrl}
                      alt={activeCert.name}
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-4xl">🎓</div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Platform: {activeCert.platform}</span>
                    <span>Issued Date: {activeCert.date}</span>
                  </div>
                  <h2 className="font-display font-bold text-xl text-slate-200">{activeCert.name}</h2>
                  <span className="inline-block text-[10px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    {activeCert.category} Verified
                  </span>
                  {activeCert.notes && (
                    <div className="p-3 bg-slate-900/40 border border-slate-800/40 rounded-xl mt-2 text-xs text-slate-400 space-y-1">
                      <span className="font-bold uppercase text-[9px] tracking-wider text-slate-500">Scope notes</span>
                      <p className="leading-relaxed italic">&ldquo;{activeCert.notes}&rdquo;</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
