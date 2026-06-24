import { Card, ProgressBar, Label } from '@heroui/react'
import { Sun, Sparkles } from 'lucide-react'

interface PhotosynthesisProps {
  lightLevel: number // 0 to 2000 µmol/m²/s
}

export const Photosynthesis = ({ lightLevel }: PhotosynthesisProps) => {
  // Photosynthesis efficiency logic
  // Typically, plants need 400-1000 µmol/m²/s for optimal photosynthesis.
  // Below 200 is too dark, above 1500 can cause heat stress or photoinhibition.
  let efficiency = 0;
  let statusText = "Sub-optimal";
  let statusColor = "text-rose-500";
  let progressColor: "default" | "accent" | "success" | "warning" | "danger" = "warning";

  if (lightLevel < 200) {
    efficiency = Math.round((lightLevel / 200) * 40);
    statusText = "Low Light (Inactive)";
    statusColor = "text-slate-500";
    progressColor = "default";
  } else if (lightLevel >= 200 && lightLevel < 600) {
    efficiency = Math.round(40 + ((lightLevel - 200) / 400) * 40);
    statusText = "Active (Moderate)";
    statusColor = "text-emerald-500";
    progressColor = "success";
  } else if (lightLevel >= 600 && lightLevel <= 1200) {
    // Peak efficiency
    efficiency = Math.round(80 + ((1200 - lightLevel) / 600) * 18);
    statusText = "Optimal (Peak Rate)";
    statusColor = "text-emerald-600 dark:text-emerald-400";
    progressColor = "success";
  } else {
    // Dropping efficiency due to stress
    efficiency = Math.max(10, Math.round(80 - ((lightLevel - 1200) / 800) * 60));
    statusText = "Slight Photo-Stress";
    statusColor = "text-amber-500";
    progressColor = "warning";
  }

  return (
    <Card className="rounded-3xl border border-m3-outline bg-m3-surface-variant/40 p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
      <Card.Header className="flex flex-row items-center justify-between pb-2">
        <div>
          <Card.Title className="text-lg font-bold text-foreground">Photosynthesis</Card.Title>
          <Card.Description className="text-xs text-muted">Light absorption metrics</Card.Description>
        </div>
        <div className="p-2 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-500 dark:text-amber-300">
          <Sun className="size-5" />
        </div>
      </Card.Header>

      <Card.Content className="flex flex-col gap-4 py-4">
        {/* PAR display */}
        <div className="flex flex-col items-center justify-center py-2 relative">
          <span className="text-3xl font-extrabold text-foreground tracking-tight">
            {lightLevel} <span className="text-sm font-normal text-muted">µmol/m²/s</span>
          </span>
          <span className="text-xs text-muted mt-1 uppercase tracking-wider font-semibold">Active PAR</span>
          {lightLevel > 1000 && (
            <Sparkles className="absolute top-1 right-8 size-4 text-amber-400 animate-bounce" />
          )}
        </div>

        {/* Progress Bar showing efficiency */}
        <ProgressBar aria-label="Photosynthesis Efficiency" color={progressColor} value={efficiency}>
          <div className="flex justify-between w-full text-xs font-semibold text-muted mb-1">
            <Label>Photosynthetic Efficiency</Label>
            <ProgressBar.Output />
          </div>
          <ProgressBar.Track className="bg-slate-200 dark:bg-slate-800">
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </Card.Content>

      <Card.Footer className="flex flex-col gap-1 items-start mt-2 border-t border-m3-outline/30 pt-3">
        <div className="flex w-full justify-between items-center text-sm">
          <span className="text-muted">Rate:</span>
          <span className={`font-semibold ${statusColor}`}>{statusText}</span>
        </div>
        <div className="flex w-full justify-between items-center text-xs text-muted">
          <span>Est. DLI:</span>
          <span className="font-medium text-foreground">
            {((lightLevel * 0.0864 * 12) / 100).toFixed(1)} mol/m²/d
          </span>
        </div>
      </Card.Footer>
    </Card>
  )
}
