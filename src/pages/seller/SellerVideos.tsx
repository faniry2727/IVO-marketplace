import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { isValidVideoUrl } from '@/lib/video';
import type { SellerVideo, Product } from '@/types';
import { Video, Plus, Edit2, Trash2, Eye, Heart, Share2, MessageSquare, Power, X, BarChart3 } from 'lucide-react';

export function SellerVideos() {
  const { profile } = useAuth();
  const [videos, setVideos] = useState<SellerVideo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SellerVideo | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    video_url: '',
    product_id: '',
  });

  const fetchVideos = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('seller_videos')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    setVideos(data || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    fetchVideos();
    supabase
      .from('products')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setProducts(data || []));
  }, [profile, fetchVideos]);

  function resetForm() {
    setForm({ title: '', description: '', video_url: '', product_id: '' });
    setEditing(null);
    setError(null);
  }

  function startEdit(video: SellerVideo) {
    setEditing(video);
    setForm({
      title: video.title,
      description: video.description || '',
      video_url: video.video_url,
      product_id: video.product_id || '',
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);

    if (!isValidVideoUrl(form.video_url)) {
      setError('L\'URL de la vidéo n\'est pas valide. Elle doit commencer par http:// ou https://');
      return;
    }

    setSaving(true);
    const payload = {
      seller_id: profile.id,
      title: form.title,
      description: form.description || null,
      video_url: form.video_url,
      product_id: form.product_id || null,
    };

    if (editing) {
      await supabase.from('seller_videos').update({
        title: payload.title,
        description: payload.description,
        video_url: payload.video_url,
        product_id: payload.product_id,
        updated_at: new Date().toISOString(),
      }).eq('id', editing.id);
    } else {
      await supabase.from('seller_videos').insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    resetForm();
    fetchVideos();
  }

  async function toggleActive(video: SellerVideo) {
    await supabase.from('seller_videos').update({ is_active: !video.is_active }).eq('id', video.id);
    fetchVideos();
  }

  async function deleteVideo(video: SellerVideo) {
    if (!confirm('Supprimer cette vidéo ?')) return;
    await supabase.from('seller_videos').delete().eq('id', video.id);
    fetchVideos();
  }

  const productName = (productId: string | null) => {
    if (!productId) return null;
    const p = products.find((p) => p.id === productId);
    return p?.name || null;
  };

  function renderStats(video: SellerVideo) {
    const totalInteractions = video.likes_count + video.shares_count + video.messages_count;
    const engagementRate = video.views_count > 0
      ? ((totalInteractions / video.views_count) * 100).toFixed(1)
      : '0.0';

    return (
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg bg-gray-50 p-2 text-center">
          <Eye className="mx-auto h-4 w-4 text-gray-400" />
          <p className="mt-1 text-sm font-bold text-gray-900">{video.views_count}</p>
          <p className="text-xs text-gray-400">Vues</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center">
          <Heart className="mx-auto h-4 w-4 text-gray-400" />
          <p className="mt-1 text-sm font-bold text-gray-900">{video.likes_count}</p>
          <p className="text-xs text-gray-400">J'aime</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center">
          <Share2 className="mx-auto h-4 w-4 text-gray-400" />
          <p className="mt-1 text-sm font-bold text-gray-900">{video.shares_count}</p>
          <p className="text-xs text-gray-400">Partages</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center">
          <MessageSquare className="mx-auto h-4 w-4 text-gray-400" />
          <p className="mt-1 text-sm font-bold text-gray-900">{video.messages_count}</p>
          <p className="text-xs text-gray-400">Messages</p>
        </div>
        <div className="col-span-2 sm:col-span-4 rounded-lg bg-ketrika-50 p-2 text-center">
          <BarChart3 className="mx-auto h-4 w-4 text-ketrika-400" />
          <p className="mt-1 text-sm font-bold text-ketrika-700">{engagementRate}%</p>
          <p className="text-xs text-ketrika-400">Taux d'interaction</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Vidéos promotionnelles">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">Publiez vos vidéos promotionnelles via URL.</p>
        <button
          onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'Annuler' : 'Ajouter une vidéo'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">
              {editing ? 'Modifier la vidéo' : 'Nouvelle vidéo'}
            </h3>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-text">Titre</label>
              <input className="input-field" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Présentation de mon produit" />
            </div>
            <div>
              <label className="label-text">Description (optionnel)</label>
              <textarea className="input-field" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label-text">URL de la vidéo</label>
              <input className="input-field" required value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
              <p className="mt-1 text-xs text-gray-400">Collez le lien de votre vidéo (YouTube, Vimeo, etc.). La vidéo n'est pas stockée sur la plateforme.</p>
            </div>
            <div>
              <label className="label-text">Produit associé (optionnel)</label>
              <select className="input-field" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                <option value="">Aucun produit associé</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Publier la vidéo'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-gray-500">Chargement...</div>
      ) : videos.length === 0 ? (
        <div className="card p-8 text-center">
          <Video className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">Aucune vidéo. Ajoutez votre première vidéo promotionnelle !</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <div key={video.id} className={`card p-5 ${!video.is_active ? 'opacity-60' : ''}`}>
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{video.title}</h4>
                  {video.product_id && (
                    <p className="text-xs text-ketrika-600">Produit: {productName(video.product_id)}</p>
                  )}
                </div>
                <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${video.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {video.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {video.description && <p className="text-sm text-gray-500 line-clamp-2">{video.description}</p>}
              <p className="mt-2 truncate text-xs text-gray-400">{video.video_url}</p>
              {renderStats(video)}
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => startEdit(video)} className="btn-secondary flex-1 text-xs">
                  <Edit2 className="h-3.5 w-3.5" />
                  Modifier
                </button>
                <button onClick={() => toggleActive(video)} className="btn-secondary text-xs">
                  <Power className="h-3.5 w-3.5" />
                  {video.is_active ? 'Off' : 'On'}
                </button>
                <button onClick={() => deleteVideo(video)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
