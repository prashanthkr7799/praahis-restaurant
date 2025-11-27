import { motion as Motion } from 'framer-motion'
import { FaCheck, FaStar, FaPhone, FaEnvelope } from 'react-icons/fa'

const pricingPlans = [
  {
    name: 'Professional Plan',
    price: '₹75',
    period: '/ table / day',
    description: 'Ideal for growing restaurants',
    billingNote: '(Billed monthly based on the number of active tables)',
    popular: true,
    features: [
      'Reliable & Fast Performance',
      'Digital Kitchen Screen',
      'Live Table Overview',
      'Complete Staff Accounts',
      'Instant Order Updates',
      'Integrated Payments',
      'Business Analytics Dashboard',
      'Custom Branding',
      'Priority Support',
      'Unlimited Staff Devices',
      'Multi-Location Support',
      'Live Updates',
      'Secure Cloud Hosting',
      'Continuous Updates',
    ],
    color: 'emerald',
  },
]

const colorClasses = {
  blue: {
    border: 'border-blue-500/30',
    bg: 'from-blue-500/10 to-blue-600/10',
    button: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    shadow: 'shadow-blue-500/30',
  },
  emerald: {
    border: 'border-emerald-500/50',
    bg: 'from-emerald-500/20 to-emerald-600/20',
    button: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
    shadow: 'shadow-emerald-500/50',
  },
  purple: {
    border: 'border-purple-500/30',
    bg: 'from-purple-500/10 to-purple-600/10',
    button: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    shadow: 'shadow-purple-500/30',
  },
}

const Pricing = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-[#0a0e1a] to-[#1a1f35] relative overflow-hidden" id="pricing">
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
            <span className="text-emerald-300 text-sm font-medium">Simple & Transparent Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Choose Your
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            No hidden fees. No setup costs. Cancel anytime.
          </p>
        </Motion.div>

        {/* Pricing Cards */}
        <div className="flex justify-center max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => {
            const colors = colorClasses[plan.color]

            return (
              <Motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative w-full"
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold shadow-lg">
                      <FaStar className="text-yellow-300" />
                      Most Popular Choice
                    </div>
                  </div>
                )}

                <div
                  className={`h-full p-8 md:p-12 rounded-3xl bg-gradient-to-br ${colors.bg} border-2 ${colors.border} backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 shadow-2xl ${colors.shadow}`}
                >
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                      {/* Plan name */}
                      <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-gray-400 text-lg mb-6">{plan.description}</p>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-6xl font-bold text-white">{plan.price}</span>
                          <span className="text-xl text-gray-400">{plan.period}</span>
                        </div>
                        <p className="text-sm text-emerald-400 mt-2 font-medium">{plan.billingNote}</p>
                      </div>

                      {/* CTA Button - Contact Admin */}
                      <div className="mt-6 space-y-4">
                        <div className={`inline-block w-full md:w-auto py-4 px-12 rounded-full bg-gradient-to-r ${colors.button} text-white font-bold text-lg text-center shadow-lg ${colors.shadow}`}>
                          Contact Admin to Get Started
                        </div>
                        <div className="flex flex-col gap-2 text-sm">
                          <a href="tel:+919876543210" className="flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors">
                            <FaPhone className="text-emerald-400" />
                            <span>+91 98765 43210</span>
                          </a>
                          <a href="mailto:admin@praahis.com" className="flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors">
                            <FaEnvelope className="text-emerald-400" />
                            <span>admin@praahis.com</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                      <h4 className="text-white font-semibold mb-4">What's Included:</h4>
                      <ul className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <FaCheck className="text-emerald-400 text-xs" />
                            </div>
                            <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Motion.div>
            )
          })}
        </div>

        {/* Bottom info */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 mb-6">
            Contact our team to get started • Custom setup available • Dedicated support
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <FaCheck className="text-emerald-400" />
              <span>Free Setup & Training</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheck className="text-emerald-400" />
              <span>Free Updates</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheck className="text-emerald-400" />
              <span>Data Migration Included</span>
            </div>
          </div>
        </Motion.div>

        {/* Enterprise CTA */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">Need a Custom Solution?</h3>
            <p className="text-gray-400 mb-6">
              For restaurant chains or custom requirements, contact our sales team for a tailored plan
            </p>
            <a
              href="#contact"
              className="inline-block px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300"
            >
              Contact Sales
            </a>
          </div>
        </Motion.div>
      </div>
    </section>
  )
}

export default Pricing
