import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDropzone } from 'react-dropzone';

interface SummarizationResult {
  summary: string;
  wordCount: number;
  keyPoints: string[];
  documentType: string;
  apiUsed?: string;
}

const DocumentSummarization: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [inputType, setInputType] = useState<'file' | 'url'>('file');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SummarizationResult | null>(null);
  const [error, setError] = useState<string>('');
  const [apiChoice, setApiChoice] = useState<'openai' | 'huggingface' | 'local'>('local');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setDocumentFile(file);
      setError('');
      setResult(null);
    } else {
      setError('Please upload a valid document file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/html': ['.html', '.htm'],
      'application/json': ['.json']
    },
    multiple: false
  });

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Function to extract text from PDF using a more reliable approach
  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Load PDF.js dynamically with proper error handling
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = async () => {
            try {
              // @ts-ignore - PDF.js is loaded globally
              const pdfjsLib = window.pdfjsLib;
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              
              let fullText = '';
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n';
              }
              
              resolve(fullText);
            } catch (error) {
              console.error('PDF processing error:', error);
              reject(new Error('Failed to process PDF content. The PDF might be image-based or corrupted.'));
            }
          };
          script.onerror = () => reject(new Error('Failed to load PDF processing library'));
          document.head.appendChild(script);
        } catch (error) {
          reject(new Error('Failed to read PDF file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Function to extract text from plain text files
  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Function to fetch content from URL
  const fetchContentFromURL = async (url: string): Promise<string> => {
    try {
      // Use a CORS proxy to avoid CORS issues
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        // Create a temporary DOM element to extract text
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // Remove script and style elements
        const scripts = doc.querySelectorAll('script, style');
        scripts.forEach(script => script.remove());
        
        // Extract text content
        const text = doc.body.textContent || doc.body.innerText || '';
        return text.replace(/\s+/g, ' ').trim();
      } else {
        throw new Error('Failed to fetch content from URL');
      }
    } catch (error) {
      throw new Error('Failed to fetch content from URL');
    }
  };

  // Function to generate summary using AI backend
  const generateSummary = async (text: string, documentType: string): Promise<SummarizationResult> => {
    try {
      console.log('🚀 Frontend: Starting AI summarization for:', documentType);
      console.log('🤖 Frontend: Using API:', apiChoice);
      
      // Send to backend API
      const response = await fetch('http://localhost:3001/api/summarize-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text,
          documentType: documentType,
          apiChoice: apiChoice
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Frontend: AI summarization completed successfully');
      
      return {
        summary: data.summary,
        wordCount: data.wordCount,
        keyPoints: data.keyPoints || [],
        documentType: data.documentType
      };
    } catch (error) {
      console.error('❌ Frontend Error:', error);
      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Function to summarize URL using AI backend
  const summarizeURL = async (url: string): Promise<SummarizationResult> => {
    try {
      console.log('🚀 Frontend: Starting URL summarization for:', url);
      
      // Send to backend API
      const response = await fetch('http://localhost:3001/api/summarize-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Frontend: URL summarization completed successfully');
      
      return {
        summary: data.summary,
        wordCount: data.wordCount,
        keyPoints: data.keyPoints || [],
        documentType: data.documentType
      };
    } catch (error) {
      console.error('❌ Frontend Error:', error);
      throw new Error(`Failed to summarize URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const processContent = async () => {
    if (inputType === 'file' && !documentFile) {
      setError('Please upload a document file');
      return;
    }
    
    if (inputType === 'url' && !url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    if (inputType === 'url' && !validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      let extractedText = '';
      let documentType: string = 'unknown';

      if (inputType === 'file' && documentFile) {
        // Extract text from uploaded file based on type
        const fileExtension = documentFile.name.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'pdf') {
          console.log('Processing PDF file:', documentFile.name);
          extractedText = await extractTextFromPDF(documentFile);
          documentType = 'pdf';
          console.log('Extracted text length:', extractedText.length);
        } else {
          extractedText = await extractTextFromFile(documentFile);
          documentType = fileExtension || 'text';
        }
      } else if (inputType === 'url' && url) {
        // For URLs, use the dedicated URL summarization endpoint
        const summaryResult = await summarizeURL(url);
        setResult(summaryResult);
        return; // Exit early for URL processing
      }

      if (!extractedText.trim()) {
        throw new Error('No text content found in the document. The PDF might be image-based or contain no extractable text.');
      }

      // Generate summary for file uploads
      const summaryResult = await generateSummary(extractedText, documentType);
      setResult(summaryResult);
      
    } catch (err) {
      console.error('Processing error:', err);
      setError(`Failed to process content: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app">
      <header className="page-header">
        <div className="container">
          <div className="logo">AI Playground</div>
          <nav className="nav">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/document-summarization" 
              className={`nav-link ${location.pathname === '/document-summarization' ? 'active' : ''}`}
            >
              Document Summarization
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name || 'User'}
              </span>
              <button 
                onClick={logout}
                className="btn btn-secondary"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">
                Document Summarization
              </h1>
              <p className="text-gray-600">
                Upload documents (PDF, TXT, HTML) or provide URLs and obtain concise summaries of the content.
              </p>
            </div>

            <div className="card">
              <div className="form-group">
                <label className="form-label">Input Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="inputType"
                      value="file"
                      checked={inputType === 'file'}
                      onChange={(e) => setInputType(e.target.value as 'file' | 'url')}
                      className="mr-2"
                    />
                    Upload Document
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="inputType"
                      value="url"
                      checked={inputType === 'url'}
                      onChange={(e) => setInputType(e.target.value as 'file' | 'url')}
                      className="mr-2"
                    />
                    Enter URL
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Summarization API</label>
                <select
                  value={apiChoice}
                  onChange={(e) => setApiChoice(e.target.value as 'openai' | 'huggingface' | 'local')}
                  className="input"
                >
                  <option value="local">Local Algorithm (No API Key Required)</option>
                  <option value="huggingface">Hugging Face API (Free Tier)</option>
                  <option value="openai">OpenAI GPT-4 (Requires API Key)</option>
                </select>
                <p className="text-sm text-gray-600 mt-1">
                  {apiChoice === 'local' && 'Uses local text processing - no external API calls'}
                  {apiChoice === 'huggingface' && 'Uses Hugging Face summarization model - requires HUGGINGFACE_API_KEY'}
                  {apiChoice === 'openai' && 'Uses OpenAI GPT-4 for advanced summarization - requires OPENAI_API_KEY'}
                </p>
              </div>

              {inputType === 'file' ? (
                <div className="form-group">
                  <label className="form-label">Upload Document</label>
                  <div 
                    {...getRootProps()} 
                    className={`dropzone ${isDragActive ? 'dragover' : ''}`}
                  >
                    <input {...getInputProps()} />
                    {documentFile ? (
                      <div>
                        <p className="text-green-600 font-medium">✓ {documentFile.name}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Click to replace or drag and drop a different document
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg mb-2">📄</p>
                        <p className="font-medium">
                          {isDragActive ? 'Drop the document here' : 'Drag & drop a document here'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          or click to select a document (PDF, TXT, HTML, JSON)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Enter URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="input"
                  />
                </div>
              )}

              <button
                onClick={processContent}
                disabled={isProcessing || (inputType === 'file' ? !documentFile : !url.trim())}
                className="btn btn-primary w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="loading"></div>
                    Processing Content...
                  </>
                ) : (
                  'Generate Summary'
                )}
              </button>

              {error && (
                <div className="error">
                  {error}
                </div>
              )}

              {result && (
                <div className="mt-8 space-y-6">
                  <div className="result-section">
                    <h3>📋 AI Summary</h3>
                    <div className="result-content">
                      {result.summary}
                    </div>
                  </div>

                  <div className="result-section">
                    <h3>📊 Document Statistics</h3>
                    <div className="result-content">
                      <p><strong>Word Count:</strong> {result.wordCount.toLocaleString()}</p>
                      <p><strong>Document Type:</strong> {result.documentType}</p>
                      <p><strong>API Used:</strong> {result.apiUsed || 'local'}</p>
                    </div>
                  </div>

                  <div className="result-section">
                    <h3>🔑 Key Points</h3>
                    <div className="result-content">
                      {result.keyPoints.map((point, index) => (
                        <p key={index}>{point}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentSummarization;