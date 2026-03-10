function Ribbon() {
  // We duplicate the items array so the screen never runs empty before it loops back
  const items = [
    "😊 No palm oil",
    "😊 No preservatives",
    "😊 No added colors",
    "😊 No palm oil",
    "😊 No preservatives",
    "😊 No added colors",
    "😊 No palm oil",
    "😊 No preservatives",
    "😊 No added colors",
  ];

  return (
    <div className="bg-primary text-white overflow-hidden mt-[30px] flex whitespace-nowrap">
      {/* The animate-marquee class pushes this massive block -50% to the left. 
          By making it flex and double the items, it flawlessly loops back to 0% right
          when the exact perfect matching pixel crosses the edge of the screen */}
      <div className="flex w-max animate-marquee font-semibold py-3 gap-12 px-6">
        {items.map((item, index) => (
          <span key={`first-${index}`}>{item}</span>
        ))}
        {items.map((item, index) => (
          <span key={`second-${index}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}

export default Ribbon;