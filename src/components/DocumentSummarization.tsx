import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDropzone } from 'react-dropzone';

interface SummarizationResult {
  summary: string;
  wordCount: number;
  keyPoints: string[];
  documentType: string;
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

  // Function to generate summary using simple algorithm
  const generateSummary = async (text: string): Promise<SummarizationResult> => {
    try {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const wordCount = text.split(/\s+/).length;
      
      // Simple extractive summarization (take first few sentences)
      const summarySentences = sentences.slice(0, Math.min(3, sentences.length));
      const summary = summarySentences.join('. ') + '.';
      
      // Extract key points (simple keyword extraction)
      const words = text.toLowerCase().split(/\s+/);
      const wordFreq: { [key: string]: number } = {};
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
      
      return {
        summary,
        wordCount,
        keyPoints,
        documentType: 'text'
      };
    } catch (error) {
      throw new Error('Failed to generate summary');
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

      if (inputType === 'file' && documentFile) {
        // Extract text from uploaded file based on type
        const fileExtension = documentFile.name.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'pdf') {
          console.log('Processing PDF file:', documentFile.name);
          extractedText = await extractTextFromPDF(documentFile);
          console.log('Extracted text length:', extractedText.length);
        } else {
          extractedText = await extractTextFromFile(documentFile);
        }
      } else if (inputType === 'url' && url) {
        // Extract text from URL
        extractedText = await fetchContentFromURL(url);
      }

      if (!extractedText.trim()) {
        throw new Error('No text content found in the document. The PDF might be image-based or contain no extractable text.');
      }

      // Generate summary
      const summaryResult = await generateSummary(extractedText);
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