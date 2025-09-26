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
  return (
    <div id={containerId} className="absolute -left-[9999px] top-0 opacity-0">
      <div className="pdf-page w-[842px] h-[595px] bg-slate-100">
        <img src={story.coverImageUrl} alt="Story cover" className="w-full h-full object-cover" />
      </div>
      {story.pages.map((page, index) => (
         <React.Fragment key={index}>
            <div className="pdf-page w-[842px] h-[595px]">
                <Page><p className="font-serif text-[22px] leading-relaxed text-slate-800 whitespace-pre-line">{page.text}</p></Page>
            </div>
            <div className="pdf-page w-[842px] h-[595px]">
                <Page><img src={page.imageUrl} alt={`Illustration`} className="w-full h-full object-contain" /></Page>
            </div>
         </React.Fragment>
      ))}
    </div>
  );
};
