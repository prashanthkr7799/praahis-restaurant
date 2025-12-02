const DishCard = ({ project }) => {
  return (
    <div className="group">
      <div className="overflow-hidden rounded-lg mb-4">
        <img 
          src={project.image} 
          alt={project.title} 
          className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110" 
        />
      </div>
      <div>
        <h3 className="mb-3 text-2xl font-bold tracking-tighter text-orange-400">{project.title}</h3>
        <p className="text-sm text-neutral-300 mb-4 line-clamp-4">{project.description}</p>
        <button className="border-b-2 border-orange-400 text-orange-400 font-semibold uppercase text-sm tracking-wider hover:text-orange-300 hover:border-orange-300 transition-colors">
          Read More
        </button>
      </div>
    </div>
  );
}

export default DishCard;
