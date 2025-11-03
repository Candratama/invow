import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-24 bg-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Stop invoicking manually. Start today.
        </h2>
        <p className="mt-6 text-xl text-white/90">
          It takes 30 seconds to create your first invoice. No signup required
          to try.
        </p>
        <div className="mt-12">
          <Link href="/dashboard">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-50 text-lg px-8 py-6 shadow-sm"
            >
              Create Your First Invoice
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-white/80">
            Free forever • No credit card • Works on any phone
          </p>
        </div>
      </div>
    </section>
  );
}
