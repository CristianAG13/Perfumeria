import { Helmet } from 'react-helmet-async'

interface Props {
  title?: string
  description?: string
  noIndex?: boolean
}

const BASE_TITLE = 'Perfumería A y F — Perfumes Originales en Costa Rica'
const BASE_DESCRIPTION = 'Perfumes originales importados en Costa Rica. Envíos a todo el país, los mejores precios y atención personalizada.'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Perfumería A y F',
  description: BASE_DESCRIPTION,
  url: 'https://perfumeriaayf.com',
  telephone: '+506 8888-8888',
  email: 'info@perfumeriaayf.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'San José',
    addressCountry: 'CR',
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '09:00',
    closes: '18:00',
  },
  priceRange: '₡₡₡',
}

export function SEO({ title, description, noIndex }: Props) {
  const fullTitle = title ? `${title} | Perfumería A y F` : BASE_TITLE
  const desc = description ?? BASE_DESCRIPTION

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  )
}
