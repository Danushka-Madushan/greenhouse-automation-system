import { Card } from '@heroui/react'
import { Sprout } from 'lucide-react'

interface SoilMoistureProps {
  sector1: number
  sector2: number
  sector3: number
  sector4: number
}

export const SoilMoisture = ({ sector1, sector2, sector3, sector4 }: SoilMoistureProps) => {
  const average = Math.round((sector1 + sector2 + sector3 + sector4) / 4);

  let statusText = "Optimal";
  let statusColor = "text-emerald-600 dark:text-emerald-400";
  
  if (average < 30) {
    statusText = "Dry - Irrigation Needed";
    statusColor = "text-rose-500";
  } else if (average > 80) {
    statusText = "Over-saturated";
    statusColor = "text-blue-500";
  }

  // Helper function to get color for a sector moisture level
  const getSectorStyle = (moisture: number) => {
    if (moisture < 30) {
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/30";
    } else if (moisture > 80) {
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30";
    } else {
      return "bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/20";
    }
  }

  return (
    <Card className="rounded-3xl border border-m3-outline bg-m3-surface-variant/40 p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
      <Card.Header className="flex flex-row items-center justify-between pb-2">
        <div>
          <Card.Title className="text-lg font-bold text-foreground">Soil Moisture</Card.Title>
          <Card.Description className="text-xs text-muted">Averaged greenhouse rootzone</Card.Description>
        </div>
        <div className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
          <Sprout className="size-5" />
        </div>
      </Card.Header>

      <Card.Content className="flex flex-col gap-4 py-3">
        {/* Average Display */}
        <div className="flex flex-col items-center">
          <span className="text-3xl font-extrabold text-foreground">{average}%</span>
          <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Average Level</span>
        </div>

        {/* 2x2 Sector Matrix */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${getSectorStyle(sector1)}`}>
            <span className="text-[10px] font-semibold opacity-85">NW Sector 1</span>
            <span className="text-sm font-bold mt-0.5">{sector1}%</span>
          </div>
          <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${getSectorStyle(sector2)}`}>
            <span className="text-[10px] font-semibold opacity-85">NE Sector 2</span>
            <span className="text-sm font-bold mt-0.5">{sector2}%</span>
          </div>
          <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${getSectorStyle(sector3)}`}>
            <span className="text-[10px] font-semibold opacity-85">SW Sector 3</span>
            <span className="text-sm font-bold mt-0.5">{sector3}%</span>
          </div>
          <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${getSectorStyle(sector4)}`}>
            <span className="text-[10px] font-semibold opacity-85">SE Sector 4</span>
            <span className="text-sm font-bold mt-0.5">{sector4}%</span>
          </div>
        </div>
      </Card.Content>

      <Card.Footer className="flex flex-col gap-1 items-start mt-2 border-t border-m3-outline/30 pt-3">
        <div className="flex w-full justify-between items-center text-sm">
          <span className="text-muted">Condition:</span>
          <span className={`font-semibold ${statusColor}`}>{statusText}</span>
        </div>
        <div className="flex w-full justify-between items-center text-xs text-muted">
          <span>Active Valves:</span>
          <span className="font-medium text-foreground">{average < 30 ? "4 Open" : "All Closed"}</span>
        </div>
      </Card.Footer>
    </Card>
  )
}
