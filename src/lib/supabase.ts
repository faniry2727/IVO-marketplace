const API_URL = 'http://localhost:8000/api';

class QueryBuilder {
  private table: string;
  private action: string = 'select';
  private payload: any = null;

  constructor(table: string) { this.table = table; }
  select(fields = '*') { this.action = 'select'; return this; }
  insert(data: any) { this.action = 'insert'; this.payload = data; return this; }
  update(data: any) { this.action = 'update'; this.payload = data; return this; }
  delete() { this.action = 'delete'; return this; }
  eq(col: string, val: any) { return this; }
  order(col: string, opt?: any) { return this; }
  limit(n: number) { return this; }
  single() { return this.execute(true); }

  async then(resolve: (val: any) => void) {
    const res = await this.execute();
    resolve(res);
  }

  private async execute(single = false) {
    const token = localStorage.getItem('ivo_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let endpoint = `${API_URL}/public/${this.table}`;
    if (this.table === 'orders') endpoint = `${API_URL}/orders`;
    if (this.table === 'deliveries') endpoint = `${API_URL}/deliveries/available`;
    if (this.table === 'profiles') endpoint = `${API_URL}/admin/users`;

    try {
      const response = await fetch(endpoint, {
        method: this.action === 'insert' ? 'POST' : 'GET',
        headers,
        body: this.action === 'insert' ? JSON.stringify(this.payload) : undefined,
      });

      if (!response.ok) return { data: single ? null : [], error: 'Erreur API' };
      const data = await response.json();
      return { data: single && Array.isArray(data) ? data[0] : data, error: null };
    } catch (err: any) {
      return { data: single ? null : [], error: err.message };
    }
  }
}

export const supabase = {
  from(table: string) { return new QueryBuilder(table); },
  auth: {
    // 1. GESTION DE LA CONNEXION
    async signInWithPassword({ email, password }: any) {
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const err = await res.json();
          return { data: { user: null, session: null }, error: new Error(err.detail || 'Identifiants incorrects') };
        }
        const data = await res.json();
        localStorage.setItem('ivo_token', data.access_token);
        return { data: { user: data.user, session: { access_token: data.access_token } }, error: null };
      } catch (e: any) {
        return { data: { user: null, session: null }, error: e };
      }
    },

    // 2. GESTION DE L'INSCRIPTION
    async signUp(data: any) {
      try {
        const payload = {
          email: data.email,
          password: data.password,
          full_name: data.options?.data?.full_name || '',
          role: data.options?.data?.role || 'client',
          phone: data.options?.data?.phone || '',
          city: data.options?.data?.city || '',
        };
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          return { data: { user: null, session: null }, error: new Error(err.detail || 'Erreur inscription') };
        }
        const resData = await res.json();
        localStorage.setItem('ivo_token', resData.access_token);
        return { data: { user: resData.user, session: { access_token: resData.access_token } }, error: null };
      } catch (e: any) {
        return { data: { user: null, session: null }, error: e };
      }
    },

    async getSession() {
      const token = localStorage.getItem('ivo_token');
      return { data: { session: token ? { access_token: token } : null }, error: null };
    },

    async getUser() {
      const token = localStorage.getItem('ivo_token');
      if (!token) return { data: { user: null }, error: null };
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return { data: { user: null }, error: null };
        const user = await res.json();
        return { data: { user }, error: null };
      } catch (err) {
        return { data: { user: null }, error: err };
      }
    },

    async signOut() {
      localStorage.removeItem('ivo_token');
      return { error: null };
    },

    onAuthStateChange(callback: any) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  storage: {
    from() {
      return {
        async upload() { return { data: { path: '' }, error: null }; },
        getPublicUrl(path: string) { return { data: { publicUrl: path } }; }
      };
    }
  }
};
