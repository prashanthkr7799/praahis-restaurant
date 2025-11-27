import { motion as Motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Scan & Browse',
    description: 'Guests scan the table QR code to view your menu instantly on their phones.',
    icon: '📱',
    color: 'from-emerald-500 to-emerald-400',
    shadow: 'shadow-emerald-500/20'
  },
  {
    number: '02',
    title: 'Order Instantly',
    description: 'Guests place orders directly, sending details straight to your staff.',
    icon: '🍽️',
    color: 'from-blue-500 to-blue-400',
    shadow: 'shadow-blue-500/20'
  },
  {
    number: '03',
    title: 'Kitchen Prepares',
    description: 'Your kitchen team sees orders immediately and starts preparation.',
    icon: '👨‍🍳',
    color: 'from-orange-500 to-orange-400',
    shadow: 'shadow-orange-500/20'
  },
  {
    number: '04',
    title: 'Quick Service',
    description: 'Staff are notified when food is ready to serve, ensuring hot meals.',
    icon: '✅',
    color: 'from-purple-500 to-purple-400',
    shadow: 'shadow-purple-500/20'
  },
  {
    number: '05',
    title: 'Easy Payment',
    description: 'Guests can pay via their preferred method for a smooth exit.',
    icon: '💳',
    color: 'from-pink-500 to-pink-400',
    shadow: 'shadow-pink-500/20'
  },
  {
    number: '06',
    title: 'Track Growth',
    description: 'View daily sales and performance to help your business grow.',
    icon: '📊',
    color: 'from-cyan-500 to-cyan-400',
    shadow: 'shadow-cyan-500/20'
  },
]

const HowItWorks = () => {
  return (
    <section className="py-32 bg-[#0a0e1a] relative overflow-hidden" id="how-it-works">
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-blue-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-24">
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block"
          >
            <span className="px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6 block w-fit mx-auto">
              Seamless Workflow
            </span>
            <h2 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-6">
              From Order to Payment
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience a fully automated restaurant operation that flows naturally from one step to the next.
            </p>
          </Motion.div>
        </div>

        {/* Timeline Container */}
        <div className="max-w-6xl mx-auto relative">
          <div className="space-y-16 lg:space-y-0">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0
              const isLast = index === steps.length - 1

              return (
                <div key={index} className="relative lg:h-48">
                  {/* Connector Line (Desktop) */}
                  {!isLast && (
                    <div className="hidden lg:block absolute w-full h-full pointer-events-none" style={{ top: '50%', zIndex: 0 }}>
                      <svg
                        className="w-full h-[100%]"
                        viewBox="0 0 100 100"
                        fill="none"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id={`gradient-line-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                        {/* The Path */}
                        <Motion.path
                          d={isEven 
                            ? "M 42 0 C 58 0, 42 100, 58 100" // Left (42%) to Right (58%)
                            : "M 58 0 C 42 0, 58 100, 42 100" // Right (58%) to Left (42%)
                          }
                          stroke={`url(#gradient-line-${index})`}
                          strokeWidth="0.4"
                          strokeLinecap="round"
                          fill="none"
                          initial={{ pathLength: 0, opacity: 0 }}
                          whileInView={{ pathLength: 1, opacity: 0.4 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1 }}
                        />
                        {/* Animated Dash */}
                        <Motion.path
                          d={isEven 
                            ? "M 42 0 C 58 0, 42 100, 58 100"
                            : "M 58 0 C 42 0, 58 100, 42 100"
                          }
                          stroke={`url(#gradient-line-${index})`}
                          strokeWidth="0.4"
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray="2 2"
                          animate={{ strokeDashoffset: [0, -4] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          style={{ opacity: 0.8 }}
                        />
                      </svg>
                    </div>
                  )}

                  <div className={`flex flex-col lg:flex-row items-center ${isEven ? 'lg:justify-start' : 'lg:justify-end'} relative z-10 h-full`}>
                    {/* The Card */}
                    <Motion.div
                      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.6 }}
                      className={`w-full lg:w-[42%] ${isEven ? 'lg:mr-auto' : 'lg:ml-auto'}`}
                    >
                      <div className={`group relative bg-[#0f1623] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 ${step.shadow} hover:shadow-2xl`}>
                        {/* Gradient Border Glow */}
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                        
                        <div className="relative z-10 flex items-start gap-5">
                          {/* Icon Box */}
                          <div className={`shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} p-[1px]`}>
                            <div className="w-full h-full bg-[#0f1623] rounded-xl flex items-center justify-center text-2xl">
                              {step.icon}
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div>
                            <div className={`text-xs font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent mb-1 uppercase tracking-wider`}>
                              Step {step.number}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Motion.div>

                    {/* Mobile Timeline Dot */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-16 bg-gradient-to-b from-emerald-500/20 to-transparent lg:hidden"></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Stats */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          {[
            { value: '< 30 sec', label: 'Order to Kitchen Time' },
            { value: '100%', label: 'Real-Time Sync' },
            { value: '0', label: 'Manual Errors' },
          ].map((stat, index) => (
            <div key={index} className="text-center p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:bg-white/[0.04] transition-colors">
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </Motion.div>
      </div>
    </section>
  )
}

export default HowItWorks
