// src/components/DrawingCanvas.tsx
import React, { useRef, useState } from 'react';
import { useImageGeneration } from '../hooks/useImageGeneration';

export const DrawingCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prompt, setPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.65);
  const [guidanceScale, setGuidanceScale] = useState(0.82);
  
  const {
    isGenerating,
    progress,
    generatedImages,
    error,
    generateImages
  } = useImageGeneration();
  
  const handleGenerateClick = async () => {
    if (!canvasRef.current) return;
    
    // Convert canvas to blob
    const blob = await new Promise<Blob | null>(resolve => {
      canvasRef.current?.toBlob(resolve);
    });
    
    if (!blob) return;
    
    // Create a file from the blob
    const file = new File([blob], 'sketch.png', { type: 'image/png' });
    
    // Generate images
    await generateImages(file, {
      prompt,
      temperature,
      guidanceScale,
      numImages: 4
    });
  };
  
  // Canvas drawing functionality omitted for brevity
  
  return (
    <div className="drawing-canvas-container">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600}
        // Drawing event handlers would go here
      />
      
      <div className="controls">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to generate..."
        />
        
        <div className="parameters">
          <label>
            Temperature: {temperature}
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.01"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
            />
          </label>
          
          <label>
            Guidance Scale: {guidanceScale}
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.01"
              value={guidanceScale}
              onChange={(e) => setGuidanceScale(Number(e.target.value))}
            />
          </label>
        </div>
        
        <button 
          onClick={handleGenerateClick}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? `Generating (${Math.round(progress)}%)` : 'Generate with AI'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      {generatedImages.length > 0 && (
        <div className="generated-images">
          <h3>Generated Images</h3>
          <div className="image-grid">
            {generatedImages.map((imageUrl, index) => (
              <div key={index} className="generated-image">
                <img src={imageUrl} alt={`Generated image ${index + 1}`} />
                <button>Save to Collectibles</button>
                {/* Add Pro mode options for NFT minting */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
