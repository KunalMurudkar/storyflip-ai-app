// Helper function to convert a Blob to a base64 string
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      if (!base64String) {
        reject(new Error("Failed to convert PDF blob to base64."));
        return;
      }
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
      const errorData = await response.json().catch(() => ({message: "The flipbook creator returned an unexpected error."}));
      throw new Error(`Failed to create flipbook: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    if (!result.url) {
        throw new Error("Flipbook was created, but the URL was not provided.");
    }
    return result.url;

  } catch (error) {
    console.error("Error in createHeyzineFlipbook service:", error);
    throw error; // Re-throw the original error to be caught by the UI
  }
};
