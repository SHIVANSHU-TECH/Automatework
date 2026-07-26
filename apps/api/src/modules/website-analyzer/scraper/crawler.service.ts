import axios from 'axios';

export type CrawlResult = {
  html: string;
  url: string;
  status: number;
};

export const fetchWebsiteHtml = async (url: string): Promise<CrawlResult> => {
  const response = await axios.get<string>(url, {
    headers: {
      'User-Agent': 'AI Proposal Generator / 1.0',
      Accept: 'text/html,application/xhtml+xml,application/xml',
    },
    timeout: 15000,
    maxRedirects: 5,
    responseType: 'text',
  });

  return {
    html: response.data,
    url: response.request?.res?.responseUrl ?? url,
    status: response.status,
  };
};
