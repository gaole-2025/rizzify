"use client"

import { ChangeEvent, useMemo, useRef } from "react"
import clsx from "clsx"
import OptimizedImage from "../OptimizedImage"
import { GenderOption, SelectedFileMeta, StartExamples, UploadHint } from "@/lib/stage1-data"

interface DropzoneCopy {
  title: string
  description: string
  helper: string
}

interface UploadAreaProps {
  genderOptions: GenderOption[]
  selectedGender?: string
  onGenderChange: (value: "male" | "female") => void
  selectedFile?: SelectedFileMeta | null
  uploadHint: UploadHint
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  disabled?: boolean
  isUploading?: boolean
  examples: StartExamples
  dropzoneCopy: DropzoneCopy
}

const PLACEHOLDER_COUNT = 4

export default function UploadArea({
  genderOptions,
  selectedGender,
  onGenderChange,
  selectedFile,
  uploadHint,
  onFileSelect,
  onFileRemove,
  disabled,
  isUploading,
  examples,
  dropzoneCopy,
}: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const triggerSelect = () => {
    inputRef.current?.click()
  }

  const idealImages = useMemo(() => examples.idealImages ?? [], [examples])
  const avoidImages = useMemo(() => examples.avoidImages ?? [], [examples])

  const idealTiles = useMemo(() => {
    if (idealImages.length >= PLACEHOLDER_COUNT) return idealImages.slice(0, PLACEHOLDER_COUNT)
    return [...idealImages, ...Array(PLACEHOLDER_COUNT - idealImages.length).fill("")]
  }, [idealImages])

  const avoidTiles = useMemo(() => {
    if (avoidImages.length >= PLACEHOLDER_COUNT) return avoidImages.slice(0, PLACEHOLDER_COUNT)
    return [...avoidImages, ...Array(PLACEHOLDER_COUNT - avoidImages.length).fill("")]
  }, [avoidImages])

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">I am a...</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {genderOptions.map((option) => {
            const isActive = selectedGender === option.value
            return (
              <button
                key={option.value}
                type="button"
                className={clsx(
                  "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                  isActive
                    ? "border-blue-400 bg-blue-500/15 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white",
                  disabled && !isActive && "opacity-50"
                )}
                onClick={() => onGenderChange(option.value)}
                disabled={disabled}
                aria-pressed={isActive}
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs uppercase tracking-wide text-white/50">{isActive ? "Selected" : "Choose"}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-5">
        <header className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Photo guidance</h2>
          <p className="text-sm text-white/60">Use these examples to pick the right reference photo.</p>
        </header>
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-green-300">Ideal photo examples</h3>
              <span className="text-[11px] text-white/50">4 sample references</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {idealTiles.map((src, index) => (
                <div key={`ideal-${index}`} className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-white/10">
                  {src ? (
                    <OptimizedImage src={src} alt="Ideal reference example" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">Ideal #{index + 1}</div>
                  )}
                </div>
              ))}
            </div>
            <ul className="space-y-1 text-xs text-white/60">
              {examples.ideal.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-red-300">Photos to avoid</h3>
              <span className="text-[11px] text-white/50">4 samples to skip</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {avoidTiles.map((src, index) => (
                <div key={`avoid-${index}`} className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {src ? (
                    <OptimizedImage src={src} alt="Avoid reference example" fill className="object-cover opacity-70" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">Avoid #{index + 1}</div>
                  )}
                </div>
              ))}
            </div>
            <ul className="space-y-1 text-xs text-white/60">
              {examples.avoid.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <header>
          <h2 className="mb-2 text-lg font-semibold text-white">{dropzoneCopy.title}</h2>
          <p className="text-sm text-white/60">{dropzoneCopy.description}</p>
        </header>

        <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-6">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
            aria-label="Upload a reference photo"
          />

          {!selectedFile ? (
            <button
              type="button"
              className={clsx(
                "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/20 py-12 text-center text-white/70 transition",
                disabled ? "cursor-not-allowed opacity-50" : "hover:border-white/30 hover:text-white"
              )}
              onClick={triggerSelect}
              disabled={disabled}
            >
              <span className="text-4xl" aria-hidden="true">📤</span>
              <div className="space-y-1">
                <p className="text-base font-medium text-white">Drag and drop, or browse from your device</p>
                <p className="text-xs text-white/60">{dropzoneCopy.helper}</p>
              </div>
            </button>
          ) : (
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{selectedFile.name}</p>
                <p className="text-xs text-white/50">
                  {selectedFile.sizeMB.toFixed(2)} MB · {selectedFile.width}×{selectedFile.height}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/70 hover:border-white/30 hover:text-white"
                  onClick={triggerSelect}
                  disabled={disabled}
                >
                  Replace
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-white/10 px-3 py-1 text-xs text-red-300 hover:border-red-300/80"
                  onClick={onFileRemove}
                  disabled={disabled}
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-white/50">
            {uploadHint.passed ? "Looks great" : "We will double-check clarity during generation."}
          </div>
        </div>
      </section>

      <div className="flex flex-col items-start gap-3 text-xs text-white/60 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={triggerSelect}
          className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:border-white/40 hover:bg-white/10"
          disabled={disabled || isUploading || !selectedGender}
        >
          {selectedFile ? "Replace photo" : "Upload photo"}
        </button>
        {isUploading && <span className="text-blue-300">Uploading...</span>}
        {!selectedGender && <span className="text-yellow-300">Select a gender to enable upload.</span>}
      </div>
    </div>
  )
}
