import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { StoryStructure, StoryData, GeneratedPage } from './types';
import fetch from 'node-fetch';

/**
 * Queries the Hugging Face Inference API to generate an image from a text prompt.
 * Includes a retry mechanism for when the model is loading (HTTP 503).
 * @param data The prompt to send to the model.
 * @param retries The number of retries left.
 * @returns A Buffer containing the raw image data.
 */
async function queryHuggingFace(data: { inputs: string }, retries = 3): Promise<Buffer> {
    const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
    if (!HUGGING_FACE_API_KEY) {
        throw new Error("Server configuration error: Missing HUGGING_FACE_API_KEY.");
    }
    const MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
    
    const response = await fetch(MODEL_URL, {
        headers: {
            "Authorization": `Bearer ${HUGGING_FACE_API_KEY}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data),
    });

    // If the model is loading, wait and retry.
    if (response.status === 503 && retries > 0) {
        console.warn("Hugging Face model is loading, retrying in 15 seconds...");
        await new Promise(res => setTimeout(res, 15000));
        return queryHuggingFace(data, retries - 1);
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Hugging Face API Error:", errorText);
        throw new Error(`Failed to generate image with Hugging Face. Status: ${response.status}, Message: ${errorText}`);
    }

    // The response from Hugging Face for image generation is binary data (the image itself).
    // We need to read it as an ArrayBuffer.
    const arrayBuffer = await (response as any).arrayBuffer();
    return Buffer.from(arrayBuffer);
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
    
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable not set");
      return res.status(500).json({ message: "Server configuration error: Missing API Key." });
    }
    
    const ai = new GoogleGenAI({ apiKey });

    const { prompt, style, personalization, pageCount } = req.body;
    if (!prompt || !style || !personalization || !pageCount) {
        return res.status(400).json({ message: 'Missing required fields: prompt, style, personalization, pageCount.' });
    }

    // == Step 1: Generate the story structure JSON with Gemini ==
    const storySchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A creative, short title for the story." },
        characterDescriptions: { type: Type.STRING, description: "A consistent, detailed visual description of the main character(s) to be used in every image prompt." },
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pageText: { type: Type.STRING, description: "One to two paragraphs of the story for this scene." },
              imagePrompt: { type: Type.STRING, description: "A detailed visual prompt for an illustration of this scene, referencing the character descriptions." },
            },
            required: ['pageText', 'imagePrompt']
          },
        },
      },
      required: ['title', 'characterDescriptions', 'scenes']
    };
    
    const storyPrompt = `Create a short story for a child.
      Primary subject: ${prompt}
      Incorporate this personalization: ${personalization}
      The story must have exactly ${pageCount} scenes.
      For each scene, provide the story text and a detailed image prompt in a ${style} style that describes the scene visually.
      The image prompts MUST maintain character consistency. First, describe the main characters in the 'characterDescriptions' field. Then, reference those descriptions in each scene's 'imagePrompt' to ensure the characters look the same in every picture.`;

    const storyResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: storyPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: storySchema,
        },
    });

    let storyStructure: StoryStructure;
    try {
        if (!storyResponse.text) throw new Error("Received empty response from story generator.");
        storyStructure = JSON.parse(storyResponse.text);
    } catch (e) {
        console.error("Failed to parse story structure JSON:", storyResponse.text, e);
        return res.status(500).json({ message: "The AI storyteller got confused. Please try a different prompt." });
    }

    // == Step 2: Generate all images concurrently with Hugging Face ==
    const coverImagePrompt = `A beautiful and captivating book cover for a story titled "${storyStructure.title}". Style: ${style}. Featuring: ${storyStructure.characterDescriptions}. The cover should be vibrant and inviting for a child, without any text. high quality, detailed.`;
    
    const imagePrompts = [
      coverImagePrompt,
      ...storyStructure.scenes.map(scene => `${scene.imagePrompt}. Style: ${style}. Characters: ${storyStructure.characterDescriptions}. high quality, detailed.`)
    ];

    const imageGenerationPromises = imagePrompts.map(p => queryHuggingFace({ inputs: p }));
    const imageResults = await Promise.all(imageGenerationPromises);

    const generatedImages = imageResults.map((buffer, index) => {
        if (!buffer || buffer.length === 0) {
            console.error(`Image generation failed for prompt: "${imagePrompts[index]}"`);
            throw new Error("Failed to generate a required illustration for the story from Hugging Face.");
        }
        return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    });
    
    const [coverImageUrl, ...sceneImageUrls] = generatedImages;

    const pages: GeneratedPage[] = storyStructure.scenes.map((scene, index) => ({
      text: scene.pageText,
      imageUrl: sceneImageUrls[index],
    }));

    const finalStoryData: StoryData = {
      title: storyStructure.title,
      coverImageUrl,
      pages,
    };

    res.status(200).json(finalStoryData);

  } catch (error) {
    console.error("Error in generate-story endpoint:", error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ message: `An error occurred while generating the story: ${message}` });
  }
}