import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function ChangePasswordPage() {
  const { profile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Le nouveau mot de passe doit être différent du mot de passe actuel.');
      return;
    }

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile?.email || '',
      password: currentPassword,
    });

    if (signInError) {
      setError('Le mot de passe actuel est incorrect.');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setLoading(false);
  }

  return (
    <DashboardLayout title="Changer le mot de passe">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ketrika-50 text-ketrika-600">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Sécurité du compte</h2>
              <p className="text-sm text-gray-500">Mettez à jour votre mot de passe régulièrement.</p>
            </div>
          </div>
        </div>

        {success && (
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-green-50 p-4">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
            <p className="text-sm font-medium text-green-800">Votre mot de passe a été modifié avec succès.</p>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-5 p-6">
          {/* Current password */}
          <div>
            <label className="label-text">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                className="input-field pr-10"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Entrez votre mot de passe actuel"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="label-text">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                className="input-field pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="label-text">Confirmer le nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className="input-field pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le nouveau mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
