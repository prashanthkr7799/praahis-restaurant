import { motion as Motion } from 'framer-motion'
import { FaStar, FaQuoteLeft } from 'react-icons/fa'

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Owner, Spice Garden Restaurant',
    location: 'Mumbai',
    image: '👨‍💼',
    rating: 5,
    quote: 'Praahis simplified our operations. Order errors dropped, and our table turnover increased significantly.',
  },
  {
    name: 'Priya Sharma',
    role: 'Manager, Coastal Bites',
    location: 'Bangalore',
    image: '👩‍💼',
    rating: 5,
    quote: 'Managing tables is so much easier now. Our staff loves the simplicity, and customers appreciate the faster service.',
  },
  {
    name: 'Chef Arjun Mehta',
    role: 'Head Chef, Urban Kitchen',
    location: 'Delhi',
    image: '👨‍🍳',
    rating: 5,
    quote: 'The kitchen view is brilliant! Orders come in clearly, and the team knows exactly what to prepare.',
  },
  {
    name: 'Sneha Patel',
    role: 'Owner, Cafe Delight',
    location: 'Pune',
    image: '👩‍💼',
    rating: 5,
    quote: 'The insights help me see peak hours and best-selling items. It’s great to have everything in one place.',
  },
  {
    name: 'Vikram Singh',
    role: 'Restaurant Manager, Tandoor House',
    location: 'Hyderabad',
    image: '👨‍💼',
    rating: 5,
    quote: 'QR ordering is a hit! Customers love the convenience, and billing is smooth and automated.',
  },
  {
    name: 'Anita Desai',
    role: 'Owner, South Spice',
    location: 'Chennai',
    image: '👩‍💼',
    rating: 5,
    quote: 'Best investment for us. The communication tools keep everyone in sync and customers happy.',
  },
]

const Testimonials = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-[#1a1f35] to-[#0a0e1a] relative overflow-hidden" id="testimonials">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-20 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 backdrop-blur-sm mb-6">
            <span className="text-pink-300 text-sm font-medium">Trusted by Restaurant Owners</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            What Our Customers
            <br />
            <span className="bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
              Are Saying
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Real feedback from restaurant owners, managers, and chefs using Praahis daily
          </p>
        </Motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-white/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:shadow-xl relative">
                {/* Quote icon */}
                <div className="absolute top-6 right-6 text-4xl text-pink-500/20">
                  <FaQuoteLeft />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <FaStar key={i} className="text-yellow-400 text-sm" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-300 leading-relaxed mb-6 relative z-10">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center text-2xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                    <div className="text-xs text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            </Motion.div>
          ))}
        </div>

        {/* Bottom stats */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {[
            { value: '500+', label: 'Active Restaurants' },
            { value: '4.9/5', label: 'Average Rating' },
            { value: '98%', label: 'Customer Satisfaction' },
            { value: '10K+', label: 'Daily Orders Processed' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </Motion.div>
      </div>
    </section>
  )
}

export default Testimonials
