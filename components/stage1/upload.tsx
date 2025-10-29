"use client";

import { ChangeEvent, useMemo, useRef } from "react";
import clsx from "clsx";
import OptimizedImage from "../OptimizedImage";
import {
  GenderOption,
  SelectedFileMeta,
  StartExamples,
  UploadHint,
} from "@/lib/stage1-data";

interface DropzoneCopy {
  title: string;
  description: string;
  helper: string;
}

interface UploadAreaProps {
  genderOptions: GenderOption[];
  selectedGender?: string;
  onGenderChange: (value: "male" | "female") => void;
  selectedFile?: SelectedFileMeta | null;
  uploadHint: UploadHint;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  disabled?: boolean;
  isUploading?: boolean;
  examples: StartExamples;
  dropzoneCopy: DropzoneCopy;
}

const PLACEHOLDER_COUNT = 4;

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
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const triggerSelect = () => {
    inputRef.current?.click();
  };

  const idealImages = useMemo(() => examples.idealImages ?? [], [examples]);
  const avoidImages = useMemo(() => examples.avoidImages ?? [], [examples]);

  const idealTiles = useMemo(() => {
    if (idealImages.length >= PLACEHOLDER_COUNT)
      return idealImages.slice(0, PLACEHOLDER_COUNT);
    return [
      ...idealImages,
      ...Array(PLACEHOLDER_COUNT - idealImages.length).fill(""),
    ];
  }, [idealImages]);

  const avoidTiles = useMemo(() => {
    if (avoidImages.length >= PLACEHOLDER_COUNT)
      return avoidImages.slice(0, PLACEHOLDER_COUNT);
    return [
      ...avoidImages,
      ...Array(PLACEHOLDER_COUNT - avoidImages.length).fill(""),
    ];
  }, [avoidImages]);

  // 理想照片的描述文本
  const idealDescriptions = [
    "High Definition and Good Lighting",
    "Various Facial Expressions",
    "Diverse Locations and Clothes",
    "Variation of Backgrounds, Angles & Scenes",
  ];

  // 避免照片的描述文本
  const avoidDescriptions = [
    "Cutoff Or Covered Faces",
    "Multiple Persons or Blurry Images",
    "Poorly cropped or Facial Features not visible",
    "Sunglasses or Hats",
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">I am a...</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {genderOptions.map((option) => {
            const isActive = selectedGender === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={clsx(
                  "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                  isActive
                    ? "border-blue-400 bg-blue-500/15 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white",
                  disabled && !isActive && "opacity-50",
                )}
                onClick={() => onGenderChange(option.value)}
                disabled={disabled}
                aria-pressed={isActive}
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs uppercase tracking-wide text-white/50">
                  {isActive ? "Selected" : "Choose"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <header className="space-y-2">
          <h2 className="text-xl font-semibold text-white">
            Upload Your Sample Photos
          </h2>
          <p className="text-sm text-white/70">
            The quality of your AI-generated photos depends directly on the
            sample photos you provide. Think of these as training data for your
            personal AI model.
          </p>
        </header>

        {/* Ideal Photo Examples Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-400">
              Ideal Photo Examples
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {idealTiles.map((src, index) => (
              <div
                key={`ideal-${index}`}
                className="flex flex-col items-center space-y-3"
              >
                <div className="relative aspect-[3/4] w-full max-w-[160px] overflow-hidden rounded-xl border-2 border-green-400/30 bg-white/5 shadow-lg">
                  {src ? (
                    <OptimizedImage
                      src={src}
                      alt={`Ideal photo example ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                      Ideal #{index + 1}
                    </div>
                  )}
                </div>
                <p className="text-center text-xs font-medium leading-tight text-green-300">
                  {idealDescriptions[index] || `Ideal Example ${index + 1}`}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Photos to Avoid Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-400">
              Photos to Avoid
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {avoidTiles.map((src, index) => (
              <div
                key={`avoid-${index}`}
                className="flex flex-col items-center space-y-3"
              >
                <div className="relative aspect-[3/4] w-full max-w-[160px] overflow-hidden rounded-xl border-2 border-red-400/30 bg-white/5 shadow-lg">
                  {src ? (
                    <div className="relative h-full w-full">
                      <OptimizedImage
                        src={src}
                        alt={`Photo to avoid example ${index + 1}`}
                        fill
                        className="object-cover opacity-75"
                      />
                      {/* Red overlay with X */}
                      <div className="absolute inset-0 bg-red-500/20">
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
                            <svg
                              className="h-5 w-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                      Avoid #{index + 1}
                    </div>
                  )}
                </div>
                <p className="text-center text-xs font-medium leading-tight text-red-300">
                  {avoidDescriptions[index] || `Avoid Example ${index + 1}`}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Best Results Tips */}
        <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
          <h4 className="mb-3 font-semibold text-blue-300">
            For best results:
          </h4>
          <ul className="space-y-1 text-sm text-white/80">
            <li>• Upload one clear, well-lit photo that looks like you</li>
            <li>
              • Crop your photo close to your face - your face should fill most
              of the frame
            </li>
            <li>• Ensure your face is clearly visible and well-centered</li>
            <li>
              • Choose a recent photo that represents your current appearance
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <header>
          <h2 className="mb-2 text-lg font-semibold text-white">
            {dropzoneCopy.title}
          </h2>
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
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "hover:border-white/30 hover:text-white",
              )}
              onClick={triggerSelect}
              disabled={disabled}
            >
              <span className="text-4xl" aria-hidden="true">
                📤
              </span>
              <div className="space-y-1">
                <p className="text-base font-medium text-white">
                  Drop your photos here or click to upload
                </p>
                <p className="text-xs text-white/60">{dropzoneCopy.helper}</p>
              </div>
            </button>
          ) : (
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-white/50">
                  {selectedFile.sizeMB.toFixed(2)} MB · {selectedFile.width}×
                  {selectedFile.height}
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
            {uploadHint.passed
              ? "Looks great"
              : "We will double-check clarity during generation."}
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-white/50">
            Supported formats: JPG, PNG, HEIC/HEIF
          </p>
        </div>
      </section>

      <div className="flex flex-col items-start gap-3 text-xs text-white/60 sm:flex-row sm:items-center">
        {!selectedGender && (
          <span className="text-yellow-300">
            Select a gender to enable upload.
          </span>
        )}
      </div>
    </div>
  );
}
