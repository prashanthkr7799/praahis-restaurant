import { useState } from "react"
import { Link } from "react-router-dom"
import logo from "/logo.svg"
import {LINKS} from "@/constants"
import { FaTimes } from "react-icons/fa"
import { FaBars } from "react-icons/fa6"

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const toogleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    }

    const handleScroll = (event, targetId) => {
        event.preventDefault();
        const targetElement = document.getElementById(targetId);
        if (targetElement){
            const offsetTop = targetElement.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: "smooth"
            }

            )
        }
    setIsMobileMenuOpen(false)
    }
  return (
    <nav className="fixed top-4 z-50 flex w-full flex-col items-center justify-center">
        <div className="flex w-full items-center justify-between overflow-y-hidden p-4 backdrop-blur-lg lg:m-2 lg:w-[50rem] lg:rounded-full lg:shadow-lg">
            <div className="flex items-center h-full">
                <img src={logo} alt="Tabun logo" className="h-10 w-auto mr-22 object-contain mt- -5" />
            </div>
            <div className="hidden space-x-6 lg:flex items-center h-full">
                <Link to="/" className="text-sm hover:opacity-50 text-foreground ml-4 ">
                    Home
                </Link>
                {LINKS.map((link, index) => (
                    <a key={index} href={`#${link.targetId}`} className={'text-sm border-l-2 border-neutral-300/20 pl-2 hover:opacity-50'} onClick={(e)=> handleScroll(e, link.targetId)}>
                        {link.text}
                    </a>
                ))}
                <Link to="/table/demo" className="text-sm border-l-2 border-neutral-300/20 pl-2 hover:opacity-50">
                    Demo
                </Link>
            </div>
            <div className="lg:hidden">
                <button onClick={toogleMobileMenu}>
                    {isMobileMenuOpen ? <FaTimes/> : <FaBars/>}
                </button>
            </div>
        </div>
        {isMobileMenuOpen && (
            <div className="w-full backdrop-blur-lg lg:hidden">
                <Link to="/" className="block p-4 uppercase tracking-tighter" onClick={toogleMobileMenu}>
                    Home
                </Link>
                {LINKS.map((link, index)=>(
                    <a key={index} href={`#${link.targetId}`} className="block p-4 uppercase tracking-tighter" onClick={(e) => handleScroll(e,link.targetId)}>
                            {link.text}
                        </a>
                ))}
                <Link to="/table/demo" className="block p-4 uppercase tracking-tighter" onClick={toogleMobileMenu}>
                    Demo
                </Link>
            </div>
        )}
    </nav>
  )
}
export default Navbar
