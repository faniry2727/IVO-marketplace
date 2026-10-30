import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Shop } from '@/types';
import { Store, Save, MapPin } from 'lucide-react';

export function SellerShop() {
  const { profile } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    address: '',
  });

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('shops')
      .select('*')
      .eq('seller_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        setShop(data as Shop | null);
        if (data) {
          setForm({
            name: data.name,
            description: data.description || '',
            city: data.city || '',
            address: data.address || '',
          });
        }
        setLoading(false);
      });
  }, [profile]);

  async function handleCreateOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    if (shop) {
      await supabase.from('shops').update({
        name: form.name,
        description: form.description,
        city: form.city,
        address: form.address,
      }).eq('id', shop.id);
    } else {
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);
      await supabase.from('shops').insert({
        seller_id: profile.id,
        name: form.name,
        slug,
        description: form.description,
        city: form.city,
        address: form.address,
      });
    }

    setSaving(false);
    setEditing(false);
    const { data } = await supabase.from('shops').select('*').eq('seller_id', profile.id).maybeSingle();
    setShop(data as Shop | null);
  }

  if (loading) {
    return (
      <DashboardLayout title="Ma boutique">
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ma boutique">
      {!shop && !editing ? (
        <div className="card p-8 text-center">
          <Store className="mx-auto h-12 w-12 text-gray-300" />
          {profile?.is_validated ? (
            <>
              <p className="mt-3 text-gray-500">Vous n'avez pas encore créé votre boutique.</p>
              <button onClick={() => setEditing(true)} className="btn-primary mt-4">
                Créer ma boutique
              </button>
            </>
          ) : (
            <p className="mt-3 text-gray-500">Votre compte doit être validé par un administrateur avant de pouvoir créer votre boutique.</p>
          )}
        </div>
      ) : editing ? (
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900">
            {shop ? 'Modifier la boutique' : 'Créer votre boutique'}
          </h3>
          <form onSubmit={handleCreateOrUpdate} className="space-y-4">
            <div>
              <label className="label-text">Nom de la boutique</label>
              <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Description</label>
              <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-text">Ville</label>
                <input className="input-field" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className="label-text">Adresse</label>
                <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                <Save className="h-4 w-4" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              {shop && <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Annuler</button>}
            </div>
          </form>
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ketrika-50 text-ketrika-600">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{shop!.name}</h3>
                <p className="text-sm text-gray-500">{shop!.slug}</p>
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="btn-secondary">
              Modifier
            </button>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            {shop!.description && (
              <p className="text-gray-600">{shop!.description}</p>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{shop!.address}, {shop!.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${shop!.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {shop!.is_active ? 'Boutique active' : 'Boutique inactive'}
              </span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
