import React from 'react';

const ManageCard = (props) => {
  const { icon: Icon, label, desc, onClick } = props;
  return (
    <button
      onClick={onClick}
      className="group w-full text-left card-minimal p-4 hover:border-primary/40 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground group-hover:bg-primary-tint group-hover:text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold text-foreground">{label}</h3>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
    </button>
  );
};

export default ManageCard;
