export function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Invow",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "IDR",
        name: "Starter Plan",
        description: "10 invoice per bulan gratis",
      },
      {
        "@type": "Offer",
        price: "15000",
        priceCurrency: "IDR",
        name: "Business Plan",
        description: "200 invoice per bulan",
      },
      {
        "@type": "Offer",
        price: "50000",
        priceCurrency: "IDR",
        name: "Enterprise Plan",
        description: "Unlimited invoice",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "100",
      bestRating: "5",
      worstRating: "1",
    },
    description:
      "Buat invoice profesional dalam 30 detik dari HP. Platform invoice generator terbaik untuk bisnis Indonesia.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
