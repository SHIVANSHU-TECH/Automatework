import { load, type CheerioAPI } from 'cheerio';

export type ContentExtractionResult = {
  headings: string[];
  paragraphs: string[];
  services: string[];
  testimonials: string[];
  pricing: string[];
  forms: string[];
  ctas: string[];
  navigation: string[];
  footer: string[];
  metadata: Record<string, string>;
};

const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim();

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const gatherTexts = ($: CheerioAPI, selector: string): string[] =>
  unique(
    $(selector)
      .map((_, element) => normalizeText($(element).text()))
      .get()
  );

const collectSectionsByKeyword = ($: CheerioAPI, keywords: string[], selector: string): string[] =>
  unique(
    $(selector)
      .map((_, element) => normalizeText($(element).text()))
      .get()
      .filter((text) => keywords.some((keyword) => text.toLowerCase().includes(keyword)))
  );

export const extractContent = async (html: string): Promise<ContentExtractionResult> => {
  const $ = load(html);

  const headings = gatherTexts($, 'h1,h2,h3,h4,h5,h6');
  const paragraphs = gatherTexts($, 'p');

  const services = unique([
    ...gatherTexts($, '.service, .services, [class*="service"], [id*="service"], .feature, .features'),
    ...collectSectionsByKeyword($, ['service', 'solution', 'feature'], '.service, .services, .feature, .features, .pricing, .pricing-card'),
  ]);

  const testimonials = unique([
    ...gatherTexts($, 'blockquote, .testimonial, .testimonials'),
    ...collectSectionsByKeyword($, ['testimonial', 'reviews', 'client story', 'customer story'], '.testimonial, .testimonials, .review'),
  ]);

  const pricing = unique([
    ...gatherTexts($, '.pricing, .pricing-table, .price, .price-card, [class*="pricing"], [id*="pricing"]'),
    ...collectSectionsByKeyword($, ['pricing', 'cost', 'package', 'plan'], '.pricing, .pricing-table, .price, .price-card'),
  ]);

  const forms = unique(
    $('form')
      .map((_, form) => normalizeText($(form).text()))
      .get()
  );

  const ctaSelectors = ['.cta', '.call-to-action', 'a', 'button'];
  const ctaTexts = unique(
    ctaSelectors
      .map((selector) => gatherTexts($, selector))
      .flat()
      .filter((text) => /start|get|contact|book|schedule|request|quote|buy|subscribe/i.test(text))
  );

  const navigation = unique([
    ...gatherTexts($, 'nav a, .nav a, .navigation a, .navbar a'),
    ...collectSectionsByKeyword($, ['home', 'about', 'services', 'contact', 'pricing'], 'nav a, .nav a, .navigation a, .navbar a'),
  ]);

  const footer = unique([
    ...gatherTexts($, 'footer, footer *'),
    ...gatherTexts($, '.footer, .footer *'),
  ]);

  const metadata: Record<string, string> = {};

  $('head meta').each((_, element) => {
    const key = $(element).attr('name') ?? $(element).attr('property');
    const value = $(element).attr('content');
    if (key && value) {
      metadata[key] = value;
    }
  });

  const title = $('head title').text().trim();
  if (title) {
    metadata.title = title;
  }

  if (!metadata.description) {
    const description = $('head meta[name="description"]').attr('content');
    if (description) {
      metadata.description = description;
    }
  }

  return {
    headings,
    paragraphs,
    services,
    testimonials,
    pricing,
    forms,
    ctas: ctaTexts,
    navigation,
    footer,
    metadata,
  };
};
