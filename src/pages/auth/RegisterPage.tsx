import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeLogo as Logo } from '@/components/ThemeLogo';
import { useTheme } from '@/context/ThemeContext';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import type { UserRole } from '@/types';

export function RegisterPage() {
  const { signUp } = useAuth();
  const { publishedTheme } = useTheme();
  const marketplaceName = publishedTheme.settings.marketplaceName || 'Ketrika';
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone.trim()) {
      setError('Le numéro de téléphone est obligatoire.');
      return;
    }
    if (!city.trim()) {
      setError('La ville d\'habitation est obligatoire.');
      return;
    }

    setLoading(true);

    const { error } = await signUp({
      email,
      password,
      full_name: fullName,
      phone,
      city,
      role,
      zone: role === 'driver' ? zone : undefined,
    });

    if (error) {
      setError(error);
      setLoading(false);
    } else {
      setRegistered(true);
      setLoading(false);
    }
  };

  const roleOptions: { value: UserRole; label: string; desc: string }[] = [
    { value: 'client', label: 'Client', desc: 'Acheter des produits' },
    { value: 'seller', label: 'Vendeur', desc: 'Vendre mes produits' },
    { value: 'driver', label: 'Livreur', desc: 'Faire des livraisons' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-ketrika-50 via-white to-accent-50">
      <div className="flex flex-1 items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg">
          <div className="mb-6 flex justify-center">
            <Link to="/">
              <Logo placement="login" size="lg" />
            </Link>
          </div>

          <div className="card p-8">
            <h1 className="mb-1 text-2xl font-bold text-gray-900">Créer un compte</h1>
            <p className="mb-6 text-sm text-gray-500">Rejoignez la marketplace {marketplaceName.toUpperCase()}</p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {registered && (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Compte créé ! Un email de confirmation vous a été envoyé. Vérifiez votre boîte de réception et cliquez sur le lien pour valider votre compte, puis connectez-vous.
              </div>
            )}

            {registered ? (
              <div className="text-center">
                <Link to="/login" className="btn-primary w-full inline-block">
                  Aller à la connexion
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text">Je suis...</label>
                <div className="grid grid-cols-3 gap-3">
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`rounded-lg border-2 px-3 py-3 text-center transition-all ${
                        role === opt.value
                          ? 'border-ketrika-500 bg-ketrika-50 text-ketrika-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-text" htmlFor="fullName">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-text" htmlFor="email">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="vous@exemple.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-text" htmlFor="phone">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field pl-10"
                      placeholder="034 00 000 00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-text" htmlFor="city">Ville</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Antananarivo"
                    />
                  </div>
                </div>

                {role === 'driver' && (
                  <div>
                    <label className="label-text" htmlFor="zone">Zone</label>
                    <input
                      id="zone"
                      type="text"
                      required
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="input-field"
                      placeholder="Analakely"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="label-text" htmlFor="password">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            </form>
            )}

            <p className="mt-6 text-center text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-semibold text-ketrika-600 hover:text-ketrika-700">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
