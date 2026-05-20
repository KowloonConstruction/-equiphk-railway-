import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  /** Traditional Chinese (zh-HK) meta description for Google zh-HK search */
  zhDescription?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: "website" | "product" | "article";
  keywords?: string;
  noindex?: boolean;
  // Product-specific
  price?: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  brand?: string;
}

const SITE_NAME = "EquipHK";
const TWITTER_HANDLE = "@equiphk";
const DEFAULT_DESCRIPTION =
  "Hong Kong's trusted equipment rental platform. Rent power tools, construction equipment, generators and plant hire from HK$85/day. Serving DIY enthusiasts to Tier-1 contractors. Same-day delivery across HK.";
const DEFAULT_ZH_DESCRIPTION =
  "香港最可靠的器材租賃平台。租用電動工具、建築設備、發電機及重型機械，每日低至港幣85元。服務對象涵蓋DIY愛好者至一級承建商，全港即日送貨。";
const DEFAULT_KEYWORDS =
  "equipment rental Hong Kong, tool hire HK, construction equipment rental, generator hire Hong Kong, power tool rental HK, plant hire Hong Kong, scaffolding rental, aerial platform hire, heavy plant hire HK, EquipHK, 香港器材租賃, 工具租借, 建築設備出租, 發電機租賃";
const DEFAULT_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663429127370/EqJqhhxWWJKtKB68YEvggw/equiphk-og-image-gbsgsY4eLL2e6p4Dos2cHG.png";
const SITE_URL = "https://www.equip.hk";

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  zhDescription = DEFAULT_ZH_DESCRIPTION,
  image = DEFAULT_IMAGE,
  imageAlt,
  url,
  type = "website",
  keywords = DEFAULT_KEYWORDS,
  noindex = false,
  price,
  currency = "HKD",
  availability,
  brand,
}: SEOHeadProps) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME} — Hong Kong Equipment Rental`
    : `${SITE_NAME} — Rent Anything. Build Everything. | Hong Kong`;
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const ogImageAlt = imageAlt ?? fullTitle;

  return (
    <Helmet>
      {/* ── Primary ── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      <meta
        name="robots"
        content={
          noindex
            ? "noindex,nofollow"
            : "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"
        }
      />
      <meta name="author" content="EquipHK — Kowloon Construction Company Ltd" />

      {/* ── Hreflang: tell Google this page exists in en-HK and zh-HK ── */}
      <link rel="alternate" hrefLang="en-HK" href={canonicalUrl} />
      <link rel="alternate" hrefLang="zh-HK" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* ── Traditional Chinese meta description (zh-HK) ── */}
      {zhDescription && (
        <meta name="description" lang="zh-HK" content={zhDescription} />
      )}

      {/* ── Open Graph ── */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_HK" />
      <meta property="og:locale:alternate" content="zh_HK" />

      {/* ── Product-specific OG (for type=product) ── */}
      {type === "product" && price !== undefined && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
          {availability && (
            <meta
              property="product:availability"
              content={
                availability === "InStock"
                  ? "in stock"
                  : availability === "OutOfStock"
                  ? "out of stock"
                  : "preorder"
              }
            />
          )}
          {brand && <meta property="product:brand" content={brand} />}
        </>
      )}

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={ogImageAlt} />

      {/* ── WhatsApp / iMessage rich preview ── */}
      <meta property="og:image:secure_url" content={image} />
    </Helmet>
  );
}
