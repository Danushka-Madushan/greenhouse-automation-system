import { ShieldCheck, Unplug } from 'lucide-react'

export const ConnectionChip = ({ isConnected }: { isConnected: boolean }) => {

  return (
    <div className="flex-1 flex justify-end min-w-0">
      <div
        className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold shrink-0"
        style={{
          backgroundColor: isConnected ? 'var(--color-md-primary-container)' : 'var(--color-md-error-container)',
          color: isConnected ? 'var(--color-md-on-primary-container)' : 'var(--color-md-on-error-container)',
        }}
      >
        {isConnected ? (
          <ShieldCheck className="size-4" />
        ) : (
          <Unplug className="size-4" />
        )}
        <span>System {isConnected ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  )
}
