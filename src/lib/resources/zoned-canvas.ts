/**
 * Schema + starter templates for the `zoned_canvas` block.
 *
 * A zoned_canvas is a single interactive block that renders a 2-D
 * canvas with one or more labeled zones (rectangles, circles,
 * ellipses, polygons). The patient adds items by tapping a zone; the
 * zone is determined by tap position. One block can therefore express
 * a wide range of therapy exercises — Circle of Control, Eisenhower
 * matrix, body map, etc. — without us having to bake each as its own
 * block type.
 *
 * Coordinates use a viewBox-relative system (typical canvas size is
 * 800×600). The renderer scales to whatever the container width is.
 */

// ── Geometry primitives ─────────────────────────────────────────────

export type ZoneShape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; rx?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'polygon'; points: [number, number][] }

export interface CanvasZone {
  id: string
  label: { en: string; fr: string; es?: string }
  description?: { en: string; fr: string; es?: string }
  shape: ZoneShape
  /** Tailwind-ish accent token used by the renderer for fill / border / text. */
  accent?: 'teal' | 'amber' | 'rose' | 'violet' | 'sky' | 'emerald' | 'orange' | 'slate'
  /** Nesting — if set, taps that fall inside this zone resolve to this zone,
      not the parent. Lets a circle live inside a square. */
  parentZoneId?: string | null
  /** Soft cap on entries the patient can add to this zone. */
  maxItems?: number
}

export interface CanvasDefinition {
  width: number
  height: number
  /**
   * Optional background image rendered behind the zones (e.g. a body
   * silhouette). When provided, zone shapes are drawn over the image.
   */
  backgroundImageUrl?: string
}

// ── Block + response shapes ─────────────────────────────────────────

export interface ZonedCanvasBlock {
  type: 'zoned_canvas'
  id: string
  /** Practitioner-authored instructions shown above the canvas. */
  content?: string
  /** Optional template id this block was instantiated from. */
  templateId?: string
  canvas: CanvasDefinition
  zones: CanvasZone[]
}

export interface ZoneEntry {
  id: string
  text: string
  createdAt: string
}

/**
 * Patient response payload, keyed by zone id.
 */
export type ZoneEntries = Record<string, ZoneEntry[]>

// ── Template definitions ────────────────────────────────────────────

export interface ZonedCanvasTemplate {
  id: string
  name: { en: string; fr: string; es?: string }
  category: 'concentric' | 'grid' | 'bands' | 'triangle' | 'wedges' | 'image_overlay'
  description: { en: string; fr: string; es?: string }
  canvas: CanvasDefinition
  zones: CanvasZone[]
  /** Default instruction text inserted into the block when this template is picked. */
  defaultInstructions?: { en: string; fr: string; es?: string }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

// 1. Circle of Control
const circleOfControl: ZonedCanvasTemplate = {
  id: 'circle_of_control',
  category: 'concentric',
  name: { en: 'Circle of Control', fr: 'Cercle de contrôle' },
  description: {
    en: 'Sort worries into what you can and cannot control.',
    fr: 'Classez vos préoccupations selon ce que vous pouvez contrôler ou non.',
  },
  defaultInstructions: {
    en: "Identify a problem, then write what you can and cannot control about it.",
    fr: 'Identifiez un problème, puis écrivez ce que vous pouvez et ne pouvez pas contrôler.',
  },
  canvas: { width: 800, height: 600 },
  zones: [
    {
      id: 'cant',
      label: { en: "What I CAN'T Control", fr: "Ce que je ne peux PAS contrôler" },
      shape: { kind: 'rect', x: 40, y: 40, w: 720, h: 520, rx: 24 },
      accent: 'slate',
    },
    {
      id: 'can',
      label: { en: 'What I CAN Control', fr: 'Ce que je PEUX contrôler' },
      shape: { kind: 'circle', cx: 400, cy: 300, r: 200 },
      accent: 'teal',
      parentZoneId: 'cant',
    },
  ],
}

// 2. Comfort / Stretch / Panic
const comfortStretchPanic: ZonedCanvasTemplate = {
  id: 'comfort_stretch_panic',
  category: 'concentric',
  name: { en: 'Comfort · Stretch · Panic', fr: 'Confort · Étirement · Panique' },
  description: {
    en: 'Sort activities by the anxiety they trigger to design gentle exposure.',
    fr: 'Classez vos activités selon l’anxiété qu’elles déclenchent.',
  },
  defaultInstructions: {
    en: 'Place each activity in the zone that matches how it makes you feel.',
    fr: 'Placez chaque activité dans la zone qui correspond à ce que vous ressentez.',
  },
  canvas: { width: 800, height: 600 },
  zones: [
    {
      id: 'panic',
      label: { en: 'Panic', fr: 'Panique' },
      shape: { kind: 'circle', cx: 400, cy: 300, r: 270 },
      accent: 'rose',
    },
    {
      id: 'stretch',
      label: { en: 'Stretch', fr: 'Étirement' },
      shape: { kind: 'circle', cx: 400, cy: 300, r: 180 },
      accent: 'amber',
      parentZoneId: 'panic',
    },
    {
      id: 'comfort',
      label: { en: 'Comfort', fr: 'Confort' },
      shape: { kind: 'circle', cx: 400, cy: 300, r: 90 },
      accent: 'emerald',
      parentZoneId: 'stretch',
    },
  ],
}

// 3. Eisenhower Matrix
const eisenhower: ZonedCanvasTemplate = {
  id: 'eisenhower_matrix',
  category: 'grid',
  name: { en: 'Eisenhower Matrix', fr: 'Matrice d’Eisenhower' },
  description: {
    en: 'Sort tasks by urgency and importance to focus your effort.',
    fr: 'Classez vos tâches par urgence et importance pour mieux les prioriser.',
  },
  defaultInstructions: {
    en: 'For each task, decide whether it is urgent and whether it is important. Place it accordingly.',
    fr: "Pour chaque tâche, déterminez si elle est urgente et importante, puis placez-la.",
  },
  canvas: { width: 800, height: 600 },
  zones: [
    {
      id: 'do',
      label: { en: 'Urgent · Important · Do', fr: 'Urgent · Important · Faire' },
      shape: { kind: 'rect', x: 40, y: 40, w: 360, h: 260, rx: 12 },
      accent: 'rose',
    },
    {
      id: 'schedule',
      label: { en: 'Not Urgent · Important · Schedule', fr: 'Non urgent · Important · Planifier' },
      shape: { kind: 'rect', x: 400, y: 40, w: 360, h: 260, rx: 12 },
      accent: 'teal',
    },
    {
      id: 'delegate',
      label: { en: 'Urgent · Not Important · Delegate', fr: 'Urgent · Non important · Déléguer' },
      shape: { kind: 'rect', x: 40, y: 300, w: 360, h: 260, rx: 12 },
      accent: 'amber',
    },
    {
      id: 'drop',
      label: { en: 'Not Urgent · Not Important · Drop', fr: 'Non urgent · Non important · Abandonner' },
      shape: { kind: 'rect', x: 400, y: 300, w: 360, h: 260, rx: 12 },
      accent: 'slate',
    },
  ],
}

// 4. Iceberg (above / below)
const iceberg: ZonedCanvasTemplate = {
  id: 'iceberg',
  category: 'bands',
  name: { en: 'Iceberg', fr: 'Iceberg' },
  description: {
    en: 'What people see vs. what is really driving it underneath.',
    fr: 'Ce que les autres voient vs. ce qui se passe en profondeur.',
  },
  defaultInstructions: {
    en: 'Write the visible reaction on top. Below, write the underlying belief, fear, or need.',
    fr: 'En haut, la réaction visible. En bas, la croyance, la peur ou le besoin sous-jacent.',
  },
  canvas: { width: 800, height: 600 },
  zones: [
    {
      id: 'above',
      label: { en: 'What people see', fr: 'Ce que les autres voient' },
      description: { en: 'Behaviors, words, visible emotions', fr: 'Comportements, paroles, émotions visibles' },
      shape: { kind: 'rect', x: 40, y: 40, w: 720, h: 180, rx: 12 },
      accent: 'sky',
    },
    {
      id: 'below',
      label: { en: 'What drives it', fr: 'Ce qui le motive' },
      description: { en: 'Beliefs, fears, needs, history', fr: 'Croyances, peurs, besoins, histoire' },
      shape: { kind: 'rect', x: 40, y: 240, w: 720, h: 320, rx: 12 },
      accent: 'violet',
    },
  ],
}

// 5. Cognitive Triangle
const cognitiveTriangle: ZonedCanvasTemplate = {
  id: 'cognitive_triangle',
  category: 'triangle',
  name: { en: 'Cognitive Triangle', fr: 'Triangle cognitif' },
  description: {
    en: 'Unpack a moment into thoughts, feelings, and behaviors.',
    fr: 'Décomposez un instant en pensées, émotions et comportements.',
  },
  defaultInstructions: {
    en: 'Pick one situation. Write the thoughts, the feelings, and the behaviors that followed.',
    fr: 'Choisissez une situation. Écrivez les pensées, les émotions et les comportements qui ont suivi.',
  },
  canvas: { width: 800, height: 600 },
  zones: [
    {
      id: 'thoughts',
      label: { en: 'Thoughts', fr: 'Pensées' },
      shape: { kind: 'circle', cx: 400, cy: 110, r: 90 },
      accent: 'violet',
    },
    {
      id: 'feelings',
      label: { en: 'Feelings', fr: 'Émotions' },
      shape: { kind: 'circle', cx: 180, cy: 480, r: 90 },
      accent: 'rose',
    },
    {
      id: 'behaviors',
      label: { en: 'Behaviors', fr: 'Comportements' },
      shape: { kind: 'circle', cx: 620, cy: 480, r: 90 },
      accent: 'teal',
    },
  ],
}

// 6. Window of Tolerance
const windowOfTolerance: ZonedCanvasTemplate = {
  id: 'window_of_tolerance',
  category: 'bands',
  name: { en: 'Window of Tolerance', fr: 'Fenêtre de tolérance' },
  description: {
    en: 'Map experiences by where they put you on the arousal spectrum.',
    fr: 'Cartographiez vos expériences selon votre niveau d’activation.',
  },
  defaultInstructions: {
    en: 'Place each recent experience in the zone that matches your nervous system response.',
    fr: 'Placez chaque expérience récente dans la zone qui correspond à votre réaction.',
  },
  canvas: { width: 800, height: 600 },
  zones: [
    {
      id: 'hyper',
      label: { en: 'Hyperarousal', fr: 'Hyperactivation' },
      description: { en: 'Anxious, panicked, overwhelmed', fr: 'Anxieux, paniqué, débordé' },
      shape: { kind: 'rect', x: 40, y: 40, w: 720, h: 160, rx: 12 },
      accent: 'rose',
    },
    {
      id: 'window',
      label: { en: 'Window of Tolerance', fr: 'Fenêtre de tolérance' },
      description: { en: 'Present, engaged, regulated', fr: 'Présent, engagé, régulé' },
      shape: { kind: 'rect', x: 40, y: 220, w: 720, h: 160, rx: 12 },
      accent: 'emerald',
    },
    {
      id: 'hypo',
      label: { en: 'Hypoarousal', fr: 'Hypoactivation' },
      description: { en: 'Shut down, numb, disconnected', fr: 'Apathie, engourdissement, déconnexion' },
      shape: { kind: 'rect', x: 40, y: 400, w: 720, h: 160, rx: 12 },
      accent: 'slate',
    },
  ],
}

// 7. Wheel of Life
// 8 wedges of a circle, computed as polygons.
const wheelOfLifeWedges = (): CanvasZone[] => {
  const cx = 400
  const cy = 300
  const r = 250
  const innerR = 30 // small dead-zone at the centre so taps near the middle aren't ambiguous
  const segments = 8
  const labels: Array<[string, string]> = [
    ['Career', 'Carrière'],
    ['Money', 'Argent'],
    ['Health', 'Santé'],
    ['Family', 'Famille'],
    ['Relationships', 'Relations'],
    ['Growth', 'Développement'],
    ['Fun', 'Plaisir'],
    ['Environment', 'Environnement'],
  ]
  const accents: CanvasZone['accent'][] = ['teal', 'amber', 'rose', 'violet', 'sky', 'emerald', 'orange', 'slate']
  const zones: CanvasZone[] = []
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2 - Math.PI / 2
    const a1 = ((i + 1) / segments) * Math.PI * 2 - Math.PI / 2
    const points: [number, number][] = [
      [cx + innerR * Math.cos(a0), cy + innerR * Math.sin(a0)],
      [cx + r * Math.cos(a0), cy + r * Math.sin(a0)],
      // Approximate the arc with intermediate points so the wedge looks
      // like a curved slice rather than a triangle.
      ...Array.from({ length: 8 }, (_, k) => {
        const t = (k + 1) / 9
        const a = a0 + t * (a1 - a0)
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number]
      }),
      [cx + r * Math.cos(a1), cy + r * Math.sin(a1)],
      [cx + innerR * Math.cos(a1), cy + innerR * Math.sin(a1)],
    ]
    zones.push({
      id: `wedge_${i}`,
      label: { en: labels[i][0], fr: labels[i][1] },
      shape: { kind: 'polygon', points },
      accent: accents[i % accents.length],
    })
  }
  return zones
}
const wheelOfLife: ZonedCanvasTemplate = {
  id: 'wheel_of_life',
  category: 'wedges',
  name: { en: 'Wheel of Life', fr: 'Roue de la vie' },
  description: {
    en: 'Rate each life area and note where to invest more attention.',
    fr: 'Évaluez chaque domaine et notez où porter votre attention.',
  },
  defaultInstructions: {
    en: 'For each area, note one observation: what is going well, what feels stuck.',
    fr: 'Pour chaque domaine, notez une observation : ce qui va bien, ce qui bloque.',
  },
  canvas: { width: 800, height: 600 },
  zones: wheelOfLifeWedges(),
}

// 8. Body Map — silhouette is rendered as a polygon outline (so we ship
// without depending on an uploaded image). Practitioners can replace
// the canvas with their own background image later.
const bodyMap: ZonedCanvasTemplate = {
  id: 'body_map',
  category: 'image_overlay',
  name: { en: 'Body Map', fr: 'Carte corporelle' },
  description: {
    en: 'Tag physical sensations to body regions.',
    fr: 'Associez les sensations physiques à des zones du corps.',
  },
  defaultInstructions: {
    en: 'Tap a body region and note the sensation you noticed there.',
    fr: 'Touchez une zone du corps et notez la sensation que vous y avez ressentie.',
  },
  canvas: { width: 400, height: 600 },
  zones: [
    {
      id: 'head',
      label: { en: 'Head', fr: 'Tête' },
      shape: { kind: 'ellipse', cx: 200, cy: 70, rx: 50, ry: 60 },
      accent: 'violet',
    },
    {
      id: 'throat',
      label: { en: 'Throat', fr: 'Gorge' },
      shape: { kind: 'ellipse', cx: 200, cy: 145, rx: 22, ry: 18 },
      accent: 'rose',
    },
    {
      id: 'chest',
      label: { en: 'Chest', fr: 'Poitrine' },
      shape: { kind: 'ellipse', cx: 200, cy: 230, rx: 80, ry: 50 },
      accent: 'sky',
    },
    {
      id: 'belly',
      label: { en: 'Belly', fr: 'Ventre' },
      shape: { kind: 'ellipse', cx: 200, cy: 330, rx: 70, ry: 45 },
      accent: 'amber',
    },
    {
      id: 'arms',
      label: { en: 'Arms', fr: 'Bras' },
      shape: { kind: 'polygon', points: [[100, 180], [140, 180], [120, 380], [80, 380]] },
      accent: 'teal',
    },
    {
      id: 'hands',
      label: { en: 'Hands', fr: 'Mains' },
      shape: { kind: 'rect', x: 70, y: 380, w: 50, h: 60, rx: 8 },
      accent: 'emerald',
    },
    {
      id: 'legs',
      label: { en: 'Legs', fr: 'Jambes' },
      shape: { kind: 'polygon', points: [[170, 380], [230, 380], [240, 580], [160, 580]] },
      accent: 'orange',
    },
  ],
}

export const ZONED_CANVAS_TEMPLATES: ZonedCanvasTemplate[] = [
  circleOfControl,
  comfortStretchPanic,
  eisenhower,
  iceberg,
  cognitiveTriangle,
  windowOfTolerance,
  wheelOfLife,
  bodyMap,
]

export function getTemplate(id: string): ZonedCanvasTemplate | undefined {
  return ZONED_CANVAS_TEMPLATES.find(t => t.id === id)
}

/**
 * Materialise a template into a fresh block ready to be inserted into a
 * worksheet. Generates a new id and copies the geometry + labels.
 */
export function templateToBlock(
  template: ZonedCanvasTemplate,
  blockId: string,
  locale: 'en' | 'fr' | 'es' = 'en',
): ZonedCanvasBlock {
  return {
    type: 'zoned_canvas',
    id: blockId,
    templateId: template.id,
    content: template.defaultInstructions?.[locale === 'fr' ? 'fr' : 'en'] ?? '',
    canvas: { ...template.canvas },
    zones: template.zones.map(z => ({ ...z, shape: structuredClone(z.shape) })),
  }
}
