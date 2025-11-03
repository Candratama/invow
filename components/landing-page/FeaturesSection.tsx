import {
  Smartphone,
  Zap,
  FileText,
  Shield,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: Smartphone,
    title: "Create invoices anywhere",
    description:
      "No laptop needed. Write invoices while you're at the market, in your shop, or anywhere you are. Your phone is all you need.",
  },
  {
    icon: Zap,
    title: "Done in 30 seconds",
    description:
      "Just type the items, add the price, and you'sre done. No complicated forms or setup. Get back to running your business.",
  },
  {
    icon: FileText,
    title: "Looks professional",
    description:
      "Your customers will take you seriously. Clean, professional invoices that build trust and make you look like a real business.",
  },
  {
    icon: Shield,
    title: "Never lose an invoice",
    description:
      "Everything saves automatically. Access your invoice history from any device. No more lost receipts or wondering what you sold.",
  },
  {
    icon: CheckCircle,
    title: "No learning curve",
    description:
      "If you can text, you can use this. No courses to take or manuals to read. Just open the app and start creating invoices.",
  },
  {
    icon: CreditCard,
    title: "Works with Rupiah",
    description:
      "Automatic IDR formatting, proper decimal places, and currency symbols. Just enter the numbers, we handle the formatting.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to invoice like a pro
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Built specifically for Indonesian UMKM who want to get paid faster
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
