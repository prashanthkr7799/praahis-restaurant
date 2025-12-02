import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaBars, FaTimes } from 'react-icons/fa'
import logo from '/logo.svg'

const navLinks = [
  { text: 'Features', href: '#features' },
  { text: 'How It Works', href: '#how-it-works' },
  { text: 'Benefits', href: '#benefits' },
  { text: 'Testimonials', href: '#testimonials' },
  { text: 'Pricing', href: '#pricing' },
  { text: 'Contact', href: '#contact' },
]

const SaaSNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleScroll = (event, href) => {
    event.preventDefault()
    
    if (href.startsWith('#')) {
      const targetId = href.substring(1)
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        const offsetTop = targetElement.offsetTop - 120
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth',
        })
      }
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="Praahis Logo" className="h-10 w-auto group-hover:scale-105 transition-transform" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                {link.text}
              </a>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              to="/login"
              className="px-6 py-2.5 text-gray-300 hover:text-white font-medium transition-colors duration-200"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0a0e1a]/95 backdrop-blur-xl border-t border-white/10">
          <div className="container mx-auto px-4 py-6 space-y-4">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="block py-3 text-gray-300 hover:text-white transition-colors duration-200 font-medium border-b border-white/5"
              >
                {link.text}
              </a>
            ))}
            <div className="pt-4 space-y-3">
              <Link
                to="/login"
                onClick={toggleMobileMenu}
                className="block w-full py-3 text-center text-gray-300 hover:text-white font-medium transition-colors duration-200 border border-white/10 rounded-full"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default SaaSNavbar
