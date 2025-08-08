# AI Playground - Multi-modal AI Tasks

A modern web application that provides a playground for exploring multi-modal AI capabilities including conversation analysis, image recognition, and document summarization.

## 🚀 Features

### Core Capabilities

1. **Conversation Analysis (20 points)**
   - Upload audio files (MP3, WAV, M4A, OGG)
   - Speech-to-text transcription
   - Speaker diarization for up to 2 speakers
   - AI-powered conversation summarization

2. **Image Analysis (10 points)**
   - Upload images (JPEG, PNG, GIF, BMP, WebP)
   - AI-powered image description generation
   - Real-time image preview

3. **Document Summarization (20 points)**
   - Upload documents (PDF, DOC, DOCX, TXT)
   - URL-based content summarization
   - AI-powered content analysis and summarization

### Technical Features

- **Authentication System**: Simple login/logout functionality
- **Responsive Design**: Modern UI inspired by Linear design
- **Drag & Drop**: Intuitive file upload interface
- **Real-time Processing**: Simulated AI processing with loading states
- **Error Handling**: Comprehensive error management
- **TypeScript**: Full type safety throughout the application

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Custom CSS with modern design system
- **File Upload**: React Dropzone
- **Routing**: React Router DOM
- **State Management**: React Context API

## 📦 Installation

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-playground-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## 🚀 Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

### Option 2: Deploy via GitHub Integration

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Vercel will automatically deploy on every push

### Option 3: Manual Deployment

1. Build the project: `npm run build`
2. Upload the `dist` folder to Vercel

## 🎯 Usage

### Getting Started

1. **Login**: Use any email and password to sign in
2. **Select a Skill**: Choose from the three available AI capabilities
3. **Upload Content**: Use drag & drop or click to upload files
4. **Process**: Click the analyze button to process your content
5. **View Results**: See AI-generated results in real-time

### Supported File Types

- **Audio**: MP3, WAV, M4A, OGG
- **Images**: JPEG, PNG, GIF, BMP, WebP
- **Documents**: PDF, DOC, DOCX, TXT

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── ConversationAnalysis.tsx
│   ├── ImageAnalysis.tsx
│   └── DocumentSummarization.tsx
├── contexts/            # React contexts
│   └── AuthContext.tsx
├── App.tsx             # Main app component
├── main.tsx           # Entry point
├── index.css          # Global styles
└── App.css            # App-specific styles
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory for any API keys or configuration:

```env
VITE_API_URL=your_api_url_here
VITE_AI_SERVICE_KEY=your_ai_service_key_here
```

### Customization

- **Styling**: Modify CSS variables in `src/index.css`
- **Components**: Update components in `src/components/`
- **Routing**: Modify routes in `src/App.tsx`

## 🧪 Testing

The application includes mock AI processing to demonstrate functionality. In a production environment, you would integrate with actual AI services such as:

- **Speech-to-Text**: OpenAI Whisper, Google Speech-to-Text
- **Image Analysis**: OpenAI GPT-4 Vision, Google Vision AI
- **Document Processing**: OpenAI GPT-4, Anthropic Claude

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🔒 Security

- Client-side authentication (demo purposes)
- File type validation
- URL validation for document summarization
- Error handling and user feedback

## 🚀 Future Enhancements

- **Real AI Integration**: Connect to actual AI services
- **User History**: Store and display past 10 interactions
- **Advanced Analytics**: Processing metrics and insights
- **Batch Processing**: Handle multiple files simultaneously
- **Export Features**: Download results in various formats

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please open an issue in the GitHub repository.

---

**Note**: This is a demonstration application with simulated AI processing. For production use, integrate with actual AI services and implement proper security measures.
