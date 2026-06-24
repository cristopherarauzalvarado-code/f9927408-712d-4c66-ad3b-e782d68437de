"use client"

import { useState } from "react"

export type FaqItem = {
  question: string
  answer: string
}

const FaqAccordion = ({ items }: { items: FaqItem[] }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="flex flex-col divide-y divide-black/10 border-y border-black/10">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <div key={item.question}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-bold text-base small:text-lg text-black">
                {item.question}
              </span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                className={`shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isOpen && (
              <p className="pb-5 -mt-1 text-sm small:text-base text-black/60 leading-relaxed whitespace-pre-line">
                {item.answer}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default FaqAccordion
