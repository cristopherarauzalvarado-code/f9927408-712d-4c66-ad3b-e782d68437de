import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <section className="w-full bg-[#F2F0F1] overflow-hidden">
      <div className="max-w-[1440px] mx-auto relative small:min-h-[663px]">

        {/* Content — in-flow on mobile, absolute+centered on desktop */}
        <div
          className="
            relative z-10
            px-4 pt-10 pb-0
            small:px-0 small:pt-0 small:pb-0
            small:absolute small:left-[100px] small:top-1/2 small:-translate-y-1/2 small:max-w-[577px]
          "
        >
          <h1 className="font-heading font-black text-[36px] small:text-[64px] leading-[1.05] uppercase text-black mb-4 small:mb-6">
            Encontrá ropa que combine con tu estilo
          </h1>

          <p className="text-black/60 text-sm small:text-base leading-relaxed mb-6 small:mb-8 max-w-[358px] small:max-w-[545px]">
            Explorá nuestra variada gama de prendas cuidadosamente confeccionadas,
            diseñadas para resaltar tu individualidad y adaptarse a tu sentido del
            estilo.
          </p>

          {/* CTA — full-width on mobile, auto on desktop */}
          <LocalizedClientLink
            href="/store"
            className="flex items-center justify-center bg-black text-white rounded-full px-14 py-4 text-base font-medium hover:bg-gray-800 transition-colors mb-6 small:mb-12 small:w-fit"
          >Comprar ahora</LocalizedClientLink>

          {/* Stats */}
          <div>
            {/* Row 1: 200+ | divider | 2,000+ (both layouts) */}
            <div className="flex items-center justify-center small:justify-start gap-6">
              <div className="text-center small:text-left">
                <p className="text-2xl small:text-[40px] font-bold leading-tight text-black">200+</p>
                <p className="text-black/60 text-xs small:text-base mt-1">Marcas internacionales</p>
              </div>

              <div className="h-10 small:h-14 w-px bg-black/10 shrink-0" />

              <div className="text-center small:text-left">
                <p className="text-2xl small:text-[40px] font-bold leading-tight text-black">2,000+</p>
                <p className="text-black/60 text-xs small:text-base mt-1">Productos de alta calidad</p>
              </div>

              {/* Third stat inline on desktop only */}
              <div className="hidden small:contents">
                <div className="h-14 w-px bg-black/10 shrink-0" />
                <div>
                  <p className="text-[40px] font-bold leading-tight text-black">30,000+</p>
                  <p className="text-black/60 text-base mt-1">Clientes felices</p>
                </div>
              </div>
            </div>

            {/* Row 2 on mobile: 30,000+ centered */}
            <div className="flex justify-center mt-4 small:hidden">
              <div className="text-center">
                <p className="text-2xl font-bold leading-tight text-black">30,000+</p>
                <p className="text-black/60 text-xs mt-1">Clientes felices</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile image — in-flow, appears below content */}
        <div
          className="small:hidden w-full h-[448px] mt-6 bg-[#F2F0F1] bg-cover bg-top"
          style={{ backgroundImage: "url('/hero-fashion.jpg')" }}
          aria-hidden="true"
        />

        {/* Desktop image — absolute, right half */}
        <div
          className="hidden small:block absolute right-0 top-0 w-[55%] h-full bg-[#F2F0F1] bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-fashion.jpg')" }}
          aria-hidden="true"
        >
          <div className="absolute top-[10%] right-[8%] text-4xl pointer-events-none select-none opacity-60">✦</div>
          <div className="absolute bottom-[20%] left-[5%] text-xl pointer-events-none select-none opacity-60">✦</div>
        </div>

      </div>
    </section>
  )
}

export default Hero
