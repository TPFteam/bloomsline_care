/**
 * Quip pools for the empty-state of the dashboard's "Today's plan" card.
 *
 * Indexed deterministically by day-of-year so the same date always shows
 * the same line — no flicker on rerenders, and you don't see the same
 * joke twice in a row across the day.
 *
 * Tone: warm, light, never trivializes the work. Used only on TODAY or
 * a future day with no sessions; past empty days fall back to a neutral
 * "Aucune séance ce jour-là" line in the component.
 */

const FR_QUIPS: readonly string[] = [
  'Journée libre. Profitez-en pour respirer (ou faire votre lessive).',
  'Personne sur l\'agenda — un café et un peu de paperasse ?',
  'Calendrier vide. Le monde tient bon, vous aussi.',
  'Aucune séance prévue. Vos plantes vous remercient d\'avance.',
  'Une journée pour vous. Méritée, sans rendez-vous.',
  'Pas de patients aujourd\'hui — peut-être un livre ?',
  'Espace vide. C\'est aussi une forme de soin.',
  'Rien sur l\'agenda. Le silence aussi a ses vertus.',
  'Aujourd\'hui, c\'est journée tranquille. Profitez-en.',
  'Zéro séance. Un bon jour pour relire une note ou deux.',
  'Pause naturelle. Le calendrier vous fait un cadeau.',
  'Personne en vue. Soufflez avant la prochaine vague.',
  'Une fenêtre libre — l\'occasion idéale pour rattraper vos notes.',
  'Aucun rendez-vous. Le thé est prêt.',
  'Un jour sans séance, c\'est un jour pour soi.',
  'Vide aujourd\'hui. Recharger les batteries fait partie du travail.',
  'Pas de patients — peut-être un peu de marche ?',
  'Calendrier détendu. Vous aussi, on espère.',
  'Aucun rendez-vous prévu. Pensez à vous.',
  'Rien aujourd\'hui — l\'occasion d\'avancer sur ce qui traîne.',
  'Fenêtre libre. L\'agenda fait une pause, vous aussi.',
  'Pas de séance. Un bon moment pour mettre à jour un protocole.',
  'Calendrier vide. Et c\'est très bien comme ça.',
  'Aujourd\'hui, l\'agenda dit non. Écoutez-le.',
  'Aucune obligation programmée. Profitez du calme.',
]

const EN_QUIPS: readonly string[] = [
  'Free day. Use it to breathe (or do laundry).',
  'No one on the agenda — coffee and paperwork?',
  'Empty calendar. The world will hold, and so will you.',
  'No sessions scheduled. Your plants thank you in advance.',
  'A day for you. Earned, with no appointments.',
  'No patients today — maybe a book?',
  'Empty space. That counts as care, too.',
  'Nothing on the schedule. Silence has its virtues.',
  'Quiet day ahead. Enjoy it.',
  'Zero sessions. Good day to revisit a note or two.',
  'Natural pause. The calendar is giving you a gift.',
  'No one in sight. Catch your breath before the next wave.',
  'Open window — perfect time to catch up on notes.',
  'No appointments. The kettle\'s on.',
  'A day without sessions is a day for yourself.',
  'Empty today. Recharging is part of the work.',
  'No patients — maybe a walk?',
  'Relaxed calendar. Hopefully you are too.',
  'No appointments planned. Take care of yourself.',
  'Nothing today — chance to clear what\'s lingering.',
  'Open slot. The agenda is taking a break — so should you.',
  'No sessions. Good moment to refresh a protocol.',
  'Empty calendar. And that\'s perfectly fine.',
  'Today, the schedule says no. Listen to it.',
  'No commitments lined up. Enjoy the quiet.',
]

const ES_QUIPS: readonly string[] = [
  'Día libre. Aprovecha para respirar (o hacer la colada).',
  'Nadie en la agenda — ¿un café y algo de papeleo?',
  'Calendario vacío. El mundo aguanta, y tú también.',
  'Sin sesiones. Tus plantas te lo agradecen.',
  'Un día para ti. Bien merecido.',
  'Sin pacientes hoy — ¿quizá un libro?',
  'Espacio vacío. También es una forma de cuidarse.',
  'Nada en la agenda. El silencio también vale.',
  'Día tranquilo por delante. Disfrútalo.',
  'Cero sesiones. Buen día para releer alguna nota.',
  'Pausa natural. El calendario te hace un regalo.',
  'Nadie a la vista. Toma aire antes de la próxima ola.',
  'Hueco libre — momento perfecto para ponerse al día con las notas.',
  'Sin citas. El té está listo.',
  'Un día sin sesiones es un día para uno mismo.',
  'Vacío hoy. Recargar pilas también es trabajo.',
  'Sin pacientes — ¿un paseo?',
  'Calendario relajado. Esperamos que tú también.',
  'Sin citas previstas. Cuídate.',
  'Nada hoy — oportunidad para avanzar con lo pendiente.',
  'Hueco abierto. La agenda descansa, tú también deberías.',
  'Sin sesiones. Buen momento para revisar un protocolo.',
  'Calendario vacío. Y está perfectamente bien.',
  'Hoy la agenda dice no. Hazle caso.',
  'Sin compromisos. Disfruta de la calma.',
]

const POOLS = { fr: FR_QUIPS, en: EN_QUIPS, es: ES_QUIPS } as const

/** Day-of-year for a Date (1..366), in the local timezone. */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / 86_400_000)
}

/**
 * Pick a stable quip for the given date + locale. Same date renders the
 * same string, so the message doesn't jitter when the component remounts
 * or the practitioner navigates back to today.
 */
export function quipForDay(date: Date, locale: string): string {
  const pool = POOLS[locale as keyof typeof POOLS] ?? POOLS.en
  return pool[dayOfYear(date) % pool.length]
}
