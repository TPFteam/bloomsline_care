/**
 * Bloomsline booking embed loader.
 *
 * Practitioners drop this snippet into their site:
 *
 *   <div data-bloomsline-booking="caroline-bouette"
 *        data-primary="#4A9A86"
 *        data-max-width="720"></div>
 *   <script src="https://bloomsline.com/embed.js" async></script>
 *
 * The script finds every `[data-bloomsline-booking]` element, injects an
 * iframe pointing at the practitioner's booking page in embed mode, and
 * auto-resizes the iframe to fit the booking form's height (no internal
 * scrollbar, no wasted space) by listening for postMessage events from
 * the iframe.
 */
(function () {
  'use strict'

  if (typeof window === 'undefined') return
  // Idempotent: never run twice
  if (window.__bloomslineEmbedInstalled) return
  window.__bloomslineEmbedInstalled = true

  // Resolve the script's origin so iframes load from the same host
  // (works in dev / preview / production without hardcoding).
  function resolveOrigin() {
    try {
      var scripts = document.getElementsByTagName('script')
      for (var i = scripts.length - 1; i >= 0; i--) {
        var src = scripts[i].src || ''
        if (src.indexOf('/embed.js') !== -1) {
          var u = new URL(src)
          return u.origin
        }
      }
    } catch (e) { /* fall through */ }
    return 'https://bloomsline.com'
  }
  var ORIGIN = resolveOrigin()

  function buildSrc(slug, opts) {
    var p = new URLSearchParams()
    p.set('embed', '1')
    if (opts.primary) p.set('primary', opts.primary)
    return ORIGIN + '/practitioner/' + encodeURIComponent(slug) + '/book?' + p.toString()
  }

  function mountOne(el) {
    if (el.__bloomslineMounted) return
    el.__bloomslineMounted = true

    var slug = el.getAttribute('data-bloomsline-booking') || el.getAttribute('data-slug')
    if (!slug) return

    var primary = el.getAttribute('data-primary') || ''
    var maxWidth = el.getAttribute('data-max-width') || ''

    var iframe = document.createElement('iframe')
    iframe.src = buildSrc(slug, { primary: primary })
    iframe.style.border = '0'
    iframe.style.width = '100%'
    iframe.style.minHeight = '600px'
    iframe.style.display = 'block'
    iframe.style.transition = 'height 200ms ease'
    if (maxWidth) iframe.style.maxWidth = maxWidth + 'px'
    iframe.setAttribute('allow', 'payment')
    iframe.setAttribute('title', 'Bloomsline booking')

    el.innerHTML = ''
    el.appendChild(iframe)
    el.__bloomslineIframe = iframe
  }

  function mountAll() {
    var nodes = document.querySelectorAll('[data-bloomsline-booking]')
    for (var i = 0; i < nodes.length; i++) mountOne(nodes[i])
  }

  // Listen for height-update messages from any embedded iframe and resize
  // the matching iframe element. Origin check ensures we only trust messages
  // from our own host.
  window.addEventListener('message', function (e) {
    try {
      if (!e.data || typeof e.data !== 'object') return
      if (e.data.type !== 'bloomsline:embed:height') return
      if (e.origin !== ORIGIN) return
      var h = parseInt(e.data.height, 10)
      if (!h || h < 100) return
      var iframes = document.querySelectorAll('[data-bloomsline-booking] iframe')
      for (var i = 0; i < iframes.length; i++) {
        if (iframes[i].contentWindow === e.source) {
          iframes[i].style.height = h + 'px'
        }
      }
    } catch (_) { /* ignore */ }
  })

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll)
  } else {
    mountAll()
  }

  // Re-scan when new nodes are added (so SPAs can drop in the placeholder
  // after page load and still get a working embed).
  if (typeof MutationObserver !== 'undefined') {
    var mo = new MutationObserver(function () { mountAll() })
    mo.observe(document.body || document.documentElement, { childList: true, subtree: true })
  }
})()
