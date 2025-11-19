import hero from "@/assets/marketing/hero.jpeg"
import DemoButton from "./DemoButton"
// Animate elements in hero (removed logo animation)

const HeroSection = () => {
  return (
    <section className="relative flex h-screen items-center justify-center">
    <div className="absolute inset-0 -z-20 h-full w-full overflow-hidden">
      <img src={hero} alt="Hero background" className="h-full w-full object-cover" />
    </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent from-70% to-black"></div>
    <div className="relative z-20 flex h-screen flex-col justify-end pb-20">
            <div className="flex justify-center p-4">
                <DemoButton />
            </div>
        </div>
    </section>
  )
}
export default HeroSection