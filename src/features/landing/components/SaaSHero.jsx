import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa6';

const SaaSHero = () => {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0e1a] via-[#1a1f35] to-[#0a0e1a]"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Content */}
        <Motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-left space-y-8"
        >
          {/* Badge */}
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 text-sm text-emerald-400"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Trusted by Modern Restaurants
          </Motion.div>

          {/* Headline */}
          <Motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
          >
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Smart Restaurant
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              Operating System
            </span>
          </Motion.h1>

          {/* Subheadline */}
          <Motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-400 max-w-xl"
          >
            Manage orders, tables, billing & kitchen in real time.
            <span className="block mt-2 text-lg text-gray-500">
              No training needed — get started immediately.
            </span>
          </Motion.p>

          {/* CTAs */}
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              to="/safe-demo"
              className="group flex items-center gap-3 bg-emerald-700 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.7)] hover:scale-105"
            >
              Try Live Demo
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </Motion.div>

          {/* Stats */}
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10"
          >
            {[
              { value: '500+', label: 'Restaurants' },
              { value: '99.9%', label: 'Uptime' },
              { value: '24/7', label: 'Support' },
            ].map((stat, i) => (
              <div key={i} className="text-center lg:text-left">
                <div className="text-3xl font-bold text-white tabular-nums">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </Motion.div>
        </Motion.div>

        {/* Right: Abstract Dashboard Preview (Heavily Blurred) */}
        <Motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative"
        >
          {/* Abstract Dashboard Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0f172a] font-sans">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
              <div className="h-2 w-32 bg-white/10 rounded-full"></div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6 grid gap-6">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Revenue', value: '$12,450', color: 'text-emerald-400' },
                  { label: 'Active Orders', value: '24', color: 'text-blue-400' },
                  { label: 'Pending', value: '12', color: 'text-orange-400' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-xs text-gray-400 mb-1">{stat.label}</div>
                    <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Main Area */}
              <div className="grid grid-cols-3 gap-4 h-48">
                {/* List */}
                <div className="col-span-2 bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                  <div className="h-2 w-20 bg-white/10 rounded-full mb-4"></div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10"></div>
                        <div className="space-y-1">
                          <div className="h-2 w-24 bg-white/10 rounded-full"></div>
                          <div className="h-1.5 w-16 bg-white/5 rounded-full"></div>
                        </div>
                      </div>
                      <div className="h-6 w-16 bg-emerald-500/20 rounded-full"></div>
                    </div>
                  ))}
                </div>
                {/* Chart/Side */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col justify-between">
                  <div className="h-2 w-16 bg-white/10 rounded-full"></div>
                  <div className="flex items-end justify-between gap-2 h-32">
                    <div className="w-full bg-blue-500/20 rounded-t-sm h-[40%]"></div>
                    <div className="w-full bg-blue-500/20 rounded-t-sm h-[70%]"></div>
                    <div className="w-full bg-blue-500/20 rounded-t-sm h-[50%]"></div>
                    <div className="w-full bg-blue-500/20 rounded-t-sm h-[80%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay Text - Removed as per request to design a preview dashboard, but user said 'remove these also in the page' referring to 'Want to see it in action?'. 
               The user said 'design the preview dashboard in the home screen but it should not be exactly our page.'
               I will remove the 'PREVIEW Dashboard Concept' overlay to make it look like a real dashboard.
            */}
          </div>

          {/* Floating Elements */}
          <Motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -top-6 -right-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-3 backdrop-blur-xl"
          >
            <div className="text-xs text-emerald-400 mb-1">Real-Time Sync</div>
            <div className="text-2xl font-bold text-white">⚡ Live</div>
          </Motion.div>

          <Motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 3, delay: 1 }}
            className="absolute -bottom-6 -left-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl px-6 py-3 backdrop-blur-xl"
          >
            <div className="text-xs text-blue-400 mb-1">Cloud Based</div>
            <div className="text-2xl font-bold text-white">☁️ Secure</div>
          </Motion.div>
        </Motion.div>
      </div>
    </section>
  );
};

export default SaaSHero;
