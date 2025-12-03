import { HugeiconsIcon } from "@hugeicons/react";

type IconType = readonly (readonly [
  string,
  { readonly [key: string]: string | number }
])[];

interface FeatureCardProps {
  icon: IconType;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="relative rounded-xl bg-white p-8 hover:shadow-md transition-shadow border border-gray-200">
      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <HugeiconsIcon
          icon={icon}
          size={24}
          className="text-primary"
          strokeWidth={1.5}
        />
      </div>
      <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">
        {title}
      </h3>
      <p className="text-sm lg:text-base text-gray-600">{description}</p>
    </div>
  );
}
