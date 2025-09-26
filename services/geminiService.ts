import { StoryData } from '../types';
import { STORY_LENGTHS } from '../constants';

export const generateStoryAndImages = async (
  prompt: string,
  style: string,
  length: string,
  personalization: string,
  setLoadingMessage: (message: string) => void
): Promise<StoryData> => {
  
  setLoadingMessage('Waking up the storyteller AI...');
  const pageCount = STORY_LENGTHS[length] || 4;
  
  const response = await fetch('/api/generate-story', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, style, personalization, pageCount, setLoadingMessage }),
  });

  setLoadingMessage('Dreaming up characters and adventures...');

  if (!response.ok) {
    const errorResult = await response.json().catch(() => ({ message: "The story couldn't be generated due to a server error." }));
    throw new Error(errorResult.message);
  }

  setLoadingMessage('Painting the illustrations...');
  const storyData: StoryData = await response.json();
  return storyData;
};