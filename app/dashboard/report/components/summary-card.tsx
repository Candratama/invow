import { Card, CardContent } from '@/components/ui/card'

interface SummaryCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
