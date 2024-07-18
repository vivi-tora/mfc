// pages/api/update-availability.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    logger.warn(`Method ${req.method} not allowed`, {
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
      },
    });
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    logger.error('Invalid or empty items array', { data: { items } });
    return res.status(400).json({ error: 'Invalid or empty items array' });
  }

  const publicKey = process.env.MFC_PUBLIC_KEY;
  const privateKey = process.env.MFC_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    logger.error('MFC API keys are not set');
    return res.status(500).json({ error: 'MFC API keys are not set' });
  }

  try {
    logger.info(`Processing ${items.length} items`, { data: { itemCount: items.length } });
    const results = await Promise.all(items.map(async (item: any) => {
      const { jan, available, price, url } = item;

      if (!jan || typeof available !== 'boolean' || !price || !url) {
        logger.error(`Invalid item data`, { data: { item } });
        throw new Error(`Invalid item data for JAN: ${jan}`);
      }

      const baseParams = `key=${encodeURIComponent(publicKey)}&jan=${encodeURIComponent(jan)}&available=${available ? 1 : 0}`;
      const signature = crypto.createHmac('sha256', privateKey)
        .update(baseParams)
        .digest('base64');

      const params = new URLSearchParams(baseParams);
      params.append('s', signature);
      params.append('price', price.toString());
      params.append('url', url);

      const requestBody = params.toString();
      logger.logRequest(`Sending request for JAN: ${jan}`,
        {
          method: 'POST',
          url: 'https://myfigurecollection.net/papi.php?mode=set-availability',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: requestBody,
        }
      );

      const response = await fetch('https://myfigurecollection.net/papi.php?mode=set-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: requestBody,
      });

      if (!response.ok) {
        logger.error(`HTTP error for JAN: ${jan}`, {
          data: { jan, status: response.status },
          response: {
            status: response.status,
            statusText: response.statusText,
          },
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.logRequest(`Received response for JAN: ${jan}`,
        {
          method: 'POST',
          url: 'https://myfigurecollection.net/papi.php?mode=set-availability',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: requestBody,
        },
        {
          status: response.status,
          body: data,
        }
      );
      return { jan, result: data };
    }));

    logger.info(`Successfully processed ${results.length} items`, { data: { processedCount: results.length, results } });
    res.status(200).json({ results });
  } catch (error) {
    logger.error('Error updating availability', {
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      details: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
}
