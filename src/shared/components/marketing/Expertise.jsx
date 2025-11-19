import { CUSINES } from "@/constants"
import { motion as Motion } from "framer-motion"
import bgImage from '@/assets/marketing/bg-taboon.jpeg'

const containerVariants = {
    hidden: {opacity: 0,},
    show: { 
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
        }
    }
}

const ItemVariants ={
    hidden: {opacity:0, y:20},
    show: {opacity:1, y:0, transition:{
        duration: 0.4,
    }}
}
const Expertise = () => {
  return (
   <section className="relative py-16" id="expertise">
    {/* Background Image */}
    <div 
      className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    />
    
    {/* Dark overlay for better text readability */}
    <div className="absolute inset-0 z-0 bg-black/40" />
    
    {/* Content */}
    <div className="relative z-10">
      <h2 className="my-8 text-center text-3xl tracking-tighter lg:text-4xl text-white drop-shadow-lg">Our Expertise</h2>
      <Motion.div 
      initial="hidden"
      whileInView="show"
      variants={containerVariants}
      className="container ms-auto px-4">
          {CUSINES.map((cusine, index)=>(
              <Motion.div 
              variants={ItemVariants}
              key={index} className="flex items-center border-b-4 border-dotted border-neutral-300/40 py-2">
                  <div className="flex-shrink-0 pr-8 text-2xl text-white">{cusine.number}</div>
                  <div className="w-1/3 flex-shrink-0">
                  <img src={cusine.image} alt={cusine.title} className="h-auto rounded-3xl"></img>
                  </div>
                  <div className="pl-8"> 
                      <h3 className="text-2xl uppercase tracking-tighter text-rose-300">
                          {cusine.title}
                      </h3>
                      <p className="mt-4 text-lg tracking-tighter text-neutral-200">
                          {cusine.description}
                      </p>
                  </div>
              </Motion.div>
          ))}
      </Motion.div>
    </div>
   </section>
  )
}
export default Expertise
