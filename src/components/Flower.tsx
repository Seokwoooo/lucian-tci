export function Flower({ small = false }: { small?: boolean }) {
  const colors = ['#bfca9c','#d6bf9e','#a3b8a1','#e4c5a8','#c7c4a7','#aec3bd','#d5b7ae'];
  return <svg viewBox="0 0 400 400" className={small ? 'flower small' : 'flower'} aria-hidden="true">
    <circle cx="200" cy="200" r="175" fill="none" stroke="currentColor" strokeOpacity=".13" strokeDasharray="2 8" />
    {colors.map((color,i) => <g key={color} transform={`rotate(${i * 360/7} 200 200)`}>
      <path d="M200 209 C127 180 119 72 200 40 C281 72 273 180 200 209Z" fill={color} fillOpacity=".88" stroke="#f7f7f0" strokeWidth="2" />
      <path d="M200 200Q191 123 200 67" fill="none" stroke="#536044" strokeWidth=".8" strokeOpacity=".35" />
    </g>)}
    <circle cx="200" cy="200" r="23" fill="#f7f7f0" />
    <circle cx="200" cy="200" r="5" fill="#44593f" />
  </svg>;
}
