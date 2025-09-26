import React, { useState, useEffect } from 'react';
import { StoryForm } from './components/StoryForm';
import { Storybook } from './components/Storybook';
import { LoadingIndicator } from './components/LoadingIndicator';
import { PdfContent } from './components/PdfContent';
import { StoryData } from './types';
import { generatePdfBlob } from './services/pdfService';
import { createHeyzineFlipbook } from './services/heyzineService';
import { generateStoryAndImages } from './services/geminiService';

const PDF_CONTAINER_ID = 'pdf-content-container';

const App: React.FC = () => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [flipbookUrl, setFlipbookUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect triggers once the story and images are generated and ready in the DOM.
    if (storyData && !flipbookUrl && isLoading) {
      const createFlipbook = async () => {
        try {
          setLoadingMessage('Assembling the storybook pages...');
          const pdfBlob = await generatePdfBlob(PDF_CONTAINER_ID);
          
          setLoadingMessage('Sending your book to the magical press...');
          const url = await createHeyzineFlipbook(pdfBlob, storyData.title);
          setFlipbookUrl(url);

        } catch (err) {
          console.error(err);
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while creating the flipbook.';
          setError(`Something went wrong during the final step. ${errorMessage}`);
        } finally {
          setIsLoading(false);
          setLoadingMessage('');
        }
      };
      // A small timeout allows the off-screen PdfContent component to fully render before we capture it.
      const timer = setTimeout(createFlipbook, 100); 
      return () => clearTimeout(timer);
    }
  }, [storyData, flipbookUrl, isLoading]);

  const handleGenerateStory = async (prompt: string, style: string, length: string, personalization: string) => {
    setIsLoading(true);
    setError(null);
    setStoryData(null);
    setFlipbookUrl(null);

    try {
      const data = await generateStoryAndImages(prompt, style, length, personalization, setLoadingMessage);
      setStoryData(data); // This triggers the useEffect to create the PDF and flipbook
    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while generating the story.';
        setError(errorMessage);
        setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setStoryData(null);
    setFlipbookUrl(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <header className="py-6 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center text-purple-600 font-serif tracking-wide">
            StoryFlip AI
          </h1>
          <p className="text-center text-slate-500 mt-1">
            Create magical, personalized storybooks for your little ones.
          </p>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-8">
        {!storyData && !isLoading && !flipbookUrl && (
          <StoryForm onGenerate={handleGenerateStory} />
        )}
        
        {isLoading && <LoadingIndicator message={loadingMessage} />}
        
        {/* This hidden component is rendered temporarily to generate the PDF from its DOM structure */}
        {storyData && !flipbookUrl && isLoading && (
          <PdfContent story={storyData} containerId={PDF_CONTAINER_ID} />
        )}

        {error && !isLoading && (
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Oh no, a plot twist!</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {flipbookUrl && !isLoading && (
          <Storybook url={flipbookUrl} onReset={handleReset} />
        )}
      </main>
    </div>
  );
};

export default App;