import { VercelRequest, VercelResponse } from '@vercel/node';
import FormData from 'form-data';
import fetch from 'node-fetch';

const HEYZINE_API_URL = 'https://heyzine.com/api/v1/flipbooks';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { pdfData, title } = req.body;
    const apiKey = process.env.HEYZINE_API_KEY;

    if (!apiKey) {
      console.error('HEYZINE_API_KEY is not configured on the server.');
      return res.status(500).json({ message: 'Flipbook service is not configured correctly.' });
    }

    if (!pdfData || !title) {
      return res.status(400).json({ message: 'Missing PDF data or title in the request.' });
    }

    const pdfBuffer = Buffer.from(pdfData, 'base64');

    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('pdf', pdfBuffer, `${title.replace(/ /g, '_')}.pdf`);
    formData.append('title', title);
    formData.append('background_color', '#F1F5F9');
    formData.append('logo_remove', '1');

    const heyzineResponse = await fetch(HEYZINE_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result: any = await heyzineResponse.json();

    if (!heyzineResponse.ok) {
      console.error("Heyzine API Error:", result);
      throw new Error(result.message || 'The flipbook service returned an error.');
    }

    res.status(200).json(result);

  } catch (error) {
    console.error("Failed to create Heyzine flipbook:", error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ message: `An error occurred while creating the flipbook: ${message}` });
  }
}