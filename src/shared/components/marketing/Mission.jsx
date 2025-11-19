import missionImg from "@/assets/marketing/mission.jpeg"
import { MISSION } from "@/constants"
import { motion as Motion } from 'framer-motion'
const Mission = () => {
  return (
    <section id="mission">
        <div className="container mx-auto text-center">
            <h2 className="mv-8 text-3xl lg:text-4xl">Our Mission</h2>
            <div className="relative flex items-center justify-center">
  <Motion.img
    className="w-full rounded-3xl object-cover"
    src={missionImg}
    alt="Our Mission"
    initial={{opacity:0}}
    whileInView={{opacity:1}}
    viewport={{once:true}}
    transition={{duration:1}}
  />
        <Motion.div
                initial={{opacity:0}}
                whileInView={{opacity:1}}
                viewport={{once:true}}
                transition={{duration:0.5, delay:0.5}}
         className="absolute h-full w-full rounded-3xl bg-black/40"></Motion.div>
        <Motion.p 
                initial={{opacity:0, y:20}}
                whileInView={{opacity:1, y:0}}
                viewport={{once:true}}
                transition={{duration:1, delay:0.5}}
        className="absolute max-w-lg tracking-tighter lg:text-3xl">{MISSION}</Motion.p>
            </div>
        </div>
    </section>
  )
}

export default Mission
