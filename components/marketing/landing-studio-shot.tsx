import Image from "next/image";

type LandingStudioShotProps = {
  src: string;
  alt: string;
  className?: string;
  heightClassName?: string;
};

export function LandingStudioShot({
  src,
  alt,
  className = "",
  heightClassName = "h-[320px] lg:h-[400px]",
}: LandingStudioShotProps) {
  return (
    <div
      className={`landing-studio-shot relative w-full min-w-0 overflow-hidden ${heightClassName}${className ? ` ${className}` : ""}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="landing-studio-shot-img object-contain object-center"
        sizes="(min-width: 1024px) 50vw, 100vw"
      />
      <div className="landing-studio-vignette" aria-hidden />
    </div>
  );
}
