import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { buildFacebookShareUrl } from '@/lib/video';
import type { SellerVideo, Product, Profile, Shop } from '@/types';
import { Eye, Heart, Share2, MessageSquare, Store, Play } from 'lucide-react';

interface VideoCardProps {
  video: SellerVideo;
  seller: Profile | null;
  shop: Shop | null;
  product: Product | null;
}

function getSessionKey(): string {
  const key = sessionStorage.getItem('video_session_key');
  if (key) return key;
  const newKey = crypto.randomUUID();
  sessionStorage.setItem('video_session_key', newKey);
  return newKey;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/embed\/)([\w-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export function VideoCard({ video, seller, shop, product }: VideoCardProps) {
  const { profile } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes_count);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const checkLiked = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('video_likes')
      .select('id')
      .eq('video_id', video.id)
      .eq('user_id', profile.id)
      .maybeSingle();
    setLiked(!!data);
  }, [profile, video.id]);

  const recordView = useCallback(async () => {
    if (viewRecorded) return;
    const sessionKey = profile?.id || getSessionKey();
    const { error } = await supabase
      .from('video_views')
      .insert({
        video_id: video.id,
        user_id: profile?.id || null,
        session_key: sessionKey,
      });
    if (!error) {
      await supabase.rpc('increment_video_views', { video_id: video.id });
      setViewRecorded(true);
    } else if (error.code === '23505') {
      setViewRecorded(true);
    }
  }, [profile, video.id, viewRecorded]);

  useEffect(() => {
    checkLiked();
  }, [checkLiked]);

  async function toggleLike() {
    if (!profile) {
      window.location.href = '/login';
      return;
    }
    if (liked) {
      await supabase.from('video_likes').delete().eq('video_id', video.id).eq('user_id', profile.id);
      await supabase.rpc('decrement_video_likes', { video_id: video.id });
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('video_likes').insert({ video_id: video.id, user_id: profile.id });
      await supabase.rpc('increment_video_likes', { video_id: video.id });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  }

  function handleShare() {
    const shareUrl = buildFacebookShareUrl(window.location.origin + '/shop/' + (shop?.id || ''));
    window.open(shareUrl, '_blank', 'width=600,height=400');
    supabase.from('video_shares').insert({
      video_id: video.id,
      user_id: profile?.id || null,
      platform: 'facebook',
    });
    supabase.rpc('increment_video_shares', { video_id: video.id });
  }

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !seller || !contactMessage.trim()) return;
    const context = product
      ? `Message concernant la vidéo "${video.title}" (produit: ${product.name})`
      : `Message concernant la vidéo "${video.title}"`;

    await supabase.from('video_contact_messages').insert({
      video_id: video.id,
      from_user_id: profile.id,
      to_user_id: seller.id,
      message: `${context}\n\n${contactMessage}`,
    });
    await supabase.rpc('increment_video_messages', { video_id: video.id });
    setContactSent(true);
    setContactMessage('');
    setTimeout(() => { setShowContactForm(false); setContactSent(false); }, 2000);
  }

  const youtubeId = extractYouTubeId(video.video_url);
  const vimeoId = extractVimeoId(video.video_url);

  return (
    <div className="card overflow-hidden">
      {/* Video player */}
      <div className="relative aspect-video bg-black" onMouseEnter={recordView}>
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={video.title}
            className="h-full w-full"
            allowFullScreen
            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : vimeoId ? (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            title={video.title}
            className="h-full w-full"
            allowFullScreen
          />
        ) : (
          <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="flex h-full w-full flex-col items-center justify-center gap-2 text-white" onClick={recordView}>
            <Play className="h-12 w-12" />
            <span className="text-sm">Ouvrir la vidéo</span>
          </a>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{video.title}</h3>
        {video.description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{video.description}</p>}

        {/* Shop / seller */}
        {shop && (
          <Link to={`/shop/${shop.id}`} className="mt-2 flex items-center gap-1.5 text-sm text-ketrika-600 hover:text-ketrika-700">
            <Store className="h-3.5 w-3.5" />
            {shop.name}
          </Link>
        )}

        {/* Product */}
        {product && (
          <Link to={`/products/${product.id}`} className="mt-1 block text-xs text-gray-400 hover:text-gray-600">
            Produit: {product.name}
          </Link>
        )}

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {video.views_count}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {likeCount}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" />
            {video.shares_count}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={toggleLike}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              liked ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
            {liked ? 'Aimé' : 'J\'aime'}
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1877F2] px-3 py-2 text-sm font-medium text-white hover:brightness-90"
          >
            <Share2 className="h-4 w-4" />
            Partager
          </button>
          {seller && (
            <button
              onClick={() => setShowContactForm(!showContactForm)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <MessageSquare className="h-4 w-4" />
              Contacter
            </button>
          )}
        </div>

        {/* Contact form */}
        {showContactForm && seller && (
          <form onSubmit={handleContact} className="mt-3 rounded-lg border border-gray-200 p-3">
            {contactSent ? (
              <p className="text-sm text-green-600">Message envoyé au vendeur !</p>
            ) : (
              <>
                <textarea
                  className="input-field text-sm"
                  rows={2}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder={`Message pour ${seller.full_name}...`}
                />
                <button type="submit" className="btn-primary mt-2 w-full text-sm">
                  Envoyer le message
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
