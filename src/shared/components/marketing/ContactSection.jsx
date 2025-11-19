import { CONTACT } from "@/constants"
import bgImage from '@/assets/marketing/bg-taboon.jpeg'

const ContactSection = () => {
  return (
    <section className="relative py-16" id="contact">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 z-0 bg-black/40" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto">
        <h2 className="mb-8 text-center text-3xl lg:text-4xl text-white drop-shadow-lg">Contact Us</h2>
        <div className="text-neutral-200">{CONTACT.map((details)=>(
            <p key={details.key} className="my-20 border-b-2 border-dotted border-neutral-300/40 pb-12 text-center text-2xl tracking-tighter lg:text-3xl" >
                {details.value}
            </p>
        ))}
        </div>
      </div>
    </section>
  )
}

export default ContactSection
