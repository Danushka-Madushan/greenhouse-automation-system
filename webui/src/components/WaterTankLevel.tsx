import { Card } from '@heroui/react'
import { Droplet, AlertTriangle } from 'lucide-react'

interface WaterTankLevelProps {
  level: number // 0 to 100
}

export const WaterTankLevel = ({ level }: WaterTankLevelProps) => {
  const capacity = 2000;
  const currentVolume = Math.round((level / 100) * capacity);
  
  let statusColor = "text-emerald-600 dark:text-emerald-400";
  let statusText = "Optimal";
  let waterBg = "bg-blue-500/80 dark:bg-blue-600/80";
  
  if (level < 20) {
    statusColor = "text-rose-600 dark:text-rose-400";
    statusText = "Low Level";
    waterBg = "bg-rose-500/80 dark:bg-rose-600/80";
  } else if (level > 90) {
    statusColor = "text-amber-500";
    statusText = "Nearly Full";
    waterBg = "bg-cyan-500/80 dark:bg-cyan-600/80";
  }

  return (
    <Card className="rounded-3xl border border-m3-outline bg-m3-surface-variant/40 p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
      <Card.Header className="flex flex-row items-center justify-between pb-2">
        <div>
          <Card.Title className="text-lg font-bold text-foreground">Water Tank</Card.Title>
          <Card.Description className="text-xs text-muted">Primary irrigation source</Card.Description>
        </div>
        <div className="p-2 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
          <Droplet className="size-5" />
        </div>
      </Card.Header>
      
      <Card.Content className="flex flex-col items-center py-4">
        {/* Tank Container */}
        <div className="relative w-28 h-40 border-4 border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-inner flex flex-col justify-end">
          {/* Water level fill */}
          <div 
            className={`w-full ${waterBg} transition-all duration-500 ease-out relative`}
            style={{ height: `${level}%` }}
          >
            {/* Soft wave overlay */}
            <div className="absolute top-0 left-0 w-full h-2 bg-white/20 -translate-y-1 animate-pulse" />
          </div>
          
          {/* Digital reading overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 drop-shadow-sm">
              {level}%
            </span>
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
              {currentVolume}L / {capacity}L
            </span>
          </div>
        </div>
      </Card.Content>
      
      <Card.Footer className="flex flex-col gap-1 items-start mt-2 border-t border-m3-outline/30 pt-3">
        <div className="flex w-full justify-between items-center text-sm">
          <span className="text-muted">Status:</span>
          <span className={`font-semibold ${statusColor} flex items-center gap-1`}>
            {level < 20 && <AlertTriangle className="size-3.5" />}
            {statusText}
          </span>
        </div>
        <div className="flex w-full justify-between items-center text-xs text-muted">
          <span>Flow Rate:</span>
          <span className="font-medium text-foreground">120 L/hr</span>
        </div>
      </Card.Footer>
    </Card>
  )
}
