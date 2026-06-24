import { Card, Button } from '@heroui/react'
import { BarChart3, BellRing, Sparkles } from 'lucide-react'

export const AnalyticsEmpty = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 max-w-xl mx-auto text-center">
      <Card className="rounded-3xl border border-m3-outline bg-m3-surface-variant/40 p-8 shadow-sm max-w-lg w-full">
        <Card.Header className="flex flex-col items-center gap-3 pb-4">
          <div className="p-4 rounded-3xl bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 relative">
            <BarChart3 className="size-8 animate-pulse" />
            <Sparkles className="absolute -top-1 -right-1 size-4 text-amber-500" />
          </div>
          <Card.Title className="text-xl font-bold mt-2">Greenhouse Analytics</Card.Title>
          <Card.Description className="text-sm text-muted">
            Track growth trends, micro-climate stability, and automated watering cycles.
          </Card.Description>
        </Card.Header>
        
        <Card.Content className="py-4">
          <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-400 bg-m3-surface-variant/30 p-4 rounded-2xl border border-m3-outline/20">
            <div className="flex items-center gap-3 text-left">
              <div className="size-2 rounded-full bg-emerald-500 shrink-0" />
              <span><strong>Yield Prediction:</strong> ML models mapping PAR & VPD to crop growth rate.</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="size-2 rounded-full bg-blue-500 shrink-0" />
              <span><strong>Water Consumption:</strong> Track exact Liters irrigated vs soil saturation rates.</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="size-2 rounded-full bg-amber-500 shrink-0" />
              <span><strong>Anomalies detection:</strong> Automatic alerts for climate spikes or valve failures.</span>
            </div>
          </div>
        </Card.Content>
        
        <Card.Footer className="flex justify-center mt-4">
          <Button className="rounded-2xl flex items-center gap-2">
            <BellRing className="size-4" />
            Notify Me When Ready
          </Button>
        </Card.Footer>
      </Card>
    </div>
  )
}
