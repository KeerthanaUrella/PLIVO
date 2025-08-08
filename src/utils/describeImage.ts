// Function to convert file to base64 (keeping this for preview purposes)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Main function to describe image comprehensively
export async function describeImage(imageFile: File): Promise<string> {
  try {
    console.log('🚀 Frontend: Starting image analysis for:', imageFile.name);
    
    // Create FormData to send the file to backend
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Send to backend API
    const response = await fetch('http://localhost:3001/api/describe-image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Frontend: AI analysis completed successfully');
    
    return data.description || 'No description generated';
  } catch (error) {
    console.error('❌ Frontend Error:', error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to analyze image with specific focus
export async function analyzeImageWithFocus(imageFile: File, focus: string): Promise<string> {
  try {
    console.log('🚀 Frontend: Starting focused analysis for:', imageFile.name, 'focus:', focus);
    
    // Create FormData to send the file to backend
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('focus', focus);
    
    // Send to backend API (you can extend the backend to handle focus parameter)
    const response = await fetch('http://localhost:3001/api/describe-image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Frontend: Focused analysis completed successfully');
    
    return data.description || 'No analysis generated';
  } catch (error) {
    console.error('❌ Frontend Error:', error);
    throw new Error(`Failed to analyze ${focus}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
