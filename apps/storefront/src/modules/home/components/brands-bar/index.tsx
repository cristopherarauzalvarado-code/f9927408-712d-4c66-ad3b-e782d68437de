const brands = [
  { name: "VERSACE", className: "font-serif italic text-xl small:text-2xl font-bold tracking-widest" },
  { name: "ZARA", className: "font-heading text-2xl small:text-3xl font-black tracking-[0.25em]" },
  { name: "GUCCI", className: "font-serif text-xl small:text-2xl font-bold tracking-[0.2em]" },
  { name: "PRADA", className: "font-heading text-xl small:text-2xl font-black tracking-[0.2em]" },
  { name: "Calvin Klein", className: "font-sans text-sm small:text-xl font-light tracking-[0.3em] uppercase" },
]

export default function BrandsBar() {
  return (
    <section className="w-full bg-black py-8 small:py-10">
      <div className="max-w-[1440px] mx-auto px-4 small:px-6">
        {/* Two rows on mobile, single row on desktop */}
        <div className="flex flex-wrap items-center justify-around small:justify-between gap-y-6 small:gap-y-0">
          {brands.map((brand) => (
            <span key={brand.name} className={`text-white ${brand.className}`}>
              {brand.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
