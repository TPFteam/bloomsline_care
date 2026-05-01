export default function NotificationFlowsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Flows</h1>
        <p className="text-gray-500 mb-10">How emails and notifications work across all booking scenarios</p>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-8 text-sm">
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> Google Calendar</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-teal-500" /> Bloomsline (Postmark)</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-violet-500" /> In-app notification</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-300" /> Nothing sent</span>
        </div>

        {/* Flow 1 */}
        <Section title="1. Practitioner books a session" subtitle="From dashboard / member profile">
          <Row
            scenario="Calendar mode (future session)"
            practitioner={<Tag color="blue">Google Calendar invite</Tag>}
            patient={<Tag color="blue">Google Calendar invite + Meet link</Tag>}
            notes="sendUpdates=all — Google sends invite to both parties"
          />
          <Row
            scenario="Manual mode"
            practitioner={<Tag color="gray">Nothing</Tag>}
            patient={<Tag color="gray">Nothing</Tag>}
            notes="No Google sync, no emails. Session logged internally only."
          />
          <Row
            scenario="Backdated session (past date)"
            practitioner={<Tag color="gray">Nothing</Tag>}
            patient={<Tag color="gray">Nothing</Tag>}
            notes="sendUpdates=none — historical record, no notifications"
          />
        </Section>

        {/* Flow 2 */}
        <Section title="2. Patient books a session" subtitle="From public booking page (/practitioner/[slug]/book)">
          <Row
            scenario="Auto-confirmed (no approval needed)"
            practitioner={
              <div className="flex flex-col gap-1">
                <Tag color="teal">Bloomsline email: &quot;New booking&quot;</Tag>
                <Tag color="violet">In-app notification</Tag>
                <Tag color="blue">Google Calendar invite</Tag>
              </div>
            }
            patient={<Tag color="blue">Google Calendar invite + Meet link</Tag>}
            notes="Practitioner gets Bloomsline email + Google invite. Patient gets Google invite only."
          />
          <Row
            scenario="Approval required"
            practitioner={
              <div className="flex flex-col gap-1">
                <Tag color="teal">Bloomsline email: &quot;New booking request&quot;</Tag>
                <Tag color="violet">In-app notification</Tag>
              </div>
            }
            patient={<Tag color="gray">Nothing (until approved)</Tag>}
            notes="No Google event created yet. Patient waits for approval."
          />
        </Section>

        {/* Flow 3 */}
        <Section title="3. Practitioner approves pending booking">
          <Row
            scenario="Approve"
            practitioner={<Tag color="blue">Google Calendar invite</Tag>}
            patient={<Tag color="blue">Google Calendar invite + Meet link</Tag>}
            notes="Google event created with sendUpdates=all on approval"
          />
          <Row
            scenario="Reject"
            practitioner={<Tag color="gray">Nothing</Tag>}
            patient={<Tag color="gray">Nothing</Tag>}
            notes="Booking cancelled. No notifications sent."
          />
        </Section>

        {/* Flow 4 */}
        <Section title="4. Cancellations">
          <Row
            scenario="Practitioner cancels"
            practitioner={<Tag color="gray">Nothing</Tag>}
            patient={<Tag color="blue">Google cancellation email</Tag>}
            notes="Google event deleted with sendUpdates=all. Description updated with reason before deletion."
          />
          <Row
            scenario="Patient cancels"
            practitioner={
              <div className="flex flex-col gap-1">
                <Tag color="teal">Bloomsline email: &quot;Session cancelled&quot;</Tag>
                <Tag color="violet">In-app notification</Tag>
              </div>
            }
            patient={<Tag color="blue">Google cancellation email</Tag>}
            notes="Practitioner gets Bloomsline email because Google doesn't notify calendar owners on event deletion."
          />
        </Section>

        {/* Flow 5 */}
        <Section title="5. Reschedules">
          <Row
            scenario="Practitioner reschedules"
            practitioner={<Tag color="blue">Google: cancel old + new invite</Tag>}
            patient={<Tag color="blue">Google: cancel old + new invite</Tag>}
            notes="Old event deleted, new event created. Both with sendUpdates=all."
          />
          <Row
            scenario="Patient reschedules (auto-confirmed)"
            practitioner={
              <div className="flex flex-col gap-1">
                <Tag color="violet">In-app notification</Tag>
                <Tag color="blue">Google: cancel old + new invite</Tag>
              </div>
            }
            patient={<Tag color="blue">Google: cancel old + new invite</Tag>}
            notes="Practitioner gets in-app notification about the reschedule."
          />
          <Row
            scenario="Patient reschedules (needs approval)"
            practitioner={<Tag color="gray">Nothing</Tag>}
            patient={<Tag color="gray">Nothing</Tag>}
            notes="Old booking cancelled, new one created as pending. No events until approved."
          />
        </Section>

        {/* Technical details */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Bloomsline Emails (Postmark)</h3>
              <ul className="space-y-1 text-gray-600">
                <li>- <code className="text-xs bg-gray-100 px-1 rounded">booking_request</code> &rarr; practitioner when patient books</li>
                <li>- <code className="text-xs bg-gray-100 px-1 rounded">booking_cancelled_by_member</code> &rarr; practitioner when patient cancels</li>
                <li className="text-gray-400 mt-2">That&apos;s it. Only 2 email types from our side.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Google Calendar API</h3>
              <ul className="space-y-1 text-gray-600">
                <li>- <code className="text-xs bg-gray-100 px-1 rounded">sendUpdates=all</code> &rarr; future sessions (sends invites)</li>
                <li>- <code className="text-xs bg-gray-100 px-1 rounded">sendUpdates=none</code> &rarr; backdated sessions (silent)</li>
                <li>- <code className="text-xs bg-gray-100 px-1 rounded">conferenceDataVersion=1</code> &rarr; auto-creates Meet link</li>
                <li>- Attendee: patient email only (practitioner is calendar owner)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">In-App Notifications</h3>
              <ul className="space-y-1 text-gray-600">
                <li>- <code className="text-xs bg-gray-100 px-1 rounded">booking_request</code></li>
                <li>- <code className="text-xs bg-gray-100 px-1 rounded">booking_cancelled_by_member</code></li>
                <li>- <code className="text-xs bg-gray-100 px-1 rounded">booking_rescheduled_by_member</code></li>
                <li className="text-gray-400 mt-2">All go to practitioner only. Patient has no in-app notifications.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">What We Could Customize</h3>
              <ul className="space-y-1 text-gray-600">
                <li>- Toggle <code className="text-xs bg-gray-100 px-1 rounded">sendUpdates</code> per scenario</li>
                <li>- Add Bloomsline confirmation email to patient</li>
                <li>- Add SMS notifications (Twilio)</li>
                <li>- Add WhatsApp notifications</li>
                <li>- Let practitioner disable Google invites per booking</li>
                <li>- Add reminder emails (24h before, 1h before)</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">Internal reference page &middot; Bloomsline Care</p>
      </div>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mb-3">{subtitle}</p>}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        <div className="grid grid-cols-[1fr_1fr_1fr] px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <span>Scenario</span>
          <span>Practitioner gets</span>
          <span>Patient gets</span>
        </div>
        {children}
      </div>
    </div>
  )
}

function Row({ scenario, practitioner, patient, notes }: { scenario: string; practitioner: React.ReactNode; patient: React.ReactNode; notes?: string }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr] px-4 py-3 items-start gap-2">
      <div>
        <p className="text-sm font-medium text-gray-900">{scenario}</p>
        {notes && <p className="text-xs text-gray-400 mt-1">{notes}</p>}
      </div>
      <div>{practitioner}</div>
      <div>{patient}</div>
    </div>
  )
}

function Tag({ color, children }: { color: 'blue' | 'teal' | 'violet' | 'gray'; children: React.ReactNode }) {
  const styles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    gray: 'bg-gray-50 text-gray-500 border-gray-200',
  }
  return (
    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-lg border ${styles[color]}`}>
      {children}
    </span>
  )
}
