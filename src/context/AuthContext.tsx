import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'client' | 'seller' | 'driver' | 'admin';
  phone?: string;
  city?: string;
  is_available?: boolean;
}

export interface Session {
  access_token: string;
  user: Profile | null;
}

interface AuthContextType {
  user: Profile | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string | null }>;
  signUp: (data: any) => Promise<{ error?: string | null }>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('ivo_token');
  // Création de l'objet session officiel attendu par ProtectedRoute
  const session: Session | null = token ? { access_token: token, user: profile } : null;

  const fetchMe = async () => {
    const currentToken = localStorage.getItem('ivo_token');
    if (!currentToken) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get('/auth/me');
      setProfile(data);
    } catch {
      localStorage.removeItem('ivo_token');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('ivo_token', res.access_token);
      setProfile(res.user);
      return { error: null };
    } catch (err: any) {
      return { error: err.detail || 'Identifiants incorrects' };
    }
  };

  const signUp = async (data: any) => {
    try {
      const res = await api.post('/auth/register', data);
      localStorage.setItem('ivo_token', res.access_token);
      setProfile(res.user);
      return { error: null };
    } catch (err: any) {
      return { error: err.detail || 'Erreur lors de l\'inscription' };
    }
  };

  const signOut = () => {
    localStorage.removeItem('ivo_token');
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: profile,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile: fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
