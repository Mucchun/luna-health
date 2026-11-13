import { useEffect, useState, useCallback } from 'react';
import { Plus, X, ArrowLeft, Heart, MessageCircle, Send, Trash2, Globe, Wifi, Flag, Ban } from 'lucide-react';
import { capi, isSharedCommunity } from '../lib/community';
import { LegalModal, GUIDELINES_ACCEPTED_KEY } from '../lib/legal';
import { screenText } from '../lib/moderation';
import { notifyWarning } from '../lib/haptics';
import { useI18n } from '../i18n';
import { trTerm } from '../i18n/medical';

const identKey = (name: string, color: string) => `${name}||${color}`;

interface Post {
  id: number;
  category: string;
  anon_name: string;
  anon_color: string;
  title: string;
  content: string;
  likes: number;
  comment_count: number;
  created_at: string;
}
interface Comment {
  id: number;
  post_id: number;
  anon_name: string;
  anon_color: string;
  content: string;
  created_at: string;
}
interface PostDetail extends Post { comments: Comment[] }
interface Identity { name: string; color: string }

const TOPICS = [
  'Period & Cycle',
  'PCOS',
  'Endometriosis',
  'PMDD',
  'Treatments & Meds',
  'Mental Health',
  'Diagnosis Journey',
  'Relationships',
  'Ask the Community',
];

const TOPIC_STYLE: Record<string, [string, string]> = {
  'Period & Cycle':    ['#C83F6E', '#FCE7EF'],
  'PCOS':             ['#7B52B8', '#F0EBFF'],
  'Endometriosis':    ['#0F766E', '#CCFBF1'],
  'PMDD':             ['#A85A20', '#FEEBD8'],
  'Treatments & Meds':['#2563EB', '#DBEAFE'],
  'Mental Health':    ['#2D7A56', '#D1F5E4'],
  'Diagnosis Journey':['#D97706', '#FEF3C7'],
  'Relationships':    ['#BE185D', '#FCE7EF'],
  'Ask the Community':['#6B3A4A', '#FDE8F0'],
};

const ADJ = ['Brave','Gentle','Wild','Calm','Bold','Warm','Free','Soft','Swift','Fierce','Kind','Wise','Quiet','Bright','Tender','Radiant','Serene','Strong','Mystic','Vivid'];
const NOUN = ['Rose','Lily','Iris','Sage','Fern','Dawn','Star','Moon','Jade','Pearl','Opal','Nova','Wren','Robin','Willow','River','Birch','Meadow','Clover','Cedar'];
const PALETTE = ['#C83F6E','#7B52B8','#2D7A56','#A85A20','#2563EB','#0891B2','#7C3AED','#0F766E','#BE185D','#D97706'];

function makeIdentity(): Identity {
  const name = ADJ[Math.floor(Math.random() * ADJ.length)] + ' ' + NOUN[Math.floor(Math.random() * NOUN.length)];
  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  return { name, color };
}

function Avatar({ name, color, size = 30 }: { name: string; color: string; size?: number }) {
  const i = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.34, fontWeight: 700 }}>
      {i}
    </div>
  );
}

function TopicBadge({ topic }: { topic: string }) {
  const { lang } = useI18n();
  const [color, bg] = TOPIC_STYLE[topic] || ['#6B3A4A', '#FDE8F0'];
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: bg, color, letterSpacing: '0.2px', flexShrink: 0 }}>{trTerm(topic, lang)}</span>;
}

function ago(ts: string) {
  const s = (Date.now() - new Date(ts.replace(' ', 'T') + 'Z').getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const inp: React.CSSProperties = { width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--text)', background: '#fff', fontFamily: 'inherit', outline: 'none' };

export default function Community() {
  const { tr, lang } = useI18n();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [topic, setTopic] = useState('All');
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ category: '', title: '', content: '' });
  const [newPosting, setNewPosting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [deletingComment, setDeletingComment] = useState<number | null>(null);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [hiddenPosts, setHiddenPosts] = useState<Set<number>>(new Set());
  const [hiddenComments, setHiddenComments] = useState<Set<number>>(new Set());
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [agreed, setAgreed] = useState<boolean>(() => !!localStorage.getItem(GUIDELINES_ACCEPTED_KEY));
  const [toast, setToast] = useState('');

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };
  const isBlocked = (name: string, color: string) => blocked.has(identKey(name, color));

  const reportContent = async (kind: 'posts' | 'comments', id: number) => {
    if (!window.confirm('Report this content as inappropriate? It will be hidden from you and sent to our moderators for review.')) return;
    const setter = kind === 'posts' ? setHiddenPosts : setHiddenComments;
    const lsKey = kind === 'posts' ? 'luna_hidden_posts' : 'luna_hidden_comments';
    setter(prev => { const n = new Set(prev).add(id); localStorage.setItem(lsKey, JSON.stringify([...n])); return n; });
    capi(`/api/community/${kind}/${id}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'user report', reporter: identity?.name }) }).catch(() => {});
    if (kind === 'posts') setDetail(null);
    flash('Thanks — reported and hidden. Our team reviews reports within 24 hours.');
  };

  const blockUser = (name: string, color: string) => {
    if (!window.confirm(`Block ${name}? You will no longer see any of their posts or replies.`)) return;
    setBlocked(prev => { const n = new Set(prev).add(identKey(name, color)); localStorage.setItem('luna_blocked', JSON.stringify([...n])); return n; });
    setDetail(null);
    flash(`${name} blocked. You won't see their content anymore.`);
  };

  // Restore or generate anon identity
  useEffect(() => {
    const saved = localStorage.getItem('luna_community_id');
    if (saved) { setIdentity(JSON.parse(saved)); }
    else { const id = makeIdentity(); localStorage.setItem('luna_community_id', JSON.stringify(id)); setIdentity(id); }
    const likedSaved = localStorage.getItem('luna_liked_posts');
    if (likedSaved) setLiked(new Set(JSON.parse(likedSaved)));
    const b = localStorage.getItem('luna_blocked'); if (b) setBlocked(new Set(JSON.parse(b)));
    const hp = localStorage.getItem('luna_hidden_posts'); if (hp) setHiddenPosts(new Set(JSON.parse(hp)));
    const hc = localStorage.getItem('luna_hidden_comments'); if (hc) setHiddenComments(new Set(JSON.parse(hc)));
  }, []);

  const fetchPosts = useCallback(async (t = topic) => {
    const url = t === 'All' ? '/api/community/posts' : `/api/community/posts?category=${encodeURIComponent(t)}`;
    setPosts(await capi(url).then(r => r.json()));
  }, [topic]);

  useEffect(() => { fetchPosts(); }, [topic, fetchPosts]);

  // Live refresh so posts/replies from other users appear without a manual reload.
  useEffect(() => {
    const iv = setInterval(() => {
      if (detail) {
        capi(`/api/community/posts/${detail.id}`).then(r => r.json()).then(d => { if (d?.id) setDetail(d); }).catch(() => {});
      } else {
        fetchPosts().catch(() => {});
      }
    }, 15000);
    return () => clearInterval(iv);
  }, [detail, fetchPosts]);

  const openPost = async (id: number) => {
    setDetail(await capi(`/api/community/posts/${id}`).then(r => r.json()));
  };

  const createPost = async () => {
    if (!newForm.category || !newForm.title.trim() || !newForm.content.trim() || !identity || !agreed) return;
    const bad = screenText(newForm.title) || screenText(newForm.content);
    if (bad) { notifyWarning(); flash(bad + ' Please revise before posting.'); return; }
    setNewPosting(true);
    await capi('/api/community/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newForm, anon_name: identity.name, anon_color: identity.color }),
    });
    setNewPosting(false);
    setShowNew(false);
    setNewForm({ category: '', title: '', content: '' });
    setTopic('All');
    await fetchPosts('All');
  };

  const postComment = async () => {
    if (!commentText.trim() || !detail || !identity) return;
    if (!agreed) { setShowGuidelines(true); flash('Please review and agree to the Community Guidelines before posting.'); return; }
    const bad = screenText(commentText);
    if (bad) { notifyWarning(); flash(bad + ' Please revise before posting.'); return; }
    setCommenting(true);
    await capi(`/api/community/posts/${detail.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anon_name: identity.name, anon_color: identity.color, content: commentText.trim() }),
    });
    setCommentText('');
    setDetail(await capi(`/api/community/posts/${detail.id}`).then(r => r.json()));
    setCommenting(false);
  };

  const deleteComment = async (commentId: number) => {
    setDeletingComment(commentId);
    await capi(`/api/community/comments/${commentId}`, { method: 'DELETE' });
    if (detail) setDetail(await capi(`/api/community/posts/${detail.id}`).then(r => r.json()));
    setDeletingComment(null);
  };

  const deletePost = async (postId: number) => {
    await capi(`/api/community/posts/${postId}`, { method: 'DELETE' });
    setDetail(null);
    await fetchPosts();
  };

  const likePost = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (liked.has(id)) return;
    const updated = new Set([...liked, id]);
    setLiked(updated);
    localStorage.setItem('luna_liked_posts', JSON.stringify([...updated]));
    const res = await capi(`/api/community/posts/${id}/like`, { method: 'POST' }).then(r => r.json());
    setPosts(ps => ps.map(p => p.id === id ? { ...p, likes: res.likes } : p));
    if (detail?.id === id) setDetail(d => d ? { ...d, likes: res.likes } : d);
  };

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (detail) {
    const visibleComments = detail.comments.filter(c => !hiddenComments.has(c.id) && !isBlocked(c.anon_name, c.anon_color));
    return (
      <div style={{ maxWidth: 640, padding: '20px 20px 100px', margin: '0 auto' }}>
        <button onClick={() => setDetail(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 18 }}>
          <ArrowLeft size={15} /> Back to Community
        </button>

        {/* Post */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, padding: '22px 24px', marginBottom: 12 }}>
          <TopicBadge topic={detail.category} />
          <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--text)', margin: '10px 0 12px', letterSpacing: '-0.4px', lineHeight: 1.3 }}>{detail.title}</h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{detail.content}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name={detail.anon_name} color={detail.anon_color} size={26} />
              <span style={{ fontSize: 12, fontWeight: 600, color: detail.anon_color }}>{detail.anon_name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>· {ago(detail.created_at)}</span>
              {identity && detail.anon_name === identity.name && detail.anon_color === identity.color && (
                <span style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--border)', borderRadius: 4, padding: '1px 5px' }}>you</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {identity && detail.anon_name === identity.name && detail.anon_color === identity.color ? (
                <button onClick={() => { if (window.confirm(tr('community.deletePostConfirm'))) deletePost(detail.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 99, border: '1px solid var(--border)', background: '#fff', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer' }}>
                  <Trash2 size={11} /> Delete post
                </button>
              ) : (
                <>
                  <button onClick={() => reportContent('posts', detail.id)} title="Report this post"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 99, border: '1px solid var(--border)', background: '#fff', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer' }}>
                    <Flag size={11} /> Report
                  </button>
                  <button onClick={() => blockUser(detail.anon_name, detail.anon_color)} title="Block this user"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 99, border: '1px solid var(--border)', background: '#fff', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer' }}>
                    <Ban size={11} /> Block
                  </button>
                </>
              )}
              <button onClick={() => likePost(detail.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 99, cursor: 'pointer', transition: 'all 0.1s', border: `1.5px solid ${liked.has(detail.id) ? 'var(--accent)' : 'var(--border)'}`, background: liked.has(detail.id) ? 'var(--accent-light)' : '#fff', color: liked.has(detail.id) ? 'var(--accent)' : 'var(--text-3)', fontSize: 12, fontWeight: 500 }}>
                <Heart size={13} fill={liked.has(detail.id) ? 'var(--accent)' : 'none'} strokeWidth={1.5} />
                {detail.likes}
              </button>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {visibleComments.length} {tr('community.replies')}
            </p>
          </div>
          {visibleComments.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '28px 20px' }}>
              No replies yet — be the first to respond
            </p>
          )}
          {visibleComments.map((c, i) => {
            const isOwn = identity && c.anon_name === identity.name && c.anon_color === identity.color;
            return (
              <div key={c.id} style={{ padding: '14px 22px', borderBottom: i < visibleComments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <Avatar name={c.anon_name} color={c.anon_color} size={24} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.anon_color }}>{c.anon_name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>· {ago(c.created_at)}</span>
                  {isOwn && <span style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--border)', borderRadius: 4, padding: '1px 5px' }}>you</span>}
                  {isOwn ? (
                    <button
                      onClick={() => deleteComment(c.id)}
                      disabled={deletingComment === c.id}
                      title="Delete your reply"
                      style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, border: '1px solid var(--border)', background: '#fff', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer', opacity: deletingComment === c.id ? 0.4 : 1 }}
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  ) : (
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      <button onClick={() => reportContent('comments', c.id)} title="Report this reply"
                        style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 99, border: '1px solid var(--border)', background: '#fff', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer' }}>
                        <Flag size={10} /> {tr('community.report')}
                      </button>
                      <button onClick={() => blockUser(c.anon_name, c.anon_color)} title="Block this user"
                        style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 99, border: '1px solid var(--border)', background: '#fff', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer' }}>
                        <Ban size={10} /> {tr('community.block')}
                      </button>
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, paddingLeft: 32, whiteSpace: 'pre-wrap' }}>{c.content}</p>
              </div>
            );
          })}
        </div>

        {/* Add reply */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, padding: '18px 22px' }}>
          {identity && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, fontSize: 11, color: 'var(--text-3)' }}>
              <Avatar name={identity.name} color={identity.color} size={18} />
              Replying as <span style={{ fontWeight: 600, color: 'var(--text-2)', marginLeft: 2 }}>{identity.name}</span>
            </div>
          )}
          <textarea value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postComment(); }} placeholder={tr('community.replyPlaceholder')} rows={3} style={{ ...inp, resize: 'none', marginBottom: 10, border: '1px solid var(--border)', borderRadius: 12 }} />
          <button onClick={postComment} disabled={!commentText.trim() || commenting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', background: commentText.trim() ? 'var(--accent)' : 'var(--border)', color: commentText.trim() ? '#fff' : 'var(--text-3)', fontSize: 12, fontWeight: 700, transition: 'all 0.1s' }}>
            <Send size={12} /> {tr('community.replyAnon')}
          </button>
        </div>
      </div>
    );
  }

  // ── Feed view ────────────────────────────────────────────────────────────────
  const visiblePosts = posts.filter(p => !hiddenPosts.has(p.id) && !isBlocked(p.anon_name, p.anon_color));
  return (
    <div style={{ maxWidth: 640, padding: '28px 20px 100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>{tr('nav.community')}</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{tr('community.subtitle')}</p>
          <span title={isSharedCommunity ? 'Connected to the shared community — you see posts from other users everywhere' : 'Local mode — posts stay on this device. Set VITE_COMMUNITY_API_URL to share.'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.3px', padding: '3px 9px', borderRadius: 99,
              background: isSharedCommunity ? 'var(--sage-light)' : 'var(--border)', color: isSharedCommunity ? 'var(--sage)' : 'var(--text-3)' }}>
            {isSharedCommunity ? <Globe size={11} /> : <Wifi size={11} />}
            {isSharedCommunity ? tr('community.live') : tr('community.local')}
          </span>
        </div>
        <button onClick={() => setShowNew(true)} className="luna-btn-grad" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 17px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          <Plus size={13} /> {tr('community.post')}
        </button>
      </div>

      {/* Topic filter tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 16, scrollbarWidth: 'none' }}>
        {['All', ...TOPICS].map(t => {
          const active = topic === t;
          const [color, bg] = t === 'All' ? ['var(--accent)', 'var(--accent-light)'] : (TOPIC_STYLE[t] || ['var(--text-3)', 'var(--border)']);
          return (
            <button key={t} onClick={() => setTopic(t)} style={{ padding: '6px 13px', borderRadius: 99, fontSize: 11, fontWeight: active ? 700 : 400, border: `1.5px solid ${active ? color : 'var(--border)'}`, background: active ? bg : '#fff', color: active ? color : 'var(--text-3)', cursor: 'pointer', flexShrink: 0, transition: 'all 0.1s', whiteSpace: 'nowrap' }}>
              {trTerm(t, lang)}
            </button>
          );
        })}
      </div>

      {/* Your anon identity strip */}
      {identity && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '10px 14px', marginBottom: 14 }}>
          <Avatar name={identity.name} color={identity.color} size={30} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{tr('community.youAre')} <span style={{ color: identity.color }}>{identity.name}</span></p>
            <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{tr('community.identityNote')}</p>
          </div>
          <button onClick={() => setShowNew(true)} style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 99, padding: '4px 11px', cursor: 'pointer', flexShrink: 0 }}>
            {tr('community.postSomething')}
          </button>
        </div>
      )}

      {/* Posts feed */}
      {visiblePosts.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 22, padding: '52px 28px', textAlign: 'center' }}>
          <p style={{ fontSize: 30, marginBottom: 12 }}>🌸</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            {topic === 'All' ? tr('community.noPosts') : tr('community.noPostsIn', { topic })}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 300, margin: '0 auto 20px' }}>
            {tr('community.shareIntro')}
          </p>
          <button onClick={() => { setShowNew(true); if (topic !== 'All') setNewForm(f => ({ ...f, category: topic })); }} style={{ padding: '9px 22px', borderRadius: 99, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {tr('community.createPost')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visiblePosts.map(p => (
            <article key={p.id} onClick={() => openPost(p.id)} className="luna-card luna-card-hover" style={{ padding: '18px 20px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <TopicBadge topic={p.category} />
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{ago(p.created_at)}</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 5, lineHeight: 1.3 }}>{p.title}</p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.content}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Avatar name={p.anon_name} color={p.anon_color} size={20} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: p.anon_color }}>{p.anon_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={e => likePost(p.id, e)} style={{ display: 'flex', alignItems: 'center', gap: 4, color: liked.has(p.id) ? 'var(--accent)' : 'var(--text-3)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0', fontWeight: liked.has(p.id) ? 600 : 400 }}>
                    <Heart size={12} fill={liked.has(p.id) ? 'var(--accent)' : 'none'} strokeWidth={1.5} /> {p.likes}
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-3)', fontSize: 11 }}>
                    <MessageCircle size={12} strokeWidth={1.5} /> {p.comment_count}
                  </span>
                  {!(identity && p.anon_name === identity.name && p.anon_color === identity.color) && (
                    <button onClick={e => { e.stopPropagation(); reportContent('posts', p.id); }} title="Report this post"
                      style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-3)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0' }}>
                      <Flag size={11} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Moderation & contact footer — Guideline 1.2 */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px', marginTop: 18 }}>
        <p style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 8 }}>
          This is a moderated space with <strong>zero tolerance for objectionable content or abusive users</strong>. Use <strong>Report</strong> to flag any post or reply and <strong>Block</strong> to hide a user. Reported content is hidden immediately and reviewed within 24 hours.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setShowGuidelines(true)} style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-light)', border: 'none', borderRadius: 99, padding: '5px 12px', cursor: 'pointer' }}>
            {tr('community.guidelines')}
          </button>
          <a href="mailto:support@lunahealth.app?subject=Report%20inappropriate%20content" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 99, padding: '5px 12px', textDecoration: 'none' }}>
            {tr('community.reportProblem')}
          </a>
        </div>
      </div>

      {/* New post modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(28,10,18,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 26, width: '100%', maxWidth: 500, padding: 28, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>{tr('community.newPost')}</h3>
              <button onClick={() => { setShowNew(false); setNewForm({ category: '', title: '', content: '' }); }} style={{ border: 'none', background: 'var(--border)', borderRadius: 99, padding: '5px 6px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex' }}><X size={14} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Topic */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>{tr('community.topic')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TOPICS.map(t => {
                    const [color, bg] = TOPIC_STYLE[t] || ['#6B3A4A', '#FDE8F0'];
                    const active = newForm.category === t;
                    return (
                      <button key={t} type="button" onClick={() => setNewForm(f => ({ ...f, category: t }))} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: active ? 700 : 400, cursor: 'pointer', border: `1.5px solid ${active ? color : 'var(--border)'}`, background: active ? bg : '#fff', color: active ? color : 'var(--text-3)', transition: 'all 0.1s' }}>
                        {trTerm(t, lang)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>{tr('community.titleField')}</p>
                <input value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))} placeholder={tr('community.titlePlaceholder')} style={inp} maxLength={200} />
              </div>

              {/* Content */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>{tr('community.shareThoughts')}</p>
                <textarea value={newForm.content} onChange={e => setNewForm(f => ({ ...f, content: e.target.value }))} placeholder={tr('community.contentPlaceholder')} rows={6} style={{ ...inp, resize: 'vertical', lineHeight: 1.6, border: '1px solid var(--border)', borderRadius: 12 }} maxLength={2000} />
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, textAlign: 'right' }}>{newForm.content.length}/2000</p>
              </div>

              {/* Identity preview */}
              {identity && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', background: 'var(--bg)', borderRadius: 12 }}>
                  <Avatar name={identity.name} color={identity.color} size={26} />
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{tr('community.postingAs')} <span style={{ color: identity.color }}>{identity.name}</span></p>
                    <p style={{ fontSize: 10, color: 'var(--text-3)' }}>{tr('community.realIdentityNote')}</p>
                  </div>
                </div>
              )}

              {/* Community guidelines agreement (required once) */}
              <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', cursor: 'pointer', padding: '2px 2px' }}>
                <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); if (e.target.checked) localStorage.setItem(GUIDELINES_ACCEPTED_KEY, new Date().toISOString()); else localStorage.removeItem(GUIDELINES_ACCEPTED_KEY); }}
                  style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  I agree to the{' '}
                  <button type="button" onClick={e => { e.preventDefault(); setShowGuidelines(true); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 11 }}>{tr('community.guidelines')}</button>
                  {' '}and understand there is no tolerance for objectionable content or abusive behaviour.
                </span>
              </label>

              <button onClick={createPost} disabled={!newForm.category || !newForm.title.trim() || !newForm.content.trim() || !agreed || newPosting}
                style={{ padding: '13px', borderRadius: 14, border: 'none', cursor: 'pointer', background: (newForm.category && newForm.title.trim() && newForm.content.trim() && agreed) ? 'var(--accent)' : 'var(--border)', color: (newForm.category && newForm.title.trim() && newForm.content.trim() && agreed) ? '#fff' : 'var(--text-3)', fontSize: 14, fontWeight: 700, transition: 'all 0.1s' }}>
                {newPosting ? tr('community.posting') : tr('community.postAnon')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuidelines && <LegalModal title={tr('community.guidelines')} body={tr('legal.guidelines')} onClose={() => setShowGuidelines(false)} />}

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 90, transform: 'translateX(-50%)', zIndex: 400, background: 'var(--sidebar-bg)', color: '#fff', fontSize: 12, fontWeight: 500, padding: '11px 18px', borderRadius: 99, boxShadow: '0 10px 30px rgba(28,10,18,0.3)', maxWidth: '90vw', textAlign: 'center' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
