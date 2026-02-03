import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { User, Company } from '../types';
import { Loader2 } from 'lucide-react';

const PublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ user: User; company: Company } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const result = await api.getPublicUser(id);
        setData(result);
      } catch (err: any) {
        setError('Profile not found or deactivated.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Theme initialization
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, [id]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const generateVCard = () => {
    if (!data) return;
    const { user, company } = data;

    const nameParts = user.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');

    const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:${user.fullName}
N:${lastName};${firstName};;;
ORG:${company.name}
TITLE:${user.jobTitle}
TEL;TYPE=CELL:${user.phone}
${user.whatsapp ? `TEL;TYPE=WORK,VOICE:${user.whatsapp}` : ''}
EMAIL:${user.email}
URL:${company.domain}
${user.linkedin ? `URL;TYPE=LINKEDIN:${user.linkedin}` : ''}
${user.instagram ? `URL;TYPE=INSTAGRAM:${user.instagram}` : ''}
${user.facebook ? `URL;TYPE=FACEBOOK:${user.facebook}` : ''}
ADR;TYPE=WORK:;;${company.address || ''}
END:VCARD`;

    const blob = new Blob([vCardData], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${user.fullName.replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("链接已复制 (Link Copied)");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-sm">
          <div className="bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-user-slash text-2xl text-slate-400"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Profile Unavailable</h2>
          <p className="text-slate-500 mt-2">The digital card you are looking for does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const { user, company } = data;

  return (
    <>
      <style>
        {`
          body { -webkit-font-smoothing: antialiased; transition: background-color 0.3s ease, color 0.3s ease; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .transition-theme { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 300ms; }
          @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-enter { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
          .delay-100 { animation-delay: 0.1s; } .delay-200 { animation-delay: 0.2s; } .delay-300 { animation-delay: 0.3s; }
        `}
      </style>
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex justify-center items-start sm:items-center p-0 sm:p-4 text-slate-800 dark:text-slate-100 transition-theme">
        <main className="w-full max-w-md bg-white dark:bg-slate-900 sm:rounded-[2.5rem] shadow-soft dark:shadow-none overflow-hidden min-h-screen sm:min-h-[850px] relative flex flex-col transition-theme border dark:border-slate-800">

          {/* Header Image */}
          <div className="h-44 w-full relative overflow-hidden bg-brand-900 group">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop"
              alt="Background"
              className="w-full h-full object-cover opacity-60 mix-blend-overlay transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-brand-900/40 to-transparent"></div>

            <button
              onClick={toggleTheme}
              className="absolute top-5 left-5 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition active:scale-95 border border-white/10 z-20"
            >
              <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <button
              onClick={() => setShowQR(true)}
              className="absolute top-5 right-5 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition active:scale-95 border border-white/10 z-20"
            >
              <i className="fa-solid fa-qrcode"></i>
            </button>
          </div>

          <div className="px-6 relative flex-grow pb-24">

            <div className="relative -mt-16 mb-6 animate-enter flex justify-between items-end">
              <div 
                onClick={() => user.avatarUrl && setShowAvatar(true)}
                className="w-32 h-32 rounded-3xl border-[4px] border-white dark:border-slate-900 shadow-xl overflow-hidden bg-slate-200 transition-theme group cursor-pointer z-10 active:scale-95"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                    <i className="fa-solid fa-user text-4xl"></i>
                  </div>
                )}
              </div>
              <div className="mb-2 animate-enter delay-100">
                <span className="font-heading font-bold text-xl tracking-tight text-brand-700 dark:text-blue-400">
                  {company.name.split(' ')[0]}
                </span>
              </div>
            </div>

            <div className="mb-8 animate-enter delay-100 space-y-4">
              <div>
                <h1 className="text-[1.75rem] font-bold text-slate-900 dark:text-white mb-1.5 font-heading tracking-tight leading-tight">
                  {user.fullName}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-brand-600 dark:text-blue-300 font-semibold text-xs uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-900/50">
                    {user.jobTitle}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3.5 group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center shrink-0 text-brand-600 dark:text-blue-400 border border-blue-100 dark:border-slate-700 transition-all duration-300 group-hover:scale-105 group-hover:shadow-sm">
                    <i className="fa-solid fa-building text-sm"></i>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Company</span>
                    <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{company.name}</span>
                  </div>
                </div>
                {company.address && (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(company.address)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3.5 group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all duration-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-100 group-hover:scale-105">
                      <i className="fa-solid fa-location-dot text-sm"></i>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-0.5 group-hover:text-blue-600 transition-colors">Address</span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 leading-snug group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
                        {company.address}
                      </span>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs text-slate-300 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"></i>
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3 mb-8 animate-enter delay-200">
              <button onClick={generateVCard} className="col-span-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/20 dark:shadow-blue-900/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                <i className="fa-solid fa-user-plus"></i>
                <span>Save Contact</span>
              </button>
              <button onClick={copyLink} className="col-span-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700">
                <i className="fa-solid fa-share-nodes text-lg"></i>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-8 animate-enter delay-200">
              <a href={`tel:${user.phone}`} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-slate-700 transition-colors group-hover:text-blue-600">
                  <i className="fa-solid fa-phone"></i>
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Phone</span>
              </a>
              <a href={`mailto:${user.email}`} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-slate-700 transition-colors group-hover:text-blue-600">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Email</span>
              </a>
              {user.whatsapp && (
                <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-2xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:bg-[#25D366]/10 dark:group-hover:bg-[#25D366]/10 transition-colors group-hover:text-[#25D366] group-hover:border-[#25D366]/20">
                    <i className="fa-brands fa-whatsapp"></i>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">WhatsApp</span>
                </a>
              )}
              {user.linkedin && (
                <a href={user.linkedin} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:bg-[#0077b5]/10 dark:group-hover:bg-[#0077b5]/20 transition-colors group-hover:text-[#0077b5] group-hover:border-[#0077b5]/30">
                    <i className="fa-brands fa-linkedin-in"></i>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">LinkedIn</span>
                </a>
              )}
            </div>

            <div className="space-y-4 animate-enter delay-300">
              {user.bio && (
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-5 shadow-sm transition-theme">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Bio</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {user.bio}
                  </p>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden transition-theme group hover:border-blue-200 dark:hover:border-slate-600 duration-300">
                
                {/* A. Header & Bio */}
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={company.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
                        {company.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{company.name}</h3>
                      <p className="text-[10px] text-blue-600 dark:text-blue-300 font-medium uppercase tracking-wide">Company Profile</p>
                    </div>
                  </div>
                  {company.bio && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-l-2 border-blue-100 dark:border-slate-700 pl-3">
                      {company.bio}
                    </p>
                  )}
                </div>

                {/* B. Social Matrix (Horizontal Row) */}
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-around items-center">
                  {/* LinkedIn */}
                  {company.linkedin && (
                    <a href={company.linkedin} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5 group/icon" title="Company LinkedIn">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[#0077b5] text-lg shadow-sm group-hover/icon:scale-110 group-hover/icon:border-[#0077b5] transition-all">
                        <i className="fa-brands fa-linkedin-in"></i>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 group-hover/icon:text-[#0077b5] transition-colors">LinkedIn</span>
                    </a>
                  )}

                  {/* Facebook */}
                  {company.facebook && (
                    <a href={company.facebook} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5 group/icon" title="Facebook">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[#1877F2] text-lg shadow-sm group-hover/icon:scale-110 group-hover/icon:border-[#1877F2] transition-all">
                        <i className="fa-brands fa-facebook-f"></i>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 group-hover/icon:text-[#1877F2] transition-colors">Facebook</span>
                    </a>
                  )}

                  {/* Instagram */}
                  {company.instagram && (
                    <a href={company.instagram} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5 group/icon" title="Instagram">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-transparent bg-clip-text bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-lg shadow-sm group-hover/icon:scale-110 group-hover/icon:border-red-400 transition-all">
                        <i className="fa-brands fa-instagram text-pink-500"></i>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 group-hover/icon:text-pink-500 transition-colors">Instagram</span>
                    </a>
                  )}
                </div>

                {/* C. Official Websites (Action List) */}
                <div>
                  {company.domain && (
                    <a href={company.domain.startsWith('http') ? company.domain : `https://${company.domain}`} target="_blank" rel="noreferrer" className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition border-t border-slate-100 dark:border-slate-700 group/link">
                      <div className="flex items-center gap-3">
                        <i className="fa-solid fa-globe text-slate-400 dark:text-slate-500 group-hover/link:text-blue-600 transition-colors"></i>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Official Site</span>
                      </div>
                      <i className="fa-solid fa-arrow-right text-xs text-slate-300 dark:text-slate-600 group-hover/link:text-blue-600 group-hover/link:translate-x-1 transition-all"></i>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 mb-4 flex justify-center opacity-50">
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>

            <div className="mt-2 text-center pb-2">
              <p className="text-[10px] text-slate-300 dark:text-slate-600 font-medium uppercase tracking-widest">Powered by Ritma DBC</p>
            </div>
          </div>
        </main>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-brand-900/80 backdrop-blur-sm transition-opacity" onClick={() => setShowQR(false)}></div>
          <div className="absolute inset-x-0 bottom-0 sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[350px] bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl p-8 animate-enter border-t sm:border border-slate-100 dark:border-slate-700">
            <div className="flex flex-col items-center">
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-6 sm:hidden"></div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Scan to Connect</h3>
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`}
                  alt="QR Code"
                  className="w-48 h-48 rounded-xl"
                />
              </div>
              <button onClick={() => setShowQR(false)} className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Preview Modal */}
      {showAvatar && user.avatarUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowAvatar(false)}></div>
          <div className="relative max-w-full max-h-full animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAvatar(false)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white text-3xl"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <img 
              src={user.avatarUrl} 
              alt={user.fullName} 
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PublicProfile;
