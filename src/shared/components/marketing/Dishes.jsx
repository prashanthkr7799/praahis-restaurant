import { DISHES } from "@/constants"
import DishCard from "@domains/ordering/components/DishCard"
import bgImage from '@/assets/marketing/bg-taboon.jpeg'

const Dishes = () => {
  return (
    <section className="relative py-16" id="dishes">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 z-0 bg-black/70" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4">
        <h2 className="mb-12 text-center text-3xl tracking-tighter lg:text-4xl text-white drop-shadow-lg">Our Dishes</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 max-w-7xl mx-auto">
          {DISHES.map((project, index)=>(
            <DishCard key={index} project={project}/>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Dishes
