// src/hooks/useImageGeneration.ts
import { useState, useCallback } from 'react';
import { imageGenerationApi, GenerationParams } from '../api/imageGenerationApi';

interface UseImageGenerationReturn {
  isGenerating: boolean;
  progress: number;
  generatedImages: string[];
  error: string | null;
  generateImages: (sketchFile: File, params: GenerationParams) => Promise<void>;
}

export function useImageGeneration(): UseImageGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateImages = useCallback(async (sketchFile: File, params: GenerationParams) => {
    try {
      setIsGenerating(true);
      setProgress(0);
      setError(null);
      
      // Upload the sketch
      const sketchId = await imageGenerationApi.uploadSketch(sketchFile);
      
      // Start generation
      const generationId = await imageGenerationApi.generateImages(sketchId, params);
      
      // Poll for results
      const results = await imageGenerationApi.pollGenerationStatus(
        generationId,
        (progress) => setProgress(progress)
      );
      
      setGeneratedImages(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    progress,
    generatedImages,
    error,
    generateImages,
  };
}
