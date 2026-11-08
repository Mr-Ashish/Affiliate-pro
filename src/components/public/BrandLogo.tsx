import mark from "@/assets/thumbnail.png";
import wordmark from "@/assets/perkbonus_icon.png";
import { SITE_NAME } from "@/lib/brand";

type LogoProps = {
  className?: string;
  alt?: string;
};

export function BrandWordmark({ className, alt = SITE_NAME }: LogoProps) {
  return (
    <img
      src={wordmark.src}
      width={wordmark.width}
      height={wordmark.height}
      alt={alt}
      className={className}
    />
  );
}

export function BrandMark({ className, alt = "" }: LogoProps) {
  return (
    <img
      src={mark.src}
      width={mark.width}
      height={mark.height}
      alt={alt}
      className={className}
    />
  );
}
