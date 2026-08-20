import React, { useState } from 'react';
import { User, Role } from '../types';
import { api } from '../lib/api';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Edit2,
  Save,
  Lock,
} from 'lucide-react';

interface UsersModuleProps {
  users: User[];
  currentUser: User;
  onRefresh: () => void;
  onUpdateCurrentUser?: (user: User) => void;
}

export const UsersModule: React.FC<UsersModuleProps> = ({
  users,
  currentUser,
  onRefresh,
  onUpdateCurrentUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('KASIR');
  const [phone, setPhone] = useState('');

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setName('');
    setPassword('');
    setRole('KASIR');
    setPhone('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setUsername(user.username || '');
    setName(user.name);
    setPassword('');
    setRole(user.role);
    setPhone(user.phone || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !name) {
      setErrorMsg('Username dan Nama Lengkap wajib diisi!');
      return;
    }

    if (!editingUser && !password) {
      setErrorMsg('Password wajib diisi untuk pengguna baru!');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      if (editingUser) {
        // Edit existing user
        const updates: Partial<User> = {
          name: name.trim(),
          username: username.trim(),
          role,
          phone: phone.trim() || undefined,
        };
        if (password.trim()) {
          updates.password = password.trim();
        }

        const updated = await api.updateUser(editingUser.id, updates);

        // If editing self or owner, update settings & current user
        if (editingUser.role === 'OWNER') {
          await api.updateSettings({ ownerName: name.trim() });
        }

        if (editingUser.id === currentUser.id && onUpdateCurrentUser) {
          const newCurrent = { ...currentUser, ...updated };
          localStorage.setItem('tb_user', JSON.stringify(newCurrent));
          onUpdateCurrentUser(newCurrent);
        }

        setSuccessMsg(`Akun ${name} berhasil diperbarui!`);
      } else {
        // Create new user
        const userEmail = username.includes('@') ? username : `${username.toLowerCase().replace(/\s+/g, '')}@toko.com`;
        await api.createUser({
          name: name.trim(),
          email: userEmail,
          username: username.trim(),
          role,
          phone: phone.trim() || undefined,
        });
        setSuccessMsg('Akun pengguna baru berhasil ditambahkan!');
      }

      setIsModalOpen(false);
      setUsername('');
      setName('');
      setPassword('');
      setPhone('');
      setEditingUser(null);
      setTimeout(() => setSuccessMsg(null), 3500);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data pengguna');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser.id) {
      setErrorMsg('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      setDeletingUser(null);
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await api.deleteUser(deletingUser.id);
      setDeletingUser(null);
      setSuccessMsg('Akun pengguna berhasil dihapus!');
      setTimeout(() => setSuccessMsg(null), 3500);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Manajemen Hak Akses & Karyawan (RBAC)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Atur akun Owner (Nama pemilik fleksibel dapat diubah) dan Karyawan Kasir.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Karyawan</span>
        </button>
      </div>

      {/* Users List */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Nama Lengkap</th>
                <th className="p-3.5">Username Login</th>
                <th className="p-3.5">Role / Hak Akses</th>
                <th className="p-3.5">No. WhatsApp</th>
                <th className="p-3.5">Status Akun</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.map((u) => {
                const isOwner = u.role === 'OWNER';
                return (
                  <tr key={u.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                      {u.id === currentUser.id && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-normal">
                          Anda
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">{u.username}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isOwner
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>{isOwner ? 'OWNER (Akses Penuh)' : 'KASIR (Kasir & Stok)'}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{u.phone || '-'}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aktif</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          title={`Ubah data ${u.name}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => setDeletingUser(u)}
                            title="Hapus Akun Pengguna"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT USER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <span>{editingUser ? 'Ubah Data Pengguna / Owner' : 'Tambah Pengguna Baru'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Nama Lengkap / Nama Pemilik *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ahmad Junaidi / Siti Nurhaliza"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Username Login *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. owner / kasir1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  {editingUser ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Login *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Role / Otoritas *</label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                >
                  <option value="OWNER">Owner (Akses Penuh Laba Rugi, HPP & Keuangan)</option>
                  <option value="KASIR">Kasir (Hanya Transaksi POS & Cek Stok)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">No. WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE USER CONFIRMATION */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-slate-100">
            <div className="p-5 bg-rose-950/30 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Hapus Akun Pengguna?</h3>
                <p className="text-xs text-slate-400">Pengguna ini tidak akan bisa login lagi ke sistem TB. Cincin Putih.</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Nama Lengkap:</span>
                  <span className="font-bold text-white">{deletingUser.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Username:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{deletingUser.username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Role:</span>
                  <span className="text-slate-200 font-semibold">{deletingUser.role}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950/50 transition cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Akun</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
