// Helper function to convert a Blob to a base64 string
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // result is a data URL like "data:application/pdf;base64,..."
      // We only want the base64 part after the comma.
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const createHeyzineFlipbook = async (pdfBlob: Blob, title: string): Promise<string> => {
  try {
    const pdfData = await blobToBase64(pdfBlob);

    const response = await fetch('/api/create-flipbook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdfData, title }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create flipbook: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    return result.url;

  } catch (error) {
    console.error("Error in createHeyzineFlipbook service:", error);
    throw new Error("Could not connect to the flipbook creation service. Please try again.");
  }
};
