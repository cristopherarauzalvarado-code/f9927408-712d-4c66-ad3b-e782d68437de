import { HttpTypes } from "@medusajs/types"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (optionId: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const colorMap: Record<string, string> = {
  black: "#000000",
  white: "#FFFFFF",
  red: "#FF3333",
  blue: "#3B82F6",
  green: "#22C55E",
  yellow: "#FFC633",
  orange: "#F97316",
  purple: "#A855F7",
  pink: "#EC4899",
  brown: "#92400E",
  gray: "#6B7280",
  grey: "#6B7280",
  navy: "#1E3A5F",
  beige: "#F0EEED",
  olive: "#4F4631",
  teal: "#314F4A",
  "dark navy": "#31344F",
}

function getColorHex(value: string): string | null {
  const key = value.toLowerCase().trim()
  return colorMap[key] ?? null
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)
  const isColorOption = title.toLowerCase().includes("color") || title.toLowerCase().includes("colour")

  // Traduce los nombres de opción más comunes (definidos en inglés en Medusa).
  const titleEs =
    ({ size: "talla", color: "color", colour: "color" } as Record<string, string>)[
      title.toLowerCase()
    ] ?? title.toLowerCase()

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm text-black/60">
        Seleccioná {titleEs}
      </span>

      {isColorOption ? (
        /* Color circles */
        <div className="flex flex-wrap gap-3" data-testid={dataTestId}>
          {filteredOptions.map((v) => {
            const hex = getColorHex(v)
            const isSelected = v === current
            return (
              <button
                key={v}
                onClick={() => updateOption(option.id, v)}
                disabled={disabled}
                title={v}
                aria-label={`Seleccionar color ${v}`}
                className={`relative w-9 h-9 rounded-full transition-all ${
                  isSelected ? "ring-2 ring-offset-2 ring-black" : "hover:ring-2 hover:ring-offset-1 hover:ring-black/30"
                }`}
                style={{ backgroundColor: hex ?? "#ccc" }}
                data-testid="option-button"
              >
                {isSelected && (
                  <svg
                    className="absolute inset-0 m-auto"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M3 8l4 4 6-7"
                      stroke={hex && hex.toLowerCase() === "#ffffff" ? "#000" : "#fff"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        /* Size/other pills */
        <div className="flex flex-wrap gap-2" data-testid={dataTestId}>
          {filteredOptions.map((v) => {
            const isSelected = v === current
            return (
              <button
                key={v}
                onClick={() => updateOption(option.id, v)}
                disabled={disabled}
                className={`px-5 py-2 rounded-full text-sm transition-all ${
                  isSelected
                    ? "bg-black text-white font-medium"
                    : "bg-[#F0F0F0] text-black/60 hover:bg-gray-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                data-testid="option-button"
              >
                {v}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default OptionSelect
