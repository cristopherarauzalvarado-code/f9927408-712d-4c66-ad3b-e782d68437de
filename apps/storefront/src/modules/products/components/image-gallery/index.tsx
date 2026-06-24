"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col small:flex-row gap-3">
        <div className="w-full small:w-[444px] aspect-[444/530] bg-[#F0EEED] rounded-[20px]" />
      </div>
    )
  }

  const mainImage = images[selectedIndex] ?? images[0]

  return (
    <div className="flex flex-col-reverse small:flex-row gap-3">
      {/* Thumbnails — left column on desktop, horizontal scroll on mobile */}
      {images.length > 1 && (
        <div className="flex small:flex-col gap-3 overflow-x-auto small:overflow-x-visible no-scrollbar">
          {images.map((image, index) => (
            <button
              key={image.id ?? index}
              onClick={() => setSelectedIndex(index)}
              className={`relative shrink-0 w-[80px] h-[80px] small:w-[152px] small:h-[167px] rounded-[14px] small:rounded-[20px] overflow-hidden bg-[#F0EEED] transition-all ${
                index === selectedIndex
                  ? "ring-2 ring-black"
                  : "ring-1 ring-black/10 hover:ring-black/30"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  alt={`Product thumbnail ${index + 1}`}
                  fill
                  sizes="152px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative flex-1 small:w-[444px] aspect-[444/530] small:aspect-auto small:h-[530px] rounded-[20px] overflow-hidden bg-[#F0EEED]">
        {!!mainImage.url && (
          <Image
            src={mainImage.url}
            alt="Product image"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 444px"
            className="object-cover"
          />
        )}
      </div>
    </div>
  )
}

export default ImageGallery
