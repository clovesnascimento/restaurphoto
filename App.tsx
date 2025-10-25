
import React, { useState, useCallback, useRef } from 'react';
import { restorePhoto } from './services/geminiService';
import { Camera, Download, RefreshCw, AlertTriangle, Image as ImageIcon } from 'lucide-react';

// Helper component for displaying an image or a placeholder
interface PhotoFrameProps {
  title: string;
  imageUrl?: string | null;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const PhotoFrame: React.FC<PhotoFrameProps> = ({ title, imageUrl, isLoading, children }) => (
  <div className="bg-gray-800/50 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-600/50 transition-all duration-300">
    <div className="relative w-full h-full flex items-center justify-center">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <RefreshCw className="w-12 h-12 animate-spin text-indigo-400" />
          <p className="mt-4 text-lg">Restoring your photo...</p>
          <p className="text-sm text-gray-500">This may take a moment.</p>
        </div>
      ) : imageUrl ? (
        <img src={imageUrl} alt={title} className="object-contain w-full h-full rounded-lg" />
      ) : (
        children
      )}
    </div>
    <h2 className="text-lg font-semibold text-gray-300 mt-4">{title}</h2>
  </div>
);

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [restoredImageUrl, setRestoredImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPG, etc.).');
        return;
      }
      resetState();
      setOriginalImage(file);
      setOriginalImageUrl(URL.createObjectURL(file));
    }
  };

  const handleRestore = useCallback(async () => {
    if (!originalImage) return;

    setIsLoading(true);
    setError(null);
    setRestoredImageUrl(null);

    try {
      const restoredBase64 = await restorePhoto(originalImage);
      setRestoredImageUrl(`data:${originalImage.type};base64,${restoredBase64}`);
    } catch (err: any) {
      console.error(err);
      setError('Failed to restore photo. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage]);

  const resetState = () => {
    setOriginalImage(null);
    if(originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl);
    }
    setOriginalImageUrl(null);
    setRestoredImageUrl(null);
    setIsLoading(false);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
          AI Photo Restorer
        </h1>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
          Breathe new life into your vintage photos. Our AI transforms old pictures into modern, high-quality portraits while preserving their original soul.
        </p>
      </header>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6 flex items-center max-w-4xl w-full">
          <AlertTriangle className="w-5 h-5 mr-3"/>
          <span>{error}</span>
        </div>
      )}

      <main className="w-full max-w-6xl flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <PhotoFrame title="Original Photo" imageUrl={originalImageUrl}>
            <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
               <ImageIcon className="w-16 h-16 mb-4 text-gray-500" />
              <p className="mb-2 font-semibold">Upload Your Vintage Photo</p>
              <p className="text-sm text-gray-500 mb-4">Drag & drop or click to select a file.</p>
              <button
                onClick={triggerFileSelect}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all duration-300"
              >
                <Camera className="w-5 h-5 mr-2" />
                Select Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </PhotoFrame>

          <PhotoFrame title="Restored Portrait" imageUrl={restoredImageUrl} isLoading={isLoading}>
            <div className="text-center text-gray-500">
              <p className="text-lg">Your restored photo will appear here.</p>
            </div>
          </PhotoFrame>
        </div>
      </main>

      <footer className="w-full max-w-6xl mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handleRestore}
          disabled={!originalImage || isLoading}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Restoring...
            </>
          ) : (
            'Restore Photo'
          )}
        </button>
        {restoredImageUrl && (
          <a
            href={restoredImageUrl}
            download="restored-photo.png"
            className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center transition-all duration-300"
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </a>
        )}
        {(originalImage || restoredImageUrl) && (
            <button
                onClick={resetState}
                disabled={isLoading}
                className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center transition-all duration-300 disabled:opacity-50"
            >
                <RefreshCw className="w-5 h-5 mr-2" />
                Start Over
            </button>
        )}
      </footer>
    </div>
  );
};

export default App;
