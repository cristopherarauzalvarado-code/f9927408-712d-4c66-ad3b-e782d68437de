import LocalizedClientLink from "@modules/common/components/localized-client-link"

const styles = [
  {
    name: "Casual",
    href: "/store",
    bg: "bg-[#fde8d8]",
    span: "small:col-span-1",
  },
  {
    name: "Formal",
    href: "/store",
    bg: "bg-[#dce8fd]",
    span: "small:col-span-2",
  },
  {
    name: "Fiesta",
    href: "/store",
    bg: "bg-[#fde8f0]",
    span: "small:col-span-2",
  },
  {
    name: "Gym",
    href: "/store",
    bg: "bg-[#e8fde8]",
    span: "small:col-span-1",
  },
]

export default function BrowseByStyle() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 small:px-6 py-12 small:py-16">
      <div className="bg-[#F0F0F0] rounded-[20px] small:rounded-[40px] p-6 small:p-16">
        <h2 className="font-heading font-black text-[32px] small:text-[48px] uppercase text-black text-center mb-8 small:mb-12 leading-[1.1]">
          Buscá por estilo
        </h2>
        <div className="grid grid-cols-1 small:grid-cols-3 gap-4">
          {styles.map((style) => (
            <LocalizedClientLink
              key={style.name}
              href={style.href}
              className={`
                ${style.span} ${style.bg}
                rounded-[20px] p-6
                h-[190px] small:h-[289px]
                flex items-start overflow-hidden relative
                group hover:shadow-md transition-shadow
              `}
            >
              <span className="font-sans font-bold text-2xl small:text-[36px] text-black z-10 relative">
                {style.name}
              </span>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}
