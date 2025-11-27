import { motion as Motion } from 'framer-motion'
import { 
  FaQrcode, 
  FaUtensils, 
  FaChartLine, 
  FaTable, 
  FaCreditCard, 
  FaUsers,
  FaBell,
  FaCog
} from 'react-icons/fa'

const features = [
  {
    icon: FaQrcode,
    title: 'QR Digital Menu',
    description: 'Contactless ordering with dynamic QR codes for each table. Customers scan, browse, and order instantly.',
    color: 'emerald',
  },
  {
    icon: FaTable,
    title: 'Table Management',
    description: 'Real-time table occupancy tracking, waiter assignments, and session monitoring with live status updates.',
    color: 'blue',
  },
  {
    icon: FaUtensils,
    title: 'Kitchen Display System',
    description: 'Live order queue for chefs with preparation tracking, delayed order alerts, and seamless coordination.',
    color: 'orange',
  },
  {
    icon: FaChartLine,
    title: 'Analytics & Reports',
    description: 'Detailed revenue breakdowns, sales trends, peak hours analysis, and exportable reports (PDF/CSV/Excel).',
    color: 'purple',
  },
  {
    icon: FaCreditCard,
    title: 'Payment Processing',
    description: 'Integrated billing with UPI, cards, and cash. Automatic receipt generation and payment tracking.',
    color: 'pink',
  },
  {
    icon: FaUsers,
    title: 'Staff Management',
    description: 'Track waiter performance, broadcast messages, one-on-one chat, and activity monitoring.',
    color: 'cyan',
  },
  {
    icon: FaBell,
    title: 'Real-Time Notifications',
    description: 'Instant alerts for new orders, waiter calls, kitchen updates, and customer requests across all devices.',
    color: 'yellow',
  },
  {
    icon: FaCog,
    title: 'Complete Settings',
    description: 'Customize menu availability, pricing, offers, restaurant info, and operational preferences.',
    color: 'indigo',
  },
]

const colorClasses = {
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-600/10',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
    hover: 'group-hover:border-emerald-500/50',
  },
  blue: {
    bg: 'from-blue-500/10 to-blue-600/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    hover: 'group-hover:border-blue-500/50',
  },
  orange: {
    bg: 'from-orange-500/10 to-orange-600/10',
    border: 'border-orange-500/30',
    icon: 'text-orange-400',
    hover: 'group-hover:border-orange-500/50',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-600/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    hover: 'group-hover:border-purple-500/50',
  },
  pink: {
    bg: 'from-pink-500/10 to-pink-600/10',
    border: 'border-pink-500/30',
    icon: 'text-pink-400',
    hover: 'group-hover:border-pink-500/50',
  },
  cyan: {
    bg: 'from-cyan-500/10 to-cyan-600/10',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-400',
    hover: 'group-hover:border-cyan-500/50',
  },
  yellow: {
    bg: 'from-yellow-500/10 to-yellow-600/10',
    border: 'border-yellow-500/30',
    icon: 'text-yellow-400',
    hover: 'group-hover:border-yellow-500/50',
  },
  indigo: {
    bg: 'from-indigo-500/10 to-indigo-600/10',
    border: 'border-indigo-500/30',
    icon: 'text-indigo-400',
    hover: 'group-hover:border-indigo-500/50',
  },
}

const FeaturesGrid = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-[#0a0e1a] to-[#1a1f35] relative overflow-hidden" id="features">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm mb-6">
            <span className="text-emerald-300 text-sm font-medium">Complete Restaurant Solution</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Everything You Need
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              In One Platform
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Praahis brings together all essential restaurant operations into a unified, intelligent system
          </p>
        </Motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const colors = colorClasses[feature.color]
            
            return (
              <Motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className={`h-full p-6 rounded-2xl bg-gradient-to-br ${colors.bg} border ${colors.border} ${colors.hover} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`text-2xl ${colors.icon}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}

      </div>
    </section>
  )
}

export default FeaturesGrid
