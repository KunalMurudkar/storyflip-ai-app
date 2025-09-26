import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { StoryStructure, StoryData, GeneratedPage, StoryScene } from './types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
    
  if (!process.env.API_KEY) {
    return res.status(500).json({ message: "API_KEY environment variable not set on the server" });
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const { prompt, style, personalization, pageCount } = req.body;
  
  try {
    // Step 1: Generate the story structure
    const storySchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        characterDescriptions: { type: Type.STRING },
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pageText: { type: Type.STRING },
              imagePrompt: { type: Type.STRING },
            },
            required: ['pageText', 'imagePrompt']
          },
        },
      },
      required: ['title', 'characterDescriptions', 'scenes']
    };
    
    const storyPrompt = `Create a short story for a child.
      Topic: ${prompt}
      Personalization: ${personalization}
      The story should have exactly ${pageCount} scenes.
      For each scene, provide the story text and a detailed image prompt in a ${style} style that describes the scene visually.
      The image prompts must maintain character consistency. Use the 'characterDescriptions' field to first describe the main characters, and then reference those descriptions in each scene's image prompt to ensure the characters look the same in every picture.`;

    const storyResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: storyPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: storySchema,
        },
    });

    const storyStructure: StoryStructure = JSON.parse(storyResponse.text);

    // Step 2: Generate all images concurrently for speed and consistency
    const coverImagePrompt = `A beautiful and captivating book cover for a story titled "${storyStructure.title}". Style: ${style}. Characters: ${storyStructure.characterDescriptions}. The cover should be vibrant and inviting for a child.`;

    const imageGenerationPromises = [
        ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: coverImagePrompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '4:3' }
        }),
        ...storyStructure.scenes.map(scene => ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `${scene.imagePrompt}. Style: ${style}. Characters: ${storyStructure.characterDescriptions}`,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '4:3' }
        }))
    ];

    const imageResults = await Promise.all(imageGenerationPromises);

    const generatedImages = imageResults.map(res => {
        const base64Image = res.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64Image}`;
    });

    const coverImageUrl = generatedImages[0];
    const sceneImageUrls = generatedImages.slice(1);

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
    res.status(500).json({ message: 'An error occurred while generating the story.' });
  }
}