import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch all moments (admin bypasses RLS)
    const { data: moments, error } = await supabase
      .from('moments')
      .select('id, user_id, type, moods, caption, text_content, duration_seconds, file_size_bytes, mime_type, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching moments:', error)
      return NextResponse.json({ error: 'Failed to fetch moments' }, { status: 500 })
    }

    if (!moments || moments.length === 0) {
      return NextResponse.json({ empty: true, totalMoments: 0 })
    }

    // ── Aggregate analytics ──────────────────────────────────────

    const totalMoments = moments.length
    const uniqueUsers = [...new Set(moments.map(m => m.user_id))]
    const totalUsers = uniqueUsers.length

    // ── By type ──────────────────────────────────────────────────
    const byType: Record<string, number> = {}
    for (const m of moments) {
      byType[m.type] = (byType[m.type] || 0) + 1
    }

    // ── Moods distribution ───────────────────────────────────────
    const moodCounts: Record<string, number> = {}
    let momentsWithMoods = 0
    let momentsWithCaption = 0
    for (const m of moments) {
      if (m.moods && m.moods.length > 0) {
        momentsWithMoods++
        for (const mood of m.moods) {
          moodCounts[mood] = (moodCounts[mood] || 0) + 1
        }
      }
      if (m.caption || m.text_content) momentsWithCaption++
    }
    const moodsSorted = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([mood, count]) => ({ mood, count, pct: Math.round((count / totalMoments) * 100) }))

    // ── Per-user breakdown ───────────────────────────────────────
    const userMap: Record<string, typeof moments> = {}
    for (const m of moments) {
      if (!userMap[m.user_id]) userMap[m.user_id] = []
      userMap[m.user_id].push(m)
    }

    const perUser = uniqueUsers.map(uid => {
      const userMoments = userMap[uid]
      const first = userMoments[0].created_at
      const last = userMoments[userMoments.length - 1].created_at
      const firstDate = new Date(first)
      const lastDate = new Date(last)
      const daySpan = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)

      // Unique active days
      const activeDays = new Set(userMoments.map(m => new Date(m.created_at).toISOString().split('T')[0]))

      // Types used
      const typesUsed = [...new Set(userMoments.map(m => m.type))]

      // Moods used
      const userMoods: Record<string, number> = {}
      for (const m of userMoments) {
        if (m.moods) for (const mood of m.moods) userMoods[mood] = (userMoods[mood] || 0) + 1
      }
      const topMood = Object.entries(userMoods).sort((a, b) => b[1] - a[1])[0]

      return {
        userId: uid.slice(0, 8),
        total: userMoments.length,
        firstMoment: first,
        lastMoment: last,
        daySpan,
        activeDays: activeDays.size,
        avgPerDay: Math.round((userMoments.length / activeDays.size) * 10) / 10,
        typesUsed,
        topMood: topMood ? topMood[0] : null,
        captionRate: Math.round((userMoments.filter(m => m.caption || m.text_content).length / userMoments.length) * 100),
      }
    }).sort((a, b) => b.total - a.total)

    // ── Time-of-day distribution ─────────────────────────────────
    const hourBuckets: Record<string, number> = { 'Morning (6-12)': 0, 'Afternoon (12-17)': 0, 'Evening (17-21)': 0, 'Night (21-6)': 0 }
    const hourly = new Array(24).fill(0)
    for (const m of moments) {
      const h = new Date(m.created_at).getHours()
      hourly[h]++
      if (h >= 6 && h < 12) hourBuckets['Morning (6-12)']++
      else if (h >= 12 && h < 17) hourBuckets['Afternoon (12-17)']++
      else if (h >= 17 && h < 21) hourBuckets['Evening (17-21)']++
      else hourBuckets['Night (21-6)']++
    }

    // ── Day-of-week distribution ─────────────────────────────────
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayOfWeek: Record<string, number> = {}
    for (const d of dayNames) dayOfWeek[d] = 0
    for (const m of moments) {
      dayOfWeek[dayNames[new Date(m.created_at).getDay()]]++
    }

    // ── Daily timeline (moments per day) ─────────────────────────
    const dailyMap: Record<string, number> = {}
    for (const m of moments) {
      const day = new Date(m.created_at).toISOString().split('T')[0]
      dailyMap[day] = (dailyMap[day] || 0) + 1
    }
    const dailyTimeline = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))

    // ── Averages & computed stats ────────────────────────────────
    const avgMomentsPerUser = Math.round((totalMoments / totalUsers) * 10) / 10
    const allActiveDays = new Set(moments.map(m => new Date(m.created_at).toISOString().split('T')[0]))
    const avgMomentsPerDay = Math.round((totalMoments / allActiveDays.size) * 10) / 10
    const avgMoodsPerMoment = momentsWithMoods > 0
      ? Math.round((Object.values(moodCounts).reduce((a, b) => a + b, 0) / momentsWithMoods) * 10) / 10
      : 0

    // ── Streaks (consecutive days with moments, per user) ────────
    const streaks = perUser.map(u => {
      const userMoments = userMap[uniqueUsers.find(uid => uid.slice(0, 8) === u.userId)!]
      const days = [...new Set(userMoments.map(m => new Date(m.created_at).toISOString().split('T')[0]))].sort()
      let maxStreak = 1, currentStreak = 1
      for (let i = 1; i < days.length; i++) {
        const prev = new Date(days[i - 1])
        const curr = new Date(days[i])
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays === 1) {
          currentStreak++
          maxStreak = Math.max(maxStreak, currentStreak)
        } else {
          currentStreak = 1
        }
      }
      return { userId: u.userId, maxStreak, totalDays: days.length }
    })

    return NextResponse.json({
      empty: false,
      totalMoments,
      totalUsers,
      avgMomentsPerUser,
      avgMomentsPerDay,
      avgMoodsPerMoment,
      captionRate: Math.round((momentsWithCaption / totalMoments) * 100),
      moodTagRate: Math.round((momentsWithMoods / totalMoments) * 100),
      byType,
      moods: moodsSorted,
      perUser,
      streaks,
      timeOfDay: hourBuckets,
      hourly,
      dayOfWeek,
      dailyTimeline,
      totalActiveDays: allActiveDays.size,
      dateRange: {
        first: moments[0].created_at,
        last: moments[moments.length - 1].created_at,
      },
    })
  } catch (err) {
    console.error('Analytics error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
