import React, { useRef, useState, useEffect } from 'react';
import { useImageGeneration } from '../hooks/useImageGeneration';

export const SketchToImageCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [creativeLevel, setCreativeLevel] = useState(0.65); // renamed from temperature
  const [adherenceLevel, setAdherenceLevel] = useState(0.82); // renamed from guidanceScale
  
  const {
    isGenerating,
    progress,
    generatedImages,
    error,
    generateImages
  } = useImageGeneration();

  // Initialize canvas on component mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Configure canvas settings
    canvas.width = 800;
    canvas.height = 600;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 5;
    context.strokeStyle = '#000000';
    
    // Set white background
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    contextRef.current = context;
  }, []);

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contextRef.current) return;
    
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;
    
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const endDrawing = () => {
    if (!contextRef.current) return;
    
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!contextRef.current || !canvasRef.current) return;
    
    contextRef.current.fillStyle = '#FFFFFF';
    contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleImageCreation = async () => {
    if (!canvasRef.current || !promptText.trim()) return;
    
    try {
      // Convert canvas to blob
      const canvasBlob = await new Promise<Blob | null>((resolve) => {
        canvasRef.current?.toBlob(resolve, 'image/png');
      });
      
      if (!canvasBlob) {
        console.error('Failed to convert canvas to blob');
        return;
      }
      
      // Create file from blob
      const sketchFile = new File([canvasBlob], 'sketch.png', { type: 'image/png' });
      
      // Generate images using the hook
      await generateImages(sketchFile, {
        prompt: promptText,
        temperature: creativeLevel,
        guidanceScale: adherenceLevel,
        numImages: 4
      });
    } catch (err) {
      console.error('Error generating images:', err);
    }
  };

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-generated-image-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="sketch-to-image-container">
      <div className="canvas-section">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          className="drawing-surface"
        />
        <div className="canvas-tools">
          <button onClick={clearCanvas} className="tool-button">
            Clear Canvas
          </button>
        </div>
      </div>
      
      <div className="prompt-controls">
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Describe what you want your sketch to become..."
          className="prompt-input"
          rows={3}
        />
        
        <div className="slider-controls">
          <div className="slider-group">
            <label htmlFor="creative-level">Creativity: {creativeLevel.toFixed(2)}</label>
            <input
              id="creative-level"
              type="range"
              min="0.1"
              max="1.0"
              step="0.01"
              value={creativeLevel}
              onChange={(e) => setCreativeLevel(Number(e.target.value))}
              className="slider"
            />
          </div>
          
          <div className="slider-group">
            <label htmlFor="adherence-level">Prompt Adherence: {adherenceLevel.toFixed(2)}</label>
            <input
              id="adherence-level"
              type="range"
              min="0.1"
              max="2.0"
              step="0.01"
              value={adherenceLevel}
              onChange={(e) => setAdherenceLevel(Number(e.target.value))}
              className="slider"
            />
          </div>
        </div>
        
        <button
          onClick={handleImageCreation}
          disabled={isGenerating || !promptText.trim()}
          className="generate-button"
        >
          {isGenerating ? `Transforming Sketch (${Math.round(progress)}%)` : 'Transform Sketch to Image'}
        </button>
      </div>
      
      {error && (
        <div className="error-notification">
          <p>Something went wrong: {error}</p>
        </div>
      )}
      
      {generatedImages.length > 0 && (
        <div className="results-gallery">
          <h3>Your AI-Generated Creations</h3>
          <div className="gallery-grid">
            {generatedImages.map((imageUrl, index) => (
              <div key={index} className="gallery-item">
                <img src={imageUrl} alt={`AI creation ${index + 1} from sketch`} />
                <div className="image-actions">
                  <button onClick={() => downloadImage(imageUrl, index)}>
                    Download
                  </button>
                  <button>
                    Add to Collection
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};