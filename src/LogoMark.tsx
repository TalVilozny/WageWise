import iconUrl from "./Icons/WageWiseIcon.svg";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={iconUrl}
      alt=""
      aria-hidden
      decoding="async"
      className={className ?? "logo-icon"}
    />
  );
}
