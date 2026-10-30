import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/constants';
import type { Profile, UserRole } from '@/types';
import { Ban, CheckCircle, Search, Users, Shield, Eye, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function AdminUsers() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const canAssignAdmin = profile?.email === 'admin@ketrika.mg';
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function toggleSuspend(user: Profile) {
    setActionLoading(user.id);
    await supabase
      .from('profiles')
      .update({ is_suspended: !user.is_suspended })
      .eq('id', user.id);
    setActionLoading(null);
    fetchUsers();
  }

  async function changeRole(user: Profile, newRole: UserRole) {
    if (newRole === user.role) return;
    setActionLoading(user.id);
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id);
    setActionLoading(null);
    fetchUsers();
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout title="Utilisateurs">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-10"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field sm:w-48"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">Tous les rôles</option>
          <option value="client">Clients</option>
          <option value="seller">Vendeurs</option>
          <option value="driver">Livreurs</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3">
        <Shield className="h-4 w-4 flex-shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">Vous pouvez modifier le rôle des utilisateurs via le menu déroulant "Rôle". {canAssignAdmin ? 'Vous pouvez attribuer le rôle administrateur.' : 'Seul le compte admin@ketrika.mg peut attribuer le rôle administrateur.'}</p>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Nom</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Rôle</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 sm:table-cell">Ville</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 lg:table-cell">Inscrit le</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{user.full_name}</p>
                      {user.is_suspended && (
                        <span className="text-xs text-red-600 font-medium">Suspendu</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.email === 'admin@ketrika.mg' ? (
                        <span className={`inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700`}>
                          <Lock className="h-3 w-3" />
                          Administrateur
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => changeRole(user, e.target.value as UserRole)}
                          disabled={actionLoading === user.id}
                          className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                            user.role === 'admin'
                              ? 'border-red-200 bg-red-50 text-red-700'
                              : user.role === 'seller'
                              ? 'border-accent-200 bg-accent-50 text-accent-700'
                              : user.role === 'driver'
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-ketrika-200 bg-ketrika-50 text-ketrika-700'
                          }`}
                        >
                          <option value="client">Client</option>
                          <option value="seller">Vendeur</option>
                          <option value="driver">Livreur</option>
                          {canAssignAdmin && <option value="admin">Administrateur</option>}
                        </select>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex flex-col gap-1">
                        {user.is_suspended && <span className="text-xs text-red-600 font-medium">Suspendu</span>}
                        {(user.role === 'seller' || user.role === 'driver') && (
                          user.is_validated
                            ? <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 w-fit">Validé</span>
                            : <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 w-fit">En attente</span>
                        )}
                        {user.role === 'client' && <span className="text-xs text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-ketrika-50 px-3 py-1.5 text-xs font-medium text-ketrika-700 hover:bg-ketrika-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Dossier
                        </button>
                        {user.role !== 'admin' && (
                        <button
                          onClick={() => toggleSuspend(user)}
                          disabled={actionLoading === user.id}
                          className={
                            user.is_suspended
                              ? 'inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100'
                              : 'inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100'
                          }
                        >
                          {user.is_suspended ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                          {user.is_suspended ? 'Réactiver' : 'Suspendre'}
                        </button>
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
    </DashboardLayout>
  );
}
