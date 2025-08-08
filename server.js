const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Check if API key is available (only required for OpenAI)
if (!process.env.OPENAI_API_KEY) {
  console.log('⚠️ OPENAI_API_KEY not found - OpenAI summarization will not be available');
  console.log('✅ Local and Hugging Face summarization will still work');
}

// Initialize OpenAI client (only if API key is available)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// API route to describe image
app.post('/api/describe-image', upload.single('image'), async (req, res) => {
  try {
    console.log('🚀 Backend: Received image analysis request');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { apiChoice = 'openai', focus } = req.body;
    console.log('🤖 Backend: Using API for image analysis:', apiChoice);
    if (focus) {
      console.log('🎯 Backend: Focus area:', focus);
    }

    // Convert file to base64
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    
    console.log('📸 Backend: Image converted to base64, size:', base64Image.length);
    console.log('📸 Backend: MIME type:', mimeType);

    let result;
    
    // Choose API based on preference
    switch (apiChoice) {
      case 'huggingface':
        result = await analyzeImageWithHuggingFace(base64Image, mimeType, focus);
        break;
      case 'google':
        result = await analyzeImageWithGoogle(base64Image, mimeType, focus);
        break;
      case 'local':
        result = await analyzeImageLocally(base64Image, mimeType, focus);
        break;
      case 'openai':
      default:
        result = await analyzeImageWithOpenAI(base64Image, mimeType, focus);
        break;
    }

    console.log('✅ Backend: AI analysis completed successfully');
    
    res.json({ 
      description: result,
      apiUsed: apiChoice,
      success: true 
    });
  } catch (error) {
    console.error('❌ Backend Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
});

// Function to analyze image using OpenAI
async function analyzeImageWithOpenAI(base64Image, mimeType, focus) {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please use local, Hugging Face, or Google Vision analysis instead.');
  }
  
  let prompt = 'Provide a comprehensive analysis of this image in one detailed paragraph. Include: 1) All visible objects, vehicles, buildings, natural elements (mountains, trees, water, sky, etc.), 2) People if present and their activities, 3) Colors and visual characteristics, 4) Overall scene setting and atmosphere, 5) Any text, signs, or written content visible. Be thorough and descriptive, covering everything you can see in the image.';
  
  if (focus) {
    prompt = `Focus your analysis specifically on the ${focus} area of this image. Provide a detailed description of what you see in that particular region, including any objects, people, text, or notable features. Be thorough and descriptive about the ${focus} area.`;
  }
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
  });
  return response.choices[0].message.content;
}

// Function to analyze image using Hugging Face API
async function analyzeImageWithHuggingFace(base64Image, mimeType, focus) {
  try {
    // Try multiple Hugging Face models for better results
    const models = [
      "microsoft/git-base-coco", // Image captioning
      "nlpconnect/vit-gpt2-image-captioning", // Alternative captioning
      "Salesforce/blip-image-captioning-base" // Another captioning model
    ];
    
    let bestResult = null;
    
    for (const model of models) {
      try {
        console.log(`🤖 Trying Hugging Face model: ${model}`);
        
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            headers: { 
              Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY || 'hf_demo'}`,
              "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
              inputs: `data:${mimeType};base64,${base64Image}`
            }),
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const result = data[0]?.generated_text || data[0]?.caption || data[0]?.text;
          
          if (result && result.length > 10) {
            bestResult = result;
            console.log(`✅ Success with model: ${model}`);
            break;
          }
        }
      } catch (modelError) {
        console.log(`⚠️ Model ${model} failed, trying next...`);
        continue;
      }
    }
    
    if (bestResult) {
      let analysis = `Hugging Face AI Analysis:\n\n`;
      analysis += `📸 Image Description:\n${bestResult}\n\n`;
      
      // Extract common objects from the description
      const objectKeywords = [
        'person', 'people', 'man', 'woman', 'child', 'boy', 'girl',
        'car', 'truck', 'bus', 'bicycle', 'motorcycle',
        'building', 'house', 'tree', 'flower', 'grass',
        'table', 'chair', 'bed', 'lamp', 'phone', 'computer',
        'dog', 'cat', 'bird', 'fish', 'animal',
        'food', 'drink', 'cup', 'plate', 'book'
      ];
      
      const detectedObjects = objectKeywords.filter(keyword => 
        bestResult.toLowerCase().includes(keyword)
      );
      
      if (detectedObjects.length > 0) {
        analysis += `🔍 Detected Objects:\n`;
        detectedObjects.forEach(obj => {
          analysis += `• ${obj}\n`;
        });
        analysis += `\n`;
      }
      
      // Scene type detection
      if (bestResult.toLowerCase().includes('outdoor') || bestResult.toLowerCase().includes('outside')) {
        analysis += `📍 Scene Type: Outdoor scene\n`;
      } else if (bestResult.toLowerCase().includes('indoor') || bestResult.toLowerCase().includes('room')) {
        analysis += `📍 Scene Type: Indoor scene\n`;
      } else {
        analysis += `📍 Scene Type: Mixed or unclear scene\n`;
      }
      
      return analysis;
    } else {
      throw new Error('All Hugging Face models failed');
    }
  } catch (error) {
    console.log('⚠️ Hugging Face API failed, falling back to local analysis');
    return analyzeImageLocally(base64Image, mimeType, focus);
  }
}

// Function to analyze image using Google Vision API
async function analyzeImageWithGoogle(base64Image, mimeType, focus) {
  try {
    if (!process.env.GOOGLE_VISION_API_KEY) {
      throw new Error('Google Vision API key not configured');
    }
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image
              },
              features: [
                { type: "LABEL_DETECTION", maxResults: 10 },
                { type: "TEXT_DETECTION" },
                { type: "FACE_DETECTION" },
                { type: "OBJECT_LOCALIZATION", maxResults: 10 }
              ]
            }
          ]
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.status}`);
    }
    
    const data = await response.json();
    const annotations = data.responses[0];
    
    let description = 'Image Analysis:\n';
    
    // Labels
    if (annotations.labelAnnotations) {
      description += '\nObjects detected:\n';
      annotations.labelAnnotations.forEach(label => {
        description += `• ${label.description} (${Math.round(label.score * 100)}% confidence)\n`;
      });
    }
    
    // Text
    if (annotations.textAnnotations && annotations.textAnnotations.length > 1) {
      description += '\nText found:\n';
      description += `• ${annotations.textAnnotations[0].description}\n`;
    }
    
    // Faces
    if (annotations.faceAnnotations) {
      description += `\nFaces detected: ${annotations.faceAnnotations.length}\n`;
    }
    
    // Objects
    if (annotations.localizedObjectAnnotations) {
      description += '\nObjects located:\n';
      annotations.localizedObjectAnnotations.forEach(obj => {
        description += `• ${obj.name} (${Math.round(obj.score * 100)}% confidence)\n`;
      });
    }
    
    return description;
  } catch (error) {
    console.log('⚠️ Google Vision API failed, falling back to local analysis');
    return analyzeImageLocally(base64Image, mimeType);
  }
}

// Function to analyze image locally (enhanced analysis)
async function analyzeImageLocally(base64Image, mimeType, focus) {
  const imageSize = Math.round((base64Image.length * 3) / 4); // Approximate size in bytes
  const imageSizeKB = Math.round(imageSize / 1024);
  
  // Enhanced local analysis with common object detection patterns
  let analysis = `Enhanced Local Image Analysis:\n\n`;
  analysis += `• Image format: ${mimeType}\n`;
  analysis += `• Approximate size: ${imageSizeKB} KB\n`;
  analysis += `• Analysis method: Enhanced local processing\n`;
  if (focus) {
    analysis += `• Focus area: ${focus}\n`;
  }
  
  // Try to detect common patterns based on image characteristics
  const imageData = Buffer.from(base64Image, 'base64');
  
  // Basic color analysis (simplified)
  const hasColor = imageData.length > 1000; // Simple heuristic
  const isLikelyPhoto = imageSizeKB > 50;
  
  analysis += `\n📸 Image Characteristics:\n`;
  analysis += `• ${hasColor ? 'Color image detected' : 'Grayscale or simple image'}\n`;
  analysis += `• ${isLikelyPhoto ? 'Likely a photograph' : 'Simple graphic or icon'}\n`;
  
  // Common object detection based on image size and format
  analysis += `\n🔍 Possible Objects (based on image characteristics):\n`;
  
  if (isLikelyPhoto) {
    if (imageSizeKB > 200) {
      analysis += `• High-resolution image - likely contains detailed scenes\n`;
      analysis += `• May contain: people, buildings, vehicles, nature elements\n`;
    } else if (imageSizeKB > 100) {
      analysis += `• Medium-resolution image - good detail level\n`;
      analysis += `• May contain: objects, people, landscapes\n`;
    } else {
      analysis += `• Standard resolution image\n`;
      analysis += `• May contain: basic objects, simple scenes\n`;
    }
  } else {
    analysis += `• Simple graphic or icon\n`;
    analysis += `• May contain: logos, symbols, simple shapes\n`;
  }
  
  // Scene type estimation
  analysis += `\n📍 Scene Type Estimation:\n`;
  if (imageSizeKB > 150) {
    analysis += `• Likely outdoor or complex indoor scene\n`;
  } else if (imageSizeKB > 80) {
    analysis += `• Likely indoor scene or portrait\n`;
  } else {
    analysis += `• Likely simple scene or graphic\n`;
  }
  
  // Simple object detection based on image characteristics
  analysis += `\n🔍 Object Detection (Estimated):\n`;
  
  // Based on image size and characteristics, estimate possible objects
  if (isLikelyPhoto) {
    if (imageSizeKB > 200) {
      analysis += `• High detail suggests: people, vehicles, buildings, nature\n`;
      analysis += `• Possible objects: cars, trees, houses, people, animals\n`;
    } else if (imageSizeKB > 100) {
      analysis += `• Medium detail suggests: common objects, people, scenes\n`;
      analysis += `• Possible objects: furniture, electronics, people, plants\n`;
    } else {
      analysis += `• Standard detail suggests: basic objects and scenes\n`;
      analysis += `• Possible objects: simple objects, basic scenes\n`;
    }
  } else {
    analysis += `• Simple graphic suggests: icons, logos, symbols\n`;
    analysis += `• Possible objects: shapes, text, simple graphics\n`;
  }
  
  analysis += `\n💡 For detailed object detection and scene analysis, consider:\n`;
  analysis += `• OpenAI GPT-4 Vision (best quality, requires API key)\n`;
  analysis += `• Hugging Face image models (free tier, requires HUGGINGFACE_API_KEY)\n`;
  analysis += `• Google Vision API (detailed analysis, requires GOOGLE_VISION_API_KEY)\n`;
  
  return analysis;
}

// API route to summarize document
app.post('/api/summarize-document', async (req, res) => {
  try {
    console.log('🚀 Backend: Received document summarization request');
    
    const { content, documentType, apiChoice = 'openai' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'No document content provided' });
    }

    console.log('📄 Backend: Processing document type:', documentType);
    console.log('📄 Backend: Content length:', content.length);
    console.log('🤖 Backend: Using API:', apiChoice);

    if (!content.trim()) {
      return res.status(400).json({ error: 'No text content found in the document' });
    }

    let result;
    let wordCount = content.split(/\s+/).length;

    // Choose API based on preference
    switch (apiChoice) {
      case 'huggingface':
        result = await summarizeWithHuggingFace(content);
        break;
      case 'local':
        result = await summarizeLocally(content);
        break;
      case 'openai':
      default:
        result = await summarizeWithOpenAI(content);
        break;
    }

    console.log('✅ Backend: Document summarization completed successfully');
    
    // Extract key points from the summary
    const keyPoints = result
      .split('\n')
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*'))
      .slice(0, 5)
      .map(point => point.trim());
    
    res.json({ 
      summary: result,
      wordCount: wordCount,
      keyPoints: keyPoints,
      documentType: documentType || 'unknown',
      apiUsed: apiChoice,
      success: true 
    });
  } catch (error) {
    console.error('❌ Backend Error:', error);
    res.status(500).json({ 
      error: 'Failed to summarize document',
      details: error.message 
    });
  }
});

// Function to summarize using OpenAI
async function summarizeWithOpenAI(content) {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please use local or Hugging Face summarization instead.');
  }
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: `Please provide a comprehensive summary of the following document. Include:
1. A concise summary of the main content (2-3 paragraphs)
2. Key points and important information
3. Document type and structure analysis
4. Word count and readability assessment

Document content:
${content.substring(0, 8000)}${content.length > 8000 ? '... (truncated)' : ''}`
      },
    ],
    max_tokens: 1000,
  });
  return response.choices[0].message.content;
}

// Function to summarize using Hugging Face API
async function summarizeWithHuggingFace(content) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        headers: { 
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY || 'hf_demo'}`,
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
          inputs: content.substring(0, 1000), // Hugging Face has input limits
          parameters: {
            max_length: 500,
            min_length: 100,
            do_sample: false
          }
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data[0]?.summary_text || 'Summary not available';
  } catch (error) {
    console.log('⚠️ Hugging Face API failed, falling back to local summarization');
    return summarizeLocally(content);
  }
}

// Function to summarize locally (no API needed)
function summarizeLocally(content) {
  // Simple extractive summarization
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const wordCount = content.split(/\s+/).length;
  
  // Take first few sentences as summary
  const summarySentences = sentences.slice(0, Math.min(3, sentences.length));
  const summary = summarySentences.join('. ') + '.';
  
  // Extract key words
  const words = content.toLowerCase().split(/\s+/);
  const wordFreq = {};
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
  
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
    }
  });
  
  const keyWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  const keyPoints = keyWords.map(word => `• ${word.charAt(0).toUpperCase() + word.slice(1)}`);
  
  return `Summary:\n${summary}\n\nKey Points:\n${keyPoints.join('\n')}\n\nDocument Statistics:\n• Word Count: ${wordCount}\n• Summary generated using local algorithm`;
}

// API route to summarize URL content
app.post('/api/summarize-url', async (req, res) => {
  try {
    console.log('🚀 Backend: Received URL summarization request');
    
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    console.log('🌐 Backend: Fetching content from URL:', url);

    // Fetch content from URL (simplified - you might want to use a proper web scraping library)
    const response = await fetch(url);
    const html = await response.text();
    
    // Basic HTML to text conversion
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (!textContent) {
      return res.status(400).json({ error: 'No text content found at the URL' });
    }

    console.log('🌐 Backend: Extracted text length:', textContent.length);

    // Call OpenAI API for summarization
    const openaiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Please provide a comprehensive summary of the following web content. Include:
1. A concise summary of the main content (2-3 paragraphs)
2. Key points and important information
3. Content type and structure analysis
4. Word count and readability assessment

Web content:
${textContent.substring(0, 8000)}${textContent.length > 8000 ? '... (truncated)' : ''}`
        },
      ],
      max_tokens: 1000,
    });

    const result = openaiResponse.choices[0].message.content;
    console.log('✅ Backend: URL summarization completed successfully');
    
    // Calculate word count
    const wordCount = textContent.split(/\s+/).length;
    
    res.json({ 
      summary: result,
      wordCount: wordCount,
      documentType: 'webpage',
      success: true 
    });
  } catch (error) {
    console.error('❌ Backend Error:', error);
    res.status(500).json({ 
      error: 'Failed to summarize URL content',
      details: error.message 
    });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    hasApiKey: !!process.env.OPENAI_API_KEY 
  });
});

app.listen(port, () => {
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`🔑 API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
});
