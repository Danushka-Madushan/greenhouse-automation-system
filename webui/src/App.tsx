import { useState } from 'react'
import { Tabs } from '@heroui/react'
import { LayoutDashboard, BarChart3, Settings, Cpu, ShieldCheck } from 'lucide-react'
import { WaterTankLevel } from './components/WaterTankLevel'
import { TempHumidity } from './components/TempHumidity'
import { Photosynthesis } from './components/Photosynthesis'
import { SoilMoisture } from './components/SoilMoisture'
import { AnalyticsEmpty } from './components/AnalyticsEmpty'

const App = () => {
  // Sensor State
  const [waterLevel, setWaterLevel] = useState<number>(68);
  const [temperature, setTemperature] = useState<number>(24.5);
  const [humidity, setHumidity] = useState<number>(62);
  const [lightLevel, setLightLevel] = useState<number>(720);
  const [soilSector1, setSoilSector1] = useState<number>(45);
  const [soilSector2, setSoilSector2] = useState<number>(52);
  const [soilSector3, setSoilSector3] = useState<number>(38);
  const [soilSector4, setSoilSector4] = useState<number>(48);

  const [showSimulator, setShowSimulator] = useState<boolean>(true);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-16">
      {/* Top App Bar (Material 3 style) */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-sm flex items-center justify-center">
              <Cpu className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">GreenOS</h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Automation System</p>
            </div>
          </div>

          {/* Quick status pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-xs font-semibold">
            <ShieldCheck className="size-4" />
            <span>Greenhouse Online</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Tabs variant="secondary" defaultSelectedKey="dashboard" className="w-full flex flex-col">
          <Tabs.ListContainer className="mb-6 flex justify-center">
            <Tabs.List aria-label="Main Navigation" className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
              <Tabs.Tab id="dashboard" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
                <LayoutDashboard className="size-4" />
                Dashboard
                <Tabs.Indicator className="bg-emerald-600 dark:bg-emerald-400" />
              </Tabs.Tab>
              <Tabs.Tab id="analytics" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
                <BarChart3 className="size-4" />
                Analytics
                <Tabs.Indicator className="bg-emerald-600 dark:bg-emerald-400" />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          {/* DASHBOARD TAB */}
          <Tabs.Panel id="dashboard" className="w-full flex flex-col gap-8">
            {/* Grid of Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <WaterTankLevel level={waterLevel} />
              <TempHumidity temperature={temperature} humidity={humidity} />
              <Photosynthesis lightLevel={lightLevel} />
              <SoilMoisture 
                sector1={soilSector1} 
                sector2={soilSector2} 
                sector3={soilSector3} 
                sector4={soilSector4} 
              />
            </div>

            {/* Calibration Panel */}
            <div className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="size-5 text-emerald-600 dark:text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Sensor Calibration Panel</h2>
                    <p className="text-xs text-slate-500">Modify values to simulate environmental changes</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSimulator(!showSimulator)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {showSimulator ? "Collapse Simulator" : "Expand Simulator"}
                </button>
              </div>

              {showSimulator && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Water tank slider */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex justify-between">
                      <span>Simulate Water Level</span>
                      <span className="text-blue-600 dark:text-blue-400">{waterLevel}%</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={waterLevel} 
                      onChange={(e) => setWaterLevel(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Temp / Humidity sliders */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex justify-between">
                        <span>Simulate Temperature</span>
                        <span className="text-rose-500">{temperature}°C</span>
                      </label>
                      <input 
                        type="range" 
                        min="10" 
                        max="45" 
                        step="0.5"
                        value={temperature} 
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex justify-between">
                        <span>Simulate Humidity</span>
                        <span className="text-cyan-500">{humidity}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="20" 
                        max="100" 
                        value={humidity} 
                        onChange={(e) => setHumidity(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Light Level slider */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex justify-between">
                      <span>Simulate Sunlight (PAR)</span>
                      <span className="text-amber-500">{lightLevel} µmol</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="2000" 
                      step="10"
                      value={lightLevel} 
                      onChange={(e) => setLightLevel(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {/* Soil Moisture Sector sliders */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Simulate Soil Moisture</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 flex justify-between">
                          <span>NW Sec 1</span>
                          <span>{soilSector1}%</span>
                        </label>
                        <input 
                          type="range" 
                          min="10" 
                          max="95" 
                          value={soilSector1} 
                          onChange={(e) => setSoilSector1(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 flex justify-between">
                          <span>NE Sec 2</span>
                          <span>{soilSector2}%</span>
                        </label>
                        <input 
                          type="range" 
                          min="10" 
                          max="95" 
                          value={soilSector2} 
                          onChange={(e) => setSoilSector2(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 flex justify-between">
                          <span>SW Sec 3</span>
                          <span>{soilSector3}%</span>
                        </label>
                        <input 
                          type="range" 
                          min="10" 
                          max="95" 
                          value={soilSector3} 
                          onChange={(e) => setSoilSector3(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 flex justify-between">
                          <span>SE Sec 4</span>
                          <span>{soilSector4}%</span>
                        </label>
                        <input 
                          type="range" 
                          min="10" 
                          max="95" 
                          value={soilSector4} 
                          onChange={(e) => setSoilSector4(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Tabs.Panel>

          {/* ANALYTICS TAB */}
          <Tabs.Panel id="analytics" className="w-full">
            <AnalyticsEmpty />
          </Tabs.Panel>
        </Tabs>
      </main>
    </div>
  )
}

export default App
