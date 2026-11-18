export default function BrandLogo({
  className = "h-[1em]",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <img
      src={light ? "/image/icon_white.svg" : "/image/icon_black.svg"}
      alt="ResponKu"
      width={600}
      height={160}
      className={`inline-block w-auto align-middle ${className}`}
    />
  );
}
