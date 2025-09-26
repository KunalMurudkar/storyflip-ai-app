// This is a Vercel Serverless Function
// It runs on the backend and is never exposed to the client.

import { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import FormData from 'form-data';

const HEYZINE_API_URL = 'https://heyzine.com/api/v1/flipbooks';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { pdfData, title } = req.body;
  const apiKey = process.env.HEYZINE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'Heyzine API key is not configured on the server.' });
  }

  if (!pdfData || !title) {
    return res.status(400).json({ message: 'Missing pdfData or title in the request.' });
  }

  try {
    // Convert base64 PDF data back to a buffer
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

    const result = await heyzineResponse.json();

    if (!heyzineResponse.ok) {
      throw new Error(result.message || 'Heyzine API error');
    }

    res.status(200).json(result);

  } catch (error) {
    console.error("Failed to create Heyzine flipbook:", error);
    res.status(500).json({ message: 'An error occurred while creating the flipbook.' });
  }
}
