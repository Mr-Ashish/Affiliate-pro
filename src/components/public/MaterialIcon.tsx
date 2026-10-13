type MaterialIconProps = {
  name: string;
  filled?: boolean;
  size?: number;
  className?: string;
};

export function MaterialIcon({ name, filled, size = 20, className }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined${filled ? " fill" : ""}${className ? ` ${className}` : ""}`}
      style={{ fontSize: size }}
      aria-hidden
    >
      {name}
    </span>
  );
}
