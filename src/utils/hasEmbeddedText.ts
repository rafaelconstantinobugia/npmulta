import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set worker source for browser environments
GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.mjs';

/**
 * Checks if a PDF has embedded text content exceeding the minimum character threshold
 * @param pdfData ArrayBuffer containing the PDF data
 * @param minChars Minimum number of characters required to consider the PDF as having text
 * @returns Promise resolving to true if the PDF has embedded text, false otherwise
 */
export async function hasEmbeddedText(
  pdfData: ArrayBuffer,
  minChars = 50
): Promise<boolean> {
  const start = Date.now();
  
  try {
    // Load the PDF document
    const loadingTask = getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    let totalChars = 0;
    
    // Process each page until we reach the character threshold or time limit
    for (let i = 1; i <= pdf.numPages; i++) {
      // Abort if processing time exceeds 3 seconds
      if (Date.now() - start > 3000) return false;
      
      // Get the current page
      const page = await pdf.getPage(i);
      
      try {
        // Extract text content from the page
        const content = await page.getTextContent();
        
        // Count characters in all text items
        for (const item of content.items) {
          if (typeof item.str === 'string') {
            totalChars += item.str.length;
          }
        }
        
        // If we've reached the threshold, return true
        if (totalChars >= minChars) return true;
      } catch (error) {
        // Skip errors on individual pages
        continue;
      }
    }
    
    // If we've processed all pages and haven't reached the threshold, return false
    return false;
  } catch (error) {
    // Return false for any errors (including encryption)
    return false;
  }
}