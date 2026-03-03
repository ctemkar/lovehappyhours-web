'use client';

import Image from 'next/image';
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
  venueName: string;
}

export function PhotoGallery({ photos, venueName }: PhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-12 text-center">
        <p className="text-gray-500">No photos available yet</p>
      </div>
    );
  }

  const handlePrevious = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex(
      selectedPhotoIndex === 0 ? photos.length - 1 : selectedPhotoIndex - 1
    );
  };

  const handleNext = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex(
      selectedPhotoIndex === photos.length - 1 ? 0 : selectedPhotoIndex + 1
    );
  };

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {photos.slice(0, 6).map((photo, index) => (
          <div
            key={index}
            className="relative h-48 bg-gray-200 rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => setSelectedPhotoIndex(index)}
          >
            <Image
              src={photo}
              alt={`${venueName} - Photo ${index + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                // Hide broken images
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {index === 5 && photos.length > 6 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  +{photos.length - 6} more
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhotoIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
          >
            <X size={32} />
          </button>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* Image Container */}
          <div className="relative w-full max-w-4xl h-[60vh]">
            <Image
              src={photos[selectedPhotoIndex]}
              alt={`${venueName} - Photo ${selectedPhotoIndex + 1}`}
              fill
              className="object-contain"
              onError={(e) => {
                // Handle broken images in lightbox
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* Photo Counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {selectedPhotoIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
