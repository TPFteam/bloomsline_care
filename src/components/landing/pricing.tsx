'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles, Rocket, Building2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    price: '$299',
    period: '/month',
    icon: Sparkles,
    color: 'mint',
    features: [
      'Up to 50 service requests/month',
      '5 partner connections',
      'Basic workflow automation',
      'Real-time messaging',
      'Performance dashboards',
      'Email support',
      '99.5% uptime SLA',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    description: 'For growing businesses scaling operations',
    price: '$799',
    period: '/month',
    icon: Rocket,
    color: 'lavender',
    features: [
      'Up to 500 service requests/month',
      'Unlimited partner connections',
      'Advanced workflow builder',
      'AI-powered matching',
      'Custom integrations (5)',
      'Priority support',
      '99.9% uptime SLA',
      'Advanced analytics',
      'Multi-location support',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with complex needs',
    price: 'Custom',
    period: '',
    icon: Building2,
    color: 'peach',
    features: [
      'Unlimited service requests',
      'Unlimited partner connections',
      'Custom workflow engine',
      'Dedicated AI model training',
      'Unlimited integrations',
      'Dedicated account manager',
      '99.99% uptime SLA',
      'Custom analytics & reporting',
      'White-label options',
      'On-premise deployment',
      'Custom compliance support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

const colorClasses = {
  mint: {
    bg: 'bg-mint-100',
    icon: 'text-mint-600',
    border: 'border-mint-200',
    button: 'from-mint-500 to-mint-600 hover:from-mint-600 hover:to-mint-700 shadow-mint-500/20',
    badge: 'bg-mint-500',
  },
  lavender: {
    bg: 'bg-lavender-100',
    icon: 'text-lavender-600',
    border: 'border-lavender-200',
    button: 'from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 shadow-lavender-500/20',
    badge: 'bg-lavender-500',
  },
  peach: {
    bg: 'bg-peach-100',
    icon: 'text-peach-600',
    border: 'border-peach-200',
    button: 'from-peach-500 to-peach-600 hover:from-peach-600 hover:to-peach-700 shadow-peach-500/20',
    badge: 'bg-peach-500',
  },
}

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-background via-lavender-50/20 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-mint-600 to-lavender-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day free trial with no credit card required.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const colors = colorClasses[plan.color as keyof typeof colorClasses]

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className={`${colors.badge} text-white px-4 py-1 shadow-lg`}>
                      Most Popular
                    </Badge>
                  </div>
                )}

                <Card
                  className={`h-full p-8 bg-white/60 backdrop-blur-sm border-2 ${
                    plan.popular ? colors.border : 'border-border'
                  } ${plan.popular ? 'shadow-2xl scale-105' : 'shadow-lg'} transition-all duration-300 hover:shadow-xl`}
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center mb-6`}>
                    <plan.icon className={`w-7 h-7 ${colors.icon}`} />
                  </div>

                  {/* Plan Name & Description */}
                  <h3 className="text-2xl font-bold mb-2 text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-8">
                    <span className="text-5xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground ml-2">
                        {plan.period}
                      </span>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full mb-8 ${
                      plan.popular
                        ? `bg-gradient-to-r ${colors.button} shadow-lg`
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {plan.cta}
                  </Button>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors.icon}`} />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-4">
            All plans include 14-day free trial • No credit card required • Cancel anytime
          </p>
          <p className="text-sm text-muted-foreground">
            Need a custom solution?{' '}
            <a href="#" className="text-mint-600 hover:text-mint-700 font-medium underline">
              Contact our sales team
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
