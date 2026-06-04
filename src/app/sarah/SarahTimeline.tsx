'use client'

// DEMO-ONLY component. Renders Sarah's shared-moments timeline exactly like the
// Partagé → Moments "stacked" view in SharedTab.tsx. Dates are formatted in the
// viewer's browser timezone so they match what the practitioner sees in-app.
// Safe to delete with the /sarah route once the demo is over.

import { useState } from 'react'
import { Mic, Share2 } from 'lucide-react'

export interface DemoComment {
  author_type: string // 'practitioner' | 'member'
  content: string
  created_at: string
}

export interface DemoMoment {
  id: string
  type: 'photo' | 'video' | 'voice' | 'write' | 'mixed'
  text_content: string | null
  caption: string | null
  moods: string[] | null
  duration_seconds: number | null
  created_at: string
  shared_with_practitioner_at: string
  image_url: string | null
  full_url: string | null
  comments: DemoComment[]
}

const MOMENT_MOOD_COLORS: Record<string, string> = {
  joy: '#FCD34D', calm: '#5EEAD4', inspired: '#A78BFA', loved: '#FB7185',
  proud: '#FB923C', grateful: '#86EFAC', curious: '#67E8F9', confident: '#FBBF24',
  playful: '#2DD4BF', excited: '#FB923C', hopeful: '#86EFAC', content: '#5EEAD4',
  sad: '#94A3B8', anxious: '#FDA4AF', frustrated: '#F87171', tired: '#A8A29E',
  overwhelmed: '#C084FC', lonely: '#9CA3AF',
}

function MomentCard({ moment, onOpen }: { moment: DemoMoment; onOpen: (m: DemoMoment) => void }) {
  const mood = moment.moods?.[0]
  const moodColor = mood ? MOMENT_MOOD_COLORS[mood] || '#94A3B8' : null
  const hasImage = !!moment.image_url && (moment.type === 'photo' || moment.type === 'video' || moment.type === 'mixed')
  const isVoice = moment.type === 'voice'
  const isWrite = moment.type === 'write'
  const captured = (() => {
    const d = new Date(moment.created_at)
    const datePart = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    const timePart = d.toLocaleTimeString('fr-FR', { hour: 'numeric', minute: '2-digit' })
    return `${datePart} · ${timePart}`
  })()

  return (
    <button
      type="button"
      onClick={() => onOpen(moment)}
      className="w-full text-left rounded-2xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all overflow-hidden bg-white"
    >
      {hasImage && (
        <div className="relative rounded-xl overflow-hidden bg-gray-100">
          <img src={moment.image_url!} alt="" className="w-full h-40 object-cover" />
          {moment.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[10px] border-t-[7px] border-b-[7px] border-l-white border-t-transparent border-b-transparent ml-0.5" />
              </div>
            </div>
          )}
        </div>
      )}
      {isVoice && (
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Mic className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-700">Note vocale</div>
            {moment.duration_seconds ? (
              <div className="text-xs text-gray-400 mt-0.5">
                {Math.floor(moment.duration_seconds / 60)}:{String(Math.round(moment.duration_seconds % 60)).padStart(2, '0')}
              </div>
            ) : null}
          </div>
        </div>
      )}
      {isWrite && (
        <div className="p-4 bg-gray-50">
          <p className="text-sm text-gray-800 leading-relaxed line-clamp-4">
            {moment.text_content || moment.caption || ''}
          </p>
        </div>
      )}
      <div className="px-3 py-2.5 flex flex-col gap-1 border-t border-gray-50">
        {mood && moodColor ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full self-start" style={{ backgroundColor: `${moodColor}1F`, color: moodColor }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: moodColor }} />
            <span className="capitalize">{mood}</span>
          </span>
        ) : null}
        <span className="text-[11px] text-gray-400">{captured}</span>
      </div>
      {hasImage && (moment.caption || moment.text_content) && (
        <div className="px-3 pb-3 -mt-1">
          <p className="text-xs text-gray-500 line-clamp-2">{moment.caption || moment.text_content}</p>
        </div>
      )}
    </button>
  )
}

// Full-moment modal — mirrors the app's Shared Moment viewer (full media, moods,
// full text, captured date, conversation). Read-only in the demo.
function MomentModal({ moment, onClose }: { moment: DemoMoment; onClose: () => void }) {
  const moods = moment.moods || []
  const sharedAt = new Date(moment.shared_with_practitioner_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const capturedAt = new Date(moment.created_at).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Moment partagé</h3>
            <p className="text-xs text-gray-400 mt-0.5">Partagé le {sharedAt}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {moment.type === 'video' && moment.full_url && (
            <video src={moment.full_url} controls className="w-full max-h-[60vh] bg-black rounded-xl" />
          )}
          {moment.type === 'voice' && moment.full_url && (
            <div className="w-full bg-amber-50 rounded-xl p-6 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <audio src={moment.full_url} controls className="w-full" />
            </div>
          )}
          {(moment.type === 'photo' || moment.type === 'mixed') && moment.full_url && (
            <img src={moment.full_url} alt="" className="w-full max-h-[60vh] object-contain bg-gray-50 rounded-xl" />
          )}

          {moods.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => {
                const c = MOMENT_MOOD_COLORS[mood] || '#94A3B8'
                return (
                  <span
                    key={mood}
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${c}1F`, color: c }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                    <span className="capitalize">{mood}</span>
                  </span>
                )
              })}
            </div>
          )}

          {moment.text_content && (
            <p className="text-base text-gray-900 leading-relaxed whitespace-pre-wrap">{moment.text_content}</p>
          )}
          {moment.caption && (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{moment.caption}</p>
          )}

          <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">Capturé le {capturedAt}</p>

          {/* Conversation (read-only) */}
          <div className="pt-4 mt-2 border-t border-gray-100">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Conversation</div>
            {moment.comments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Pas encore de commentaires</p>
            ) : (
              <div className="space-y-3">
                {moment.comments.map((c, i) => {
                  const mine = c.author_type === 'practitioner'
                  const when = new Date(c.created_at).toLocaleString('fr-FR', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })
                  return (
                    <div key={i} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        <p className="whitespace-pre-wrap break-words">{c.content}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">{when}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SarahTimeline({ moments }: { moments: DemoMoment[] }) {
  const [selected, setSelected] = useState<DemoMoment | null>(null)
  // Group by shared date (matches "Date de partage" mode in the app).
  const dayKey = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }
  const dayLabel = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

  const sorted = moments
    .slice()
    .sort((a, b) => new Date(b.shared_with_practitioner_at).getTime() - new Date(a.shared_with_practitioner_at).getTime())

  const groups: Array<{ key: string; label: string; moments: DemoMoment[] }> = []
  for (const m of sorted) {
    const k = dayKey(m.shared_with_practitioner_at)
    const tail = groups[groups.length - 1]
    if (tail && tail.key === k) tail.moments.push(m)
    else groups.push({ key: k, label: dayLabel(m.shared_with_practitioner_at), moments: [m] })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Tabs (Moments only) */}
        <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
          <span className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] border-teal-500 text-teal-600">
            Moments
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">{moments.length}</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {moments.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-teal-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Share2 className="w-9 h-9 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Aucun moment partagé</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Quand ce membre partagera un moment, il apparaîtra ici.
              </p>
            </div>
          ) : (
            <>
              {/* Timeline */}
              <div className="relative max-w-3xl mx-auto px-4 py-6">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200" aria-hidden />
                {(() => {
                  let runningIndex = 0
                  return groups.map((group) => (
                    <div key={group.key}>
                      <div className="relative flex items-center justify-center my-3">
                        <span className="bg-white px-3 py-1 rounded-full border border-gray-200 text-[11px] font-medium text-gray-500 relative z-10">
                          Partagé le {group.label}
                        </span>
                      </div>
                      {group.moments.map((moment) => {
                        const isLeft = runningIndex % 2 === 0
                        runningIndex++
                        const mood = moment.moods?.[0]
                        const moodColor = mood ? MOMENT_MOOD_COLORS[mood] || '#CBD5E1' : '#CBD5E1'
                        return (
                          <div key={moment.id} className="relative grid grid-cols-2 gap-6 mb-8 last:mb-0">
                            {isLeft ? (
                              <>
                                <div className="flex justify-end">
                                  <div className="w-full max-w-[260px]">
                                    <MomentCard moment={moment} onOpen={setSelected} />
                                  </div>
                                </div>
                                <div />
                              </>
                            ) : (
                              <>
                                <div />
                                <div className="flex justify-start">
                                  <div className="w-full max-w-[260px]">
                                    <MomentCard moment={moment} onOpen={setSelected} />
                                  </div>
                                </div>
                              </>
                            )}
                            <span
                              className="absolute left-1/2 top-6 -translate-x-1/2 w-2.5 h-2.5 rounded-full ring-4 ring-white"
                              style={{ backgroundColor: moodColor }}
                              aria-hidden
                            />
                          </div>
                        )
                      })}
                    </div>
                  ))
                })()}
              </div>
            </>
          )}
        </div>
      </div>

      {selected && <MomentModal moment={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
