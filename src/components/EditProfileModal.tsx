import React, { useState, useEffect } from 'react';
import { User, StoreSettings } from '../types';
import { api } from '../lib/api';
import {
  User as UserIcon,
  Save,
  X,
  Shield,
  Phone,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Store,
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated: (updatedUser: User) => void;
  settings?: StoreSettings | null;
  onRefresh?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  settings,
  onRefresh,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [syncToStoreOwner, setSyncToStoreOwner] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setUsername(currentUser.username || '');
      setPhone(currentUser.phone || '');
      setNewPassword('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama Pemilik / Nama Lengkap tidak boleh kosong.');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('Username login tidak boleh kosong.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const updates: Partial<User> = {
        name: name.trim(),
        username: username.trim(),
        phone: phone.trim() || undefined,
      };

      if (newPassword.trim()) {
        updates.password = newPassword.trim();
      }

      // 1. Update user record in API / Storage
      const updated = await api.updateUser(currentUser.id, updates);

      // 2. If user is OWNER and sync is checked, also update StoreSettings ownerName
      if (currentUser.role === 'OWNER' && syncToStoreOwner) {
        await api.updateSettings({
          ownerName: name.trim(),
        });
      }

      // 3. Update localStorage session
      const newUserData = { ...currentUser, ...updated };
      localStorage.setItem('tb_user', JSON.stringify(newUserData));

      // 4. Trigger state update in App
      onUserUpdated(newUserData);

      setSuccessMsg('Profil & Nama Pemilik berhasil diperbarui!');
      if (onRefresh) onRefresh();

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui profil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Ubah Nama Pemilik & Profil</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentUser.role}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Nama pemilik dapat diubah sewaktu-waktu sesuai keinginan Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {successMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 flex items-center gap-2 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nama Pemilik / Display Name */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1 flex items-center justify-between">
              <span>Nama Pemilik (Owner) / Nama Lengkap *</span>
              <span className="text-[11px] text-indigo-400 font-normal">Fleksibel dapat diedit</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ahmad Junaidi / H. Hendra / dll"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Nama ini akan muncul di dashboard, laporan penjualan, dan tanda terima kasir.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Username */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Username Login *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="owner"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>No. WhatsApp / HP</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812-3456-7890"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* New Password (Optional) */}
          <div>
            <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Ganti Kata Sandi (Opsional)</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Kosongkan jika tidak ingin mengubah password"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>

          {/* Sync Checkbox */}
          {currentUser.role === 'OWNER' && (
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
              <label className="flex items-center gap-2 text-slate-200 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncToStoreOwner}
                  onChange={(e) => setSyncToStoreOwner(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Sinkronkan ke Pengaturan Usaha Toko</span>
              </label>
              <p className="text-[10px] text-slate-400 pl-6">
                Otomatis memperbarui nama pemilik di profil toko ({settings?.storeName || 'TB. Cincin Putih'}).
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 cursor-pointer transition disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
