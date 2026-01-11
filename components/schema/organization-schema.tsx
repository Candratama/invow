export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Invow",
    url: "https://invow.app",
    logo: "https://invow.app/icons/web-app-manifest-512x512.png",
    description:
      "Platform invoice generator profesional untuk bisnis Indonesia",
    address: {
      "@type": "PostalAddress",
      addressCountry: "ID",
    },
    sameAs: [
      "https://twitter.com/invow_app",
      "https://instagram.com/invow_app",
      "https://linkedin.com/company/invow",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
