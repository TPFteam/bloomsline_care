import { createAdminClient } from '@/lib/supabase/server-client'

export const dynamic = 'force-dynamic'

type Lang = 'en' | 'fr' | 'es'

interface BadgePractitioner {
  full_name: string
  avatar_url: string | null
}

/**
 * Resolve a practitioner for the public brand badge by slug.
 * Mirrors the fallback used by /p/[slug]: try practitioner_profiles first
 * (joined to users for name/avatar), then public_practitioners.
 */
async function getPractitioner(slug: string): Promise<BadgePractitioner | null> {
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('practitioner_profiles')
    .select('users(full_name, avatar_url)')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle()

  if (profile) {
    const user = Array.isArray(profile.users) ? profile.users[0] : profile.users
    return {
      full_name: user?.full_name || '',
      avatar_url: user?.avatar_url || null,
    }
  }

  const { data: pub } = await supabase
    .from('public_practitioners')
    .select('full_name, avatar_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (pub) {
    return { full_name: pub.full_name || '', avatar_url: pub.avatar_url || null }
  }

  return null
}

const COPY: Record<Lang, {
  tagline: string
  subtitle: string
  collab: (name: string) => string
  collabGeneric: string
  cta: string
}> = {
  en: {
    tagline: 'Small moments, deeper understanding.',
    subtitle: 'A calm, private space your patients carry between sessions.',
    collab: (name) => `In collaboration with ${name}`,
    collabGeneric: 'A space offered to my patients',
    cta: 'Discover Bloomsline',
  },
  fr: {
    tagline: 'Petits moments, grande compréhension.',
    subtitle: 'Un espace apaisant et confidentiel, entre les séances.',
    collab: (name) => `En collaboration avec ${name}`,
    collabGeneric: 'Un espace offert à mes patients',
    cta: 'En savoir plus',
  },
  es: {
    tagline: 'Pequeños momentos, gran comprensión.',
    subtitle: 'Un espacio tranquilo y privado entre sesiones.',
    collab: (name) => `En colaboración con ${name}`,
    collabGeneric: 'Un espacio para mis pacientes',
    cta: 'Descubrir Bloomsline',
  },
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const url = new URL(req.url)
  const langParam = url.searchParams.get('lang')
  const lang: Lang = langParam === 'fr' ? 'fr' : langParam === 'es' ? 'es' : 'en'

  const origin = url.origin
  const learnMoreUrl = `${origin}/for-everyone`

  const practitioner = await getPractitioner(slug)

  const t = COPY[lang]
  const TEAL = '#0D9488'
  const INK = '#1F2937'
  const MUTE = '#6B7280'

  // Unknown / unpublished practitioner → render a neutral generic badge
  // rather than a hard 404, so a broken slug never leaves a blank box on
  // the practitioner's live site.
  const name = (practitioner?.full_name || '').trim()
  const collabLine = name ? t.collab(name) : t.collabGeneric
  const avatar = practitioner?.avatar_url || null

  const avatarHtml = avatar
    ? `<img src="${escapeHtml(avatar)}" alt="" width="22" height="22" style="border-radius:50%;object-fit:cover;flex-shrink:0;" />`
    : ''

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Bloomsline</title>
<style>
  html,body{margin:0;padding:0;background:transparent;}
  *{box-sizing:border-box;}
  .bl-card{
    display:block;text-decoration:none;max-width:340px;margin:0 auto;
    background:#FFFFFF;border:1px solid #ECEAE5;border-radius:16px;padding:20px 22px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
    box-shadow:0 1px 2px rgba(17,24,39,0.04);transition:box-shadow .15s ease,transform .15s ease;
  }
  .bl-card:hover{box-shadow:0 6px 20px rgba(17,24,39,0.10);transform:translateY(-1px);}
  .bl-cta{
    margin-top:16px;display:inline-flex;align-items:center;gap:6px;background:${TEAL};color:#fff;
    font-size:13px;font-weight:600;padding:9px 16px;border-radius:999px;
  }
</style>
</head>
<body>
<a class="bl-card" href="${escapeHtml(learnMoreUrl)}" target="_blank" rel="noopener noreferrer">
  <div style="font-size:19px;font-weight:700;letter-spacing:-0.01em;margin-bottom:12px;">
    <span style="color:${INK};">blooms</span><span style="color:${TEAL};">line</span>
  </div>
  <div style="font-size:15px;font-weight:600;color:${INK};line-height:1.35;">${escapeHtml(t.tagline)}</div>
  <div style="font-size:13px;color:${MUTE};line-height:1.5;margin-top:6px;">${escapeHtml(t.subtitle)}</div>
  <div style="display:flex;align-items:center;gap:8px;margin-top:14px;">
    ${avatarHtml}<span style="font-size:12px;color:${MUTE};">${escapeHtml(collabLine)}</span>
  </div>
  <div class="bl-cta">${escapeHtml(t.cta)} <span aria-hidden="true">&rarr;</span></div>
</a>
<script>(function(){
  function post(){try{
    var h=document.documentElement.scrollHeight||document.body.scrollHeight;
    parent.postMessage({type:'bloomsline:embed:height',height:h},'*');
  }catch(e){}}
  window.addEventListener('load',post);window.addEventListener('resize',post);
  if(document.readyState!=='loading')post();
  setTimeout(post,60);setTimeout(post,300);
})();</script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Allow framing on any practitioner site, and cache lightly at the edge.
      'cache-control': 'public, max-age=300, s-maxage=600',
    },
  })
}
