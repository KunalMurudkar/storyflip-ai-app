
import React, { useState } from 'react';
import { ILLUSTRATION_STYLES, STORY_LENGTHS } from '../constants';

interface StoryFormProps {
  onGenerate: (prompt: string, style: string, length: string, personalization: string) => void;
}

export const StoryForm: React.FC<StoryFormProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('A brave squirrel who is afraid of heights');
  const [style, setStyle] = useState('Cartoon');
  const [length, setLength] = useState('Short');
  const [personalization, setPersonalization] = useState('The squirrel loves collecting shiny acorns');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    onGenerate(prompt, style, length, personalization);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-slate-700">Create Your Story</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="prompt" className="block text-sm font-semibold text-slate-600 mb-2">
            What is the story about?
          </label>
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            placeholder="e.g., A friendly dragon who loves to bake"
            required
          />
        </div>

        <div>
          <label htmlFor="style" className="block text-sm font-semibold text-slate-600 mb-2">
            Illustration Style
          </label>
          <select
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition bg-white"
          >
            {ILLUSTRATION_STYLES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="length" className="block text-sm font-semibold text-slate-600 mb-2">
            Story Length
          </label>
          <select
            id="length"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition bg-white"
          >
            {Object.keys(STORY_LENGTHS).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="personalization" className="block text-sm font-semibold text-slate-600 mb-2">
            Add a personal touch (child's name, interests, etc.)
          </label>
          <textarea
            id="personalization"
            value={personalization}
            onChange={(e) => setPersonalization(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            rows={3}
            placeholder="e.g., The main character is named Lily, and she loves puppies."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Crafting Magic...' : 'Generate Storybook'}
        </button>
      </form>
    </div>
  );
};
