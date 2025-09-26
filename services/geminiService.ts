import { StoryData } from '../types';
import { STORY_LENGTHS } from '../constants';

// This function now calls our own backend, not Google's directly.
export const generateStoryAndImages = async (
  prompt: string,
  style: string,
  length: string,
  personalization: string,
  setLoadingMessage: (message: string) => void
): Promise<StoryData> => {
  
  setLoadingMessage('Asking the storyteller for a new idea...');

  const pageCount = STORY_LENGTHS[length] || 4;
  
  const response = await fetch('/api/generate-story', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, style, personalization, pageCount }),
  });

  if (!response.ok) {
    const errorResult = await response.json();
    throw new Error(errorResult.message || "The story couldn't be generated.");
  }

  const storyData: StoryData = await response.json();
  return storyData;
};
