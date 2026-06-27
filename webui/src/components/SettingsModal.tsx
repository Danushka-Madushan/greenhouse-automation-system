import React, { useState, useCallback } from 'react'
import { Modal, Select, Label, ListBox, Input, Button } from '@heroui/react'
import { X, Thermometer, Droplets, Sprout } from 'lucide-react'

/* ─── Crop Preset Type ───────────────────────────── */
interface CropPreset {
  name: string
  minTemp: number
  maxTemp: number
  minHum: number
  maxHum: number
  minMoisture: number
  maxMoisture: number
  tankCapacity: number
}

const PRESET_CROPS: Record<string, CropPreset> = {
  eggplant: {
    name: 'Eggplant',
    minTemp: 24,
    maxTemp: 30,
    minHum: 60,
    maxHum: 70,
    minMoisture: 60,
    maxMoisture: 75,
    tankCapacity: 2000,
  },
  tomato: {
    name: 'Tomato',
    minTemp: 21,
    maxTemp: 27,
    minHum: 50,
    maxHum: 65,
    minMoisture: 55,
    maxMoisture: 70,
    tankCapacity: 2500,
  },
  cucumber: {
    name: 'Cucumber',
    minTemp: 22,
    maxTemp: 28,
    minHum: 70,
    maxHum: 85,
    minMoisture: 65,
    maxMoisture: 80,
    tankCapacity: 3000,
  },
  lettuce: {
    name: 'Lettuce',
    minTemp: 15,
    maxTemp: 20,
    minHum: 50,
    maxHum: 70,
    minMoisture: 45,
    maxMoisture: 60,
    tankCapacity: 1500,
  },
  bellpepper: {
    name: 'Bell Pepper',
    minTemp: 20,
    maxTemp: 26,
    minHum: 60,
    maxHum: 75,
    minMoisture: 60,
    maxMoisture: 70,
    tankCapacity: 2200,
  },
}

interface SettingsData {
  cropKey: string
  cropName: string
  minTemp: number
  maxTemp: number
  minHum: number
  maxHum: number
  minMoisture: number
  maxMoisture: number
  tankCapacity: number
}

interface SettingsModalProps extends SettingsData {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: SettingsData) => void
}

export const SettingsModal = ({
  isOpen,
  onClose,
  cropKey,
  cropName,
  minTemp,
  maxTemp,
  minHum,
  maxHum,
  minMoisture,
  maxMoisture,
  tankCapacity,
  onSave,
}: SettingsModalProps) => {
  const [formData, setFormData] = useState<SettingsData>({
    cropKey,
    cropName,
    minTemp,
    maxTemp,
    minHum,
    maxHum,
    minMoisture,
    maxMoisture,
    tankCapacity,
  })

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

  // Update state during render (React's recommended pattern over useEffect)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)

    if (isOpen) {
      setFormData({
        cropKey,
        cropName,
        minTemp,
        maxTemp,
        minHum,
        maxHum,
        minMoisture,
        maxMoisture,
        tankCapacity,
      })
    }
  }

  const handleSelectPreset = useCallback((key: string) => {
    if (key === 'custom') {
      setFormData((prev) => ({ ...prev, cropKey: key, cropName: 'Custom Crop' }))
    } else {
      const preset = PRESET_CROPS[key]
      if (preset) {
        const { name, ...numericPresets } = preset
        setFormData({
          cropKey: key,
          cropName: name,
          ...numericPresets,
        })
      }
    }
  }, [])

  const handleInputChange = useCallback((field: keyof SettingsData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleCustomNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, cropName: e.target.value, cropKey: 'custom' }))
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }, [formData, onSave])

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop isDismissable={false} isKeyboardDismissDisabled
        variant="opaque"
        className="fixed inset-0 z-50 flex h-dvh w-screen items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <Modal.Container className="fixed inset-0 z-50 flex h-dvh w-screen items-center justify-center p-4">
          {/* Increased width to max-w-4xl for side-by-side layout, added stronger shadow */}
          <Modal.Dialog className="relative w-full max-w-4xl bg-[--color-md-surface-container-high] border border-[--color-md-outline-variant] rounded-[28px] shadow-[0_0_40px_rgba(0,0,0,0.2)] flex flex-col p-6 text-[--color-md-on-surface] z-50 overflow-visible animate-in zoom-in duration-250">
            <Modal.CloseTrigger className="absolute top-5 right-5 rounded-full w-8 h-8 flex items-center justify-center hover:bg-[--color-md-surface-container-highest] transition-colors cursor-pointer z-10">
              <X className="size-5 text-[--color-md-on-surface-variant]" />
            </Modal.CloseTrigger>

            <Modal.Header className="flex items-center gap-3 pb-5">
              <Modal.Heading className="text-xl font-bold">Configure Greenhouse</Modal.Heading>
            </Modal.Header>

            {/* Removed scrolling constraints (overflow-y-auto max-h-[50vh]) */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <Modal.Body className="flex flex-col gap-6">

                {/* TOP ROW: General Settings (3 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-[--color-md-surface-container-low] p-5 rounded-2xl border border-[--color-md-outline-variant]">

                  {/* Crop Preset */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-semibold text-[--color-md-on-surface-variant]">
                      Configuration Preset
                    </Label>
                    <Select
                      className="w-full"
                      placeholder="Select a preset"
                      value={formData.cropKey}
                      onChange={(val) => handleSelectPreset(val as string)}
                    >
                      <Select.Trigger className="w-full rounded-xl border border-[--color-md-outline] bg-transparent px-3.5 py-2.5 text-sm flex items-center justify-between outline-none focus-visible:ring-2 focus-visible:ring-[--color-md-primary] cursor-pointer hover:bg-[--color-md-surface-container-highest] transition-colors">
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="z-60 min-w-50 bg-[--color-md-surface-container-high] border border-[--color-md-outline-variant] rounded-xl shadow-xl p-1">
                        <ListBox>
                          <ListBox.Item id="eggplant" textValue="Eggplant" className="px-3 py-2.5 rounded-lg text-sm hover:bg-[--color-md-surface-container-highest] cursor-pointer flex items-center justify-between">
                            Eggplant
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item id="tomato" textValue="Tomato" className="px-3 py-2.5 rounded-lg text-sm hover:bg-[--color-md-surface-container-highest] cursor-pointer flex items-center justify-between">
                            Tomato
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item id="cucumber" textValue="Cucumber" className="px-3 py-2.5 rounded-lg text-sm hover:bg-[--color-md-surface-container-highest] cursor-pointer flex items-center justify-between">
                            Cucumber
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item id="lettuce" textValue="Lettuce" className="px-3 py-2.5 rounded-lg text-sm hover:bg-[--color-md-surface-container-highest] cursor-pointer flex items-center justify-between">
                            Lettuce
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item id="bellpepper" textValue="Bell Pepper" className="px-3 py-2.5 rounded-lg text-sm hover:bg-[--color-md-surface-container-highest] cursor-pointer flex items-center justify-between">
                            Bell Pepper
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                          <ListBox.Item id="custom" textValue="Custom Crop" className="px-3 py-2.5 rounded-lg text-sm hover:bg-[--color-md-surface-container-highest] cursor-pointer flex items-center justify-between">
                            Custom / Other
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  {/* Crop Name */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="crop-custom-name" className="text-sm font-semibold text-[--color-md-on-surface-variant]">
                      Crop Display Name
                    </Label>
                    <Input
                      id="crop-custom-name"
                      type="text"
                      value={formData.cropName}
                      onChange={handleCustomNameChange}
                      className="w-full rounded-xl border border-[--color-md-outline] bg-transparent px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[--color-md-primary] hover:bg-[--color-md-surface-container-highest] transition-colors"
                      placeholder="Enter crop name..."
                      required
                    />
                  </div>

                  {/* Tank Capacity */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tank-capacity" className="text-sm font-semibold text-[--color-md-on-surface-variant]">
                      Water Tank Capacity (L)
                    </Label>
                    <Input
                      id="tank-capacity"
                      type="number"
                      min="100"
                      max="50000"
                      value={String(formData.tankCapacity)}
                      onChange={(e) => handleInputChange('tankCapacity', Number(e.target.value))}
                      className="w-full rounded-xl border border-[--color-md-outline] bg-transparent px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[--color-md-primary] hover:bg-[--color-md-surface-container-highest] transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* BOTTOM ROW: Environmental Limits (3 Color-Coded Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                  {/* Temperature Card (Orange) */}
                  <div className="flex flex-col gap-4 p-5 rounded-2xl border border-orange-500/30 bg-orange-500/5">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <Thermometer className="size-5" />
                      <h3 className="font-bold text-sm uppercase tracking-wide">Temperature (°C)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="min-temp" className="text-xs font-medium text-orange-700/80 dark:text-orange-300/80">Min Limit</Label>
                        <Input
                          id="min-temp"
                          type="number"
                          step="0.5"
                          value={String(formData.minTemp)}
                          onChange={(e) => handleInputChange('minTemp', Number(e.target.value))}
                          className="w-full rounded-lg border border-orange-500/40 bg-white/50 dark:bg-black/20 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="max-temp" className="text-xs font-medium text-orange-700/80 dark:text-orange-300/80">Max Limit</Label>
                        <Input
                          id="max-temp"
                          type="number"
                          step="0.5"
                          value={String(formData.maxTemp)}
                          onChange={(e) => handleInputChange('maxTemp', Number(e.target.value))}
                          className="w-full rounded-lg border border-orange-500/40 bg-white/50 dark:bg-black/20 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Humidity Card (Blue) */}
                  <div className="flex flex-col gap-4 p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Droplets className="size-5" />
                      <h3 className="font-bold text-sm uppercase tracking-wide">Humidity (%)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="min-hum" className="text-xs font-medium text-blue-700/80 dark:text-blue-300/80">Min Limit</Label>
                        <Input
                          id="min-hum"
                          type="number"
                          min="1"
                          max="100"
                          value={String(formData.minHum)}
                          onChange={(e) => handleInputChange('minHum', Number(e.target.value))}
                          className="w-full rounded-lg border border-blue-500/40 bg-white/50 dark:bg-black/20 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="max-hum" className="text-xs font-medium text-blue-700/80 dark:text-blue-300/80">Max Limit</Label>
                        <Input
                          id="max-hum"
                          type="number"
                          min="1"
                          max="100"
                          value={String(formData.maxHum)}
                          onChange={(e) => handleInputChange('maxHum', Number(e.target.value))}
                          className="w-full rounded-lg border border-blue-500/40 bg-white/50 dark:bg-black/20 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Moisture Card (Green) */}
                  <div className="flex flex-col gap-4 p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <Sprout className="size-5" />
                      <h3 className="font-bold text-sm uppercase tracking-wide">Soil Moisture (%)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="min-moist" className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80">Min Limit</Label>
                        <Input
                          id="min-moist"
                          type="number"
                          min="1"
                          max="100"
                          value={String(formData.minMoisture)}
                          onChange={(e) => handleInputChange('minMoisture', Number(e.target.value))}
                          className="w-full rounded-lg border border-emerald-500/40 bg-white/50 dark:bg-black/20 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="max-moist" className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80">Max Limit</Label>
                        <Input
                          id="max-moist"
                          type="number"
                          min="1"
                          max="100"
                          value={String(formData.maxMoisture)}
                          onChange={(e) => handleInputChange('maxMoisture', Number(e.target.value))}
                          className="w-full rounded-lg border border-emerald-500/40 bg-white/50 dark:bg-black/20 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end gap-3">
                <Button
                  slot="close"
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-transparent hover:bg-[--color-md-surface-container-highest] transition-colors cursor-pointer text-[--color-md-on-surface]"
                  style={{ backgroundColor: 'var(--color-md-tertiary)' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-bold rounded-xl text-[--color-md-on-primary] shadow-md transition-all hover:brightness-110 active:scale-95 cursor-pointer"
                  style={{ backgroundColor: 'var(--color-md-primary)' }}
                >
                  Save Configuration
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
