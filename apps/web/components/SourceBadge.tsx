import { Database, FileText, Upload, Globe, Bot, type LucideIcon } from 'lucide-react'
import { SOURCE_LABEL } from '@/constants/specCategories'

export const SOURCE_ICON: Record<string, LucideIcon> = {
  db_cache: Database, pdf_oficial: FileText, pdf_upload: Upload, web_scraping: Globe, ia_generated: Bot,
}

export function SourceBadge({ source, detail, className = '' }: { source: string; detail?: string | null; className?: string }) {
  const info = SOURCE_LABEL[source]
  const Icon = SOURCE_ICON[source]
  if (!info) return null

  return (
    <div className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-2 ${className}`}
      style={{ backgroundColor: `${info.color}20`, borderColor: info.color }}>
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: info.color }} />}
      <span className="text-xs font-semibold" style={{ color: info.color }}>{info.text}</span>
      {detail && <span className="text-xs" style={{ color: info.color }}>· {detail}</span>}
    </div>
  )
}
