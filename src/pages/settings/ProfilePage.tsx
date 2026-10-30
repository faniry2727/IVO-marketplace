import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, MapPin, CheckCircle, AlertCircle, Save } from 'lucide-react';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setCity(profile.city || '');
      setZone(profile.zone || '');
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!profile) return;

    if (!fullName.trim() || !phone.trim() || !city.trim()) {
      setError('Le nom, le téléphone et la ville sont obligatoires.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        zone: profile.role === 'driver' ? zone.trim() : profile.zone,
      })
      .eq('id', profile.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await refreshProfile();
    setSuccess(true);
    setLoading(false);
  }

  if (!profile) return null;

  return (
    <DashboardLayout title="Mon profil">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ketrika-50 text-ketrika-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Informations personnelles</h2>
              <p className="text-sm text-gray-500">Consultez et modifiez vos informations.</p>
            </div>
          </div>
        </div>

        {success && (
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-green-50 p-4">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
            <p className="text-sm font-medium text-green-800">Vos informations ont été enregistrées avec succès.</p>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-5 p-6">
          <div>
            <label className="label-text" htmlFor="fullName">Nom complet</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="fullName"
                type="text"
                className="input-field pl-10"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label-text">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                className="input-field pl-10 bg-gray-50 text-gray-500"
                value={profile.email}
                disabled
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">L'email ne peut pas être modifié.</p>
          </div>

          <div>
            <label className="label-text" htmlFor="phone">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="phone"
                type="tel"
                className="input-field pl-10"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="034 00 000 00"
                required
              />
            </div>
          </div>

          <div>
            <label className="label-text" htmlFor="city">Ville</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="city"
                type="text"
                className="input-field pl-10"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Antananarivo"
                required
              />
            </div>
          </div>

          {profile.role === 'driver' && (
            <div>
              <label className="label-text" htmlFor="zone">Zone</label>
              <input
                id="zone"
                type="text"
                className="input-field"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Analakely"
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Enregistrement...' : (
              <span className="inline-flex items-center gap-2">
                <Save className="h-4 w-4" />
                Enregistrer les modifications
              </span>
            )}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
