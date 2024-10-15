import Image from "next/image";
import clsx from "clsx";
import { murmur2 } from "murmurhash2";
import color from "tinycolor2";

function generateGradient(id: string) {
  const c1 = color({ h: murmur2(id, 360) % 360, s: 0.95, l: 0.5 });
  const second = c1.triad()[1].toHexString();

  return {
    fromColor: c1.toHexString(),
    toColor: second,
  };
}

export function StudioAvatar({
  id,
  url,
  size = "sm",
}: {
  id: string;
  url?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "huge";
}) {
  const gradient = generateGradient(id);

  const sizes = {
    xs: "h-5 w-5",
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
    huge: "h-14 w-14",
  }[size];

  const sizesPx = {
    xs: 20,
    sm: 24,
    md: 32,
    lg: 40,
    huge: 56,
  };

  if (url) {
    return (
      <Image
        src={url}
        alt="Studio Avatar"
        priority
        height={sizesPx[size]}
        width={sizesPx[size]}
        className={clsx(sizes, "aspect-square shrink-0 rounded-full")}
      />
    );
  }

  return (
    <div
      className={clsx(sizes, "aspect-square shrink-0 rounded-full")}
      style={{
        backgroundImage: `linear-gradient(to bottom right, ${gradient.fromColor}, ${gradient.toColor})`,
      }}
    ></div>
  );
}
