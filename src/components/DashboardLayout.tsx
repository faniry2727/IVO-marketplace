import { type ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeLogo as Logo } from '@/components/ThemeLogo';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole } from '@/types';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Store,
  LogOut,
  Menu,
  X,
  Settings,
  Wallet,
  Image,
  ClipboardCheck,
  User,
  Lock,
  Video,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case 'client':
      return [
        { label: 'Tableau de bord', path: '/client', icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Mes commandes', path: '/client/orders', icon: <ShoppingCart className="h-5 w-5" /> },
        { label: 'Catalogue', path: '/products', icon: <Package className="h-5 w-5" /> },
        { label: 'Mon panier', path: '/cart', icon: <ShoppingCart className="h-5 w-5" /> },
      ];
    case 'seller':
      return [
        { label: 'Tableau de bord', path: '/seller', icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Mes produits', path: '/seller/products', icon: <Package className="h-5 w-5" /> },
        { label: 'Commandes', path: '/seller/orders', icon: <ShoppingCart className="h-5 w-5" /> },
        { label: 'Ma boutique', path: '/seller/shop', icon: <Store className="h-5 w-5" /> },
        { label: 'Vidéos', path: '/seller/videos', icon: <Video className="h-5 w-5" /> },
        { label: 'Finance', path: '/seller/finance', icon: <Wallet className="h-5 w-5" /> },
      ];
    case 'driver':
      return [
        { label: 'Tableau de bord', path: '/driver', icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Missions', path: '/driver/deliveries', icon: <Truck className="h-5 w-5" /> },
        { label: 'Finance', path: '/driver/finance', icon: <Wallet className="h-5 w-5" /> },
      ];
    case 'admin':
      return [
        { label: 'Tableau de bord', path: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Utilisateurs', path: '/admin/users', icon: <Users className="h-5 w-5" /> },
        { label: 'Inscriptions', path: '/admin/registrations', icon: <ClipboardCheck className="h-5 w-5" /> },
        { label: 'Boutiques', path: '/admin/shops', icon: <Store className="h-5 w-5" /> },
        { label: 'Produits', path: '/admin/products', icon: <Package className="h-5 w-5" /> },
        { label: 'Commandes', path: '/admin/orders', icon: <ShoppingCart className="h-5 w-5" /> },
        { label: 'Livraisons', path: '/admin/deliveries', icon: <Truck className="h-5 w-5" /> },
        { label: 'Design', path: '/admin/design', icon: <Image className="h-5 w-5" /> },
      ];
  }
}

export function DashboardLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!profile) return null;

  const navItems = getNavItems(profile.role);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <Link to="/">
            <Logo placement="backoffice" size="sm" />
          </Link>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Compte</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 truncate">{profile.full_name}</p>
          <span className="mt-1 inline-flex items-center rounded-full bg-ketrika-50 px-2 py-0.5 text-xs font-medium text-ketrika-700">
            {ROLE_LABELS[profile.role]}
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-ketrika-50 text-ketrika-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}

          {/* Settings section with sub-items */}
          <div className="pt-3">
            <p className="px-3 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Paramètres</p>
            <Link
              to="/settings/profile"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === '/settings/profile'
                  ? 'bg-ketrika-50 text-ketrika-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <User className="h-5 w-5" />
              Profil
            </Link>
            <Link
              to="/settings/password"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === '/settings/password'
                  ? 'bg-ketrika-50 text-ketrika-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Lock className="h-5 w-5" />
              Sécurité du compte
            </Link>
          </div>
        </nav>

        <div className="border-t border-gray-200 p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <button
            className="text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <Logo placement="mobile" size="sm" />
          <div className="w-6" />
        </div>

        {/* Desktop header */}
        {title && (
          <div className="hidden lg:block border-b border-gray-200 bg-white px-8 py-4">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
        )}

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
