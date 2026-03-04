# Financial Model (Interactive)

**Route:** `/financial-model`
**Interactive 36-month financial model with 4 scenario presets, editable assumptions, revenue/growth/expense/runway charts, quarterly P&L, unit economics dashboard**

---

## Constants

| Item | Value |
|------|-------|
| Essentiel tier | €19/mo |
| Pro tier | €29/mo |
| Cabinet tier | €49/mo |
| Member premium | €3/mo |
| Variable cost (total) | €4.25/practitioner/mo |
| — AI (Claude Haiku) | €1.80 (42.4%) |
| — Infra (Supabase + Hosting + PostHog + Email) | €0.95 (22.4%) |
| — Support & onboarding | €1.50 (35.3%) |

---

## Scenario Presets

### Conservative
| Assumption | Value |
|-----------|-------|
| Starting practitioners | 10 |
| Initial growth | 20%/mo |
| End growth (M36) | 5%/mo |
| Monthly churn | 5% |
| Tier mix | 55% Essentiel / 35% Pro / 10% Cabinet |
| Members per practitioner | 10 |
| Member premium conversion | 3% |
| Variable cost/practitioner | €4.25/mo |
| CAC | €60 |
| Team cost | €8,000/mo (2 founders €4K + dev part-time €2K + sales €1.5K + expert €500) |
| Team step-up | +€2,000 every 6 months |
| CAC growth | +10%/quarter |
| Infra cost | €100/mo |
| Marketing cost | €800/mo |
| Other costs | €500/mo |
| Starting cash | €300,000 |
| Dilution | 17% |
| Use of funds | Product 40% / GTM 25% / Team 25% / Ops 10% |

### Base Case
| Assumption | Value |
|-----------|-------|
| Starting practitioners | 10 |
| Initial growth | 30%/mo |
| End growth (M36) | 7%/mo |
| Monthly churn | 4% |
| Tier mix | 20% Essentiel / 70% Pro / 10% Cabinet |
| Members per practitioner | 12 |
| Member premium conversion | 5% |
| Variable cost/practitioner | €4.25/mo |
| CAC | €50 |
| Team cost | €10,500/mo (2 founders €5K + dev €2.5K + sales €2K + expert €1K) |
| Team step-up | +€2,500 every 6 months |
| CAC growth | +7%/quarter |
| Infra cost | €200/mo |
| Marketing cost | €1,200/mo |
| Other costs | €700/mo |
| Starting cash | €400,000 |
| Dilution | 15% |
| Use of funds | Product 40% / GTM 30% / Team 20% / Ops 10% |

### Aggressive
| Assumption | Value |
|-----------|-------|
| Starting practitioners | 10 |
| Initial growth | 35%/mo |
| End growth (M36) | 7%/mo |
| Monthly churn | 3% |
| Tier mix | 10% Essentiel / 55% Pro / 35% Cabinet |
| Members per practitioner | 15 |
| Member premium conversion | 8% |
| Variable cost/practitioner | €4.25/mo |
| CAC | €50 |
| Team cost | €14,500/mo (2 founders €6K + dev full-time €3.5K + sales €2.5K + expert €1K + marketer €1.5K) |
| Team step-up | +€3,000 every 6 months |
| CAC growth | +5%/quarter |
| Infra cost | €300/mo |
| Marketing cost | €2,000/mo |
| Other costs | €1,000/mo |
| Starting cash | €500,000 |
| Dilution | 13% |
| Use of funds | Product 35% / GTM 30% / Team 25% / Ops 10% |

### Stress Test
| Assumption | Value |
|-----------|-------|
| Starting practitioners | 10 |
| Initial growth | 15%/mo |
| End growth (M36) | 3%/mo |
| Monthly churn | 7% |
| Tier mix | 55% Essentiel / 35% Pro / 10% Cabinet |
| Members per practitioner | 8 |
| Member premium conversion | 2% |
| Variable cost/practitioner | €4.25/mo |
| CAC | €70 |
| Team cost | €8,000/mo |
| Team step-up | +€2,000 every 6 months |
| CAC growth | +12%/quarter |
| Infra cost | €100/mo |
| Marketing cost | €800/mo |
| Other costs | €500/mo |
| Starting cash | €350,000 |
| Dilution | 17% |
| Use of funds | Product 40% / GTM 25% / Team 25% / Ops 10% |

---

## Model Mechanics

### Growth Model
- Growth rate decays linearly from `initialGrowthPct` to `endGrowthPct` over 36 months
- Formula: `growthRate(m) = initial + (end - initial) × ((m-1) / 35)`
- New practitioners each month = current × growthRate
- Churned practitioners = current × churnRate
- Net = max(1, current + new - churned)

### Revenue Calculation
- Blended ARPU = weighted average of tier prices by mix %
- B2B MRR = practitioners × blended ARPU
- B2C MRR = practitioners × members/practitioner × premiumConversion% × €3
- Total MRR = B2B + B2C
- ARR = MRR × 12

### Cost Model
- Variable costs = practitioners × €4.25/mo
- Gross profit = B2B MRR × gross margin + B2C MRR × 95% (near-zero variable cost)
- Team cost steps up by `teamCostStepUp` every `teamStepUpInterval` months
- CAC evolves: grows by `cacGrowthPctPerQuarter` each quarter (compounding)
- Fixed costs = team + infra + marketing + other
- Acquisition expense = new practitioners × current CAC
- Net burn = gross profit - (fixed costs + acquisition)
- Cumulative cash = starting cash + cumulative net burn

### Unit Economics Calculation
- LTV = total ARPU × average lifetime × gross margin
- Average lifetime = 1 / monthly churn rate
- CAC payback = CAC / monthly gross profit per practitioner
- Contribution margin = gross profit - (CAC / lifetime)
- Effective member CAC = practitioner CAC / members per practitioner

---

## Interactive Features
- All assumptions are editable via sliders/inputs
- 4 pre-built scenario presets (conservative, base, aggressive, stress)
- 4 charts: Revenue (MRR over 36 months), Growth (practitioners + members), Expenses (stacked by category), Runway (cumulative cash with break-even line)
- Quarterly P&L table (12 quarters)
- Unit economics dashboard (LTV, CAC, LTV/CAC ratio, payback, margins)
- Key milestones: runway months, break-even month, €100K ARR month, €1M ARR month, M18 practitioners & ARR
- Variable cost breakdown visualization (AI / Infra / Support proportions)
