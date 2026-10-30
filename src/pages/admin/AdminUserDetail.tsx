import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/constants';
import type { Profile, AdminAuditLogEntry, UserRole } from '@/types';
import { ArrowLeft, Save, FileText, Printer, History, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile: currentAdmin } = useAuth();
  const canAssignAdmin = currentAdmin?.email === 'admin@ketrika.mg';
  const [user, setUser] = useState<Profile | null>(null);
  const [auditLog, setAuditLog] = useState<AdminAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [commissionRate, setCommissionRate] = useState('');
  const [contractUrl, setContractUrl] = useState('');

  const fetchUser = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    setUser(data as Profile | null);
    if (data) {
      setCommissionRate(String((data as Profile).commission_rate * 100));
      setContractUrl((data as Profile).contract_url || '');
    }
    const { data: logData } = await supabase
      .from('admin_audit_log')
      .select('*, admin:profiles!admin_id(full_name, email)')
      .eq('target_user_id', id)
      .order('created_at', { ascending: false });
    setAuditLog(logData as any || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  async function saveCommission() {
    if (!user) return;
    setActionLoading(true);
    const newRate = parseFloat(commissionRate) / 100;
    const oldRate = user.commission_rate;
    await supabase.from('profiles').update({ commission_rate: newRate }).eq('id', user.id);
    await supabase.rpc('log_admin_action', {
      p_target_user_id: user.id,
      p_action: 'commission_change',
      p_old_value: String(oldRate * 100) + '%',
      p_new_value: String(newRate * 100) + '%',
    });
    setActionLoading(false);
    fetchUser();
  }

  async function changeRole(newRole: UserRole) {
    if (!user || newRole === user.role) return;
    setActionLoading(true);
    const oldRole = user.role;
    await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    await supabase.rpc('log_admin_action', {
      p_target_user_id: user.id,
      p_action: 'role_change',
      p_old_value: oldRole,
      p_new_value: newRole,
    });
    setActionLoading(false);
    fetchUser();
  }

  async function saveContract() {
    if (!user) return;
    setActionLoading(true);
    await supabase.from('profiles').update({ contract_url: contractUrl || null }).eq('id', user.id);
    setActionLoading(false);
    fetchUser();
  }

  async function validateUser() {
    if (!user) return;
    setActionLoading(true);
    await supabase.from('profiles').update({ is_validated: true }).eq('id', user.id);
    await supabase.rpc('log_admin_action', {
      p_target_user_id: user.id,
      p_action: 'validation',
      p_old_value: 'non valide',
      p_new_value: 'valide',
    });
    setActionLoading(false);
    fetchUser();
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <DashboardLayout title="Dossier utilisateur">
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout title="Dossier utilisateur">
        <div className="card p-8 text-center text-gray-500">Utilisateur introuvable.</div>
      </DashboardLayout>
    );
  }

  const actionLabels: Record<string, string> = {
    role_change: 'Changement de rôle',
    commission_change: 'Modification de commission',
    validation: 'Validation vendeur/livreur',
    shop_activation: 'Activation boutique',
    shop_deactivation: 'Désactivation boutique',
  };

  return (
    <DashboardLayout title="Dossier utilisateur">
      <button onClick={() => navigate('/admin/users')} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-ketrika-600 hover:text-ketrika-700">
        <ArrowLeft className="h-4 w-4" />
        Retour aux utilisateurs
      </button>

      {/* User info */}
      <div className="card mb-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-sm text-gray-500">{user.phone || 'Pas de téléphone'}</p>
            <p className="text-sm text-gray-500">{user.city || 'Pas de ville'}{user.zone ? ` — ${user.zone}` : ''}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              user.role === 'admin' ? 'bg-red-50 text-red-700' :
              user.role === 'seller' ? 'bg-accent-50 text-accent-700' :
              user.role === 'driver' ? 'bg-green-50 text-green-700' :
              'bg-ketrika-50 text-ketrika-700'
            }`}>
              {user.role === 'admin' ? 'Administrateur' : user.role === 'seller' ? 'Vendeur' : user.role === 'driver' ? 'Livreur' : 'Client'}
            </span>
            {user.is_validated ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Validé</span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Non validé</span>
            )}
            {user.is_suspended && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Suspendu</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: Role + Commission + Contract */}
        <div className="space-y-6">
          {/* Role management */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold text-gray-900 uppercase tracking-wide">Rôle</h3>
            {user.email === 'admin@ketrika.mg' ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <Lock className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Administrateur (verrouillé)</span>
              </div>
            ) : (
              <select
                value={user.role}
                onChange={(e) => changeRole(e.target.value as UserRole)}
                disabled={actionLoading}
                className="input-field"
              >
                <option value="client">Client</option>
                <option value="seller">Vendeur</option>
                <option value="driver">Livreur</option>
                {canAssignAdmin && <option value="admin">Administrateur</option>}
              </select>
            )}
          </div>

          {/* Commission */}
          {(user.role === 'seller' || user.role === 'driver') && (
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-bold text-gray-900 uppercase tracking-wide">
                Commission {user.role === 'seller' ? 'sur ventes' : 'sur livraisons'}
              </h3>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="input-field flex-1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
                <span className="text-sm font-medium text-gray-600">%</span>
                <button onClick={saveCommission} disabled={actionLoading} className="btn-primary whitespace-nowrap">
                  <Save className="h-4 w-4" />
                  Enregistrer
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">Taux par défaut: 3%</p>
            </div>
          )}

          {/* Contract */}
          {(user.role === 'seller' || user.role === 'driver') && (
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-bold text-gray-900 uppercase tracking-wide">Contrat signé</h3>
              {user.contract_url && (
                <a href={user.contract_url} target="_blank" rel="noopener noreferrer" className="mb-3 inline-flex items-center gap-1 text-sm text-ketrika-600 hover:text-ketrika-700">
                  <FileText className="h-4 w-4" />
                  Voir le contrat actuel
                </a>
              )}
              <input className="input-field mb-2" value={contractUrl} onChange={(e) => setContractUrl(e.target.value)} placeholder="https://..." />
              <div className="flex gap-2">
                <button onClick={saveContract} disabled={actionLoading} className="btn-secondary text-xs">
                  <Save className="h-3.5 w-3.5" />
                  Enregistrer
                </button>
                {user.contract_url && !user.is_validated && (
                  <button onClick={validateUser} disabled={actionLoading} className="btn-primary text-xs">
                    Valider l'utilisateur
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Audit log */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique des actions
            </h3>
            <button onClick={handlePrint} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">
              <Printer className="h-3.5 w-3.5" />
              Imprimer / PDF
            </button>
          </div>
          {auditLog.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Aucune action enregistrée.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {auditLog.map((entry) => {
                const adminName = (entry as any).admin?.full_name || '—';
                return (
                <div key={entry.id} className="border-l-2 border-ketrika-200 pl-3 py-1">
                  <p className="text-sm font-medium text-gray-900">{actionLabels[entry.action] || entry.action}</p>
                  {entry.old_value && entry.new_value && (
                    <p className="text-xs text-gray-500">{entry.old_value} → {entry.new_value}</p>
                  )}
                  <p className="text-xs text-gray-500">Par : {adminName}</p>
                  <p className="text-xs text-gray-400">{formatDate(entry.created_at)}</p>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
