import React from 'react';
import { StoryData } from '../types';

const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-[842px] h-[595px] bg-white flex flex-col justify-center items-center p-12 box-border book-page-texture">
    {children}
  </div>
);

interface PdfContentProps {
  story: StoryData;
  containerId: string;
}

export const PdfContent: React.FC<PdfContentProps> = ({ story, containerId }) => {
  // This component is rendered off-screen by positioning it absolutely with a large negative left value.
  return (
    <div id={containerId} className="absolute -left-[9999px] top-0 opacity-0" aria-hidden="true">
      {/* Page 1: Cover Image */}
      <div className="pdf-page w-[842px] h-[595px] bg-slate-100">
        <img src={story.coverImageUrl} alt="Story cover" className="w-full h-full object-cover" />
      </div>

      {/* Subsequent pages: Text followed by Image */}
      {story.pages.map((page, index) => (
         <React.Fragment key={index}>
            {/* Story Text Page */}
            <div className="pdf-page w-[842px] h-[595px]">
                <Page><p className="font-serif text-[22px] leading-relaxed text-slate-800 whitespace-pre-line">{page.text}</p></Page>
            </div>
            {/* Illustration Page */}
            <div className="pdf-page w-[842px] h-[595px]">
                <Page><img src={page.imageUrl} alt={`Illustration for page ${index + 1}`} className="max-w-full max-h-full object-contain" /></Page>
            </div>
         </React.Fragment>
      ))}
    </div>
  );
};