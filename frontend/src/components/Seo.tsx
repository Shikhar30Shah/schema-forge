import Head from 'next/head';
import { useRouter } from 'next/router';

const SITE_NAME = 'SchemaForge';
const SITE_URL = 'https://schemaforg.vercel.app';
const DEFAULT_TITLE = 'SchemaForge — AI Database Migration & API Route Generator';
const DEFAULT_DESCRIPTION =
  'AI-powered database migration and API route generator. Turn legacy schemas or ERD images into production-ready Mongoose models, Express routes, and validators.';

type SeoProps = {
  title?: string;
  description?: string;
  image?: string;
  /** Set to true for private/auth pages you do not want indexed. */
  noindex?: boolean;
};

export function Seo({ title, description, image, noindex }: SeoProps) {
  const router = useRouter();
  const fullTitle = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${router.asPath}`;
  const ogImage = image || '/og-image.svg';

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="application-name" content={SITE_NAME} />
      <meta name="theme-color" content="#0b1326" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="apple-touch-icon" href="/apple-icon.svg" />
      <link rel="manifest" href="/manifest.json" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {noindex ? (
        <meta key="robots-noindex" name="robots" content="noindex,nofollow" />
      ) : (
        <meta key="robots-index" name="robots" content="index,follow" />
      )}

    </Head>
  );
}
