import { Card, CardContent } from '@/components/ui/card'

interface SummaryCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-base font-bold mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
