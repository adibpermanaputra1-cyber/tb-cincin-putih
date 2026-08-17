import React, { useState } from 'react';
import { User, Role } from '../types';
import { api } from '../lib/api';
import { ShieldCheck, UserCheck, KeyRound, Mail, Store, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: User, greeting: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('owner@toko.com');
  const [password, setPassword] = useState('owner123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      onLoginSuccess(res.user, res.greeting);
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  const setCredentials = (target: 'OWNER' | 'RISMA' | 'RIRIN') => {
    if (target === 'OWNER') {
      setEmail('owner@toko.com');
      setPassword('owner123');
    } else if (target === 'RISMA') {
      setEmail('risma@toko.com');
      setPassword('kasir123');
    } else {
      setEmail('ririn@toko.com');
      setPassword('kasir123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Store Brand & Info */}
        <div className="lg:col-span-6 space-y-6 text-white text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Store className="w-4 h-4 text-emerald-400" />
            Aplikasi Kasir & Pembukuan Toko Bangunan
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              TB. <span className="text-emerald-400 underline decoration-emerald-500/50 underline-offset-8">Cincin Putih</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Sistem kasir penjualan bahan bangunan, hitung otomatis stok material, buku kasbon pelanggan, dan laporan keuangan toko harian.
            </p>
          </div>

          {/* Quick Access Account Selector */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pilih Akun Cepat Masuk:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Owner */}
              <button
                type="button"
                onClick={() => setCredentials('OWNER')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  email === 'owner@toko.com'
                    ? 'bg-emerald-950/90 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    OWNER
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xs font-bold text-white">Pak Ahmad & Buk Maesaroh</div>
                <div className="text-[10px] text-slate-400">owner@toko.com</div>
                <div className="text-[10px] text-emerald-400/90 font-medium leading-tight mt-0.5">
                  Akses Semua Menu
                </div>
              </button>

              {/* Kasir Risma */}
              <button
                type="button"
                onClick={() => setCredentials('RISMA')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  email === 'risma@toko.com' || email === 'kasir@toko.com'
                    ? 'bg-indigo-950/90 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    KASIR
                  </span>
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-xs font-bold text-white">Risma</div>
                <div className="text-[10px] text-slate-400">risma@toko.com</div>
                <div className="text-[10px] text-indigo-400/90 font-medium leading-tight mt-0.5">
                  Akses Kasir & Stok
                </div>
              </button>

              {/* Kasir Ririn */}
              <button
                type="button"
                onClick={() => setCredentials('RIRIN')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  email === 'ririn@toko.com'
                    ? 'bg-indigo-950/90 border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    KASIR
                  </span>
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-xs font-bold text-white">Ririn</div>
                <div className="text-[10px] text-slate-400">ririn@toko.com</div>
                <div className="text-[10px] text-indigo-400/90 font-medium leading-tight mt-0.5">
                  Akses Kasir & Stok
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Card */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-7 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Masuk Akun</h2>
              <p className="text-xs text-slate-400 mt-1">
                Silakan pilih akun di samping atau ketik email dan kata sandi Anda.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Akun
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@toko.com"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Masuk ke Aplikasi</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sistem Database Toko Aktif
              </span>
              <span>TB. Cincin Putih</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
