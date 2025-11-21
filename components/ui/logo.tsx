import Image from "next/image";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 24, showText = true, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/icons/favicon-96x96.png"
        alt="Invow Logo"
        width={size}
        height={size}
        className="rounded-sm"
      />
      {showText && <span className="text-xl lg:text-2xl font-semibold text-gray-900">Invow</span>}
    </div>
  );
}
