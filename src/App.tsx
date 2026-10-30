import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ClientDashboard } from '@/pages/client/ClientDashboard';
import { ClientOrders } from '@/pages/client/ClientOrders';
import { ClientOrderDetail } from '@/pages/client/ClientOrderDetail';
import { SellerDashboard } from '@/pages/seller/SellerDashboard';
import { SellerProducts } from '@/pages/seller/SellerProducts';
import { SellerOrders } from '@/pages/seller/SellerOrders';
import { SellerShop } from '@/pages/seller/SellerShop';
import { SellerVideos } from '@/pages/seller/SellerVideos';
import { DriverDashboard } from '@/pages/driver/DriverDashboard';
import { DriverDeliveries } from '@/pages/driver/DriverDeliveries';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminUserDetail } from '@/pages/admin/AdminUserDetail';
import { AdminRegistrations } from '@/pages/admin/AdminRegistrations';
import { AdminShops } from '@/pages/admin/AdminShops';
import { AdminProducts } from '@/pages/admin/AdminProducts';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminDeliveries } from '@/pages/admin/AdminDeliveries';
import { AdminDesign } from '@/pages/admin/AdminDesign';
import { SellerFinance } from '@/pages/seller/SellerFinance';
import { DriverFinance } from '@/pages/driver/DriverFinance';
import { ChangePasswordPage } from '@/pages/settings/ChangePasswordPage';
import { ProfilePage } from '@/pages/settings/ProfilePage';
import { ProductsPage } from '@/pages/ProductsPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { ShopDetailPage } from '@/pages/ShopDetailPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { CartProvider } from '@/context/CartContext';
import { ThemeProvider } from '@/context/ThemeContext';

function RoleRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (profile) return <Navigate to={`/${profile.role}`} replace />;
  return <HomePage />;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/shop/:id" element={<ShopDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<ProtectedRoute roles={['client']}><CheckoutPage /></ProtectedRoute>} />

          {/* Client */}
          <Route path="/client" element={<ProtectedRoute roles={['client']}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/client/orders" element={<ProtectedRoute roles={['client']}><ClientOrders /></ProtectedRoute>} />
          <Route path="/client/orders/:id" element={<ProtectedRoute roles={['client']}><ClientOrderDetail /></ProtectedRoute>} />

          {/* Seller */}
          <Route path="/seller" element={<ProtectedRoute roles={['seller']}><SellerDashboard /></ProtectedRoute>} />
          <Route path="/seller/products" element={<ProtectedRoute roles={['seller']}><SellerProducts /></ProtectedRoute>} />
          <Route path="/seller/orders" element={<ProtectedRoute roles={['seller']}><SellerOrders /></ProtectedRoute>} />
          <Route path="/seller/shop" element={<ProtectedRoute roles={['seller']}><SellerShop /></ProtectedRoute>} />
          <Route path="/seller/videos" element={<ProtectedRoute roles={['seller']}><SellerVideos /></ProtectedRoute>} />
          <Route path="/seller/finance" element={<ProtectedRoute roles={['seller']}><SellerFinance /></ProtectedRoute>} />

          {/* Driver */}
          <Route path="/driver" element={<ProtectedRoute roles={['driver']}><DriverDashboard /></ProtectedRoute>} />
          <Route path="/driver/deliveries" element={<ProtectedRoute roles={['driver']}><DriverDeliveries /></ProtectedRoute>} />
          <Route path="/driver/finance" element={<ProtectedRoute roles={['driver']}><DriverFinance /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute roles={['admin']}><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/deliveries" element={<ProtectedRoute roles={['admin']}><AdminDeliveries /></ProtectedRoute>} />
          <Route path="/admin/design" element={<ProtectedRoute roles={['admin']}><AdminDesign /></ProtectedRoute>} />
          <Route path="/admin/registrations" element={<ProtectedRoute roles={['admin']}><AdminRegistrations /></ProtectedRoute>} />
          <Route path="/admin/shops" element={<ProtectedRoute roles={['admin']}><AdminShops /></ProtectedRoute>} />
          <Route path="/admin/users/:id" element={<ProtectedRoute roles={['admin']}><AdminUserDetail /></ProtectedRoute>} />

          {/* Settings (all authenticated roles) */}
          <Route path="/settings/password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
          <Route path="/settings/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
