import { useI18n } from '../i18n'
import { BookOpen } from 'lucide-react'

// The 10 agent profiles reported by `cao profile list`. Names/roles are fixed;
// descriptions are trimmed from `cao profile list` output for this project.
type ProfileRow = { name: string; role: 'supervisor' | 'developer' | 'reviewer' | 'builtin'; desc: string }
const PROFILES: ProfileRow[] = [
  { name: 'code_supervisor', role: 'supervisor', desc: 'Supervisor code trong hệ thống đa-agent (điều phối dev/reviewer).' },
  { name: 'developer', role: 'developer', desc: 'Agent lập trình viên — implement tính năng.' },
  { name: 'memory_manager', role: 'builtin', desc: 'Quản lý context/memory cho worker agents.' },
  { name: 'reviewer', role: 'reviewer', desc: 'Agent review code (độc lập, read-only).' },
  { name: 'web_developer', role: 'developer', desc: 'Implement tính năng web UI CAO (React/TS/Vite/Tailwind).' },
  { name: 'web_documenter', role: 'developer', desc: 'Viết/cập nhật docs cho tính năng.' },
  { name: 'web_feature_supervisor', role: 'supervisor', desc: 'Supervisor điều phối luồng build tính năng web end-to-end.' },
  { name: 'web_reviewer', role: 'reviewer', desc: 'Review code web 5 chiều (adapt từ addyosmani).' },
  { name: 'web_tester', role: 'developer', desc: 'Viết/chạy test tính năng web.' },
  { name: 'workflow_scout', role: 'builtin', desc: 'Tìm kiếm các workflow spec CAO có sẵn.' },
]

const ROLE_CLASS: Record<ProfileRow['role'], string> = {
  supervisor: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30',
  developer: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
  reviewer: 'bg-amber-600/20 text-amber-300 border-amber-600/30',
  builtin: 'bg-gray-600/20 text-gray-300 border-gray-600/30',
}

export function GuidePanel() {
  const { t } = useI18n()
  const g = t.guide

  const roleLabel: Record<ProfileRow['role'], string> = {
    supervisor: g.roleSupervisor,
    developer: g.roleDeveloper,
    reviewer: g.roleReviewer,
    builtin: g.roleBuiltin,
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={20} className="text-emerald-400" />
        <h2 className="text-xl font-bold text-white">{g.title}</h2>
      </div>
      <p className="text-sm text-gray-400 mb-6">{g.intro}</p>

      {/* 1. Overview */}
      <Section n={g.sectionOverview} body={g.overviewText} />

      {/* 2. Profiles */}
      <section className="mb-6">
        <h3 className="text-base font-semibold text-white mb-1">{g.sectionProfiles}</h3>
        <p className="text-sm text-gray-400 mb-3">{g.profilesText}</p>
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/60 text-gray-300">
              <tr>
                <th className="text-left px-3 py-2 font-medium">{g.colName}</th>
                <th className="text-left px-3 py-2 font-medium w-28">{g.colRole}</th>
                <th className="text-left px-3 py-2 font-medium">{g.colDesc}</th>
              </tr>
            </thead>
            <tbody>
              {PROFILES.map((p) => (
                <tr key={p.name} className="border-t border-gray-800">
                  <td className="px-3 py-2 font-mono text-emerald-300 text-xs">{p.name}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs border ${ROLE_CLASS[p.role]}`}>
                      {roleLabel[p.role]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-300">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Run */}
      <section className="mb-6">
        <h3 className="text-base font-semibold text-white mb-1">{g.sectionRun}</h3>
        <p className="text-sm text-gray-400 mb-3">{g.runText}</p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
          <li>
            {g.runStep1}
            <pre className="mt-1 bg-gray-900 border border-gray-800 rounded-md p-3 text-emerald-300 text-xs overflow-x-auto">agent-run</pre>
          </li>
          <li>
            {g.runStep2}
            <pre className="mt-1 bg-gray-900 border border-gray-800 rounded-md p-3 text-emerald-300 text-xs overflow-x-auto">
              Add a "session count" badge to the CAO web UI top header showing how many sessions are listed.
            </pre>
          </li>
          <li>{g.runStep3}</li>
        </ol>
      </section>

      {/* 4. Flow */}
      <Section n={g.sectionFlow} body={g.flowText} />

      {/* 5. FAQ */}
      <section className="mb-2">
        <h3 className="text-base font-semibold text-white mb-2">{g.sectionFaq}</h3>
        <div className="space-y-3">
          <Faq q={g.faq1Q} a={g.faq1A} />
          <Faq q={g.faq2Q} a={g.faq2A} />
          <Faq q={g.faq3Q} a={g.faq3A} />
        </div>
      </section>
    </div>
  )
}

function Section({ n, body }: { n: string; body: string }) {
  return (
    <section className="mb-6">
      <h3 className="text-base font-semibold text-white mb-1">{n}</h3>
      <p className="text-sm text-gray-400">{body}</p>
    </section>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
      <div className="text-sm font-medium text-white mb-1">{q}</div>
      <div className="text-sm text-gray-400">{a}</div>
    </div>
  )
}
