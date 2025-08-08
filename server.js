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

// Check if API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is missing!');
  console.error('Please add OPENAI_API_KEY=your_api_key to your .env.local file');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// API route to describe image
app.post('/api/describe-image', upload.single('image'), async (req, res) => {
  try {
    console.log('🚀 Backend: Received image analysis request');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Convert file to base64
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    
    console.log('📸 Backend: Image converted to base64, size:', base64Image.length);
    console.log('📸 Backend: MIME type:', mimeType);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Provide a comprehensive analysis of this image in one detailed paragraph. Include: 1) All visible objects, vehicles, buildings, natural elements (mountains, trees, water, sky, etc.), 2) People if present and their activities, 3) Colors and visual characteristics, 4) Overall scene setting and atmosphere, 5) Any text, signs, or written content visible. Be thorough and descriptive, covering everything you can see in the image.',
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

    const result = response.choices[0].message.content;
    console.log('✅ Backend: AI analysis completed successfully');
    
    res.json({ 
      description: result,
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
