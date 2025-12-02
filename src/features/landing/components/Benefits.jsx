import { motion as Motion } from 'framer-motion'
import { FaCheckCircle, FaClock, FaChartLine, FaUsers, FaMoneyBillWave, FaSmile } from 'react-icons/fa'

const benefits = [
  {
    icon: FaClock,
    title: '40% Faster Service',
    description: 'Reduce order processing time with automated workflows and real-time kitchen coordination',
    stat: '40%',
    color: 'emerald',
  },
  {
    icon: FaMoneyBillWave,
    title: 'Increase Revenue',
    description: 'Serve more customers, reduce errors, and optimize table turnover for higher profits',
    stat: '+25%',
    color: 'blue',
  },
  {
    icon: FaCheckCircle,
    title: 'Zero Manual Errors',
    description: 'Eliminate billing mistakes and order confusion with digital automation',
    stat: '100%',
    color: 'purple',
  },
  {
    icon: FaUsers,
    title: 'Better Staff Efficiency',
    description: 'Track performance, streamline communication, and optimize staff allocation',
    stat: '3x',
    color: 'orange',
  },
  {
    icon: FaChartLine,
    title: 'Data-Driven Decisions',
    description: 'Access real-time analytics and insights to make informed business choices',
    stat: '24/7',
    color: 'pink',
  },
  {
    icon: FaSmile,
    title: 'Happy Customers',
    description: 'Faster service, accurate orders, and seamless payment lead to better reviews',
    stat: '98%',
    color: 'cyan',
  },
]

const colorClasses = {
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-600/10',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
    stat: 'from-emerald-400 to-emerald-600',
  },
  blue: {
    bg: 'from-blue-500/10 to-blue-600/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    stat: 'from-blue-400 to-blue-600',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-600/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    stat: 'from-purple-400 to-purple-600',
  },
  orange: {
    bg: 'from-orange-500/10 to-orange-600/10',
    border: 'border-orange-500/30',
    icon: 'text-orange-400',
    stat: 'from-orange-400 to-orange-600',
  },
  pink: {
    bg: 'from-pink-500/10 to-pink-600/10',
    border: 'border-pink-500/30',
    icon: 'text-pink-400',
    stat: 'from-pink-400 to-pink-600',
  },
  cyan: {
    bg: 'from-cyan-500/10 to-cyan-600/10',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-400',
    stat: 'from-cyan-400 to-cyan-600',
  },
}

const Benefits = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-[#0a0e1a] to-[#1a1f35] relative overflow-hidden" id="benefits">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm mb-6">
            <span className="text-purple-300 text-sm font-medium">Measurable Impact</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Why Restaurants
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Choose Praahis
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Real results from restaurants that switched to Praahis
          </p>
        </Motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            const colors = colorClasses[benefit.color]

            return (
              <Motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className={`h-full p-8 rounded-2xl bg-gradient-to-br ${colors.bg} border ${colors.border} backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl`}>
                  {/* Icon and Stat */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`text-2xl ${colors.icon}`} />
                    </div>
                    <div className={`text-3xl font-bold bg-gradient-to-r ${colors.stat} bg-clip-text text-transparent`}>
                      {benefit.stat}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </Motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <div className="inline-block p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 backdrop-blur-sm">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to transform your restaurant?
            </h3>
            <p className="text-gray-400 mb-6 max-w-2xl">
              Join 500+ restaurants already using Praahis to streamline operations and boost revenue
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#pricing"
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-full font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300"
              >
                View Pricing
              </a>
              <a
                href="#contact"
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300"
              >
                Talk to Sales
              </a>
            </div>
          </div>
        </Motion.div>
      </div>
    </section>
  )
}

export default Benefits
