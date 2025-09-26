import React from 'react';

interface StorybookProps {
  url: string;
  onReset: () => void;
}

export const Storybook: React.FC<StorybookProps> = ({ url, onReset }) => {
  return (
    <div className="flex flex-col items-center space-y-6 w-full">
      <div className="w-full max-w-4xl aspect-[16/9] bg-slate-200 rounded-lg shadow-2xl overflow-hidden">
        <iframe
          src={url}
          title="StoryFlip AI Flipbook"
          className="w-full h-full border-0"
          allowFullScreen
        ></iframe>
      </div>
      <button
        onClick={onReset}
        className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-transform transform hover:scale-105"
      >
        Create Another Story
      </button>
    </div>
  );
};
