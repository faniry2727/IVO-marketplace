import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeLogo as Logo } from '@/components/ThemeLogo';
import { useTheme } from '@/context/ThemeContext';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export function LoginPage() {
  const { signIn, profile, loading: authLoading } = useAuth();
  const { publishedTheme } = useTheme();
  const marketplaceName = publishedTheme.settings.marketplaceName || 'Ketrika';
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const showRegistered = (location.state as { registered?: boolean })?.registered;

  useEffect(() => {
    if (profile) {
      navigate(`/${profile.role}`, { replace: true });
    }
  }, [profile, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      if (error.includes('Email not confirmed') || error.includes('not confirmed')) {
        setError('Votre email n\'a pas encore été confirmé. Vérifiez votre boîte de réception et cliquez sur le lien de confirmation.');
      } else {
        setError(error);
      }
      setLoading(false);
    } else {
      // Navigation happens via profile check above on next render
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-ketrika-50 via-white to-accent-50">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Link to="/">
              <Logo placement="login" size="lg" />
            </Link>
          </div>

          <div className="card p-8">
            <h1 className="mb-1 text-2xl font-bold text-gray-900">Connexion</h1>
            <p className="mb-6 text-sm text-gray-500">Connectez-vous à votre compte {marketplaceName.toUpperCase()}</p>

            {showRegistered && (
              <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Compte créé ! Un email de confirmation vous a été envoyé. Vérifiez votre boîte de réception et cliquez sur le lien pour valider votre compte.
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="label-text" htmlFor="password">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
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
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div className="mt-5 rounded-lg bg-ketrika-50 border border-ketrika-100 p-4">
              <p className="text-xs font-semibold text-ketrika-700 mb-2">Comptes de démonstration :</p>
              <div className="space-y-1 text-xs text-ketrika-600">
                <p>Client : client@ketrika.mg</p>
                <p>Vendeur : hery.seller@ketrika.mg</p>
                <p>Livreur : faly.driver@ketrika.mg</p>
                <p>Admin : admin@ketrika.mg</p>
                <p className="font-medium text-ketrika-700">Mot de passe : demo1234</p>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link to="/register" className="font-semibold text-ketrika-600 hover:text-ketrika-700">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
