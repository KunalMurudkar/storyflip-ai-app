export interface StoryScene {
  pageText: string;
  imagePrompt: string;
}

export interface StoryStructure {
  title: string;
  characterDescriptions: string;
  scenes: StoryScene[];
}

export interface GeneratedPage {
  text: string;
  imageUrl: string;
}

export interface StoryData {
  title: string;
  pages: GeneratedPage[];
  coverImageUrl: string;
}