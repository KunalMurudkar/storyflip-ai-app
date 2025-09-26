import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { StoryStructure, StoryData, GeneratedPage } from './types';

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

    // == Step 1: Generate the story structure JSON ==
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

    // == Step 2: Generate all images concurrently for speed ==
    const coverImagePrompt = `A beautiful and captivating book cover for a story titled "${storyStructure.title}". Style: ${style}. Featuring: ${storyStructure.characterDescriptions}. The cover should be vibrant and inviting for a child, without any text.`;
    
    const imagePrompts = [
      coverImagePrompt,
      ...storyStructure.scenes.map(scene => `${scene.imagePrompt}. Style: ${style}. Characters: ${storyStructure.characterDescriptions}`)
    ];

    const imageGenerationPromises = imagePrompts.map(p => ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: p,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '4:3' }
    }));

    const imageResults = await Promise.all(imageGenerationPromises);

    const generatedImages = imageResults.map((res, index) => {
        if (!res?.generatedImages?.[0]?.image?.imageBytes) {
            console.error(`Image generation failed for prompt: "${imagePrompts[index]}"`, res);
            throw new Error("Failed to generate a required illustration for the story.");
        }
        return `data:image/jpeg;base64,${res.generatedImages[0].image.imageBytes}`;
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
