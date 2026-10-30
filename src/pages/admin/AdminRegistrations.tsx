import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { ClipboardCheck, Search, FileText, CheckCircle, Upload, X } from 'lucide-react';

export function AdminRegistrations() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [contractUrl, setContractUrl] = useState('');

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['seller', 'driver'])
      .eq('is_validated', false)
      .order('created_at', { ascending: false });
    setUsers(data as Profile[] || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function openContractModal(user: Profile) {
    setSelectedUser(user);
    setContractUrl(user.contract_url || '');
  }

  async function uploadContract() {
    if (!selectedUser || !contractUrl) return;
    setActionLoading(selectedUser.id);
    await supabase.from('profiles').update({ contract_url: contractUrl }).eq('id', selectedUser.id);
    setActionLoading(null);
    setSelectedUser(null);
    fetchUsers();
  }

  async function validateUser(user: Profile) {
    setActionLoading(user.id);
    await supabase.from('profiles').update({ is_validated: true }).eq('id', user.id);
    await supabase.rpc('log_admin_action', {
      p_target_user_id: user.id,
      p_action: 'validation',
      p_old_value: 'non valide',
      p_new_value: 'valide',
    });
    setActionLoading(null);
    fetchUsers();
  }

  const filtered = users.filter((u) => {
    const matchesSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout title="Inscriptions">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-10" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field sm:w-48" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">Vendeurs et livreurs</option>
          <option value="seller">Vendeurs</option>
          <option value="driver">Livreurs</option>
        </select>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 p-3">
        <FileText className="h-4 w-4 flex-shrink-0 text-blue-600" />
        <p className="text-sm text-blue-800">Envoyez le contrat par email hors plateforme, recevez le contrat signé, puis téléversez-le ici avant de valider.</p>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">Aucune inscription en attente.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Nom</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Rôle</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Contrat</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-gray-600">{user.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === 'seller' ? 'bg-accent-50 text-accent-700' : 'bg-green-50 text-green-700'}`}>
                        {user.role === 'seller' ? 'Vendeur' : 'Livreur'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.contract_url ? (
                        <a href={user.contract_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-ketrika-600 hover:text-ketrika-700">
                          <FileText className="h-3.5 w-3.5" />
                          Voir le contrat
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">Aucun</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.is_validated ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Validé</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">En attente</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openContractModal(user)} disabled={actionLoading === user.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">
                          <Upload className="h-3.5 w-3.5" />
                          Contrat
                        </button>
                        {user.contract_url && !user.is_validated && (
                          <button onClick={() => validateUser(user)} disabled={actionLoading === user.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Valider
                          </button>
                        )}
                        {user.contract_url && user.is_validated && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contract upload modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedUser(null)}>
          <div className="card max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Téléverser le contrat signé</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-500">{selectedUser.full_name} — {selectedUser.email}</p>
            <div className="space-y-4">
              <div>
                <label className="label-text">URL du contrat signé (PDF ou image)</label>
                <input className="input-field" value={contractUrl} onChange={(e) => setContractUrl(e.target.value)} placeholder="https://..." />
                <p className="mt-1 text-xs text-gray-400">Collez l'URL du contrat signé reçu hors plateforme.</p>
              </div>
              {contractUrl && (
                <a href={contractUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-ketrika-600 hover:text-ketrika-700">
                  <FileText className="h-4 w-4" />
                  Aperçu du contrat
                </a>
              )}
              <button onClick={uploadContract} disabled={actionLoading === selectedUser.id || !contractUrl} className="btn-primary w-full">
                {actionLoading === selectedUser.id ? 'Enregistrement...' : 'Enregistrer le contrat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
