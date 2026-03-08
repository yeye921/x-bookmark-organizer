import { cn } from "@/lib/utils";

interface ImageGridProps {
  images: string[];
}

export function ImageGrid({ images }: ImageGridProps) {
  if (!images || images.length === 0) return null;

  const count = images.length;

  if (count === 1) {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden border border-border">
        <img
          src={images[0]}
          alt=""
          className="w-full max-h-[300px] object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden border border-border grid grid-cols-2 gap-[2px]">
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="w-full h-[200px] object-cover"
            loading="lazy"
          />
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden border border-border grid grid-cols-2 gap-[2px] h-[280px]">
        <img
          src={images[0]}
          alt=""
          className="w-full h-full object-cover row-span-2"
          loading="lazy"
        />
        <div className="flex flex-col gap-[2px]">
          <img
            src={images[1]}
            alt=""
            className="w-full h-[139px] object-cover"
            loading="lazy"
          />
          <img
            src={images[2]}
            alt=""
            className="w-full h-[139px] object-cover"
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  // 4 images
  return (
    <div className="mt-3 rounded-2xl overflow-hidden border border-border grid grid-cols-2 gap-[2px]">
      {images.slice(0, 4).map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className="w-full h-[140px] object-cover"
          loading="lazy"
        />
      ))}
    </div>
  );
}
