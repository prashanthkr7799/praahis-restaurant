import { useState, useEffect } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaShoppingCart, FaUtensils, FaChartLine, FaClock, FaCheckCircle, FaSignal, FaWifi, FaBatteryFull, FaQrcode } from 'react-icons/fa'

// --- Shared Phone Frame Component ---
const PhoneFrame = ({ children, highlight, color, title, icon: HeaderIcon }) => (
  <div className="relative group">
    {/* Realistic Phone Body */}
    <div className={`relative w-[280px] h-[580px] bg-[#0a0a0a] rounded-[3.5rem] border-[6px] transition-all duration-700 ${
      highlight 
        ? `border-${color}-500 shadow-[0_0_80px_rgba(var(--${color}-rgb),0.3)] scale-105` 
        : 'border-[#1a1a1a] shadow-2xl scale-100'
    } z-10`}>
      
      {/* Side Buttons */}
      <div className="absolute -right-[8px] top-24 w-[8px] h-16 bg-[#1a1a1a] rounded-r-md border-l border-white/10" /> {/* Power */}
      <div className="absolute -left-[8px] top-24 w-[8px] h-12 bg-[#1a1a1a] rounded-l-md border-r border-white/10" /> {/* Vol Up */}
      <div className="absolute -left-[8px] top-40 w-[8px] h-12 bg-[#1a1a1a] rounded-l-md border-r border-white/10" /> {/* Vol Down */}

      {/* Dynamic Glow Behind */}
      <div className={`absolute -inset-1 bg-${color}-500/20 blur-2xl rounded-[3.5rem] -z-10 transition-opacity duration-700 ${highlight ? 'opacity-100' : 'opacity-0'}`} />

      {/* Notch Area */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-b-3xl z-50 flex items-center justify-center">
        <div className="w-16 h-1 bg-[#1a1a1a] rounded-full flex items-center justify-center gap-2">
          <div className="w-1 h-1 bg-[#333] rounded-full" /> {/* Camera */}
          <div className="w-8 h-0.5 bg-[#222] rounded-full" /> {/* Speaker */}
        </div>
      </div>

      {/* Screen Content */}
      <div className="w-full h-full bg-gray-950 rounded-[3.2rem] overflow-hidden relative flex flex-col border-[4px] border-black">
        {/* Status Bar */}
        <div className="h-10 w-full flex justify-between items-center px-7 pt-3 text-[10px] text-gray-400 font-medium z-40">
          <span>9:41</span>
          <div className="flex gap-1.5">
            <FaSignal className="text-[10px]" />
            <FaWifi className="text-[10px]" />
            <FaBatteryFull className="text-[10px]" />
          </div>
        </div>

        {/* App Header */}
        <div className="px-6 py-2 flex items-center gap-3 z-40 mb-2">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors duration-500 ${highlight ? `bg-${color}-500 text-white shadow-lg` : 'bg-white/5 text-gray-500'}`}>
            <HeaderIcon className="text-lg" />
          </div>
          <div>
            <div className={`text-sm font-bold transition-colors ${highlight ? `text-${color}-400` : 'text-gray-400'}`}>{title}</div>
            <div className="text-[9px] text-gray-600 font-mono tracking-wider uppercase">Praahis OS 2.0</div>
          </div>
        </div>

        {/* Main Scrollable Area */}
        <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-transparent to-black/50">
          {children}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full z-50 backdrop-blur-md" />
      </div>
    </div>
  </div>
)

// --- Premium Data Stream Animation ---
const DataStream = ({ active, visible, vertical = false }) => {
  return (
    <div className={`relative flex items-center justify-center transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'} ${vertical ? 'w-1 h-32' : 'h-1 w-48'}`}>
      {/* Base Track - Glowing Fiber Optic */}
      <div className={`absolute inset-0 ${vertical ? 'w-[2px] h-full' : 'h-[2px] w-full'} bg-gray-800/50 rounded-full overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-50" />
      </div>
      
      {/* Active Flow Animation */}
      <AnimatePresence>
        {active && (
          <>
            {/* Glowing Core */}
            <Motion.div 
              className={`absolute bg-${vertical ? 'gradient-to-b' : 'gradient-to-r'} from-emerald-500/0 via-emerald-400 to-emerald-500/0 z-10`}
              style={{
                [vertical ? 'width' : 'height']: '2px',
                [vertical ? 'height' : 'width']: '100%',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Moving Particles */}
            {[...Array(3)].map((_, i) => (
              <Motion.div
                key={i}
                className={`absolute rounded-full bg-white shadow-[0_0_15px_rgba(52,211,153,1)] z-20`}
                style={{
                  width: vertical ? '4px' : '16px',
                  height: vertical ? '16px' : '4px',
                }}
                initial={{ 
                  opacity: 0, 
                  [vertical ? 'top' : 'left']: '0%' 
                }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  [vertical ? 'top' : 'left']: ['0%', '100%']
                }}
                transition={{ 
                  duration: 1.2, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: i * 0.4 
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Enhanced Customer Phone Module
const OrderMini = ({ activeOrder, cart, showQR, showCart, highlight }) => (
  <PhoneFrame highlight={highlight} color="emerald" title="Customer App" icon={FaShoppingCart}>
    <div className="h-full flex flex-col px-5 pb-8">
      {showQR ? (
        <Motion.div
          className="flex-1 flex flex-col items-center justify-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="relative w-48 h-48 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/10 mb-8 overflow-hidden group-hover:border-emerald-500/30 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent animate-scan" />
            <FaQrcode className="text-7xl text-white/80" />
            
            {/* Scanning Corners */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-500 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-500 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-500 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-500 rounded-br-lg" />
          </div>
          <p className="text-xs text-emerald-400 font-mono animate-pulse tracking-[0.2em] uppercase">Scanning QR Code...</p>
        </Motion.div>
      ) : cart.length > 0 ? (
        <div className="flex-1 flex flex-col">
          <div className="text-[10px] text-gray-500 mb-4 font-bold uppercase tracking-widest pl-1">Current Order</div>
          <div className="space-y-3 flex-1 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {cart.map((item, idx) => (
                <Motion.div
                  key={item.id}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex items-center justify-between group/item hover:bg-white/10 transition-all hover:scale-[1.02]"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl filter drop-shadow-lg">{item.emoji}</span>
                    <div>
                      <p className="font-bold text-sm text-white">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">Qty: {item.qty}</p>
                    </div>
                  </div>
                  <p className="font-bold text-emerald-400 text-sm">₹{item.price}</p>
                </Motion.div>
              ))}
            </AnimatePresence>
          </div>

          {showCart && (
            <Motion.div
              className="mt-auto pt-6 border-t border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-between items-center mb-4 px-1">
                <span className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">Total Amount</span>
                <span className="text-2xl font-bold text-white tracking-tight">
                  ₹{cart.reduce((sum, item) => sum + (item.price * item.qty), 0)}
                </span>
              </div>
              <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all transform active:scale-95">
                <FaCheckCircle />
                Swipe to Pay
              </button>
            </Motion.div>
          )}
        </div>
      ) : null}

      {/* Order Status Overlay */}
      {activeOrder && (
        <Motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.4)]">
            <FaCheckCircle className="text-white text-4xl" />
          </div>
          <p className="text-xl font-bold text-white mb-2">Order Placed!</p>
          <p className="text-sm text-gray-400 mb-8">Kitchen is preparing your food</p>
          <div className="px-5 py-2.5 bg-white/5 rounded-full border border-white/10 flex items-center gap-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_orange]" />
            <span className="text-xs font-mono text-orange-400 tracking-wider">PREPARING</span>
          </div>
        </Motion.div>
      )}
    </div>
  </PhoneFrame>
)

// Enhanced Kitchen Display Module
const KDSMini = ({ tickets, highlight }) => (
  <PhoneFrame highlight={highlight} color="orange" title="Kitchen Display" icon={FaUtensils}>
    <div className="h-full flex flex-col px-5 pb-8">
      {tickets.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-600">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
            <FaClock className="text-4xl opacity-20" />
          </div>
          <p className="text-sm font-medium tracking-wide">Waiting for orders...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Active Tickets</div>
          {tickets.map(ticket => (
            <Motion.div
              key={ticket.id}
              className={`rounded-3xl p-5 border backdrop-blur-xl transition-all duration-500 ${
                ticket.status === 'new' 
                  ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]' 
                  : ticket.status === 'cooking'
                  ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.15)]'
                  : 'bg-green-500/10 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)]'
              }`}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">#{ticket.id}</span>
                    <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded-md text-white">Table 12</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                  ticket.status === 'new' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 
                  ticket.status === 'cooking' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 
                  'bg-green-500 text-white shadow-lg shadow-green-500/20'
                }`}>
                  {ticket.status}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {ticket.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">{item.qty}x</span>
                      <span className="text-white font-medium">{item.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <FaClock className="text-orange-400" />
                <span>Started: <span className="text-white font-mono">{ticket.time}</span></span>
              </div>
            </Motion.div>
          ))}
        </div>
      )}
    </div>
  </PhoneFrame>
)

// Enhanced Analytics Module
const ManagerMini = ({ stats, highlight }) => (
  <PhoneFrame highlight={highlight} color="indigo" title="Manager Portal" icon={FaChartLine}>
    <div className="h-full flex flex-col px-5 pb-8">
      <div className="text-[10px] text-gray-500 mb-4 font-bold uppercase tracking-widest pl-1">Today's Overview</div>
      <div className="grid grid-cols-1 gap-4">
        <Motion.div
          className="bg-gradient-to-br from-emerald-900/40 to-emerald-900/10 rounded-3xl p-6 border border-emerald-500/20 relative overflow-hidden group/card"
          animate={highlight ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
            <FaChartLine className="text-6xl text-emerald-500" />
          </div>
          <p className="text-[10px] text-emerald-400 mb-2 uppercase tracking-widest font-bold">Total Revenue</p>
          <p className="text-4xl font-bold text-white tracking-tight">₹{stats.revenue.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-300 bg-emerald-500/10 w-fit px-3 py-1.5 rounded-lg border border-emerald-500/10">
            <span>▲</span>
            <span className="font-medium">+12% vs yesterday</span>
          </div>
        </Motion.div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-3xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-3 text-indigo-400">
              <span className="text-lg">📊</span>
            </div>
            <p className="text-[9px] text-gray-400 mb-1 uppercase tracking-wider font-bold">Orders</p>
            <p className="text-2xl font-bold text-indigo-400">{stats.orders}</p>
          </div>
          <div className="bg-white/5 rounded-3xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-3 text-orange-400">
              <span className="text-lg">👥</span>
            </div>
            <p className="text-[9px] text-gray-400 mb-1 uppercase tracking-wider font-bold">Occupancy</p>
            <p className="text-2xl font-bold text-orange-400">75%</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-3xl p-5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors">
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-1">Avg Prep Time</p>
            <p className="text-xl font-bold text-purple-400">12m 30s</p>
          </div>
          <div className="h-12 w-12 rounded-full border-2 border-purple-500/30 flex items-center justify-center bg-purple-500/10">
            <span className="text-lg text-purple-400">⚡</span>
          </div>
        </div>
      </div>
    </div>
  </PhoneFrame>
)

const demoItems = [
  { id: 1, name: 'Butter Chicken', price: 320, emoji: '🍗', category: 'Main Course', cookTime: '12 min', qty: 1 },
  { id: 4, name: 'Naan', price: 40, emoji: '🫓', category: 'Breads', cookTime: '5 min', qty: 2 }
]

const SafeDemoPage = () => {
  const [phase, setPhase] = useState(0) 
  
  // State for Mini Components
  const [cart, setCart] = useState([])
  const [showQR, setShowQR] = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [activeOrder, setActiveOrder] = useState(null)
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({
    revenue: 12450,
    orders: 42,
    guests: 128,
    avgOrder: 296
  })

  // Infinite Loop Sequence
  useEffect(() => {
    let mounted = true
    
    const runSequence = async () => {
      while (mounted) {
        // Reset
        setPhase(0)
        setCart([])
        setShowQR(true)
        setShowCart(false)
        setActiveOrder(null)
        setTickets([])
        setStats(prev => ({ ...prev, revenue: 12450, orders: 42 }))
        
        // PAUSE: Show all fragments for 5 seconds
        await new Promise(r => setTimeout(r, 5000))

        // 1. Customer: Scan -> Menu -> Add to Cart -> Pay
        setPhase(1)
        await new Promise(r => setTimeout(r, 1000))
        
        // Scan QR
        setShowQR(false)
        await new Promise(r => setTimeout(r, 1500))
        
        // Add Items to Cart
        setCart([demoItems[0]])
        await new Promise(r => setTimeout(r, 1500))
        setCart([...demoItems])
        await new Promise(r => setTimeout(r, 1500))
        
        // Show Cart
        setShowCart(true)
        await new Promise(r => setTimeout(r, 1500))
        
        // Place Order
        setShowCart(false)
        setActiveOrder({ status: 'sent', items: demoItems })
        await new Promise(r => setTimeout(r, 2000))

        // 2. Kitchen: New Ticket -> Cooking -> Ready
        setPhase(2)
        const newTicket = {
          id: 1234,
          time: 'Just now',
          status: 'new',
          items: demoItems
        }
        setTickets([newTicket])
        await new Promise(r => setTimeout(r, 1500))
        
        // Cooking
        setTickets([{ ...newTicket, status: 'cooking' }])
        await new Promise(r => setTimeout(r, 2000))
        
        // Ready
        setTickets([{ ...newTicket, status: 'ready' }])
        await new Promise(r => setTimeout(r, 1500))

        // 3. Analytics: Update
        setPhase(3)
        const total = demoItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
        setStats(prev => ({
          ...prev,
          revenue: prev.revenue + total,
          orders: prev.orders + 1
        }))
        await new Promise(r => setTimeout(r, 3000))
      }
    }

    runSequence()
    return () => { mounted = false }
  }, [])

  // Responsive Camera Logic
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  
  const getCameraVariant = () => {
    if (isMobile) {
      switch(phase) {
        case 1: return { y: 80, scale: 0.85 } // Customer (Moved up from 130)
        case 2: return { y: -500, scale: 0.85 } // Kitchen (Moved up from -450)
        case 3: return { y: -1080, scale: 0.85 } // Analytics (Perfect)
        default: return { y: -530, scale: 0.38 } // Overview (Moved up from -500)
      }
    } else {
      switch(phase) {
        case 1: return { x: 480, scale: 1.1 }  // Customer (Left) -> Move Right
        case 2: return { x: 0, scale: 1.1 }    // Kitchen (Middle) -> Center
        case 3: return { x: -480, scale: 1.1 } // Analytics (Right) -> Move Left
        default: return { x: 0, scale: 0.55 }  // Overview
      }
    }
  }

  return (
    <div className="w-screen h-screen bg-[#050505] overflow-hidden text-white relative flex flex-col">
      {/* Persistent Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xl font-bold tracking-tight">Praahis<span className="text-emerald-500">.</span></Link>
          <div className="hidden md:block px-2 py-0.5 bg-white/10 rounded text-[10px] text-gray-400 font-mono">LIVE DEMO</div>
        </div>
        <div className="flex gap-4">
          <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors py-2">Back to Home</Link>
          <Link to="/#pricing" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all">Get Started</Link>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <Motion.div
          animate={getCameraVariant()}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="relative flex flex-col md:flex-row items-center gap-24 md:gap-48"
        >
          {/* 1. Customer */}
          <div className={`relative group transition-all duration-500 ${phase !== 0 && phase !== 1 ? 'blur-sm opacity-40 scale-90 grayscale-[30%]' : 'scale-90 md:scale-100'}`}>
            <OrderMini 
              activeOrder={activeOrder} 
              cart={cart}
              showQR={showQR}
              showCart={showCart}
              highlight={phase === 1}
            />
            <div className={`absolute -bottom-16 left-0 w-full text-center font-mono text-sm transition-colors ${phase === 1 ? 'text-emerald-400' : 'text-gray-600'}`}>1. ORDER</div>
            
            {/* Wire to Kitchen */}
            {/* Wire to Kitchen */}
            <div className="absolute top-1/2 -right-48 hidden md:block">
              <DataStream active={phase === 2} visible={phase > 0} />
            </div>
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 md:hidden">
              <DataStream active={phase === 2} visible={phase > 0} vertical />
            </div>
          </div>

          {/* 2. Kitchen */}
          <div className={`relative group transition-all duration-500 ${phase !== 0 && phase !== 2 ? 'blur-sm opacity-40 scale-90 grayscale-[30%]' : 'scale-90 md:scale-100'}`}>
            <KDSMini 
              tickets={tickets} 
              highlight={phase === 2}
            />
            <div className={`absolute -bottom-16 left-0 w-full text-center font-mono text-sm transition-colors ${phase === 2 ? 'text-orange-400' : 'text-gray-600'}`}>2. PREPARE</div>
            
            {/* Wire to Analytics */}
            <div className="absolute top-1/2 -right-48 hidden md:block">
              <DataStream active={phase === 3} visible={phase > 0} />
            </div>
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 md:hidden">
              <DataStream active={phase === 3} visible={phase > 0} vertical />
            </div>
          </div>

          {/* 3. Analytics */}
          <div className={`relative group transition-all duration-500 ${phase !== 0 && phase !== 3 ? 'blur-sm opacity-40 scale-90 grayscale-[30%]' : 'scale-90 md:scale-100'}`}>
            <ManagerMini 
              stats={stats} 
              highlight={phase === 3}
            />
            <div className={`absolute -bottom-16 left-0 w-full text-center font-mono text-sm transition-colors ${phase === 3 ? 'text-indigo-400' : 'text-gray-600'}`}>3. TRACK</div>
          </div>
        </Motion.div>
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur border-t border-white/5 py-2 px-6 flex justify-between items-center text-[10px] text-gray-500 font-mono">
        <div className="flex gap-4">
          <span className={phase === 1 ? 'text-emerald-500' : ''}>● CUSTOMER APP</span>
          <span className={phase === 2 ? 'text-orange-500' : ''}>● KITCHEN DISPLAY</span>
          <span className={phase === 3 ? 'text-indigo-500' : ''}>● MANAGER DASHBOARD</span>
        </div>
        <div>SYSTEM STATUS: ONLINE</div>
      </div>
    </div>
  )
}

export default SafeDemoPage
