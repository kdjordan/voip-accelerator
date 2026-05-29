import { useHead } from '@unhead/vue';

const siteUrl = 'https://www.voipaccelerator.com';
const siteName = 'VOIP Accelerator';
const ogImage = `${siteUrl}/og-image.png`;

interface MarketingSeoInput {
  path: '/' | '/features' | '/pricing' | '/contact';
  title: string;
  description: string;
}

function canonicalFor(path: MarketingSeoInput['path']): string {
  return path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`;
}

function breadcrumbJsonLd(input: MarketingSeoInput) {
  const itemListElement = [
    {
      '@type': 'ListItem',
      position: 1,
      name: siteName,
      item: `${siteUrl}/`,
    },
  ];

  if (input.path !== '/') {
    itemListElement.push({
      '@type': 'ListItem',
      position: 2,
      name: input.title.split(' - ')[0],
      item: canonicalFor(input.path),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteName,
  url: `${siteUrl}/`,
  logo: `${siteUrl}/favicon-512.png`,
  description: 'Local-first rate deck analysis software for telecom pricing and LCR teams.',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    url: `${siteUrl}/contact`,
  },
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteName,
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Telecom Rate Deck Analysis',
  operatingSystem: 'Web browser',
  description:
    'Local-first US NPANXX rate deck analysis and comparison tool with LERG enrichment and report export for VOIP operators, wholesale carriers, and telecom pricing teams.',
  url: `${siteUrl}/`,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    url: `${siteUrl}/pricing`,
  },
  publisher: {
    '@type': 'Organization',
    name: siteName,
  },
};

export function useMarketingSeo(input: MarketingSeoInput): void {
  const canonical = canonicalFor(input.path);

  useHead({
    title: input.title,
    meta: [
      { name: 'title', content: input.title },
      { name: 'description', content: input.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: siteName },
      { property: 'og:url', content: canonical },
      { property: 'og:title', content: input.title },
      { property: 'og:description', content: input.description },
      { property: 'og:image', content: ogImage },
      { property: 'og:image:width', content: '2400' },
      { property: 'og:image:height', content: '1260' },
      { property: 'og:image:type', content: 'image/png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:url', content: canonical },
      { name: 'twitter:title', content: input.title },
      { name: 'twitter:description', content: input.description },
      { name: 'twitter:image', content: ogImage },
    ],
    link: [{ rel: 'canonical', href: canonical }],
    script: [
      {
        type: 'application/ld+json',
        key: 'organization-jsonld',
        innerHTML: organizationJsonLd,
      },
      {
        type: 'application/ld+json',
        key: 'software-jsonld',
        innerHTML: softwareJsonLd,
      },
      {
        type: 'application/ld+json',
        key: `breadcrumb-jsonld-${input.path}`,
        innerHTML: breadcrumbJsonLd(input),
      },
    ],
  });
}
