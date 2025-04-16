// src/api/imageGenerationApi.ts
import axios from 'axios';

// Create an axios instance with the backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interface for generation parameters
export interface GenerationParams {
  prompt: string;
  temperature?: number;
  guidanceScale?: number;
  seed?: number;
  iterationSteps?: number;
  numImages?: number;
}

// Interface for generation response
export interface GenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  results?: string[];
  error?: string;
}

// Image generation functions
export const imageGenerationApi = {
  // Upload sketch and get a sketch ID
  uploadSketch: async (sketchFile: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', sketchFile);
    
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.sketchId;
  },
  
  // Generate images from sketch
  generateImages: async (sketchId: string, params: GenerationParams): Promise<string> => {
    const response = await apiClient.post('/generate', {
      sketchId,
      ...params,
    });
    
    return response.data.generationId;
  },
  
  // Get generation status and results
  getGenerationStatus: async (generationId: string): Promise<GenerationResponse> => {
    const response = await apiClient.get(`/status/${generationId}`);
    return response.data;
  },
  
  // Poll for generation status until complete
  pollGenerationStatus: async (
    generationId: string, 
    onProgress?: (progress: number) => void
  ): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await imageGenerationApi.getGenerationStatus(generationId);
          
          if (status.progress && onProgress) {
            onProgress(status.progress);
          }
          
          if (status.status === 'completed' && status.results) {
            resolve(status.results);
          } else if (status.status === 'failed') {
            reject(new Error(status.error || 'Generation failed'));
          } else {
            setTimeout(poll, 1000); // Poll every second
          }
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }
};
