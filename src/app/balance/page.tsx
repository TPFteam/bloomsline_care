'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Scale,
  Sun,
  Moon,
  Droplets,
  Wind,
  Heart,
  Brain,
  Zap,
  TrendingUp,
  Plus,
  Check,
} from 'lucide-react'
import MemberLayout from '@/components/member/MemberLayout'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'

interface BalanceArea {
  id: string
  icon: React.ElementType
  labelEn: string
  labelFr: string
  color: string
  bgColor: string
  value: number
}

const balanceAreas: BalanceArea[] = [
  { id: 'sleep', icon: Moon, labelEn: 'Sleep', labelFr: 'Sommeil', color: 'text-indigo-600', bgColor: 'bg-indigo-100', value: 7 },
  { id: 'hydration', icon: Droplets, labelEn: 'Hydration', labelFr: 'Hydratation', color: 'text-cyan-600', bgColor: 'bg-cyan-100', value: 6 },
  { id: 'movement', icon: Zap, labelEn: 'Movement', labelFr: 'Mouvement', color: 'text-amber-600', bgColor: 'bg-amber-100', value: 5 },
  { id: 'mindfulness', icon: Brain, labelEn: 'Mindfulness', labelFr: 'Pleine conscience', color: 'text-purple-600', bgColor: 'bg-purple-100', value: 8 },
  { id: 'connection', icon: Heart, labelEn: 'Connection', labelFr: 'Connexion', color: 'text-rose-600', bgColor: 'bg-rose-100', value: 6 },
  { id: 'nature', icon: Wind, labelEn: 'Nature', labelFr: 'Nature', color: 'text-emerald-600', bgColor: 'bg-emerald-100', value: 4 },
]

const dailyHabits = [
  { id: '1', labelEn: 'Morning meditation', labelFr: 'Méditation matinale', completed: true },
  { id: '2', labelEn: 'Drink 8 glasses of water', labelFr: 'Boire 8 verres d\'eau', completed: false },
  { id: '3', labelEn: '30 min walk', labelFr: '30 min de marche', completed: true },
  { id: '4', labelEn: 'Screen-free hour before bed', labelFr: 'Heure sans écran avant le coucher', completed: false },
]

export default function BalancePage() {
  const { locale } = useLanguage()
  const [habits, setHabits] = useState(dailyHabits)

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h =>
      h.id === id ? { ...h, completed: !h.completed } : h
    ))
  }

  const overallBalance = Math.round(
    balanceAreas.reduce((sum, area) => sum + area.value, 0) / balanceAreas.length
  )

  const completedHabits = habits.filter(h => h.completed).length

  return (
    <MemberLayout>
      <div className="px-5 pt-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {locale === 'fr' ? 'Votre Équilibre' : 'Your Balance'}
          </h1>
          <p className="text-gray-500">
            {locale === 'fr'
              ? 'Prenez soin de chaque aspect de votre bien-être'
              : 'Nurture every aspect of your well-being'}
          </p>
        </motion.div>

        {/* Overall Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-teal-500 via-emerald-500 to-green-500 rounded-3xl p-6 text-white mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm mb-1">
                {locale === 'fr' ? 'Score d\'équilibre' : 'Balance Score'}
              </p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold">{overallBalance}</span>
                <span className="text-2xl text-teal-200 mb-1">/10</span>
              </div>
              <p className="text-teal-100 text-sm mt-2">
                {overallBalance >= 7
                  ? (locale === 'fr' ? 'Excellent équilibre!' : 'Great balance!')
                  : overallBalance >= 5
                    ? (locale === 'fr' ? 'Bon travail, continuez' : 'Good work, keep going')
                    : (locale === 'fr' ? 'Prenez soin de vous' : 'Take care of yourself')}
              </p>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <Scale className="w-10 h-10" />
            </div>
          </div>
        </motion.div>

        {/* Balance Areas Grid */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {locale === 'fr' ? 'Domaines de vie' : 'Life Areas'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {balanceAreas.map((area, idx) => {
              const Icon = area.icon
              return (
                <motion.div
                  key={area.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${area.bgColor} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${area.color}`} />
                    </div>
                    <span className="font-medium text-gray-900 text-sm">
                      {locale === 'fr' ? area.labelFr : area.labelEn}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${area.value * 10}%` }}
                        transition={{ delay: 0.3 + idx * 0.05, duration: 0.5 }}
                        className={`h-full rounded-full ${
                          area.value >= 7 ? 'bg-emerald-500' :
                          area.value >= 5 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-6">{area.value}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Daily Habits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {locale === 'fr' ? 'Habitudes du jour' : 'Daily Habits'}
            </h3>
            <span className="text-sm text-emerald-600 font-medium">
              {completedHabits}/{habits.length}
            </span>
          </div>

          <div className="space-y-3">
            {habits.map((habit, idx) => (
              <motion.button
                key={habit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                onClick={() => toggleHabit(habit.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  habit.completed
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-gray-300'
                }`}>
                  {habit.completed && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className={`flex-1 text-left text-sm ${
                  habit.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                }`}>
                  {locale === 'fr' ? habit.labelFr : habit.labelEn}
                </span>
              </motion.button>
            ))}
          </div>

          <Button
            variant="ghost"
            className="w-full mt-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Ajouter une habitude' : 'Add habit'}
          </Button>
        </motion.div>

        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-5 border border-purple-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {locale === 'fr' ? 'Tendance positive' : 'Positive Trend'}
              </h4>
              <p className="text-sm text-gray-600">
                {locale === 'fr'
                  ? 'Votre équilibre s\'améliore cette semaine!'
                  : 'Your balance is improving this week!'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </MemberLayout>
  )
}
