import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-client'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch all moments (admin bypasses RLS)
    // Snapshot cutoff: only include moments up to 23 Feb 2026
    const { data: moments, error } = await supabase
      .from('moments')
      .select('id, user_id, type, moods, caption, text_content, duration_seconds, file_size_bytes, mime_type, created_at')
      .lte('created_at', '2026-02-23T23:59:59+00:00')
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

    // ── Retention curve (% users active on day N after first moment) ──
    const retentionDays = [1, 2, 3, 5, 7, 14, 21, 30]
    const retention = retentionDays.map(dayN => {
      let retained = 0
      for (const uid of uniqueUsers) {
        const userMoments = userMap[uid]
        const firstDate = new Date(userMoments[0].created_at)
        const targetDate = new Date(firstDate)
        targetDate.setDate(targetDate.getDate() + dayN)
        const targetDay = targetDate.toISOString().split('T')[0]
        const activeDays = new Set(userMoments.map(m => new Date(m.created_at).toISOString().split('T')[0]))
        if (activeDays.has(targetDay)) retained++
      }
      return { day: dayN, retained, total: totalUsers, pct: Math.round((retained / totalUsers) * 100) }
    })

    // ── Activation funnel (% users who reached N moments) ───────────
    const activationThresholds = [1, 2, 3, 5, 10, 20, 50]
    const activation = activationThresholds.map(n => {
      const count = perUser.filter(u => u.total >= n).length
      return { threshold: n, count, pct: Math.round((count / totalUsers) * 100) }
    })

    // ── Engagement depth over time (weekly averages) ────────────────
    const weeklyEngagement: { week: string; avgMoments: number; activeUsers: number }[] = []
    const firstEver = new Date(moments[0].created_at)
    const lastEver = new Date(moments[moments.length - 1].created_at)
    const weekStart = new Date(firstEver)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // start of week
    while (weekStart <= lastEver) {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      const weekLabel = `${weekStart.toISOString().split('T')[0]}`
      const weekMoments = moments.filter(m => {
        const d = new Date(m.created_at)
        return d >= weekStart && d < weekEnd
      })
      const weekUsers = new Set(weekMoments.map(m => m.user_id))
      weeklyEngagement.push({
        week: weekLabel,
        avgMoments: weekUsers.size > 0 ? Math.round((weekMoments.length / weekUsers.size) * 10) / 10 : 0,
        activeUsers: weekUsers.size,
      })
      weekStart.setDate(weekStart.getDate() + 7)
    }

    // ── Power user analysis ────────────────────────────────────────
    const powerUsers = perUser.filter(u => u.total >= 10).length
    const casualUsers = perUser.filter(u => u.total >= 3 && u.total < 10).length
    const trialUsers = perUser.filter(u => u.total < 3).length

    // ── Predictive signals: what early behavior predicts retention ──
    const usersWithDay1Multi = perUser.filter(u => {
      const uid = uniqueUsers.find(id => id.slice(0, 8) === u.userId)!
      const userMoments = userMap[uid]
      const firstDay = new Date(userMoments[0].created_at).toISOString().split('T')[0]
      const day1Count = userMoments.filter(m => new Date(m.created_at).toISOString().split('T')[0] === firstDay).length
      return day1Count >= 2
    })
    const day1MultiRetained = usersWithDay1Multi.filter(u => u.activeDays >= 3).length
    const day1SingleUsers = perUser.filter(u => !usersWithDay1Multi.includes(u))
    const day1SingleRetained = day1SingleUsers.filter(u => u.activeDays >= 3).length

    const usersWithMoodTag = perUser.filter(u => u.topMood !== null)
    const moodTagRetained = usersWithMoodTag.filter(u => u.activeDays >= 3).length
    const noMoodUsers = perUser.filter(u => u.topMood === null)
    const noMoodRetained = noMoodUsers.filter(u => u.activeDays >= 3).length

    const usersWithCaption = perUser.filter(u => u.captionRate > 0)
    const captionRetained = usersWithCaption.filter(u => u.activeDays >= 3).length
    const noCaptionUsers = perUser.filter(u => u.captionRate === 0)
    const noCaptionRetained = noCaptionUsers.filter(u => u.activeDays >= 3).length

    const signals = [
      {
        signal: '2+ moments on day 1',
        withSignal: usersWithDay1Multi.length,
        withSignalRetained: day1MultiRetained,
        withSignalPct: usersWithDay1Multi.length > 0 ? Math.round((day1MultiRetained / usersWithDay1Multi.length) * 100) : 0,
        withoutSignal: day1SingleUsers.length,
        withoutSignalRetained: day1SingleRetained,
        withoutSignalPct: day1SingleUsers.length > 0 ? Math.round((day1SingleRetained / day1SingleUsers.length) * 100) : 0,
      },
      {
        signal: 'Tagged a mood',
        withSignal: usersWithMoodTag.length,
        withSignalRetained: moodTagRetained,
        withSignalPct: usersWithMoodTag.length > 0 ? Math.round((moodTagRetained / usersWithMoodTag.length) * 100) : 0,
        withoutSignal: noMoodUsers.length,
        withoutSignalRetained: noMoodRetained,
        withoutSignalPct: noMoodUsers.length > 0 ? Math.round((noMoodRetained / noMoodUsers.length) * 100) : 0,
      },
      {
        signal: 'Wrote a caption/note',
        withSignal: usersWithCaption.length,
        withSignalRetained: captionRetained,
        withSignalPct: usersWithCaption.length > 0 ? Math.round((captionRetained / usersWithCaption.length) * 100) : 0,
        withoutSignal: noCaptionUsers.length,
        withoutSignalRetained: noCaptionRetained,
        withoutSignalPct: noCaptionUsers.length > 0 ? Math.round((noCaptionRetained / noCaptionUsers.length) * 100) : 0,
      },
    ]

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
      retention,
      activation,
      weeklyEngagement,
      userSegments: { powerUsers, casualUsers, trialUsers },
      signals,
    })
  } catch (err) {
    console.error('Analytics error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
