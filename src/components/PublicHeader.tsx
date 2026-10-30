import { Link } from 'react-router-dom';
import { ThemeLogo as Logo } from '@/components/ThemeLogo';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { ShoppingCart } from 'lucide-react';

export function PublicHeader() {
  const { profile } = useAuth();
  const { totalItems } = useCart();
  const { publishedTheme } = useTheme();
  const headerConfig = publishedTheme.header;
  const headerLogoKey = headerConfig.logoKey || 'main';

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{
        backgroundColor: (headerConfig.bgColor || '#ffffff') + 'e6',
        borderColor: 'var(--theme-border, #f3f4f6)',
        color: headerConfig.textColor || '#111827',
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/"><Logo placement={headerLogoKey} size="sm" /></Link>
        <div className="flex items-center gap-3">
          {/* Cart icon */}
          {profile && profile.role === 'client' && (
            <Link to="/cart" className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-black/5" style={{ color: headerConfig.textColor || '#4b5563' }}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ketrika-600 px-1 text-xs font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
          )}
          {profile ? (
            <Link to={`/${profile.role}`} className="btn-primary">Mon espace</Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block text-sm font-medium hover:opacity-70" style={{ color: headerConfig.textColor || '#374151' }}>Connexion</Link>
              <Link to="/register" className="btn-primary">S'inscrire</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
