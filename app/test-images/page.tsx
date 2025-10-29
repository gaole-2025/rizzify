"use client";

import { useState } from "react";
import OptimizedImage from "@/components/OptimizedImage";
import {
  LoginImages,
  BeforeAfterImages,
  GalleryImages,
  ExampleImages,
  AvoidImages,
  AvatarImages,
  getImageSourceInfo,
  getCurrentImageSource,
} from "@/lib/image-urls";

export default function TestImagesPage() {
  const [imageSource, setImageSource] = useState<'local' | 'r2' | 'auto'>('auto');
  const sourceInfo = getImageSourceInfo();
  const currentSource = getCurrentImageSource();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Image URL System Test</h1>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Current Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Current Source:</strong> {currentSource}
              </div>
              <div>
                <strong>Production Mode:</strong> {sourceInfo.isProduction ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Use R2 Images:</strong> {sourceInfo.useR2Images ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>R2 Static Domain:</strong> {sourceInfo.r2StaticDomain}
              </div>
            </div>
          </div>

          {/* Source Selector */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setImageSource('auto')}
              className={`px-4 py-2 rounded ${
                imageSource === 'auto' ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              Auto
            </button>
            <button
              onClick={() => setImageSource('local')}
              className={`px-4 py-2 rounded ${
                imageSource === 'local' ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              Local
            </button>
            <button
              onClick={() => setImageSource('r2')}
              className={`px-4 py-2 rounded ${
                imageSource === 'r2' ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              R2
            </button>
          </div>
        </div>

        {/* Login Background Images */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Login Background Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {LoginImages.list.slice(0, 12).map((filename, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  <OptimizedImage
                    src={LoginImages.get(filename, imageSource)}
                    alt={`Login image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-gray-400 truncate">{filename}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Before/After Images */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Before/After Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BeforeAfterImages.pairs.slice(0, 6).map((pair, index) => (
              <div key={index} className="space-y-2">
                <h3 className="font-semibold">Pair {index + 1}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden">
                      <OptimizedImage
                        src={BeforeAfterImages.getBefore(pair.before, imageSource)}
                        alt={`Before ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs text-green-400">Before</p>
                  </div>
                  <div className="space-y-1">
                    <div className="aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden">
                      <OptimizedImage
                        src={BeforeAfterImages.getAfter(pair.after, imageSource)}
                        alt={`After ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-xs text-blue-400">After</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Example Images */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Example Images (Ideal)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ExampleImages.idealList.slice(0, 4).map((filename, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden border-2 border-green-400/30">
                  <OptimizedImage
                    src={ExampleImages.get(filename, imageSource)}
                    alt={`Example ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-green-400 truncate">{filename}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Avoid Images */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Avoid Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AvoidImages.list.map((filename, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden border-2 border-red-400/30">
                  <OptimizedImage
                    src={AvoidImages.get(filename, imageSource)}
                    alt={`Avoid ${index + 1}`}
                    fill
                    className="object-cover opacity-75"
                  />
                </div>
                <p className="text-xs text-red-400 truncate">{filename}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Avatar Images */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Avatar Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AvatarImages.list.map((filename, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-square bg-gray-800 rounded-full overflow-hidden">
                  <OptimizedImage
                    src={AvatarImages.get(filename, imageSource)}
                    alt={`Avatar ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">{filename}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery Images */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Gallery Images (Sample)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {GalleryImages.list.slice(0, 12).map((filename, index) => (
              <div key={index} className="space-y-2">
                <div className="aspect-[4/3] bg-gray-800 rounded-lg overflow-hidden">
                  <OptimizedImage
                    src={GalleryImages.get(filename, imageSource)}
                    alt={`Gallery ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-gray-400 truncate">{filename}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Debug Info */}
        <section className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm font-mono">
            <div>
              <strong>Sample Login Image URL:</strong>
              <br />
              <span className="text-green-400">
                {LoginImages.get('04cd87b5-3984-474e-b5fc-bf887b582e79.webp', imageSource)}
              </span>
            </div>
            <div>
              <strong>Sample Before Image URL:</strong>
              <br />
              <span className="text-blue-400">
                {BeforeAfterImages.getBefore('before-1.webp', imageSource)}
              </span>
            </div>
            <div>
              <strong>Sample Avatar URL:</strong>
              <br />
              <span className="text-purple-400">
                {AvatarImages.get('mia.jpg', imageSource)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
