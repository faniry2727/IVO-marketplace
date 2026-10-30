import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { formatAriary } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { Product, Category, ProductImage } from '@/types';
import { Package, Plus, Edit2, Power, Image as ImageIcon, Trash2, X } from 'lucide-react';

export function SellerProducts() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [managingPhotos, setManagingPhotos] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price_ariary: '',
    stock: '',
    city: '',
    category_id: '',
    image_url: '',
  });

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      supabase.from('products').select('*').eq('seller_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ]).then(([prodRes, catRes]) => {
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setLoading(false);
    });
  }, [profile]);

  async function fetchShop() {
    if (!profile) return null;
    const { data } = await supabase
      .from('shops')
      .select('id')
      .eq('seller_id', profile.id)
      .maybeSingle();
    return data;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const shop = await fetchShop();
    if (!shop) return;

    const payload = {
      name: form.name,
      description: form.description,
      price_ariary: parseInt(form.price_ariary) || 0,
      stock: parseInt(form.stock) || 0,
      city: form.city,
      category_id: form.category_id || null,
      image_url: form.image_url || null,
      seller_id: profile.id,
      shop_id: shop.id,
    };

    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('products').insert(payload);
    }

    setShowForm(false);
    setEditing(null);
    setForm({ name: '', description: '', price_ariary: '', stock: '', city: '', category_id: '', image_url: '' });
    const { data } = await supabase.from('products').select('*').eq('seller_id', profile.id).order('created_at', { ascending: false });
    setProducts(data || []);
  }

  function startEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price_ariary: String(product.price_ariary),
      stock: String(product.stock),
      city: product.city || '',
      category_id: product.category_id || '',
      image_url: product.image_url || '',
    });
    setShowForm(true);
  }

  async function toggleActive(product: Product) {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    setProducts(products.map((p) => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
  }

  async function openPhotoManager(product: Product) {
    setManagingPhotos(product);
    setMainImageUrl(product.image_url || '');
    setNewImageUrl('');
    const { data } = await supabase.from('product_images').select('*').eq('product_id', product.id).order('sort_order');
    setProductImages(data || []);
  }

  async function addImage() {
    if (!managingPhotos || !newImageUrl) return;
    setImageLoading(true);
    const maxSort = productImages.reduce((max, i) => Math.max(max, i.sort_order), 0);
    await supabase.from('product_images').insert({
      product_id: managingPhotos.id,
      image_url: newImageUrl,
      sort_order: maxSort + 1,
    });
    setNewImageUrl('');
    const { data } = await supabase.from('product_images').select('*').eq('product_id', managingPhotos.id).order('sort_order');
    setProductImages(data || []);
    setImageLoading(false);
  }

  async function deleteImage(img: ProductImage) {
    setImageLoading(true);
    await supabase.from('product_images').delete().eq('id', img.id);
    const { data } = await supabase.from('product_images').select('*').eq('product_id', managingPhotos!.id).order('sort_order');
    setProductImages(data || []);
    setImageLoading(false);
  }

  async function saveMainImage() {
    if (!managingPhotos) return;
    setImageLoading(true);
    await supabase.from('products').update({ image_url: mainImageUrl || null }).eq('id', managingPhotos.id);
    setProducts(products.map((p) => p.id === managingPhotos.id ? { ...p, image_url: mainImageUrl || null } : p));
    setImageLoading(false);
    setManagingPhotos(null);
  }

  return (
    <DashboardLayout title="Mes produits">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">Gérez votre catalogue de produits.</p>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', description: '', price_ariary: '', stock: '', city: '', category_id: '', image_url: '' }); }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'Annuler' : 'Ajouter un produit'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900">
            {editing ? 'Modifier le produit' : 'Nouveau produit'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-text">Nom</label>
                <input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label-text">Catégorie</label>
                <select className="input-field" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label-text">Description</label>
              <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label-text">Prix (Ar)</label>
                <input className="input-field" type="number" required value={form.price_ariary} onChange={(e) => setForm({ ...form, price_ariary: e.target.value })} />
              </div>
              <div>
                <label className="label-text">Stock</label>
                <input className="input-field" type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div>
                <label className="label-text">Ville</label>
                <input className="input-field" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label-text">Image principale (URL)</label>
              <input className="input-field" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              {form.image_url && (
                <img src={form.image_url} alt="Aperçu" className="mt-2 h-24 w-24 rounded-lg object-cover border border-gray-200" />
              )}
            </div>
            <button type="submit" className="btn-primary">
              {editing ? 'Enregistrer' : 'Créer le produit'}
            </button>
          </form>
        </div>
      )}

      {/* Photo manager modal */}
      {managingPhotos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setManagingPhotos(null)}>
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Gérer les photos — {managingPhotos.name}</h3>
              <button onClick={() => setManagingPhotos(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main image */}
            <div className="mb-4">
              <label className="label-text">Image principale (affichée en premier)</label>
              <input className="input-field mb-2" value={mainImageUrl} onChange={(e) => setMainImageUrl(e.target.value)} placeholder="https://..." />
              {mainImageUrl && (
                <img src={mainImageUrl} alt="Image principale" className="h-32 w-full rounded-lg object-cover border border-gray-200" />
              )}
            </div>

            {/* Additional photos */}
            <div className="mb-4">
              <label className="label-text">Photos supplémentaires</label>
              {productImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {productImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={img.image_url} alt="" className="h-24 w-full rounded-lg object-cover border border-gray-200" />
                      <button
                        onClick={() => deleteImage(img)}
                        disabled={imageLoading}
                        className="absolute right-1 top-1 rounded-lg bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-3">Aucune photo supplémentaire.</p>
              )}

              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
                />
                <button onClick={addImage} disabled={imageLoading || !newImageUrl} className="btn-secondary whitespace-nowrap">
                  <Plus className="h-4 w-4" />
                  Ajouter
                </button>
              </div>
            </div>

            <button onClick={saveMainImage} disabled={imageLoading} className="btn-primary w-full">
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      ) : products.length === 0 ? (
        <div className="card p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">Aucun produit. Ajoutez votre premier produit !</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className={`card p-5 ${!product.is_active ? 'opacity-60' : ''}`}>
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="mb-3 h-32 w-full rounded-lg object-cover" />
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{product.name}</h4>
                  <p className="mt-1 text-lg font-bold text-ketrika-700">{formatAriary(product.price_ariary)}</p>
                  <p className="mt-1 text-sm text-gray-500">Stock: {product.stock}</p>
                  <p className="text-sm text-gray-500">{product.city}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => startEdit(product)} className="btn-secondary flex-1 text-xs">
                  <Edit2 className="h-3.5 w-3.5" />
                  Modifier
                </button>
                <button onClick={() => openPhotoManager(product)} className="btn-secondary flex-1 text-xs">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Photos
                </button>
                <button onClick={() => toggleActive(product)} className="btn-secondary text-xs">
                  <Power className="h-3.5 w-3.5" />
                  {product.is_active ? 'Off' : 'On'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
