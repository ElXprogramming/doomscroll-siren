import * as ort from 'onnxruntime-web';
import type { Detection } from '../types';

// Configure CDN for WASM binaries so Vite/Netlify won't have bundle/asset path conflicts
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@latest/dist/';
ort.env.wasm.numThreads = Math.min(4, Math.max(1, navigator.hardwareConcurrency ? Math.floor(navigator.hardwareConcurrency / 2) : 2));

export interface LetterboxInfo {
  scale: number;
  dx: number;
  dy: number;
  targetWidth: number;
  targetHeight: number;
}

export class VisionEngine {
  private session: ort.InferenceSession | null = null;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private isInitializing = false;
  private modelUrl = '/yolo11n.onnx';

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 640;
    this.offscreenCanvas.height = 640;
    const ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Could not create offscreen canvas context');
    }
    this.offscreenCtx = ctx;
  }

  public async initSession(onProgress?: (msg: string) => void): Promise<boolean> {
    if (this.session) return true;
    if (this.isInitializing) return false;
    this.isInitializing = true;

    try {
      onProgress?.('Verifying WebAssembly runtime...');

      // Attempt WebGPU first for acceleration, fallback to WASM
      const providers: string[] = ['wasm'];
      if ('gpu' in navigator) {
        try {
          const adapter = await (navigator as unknown as { gpu: { requestAdapter: () => Promise<unknown> } }).gpu.requestAdapter();
          if (adapter) {
            providers.unshift('webgpu');
          }
        } catch {
          // ignore webgpu check errors
        }
      }

      onProgress?.('Loading YOLO11 neural network (yolo11n.onnx)...');
      try {
        this.session = await ort.InferenceSession.create(this.modelUrl, {
          executionProviders: providers,
          graphOptimizationLevel: 'all',
        });
      } catch (gpuErr) {
        console.warn('GPU acceleration unavailable, falling back to CPU WASM:', gpuErr);
        this.session = await ort.InferenceSession.create(this.modelUrl, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
        });
      }

      onProgress?.('Vision engine ready.');
      return true;
    } catch (err) {
      console.error('Failed to load ONNX model:', err);
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  public isReady(): boolean {
    return this.session !== null;
  }

  /**
   * Preprocesses video frame into 1x3x640x640 Float32 CHW RGB tensor with letterboxing
   */
  public preprocess(video: HTMLVideoElement): { tensor: ort.Tensor; letterbox: LetterboxInfo } {
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    const scale = Math.min(640 / vw, 640 / vh);
    const sw = Math.round(vw * scale);
    const sh = Math.round(vh * scale);
    const dx = Math.round((640 - sw) / 2);
    const dy = Math.round((640 - sh) / 2);

    // Fill background with standard YOLO padding (114, 114, 114)
    this.offscreenCtx.fillStyle = 'rgb(114, 114, 114)';
    this.offscreenCtx.fillRect(0, 0, 640, 640);

    // Draw video frame
    this.offscreenCtx.drawImage(video, 0, 0, vw, vh, dx, dy, sw, sh);

    const imgData = this.offscreenCtx.getImageData(0, 0, 640, 640);
    const rgba = imgData.data;
    const float32 = new Float32Array(3 * 640 * 640);

    const planeSize = 640 * 640;
    for (let i = 0; i < planeSize; i++) {
      const p = i * 4;
      float32[i] = rgba[p] / 255.0; // R
      float32[planeSize + i] = rgba[p + 1] / 255.0; // G
      float32[planeSize * 2 + i] = rgba[p + 2] / 255.0; // B
    }

    const tensor = new ort.Tensor('float32', float32, [1, 3, 640, 640]);
    return {
      tensor,
      letterbox: { scale, dx, dy, targetWidth: sw, targetHeight: sh },
    };
  }

  /**
   * Runs inference on the preprocessed frame
   * Output shape: [1, 300, 6] where each entry is [x1, y1, x2, y2, score, class_id]
   */
  public async detect(
    video: HTMLVideoElement,
    confidenceThreshold: number
  ): Promise<{ detections: Detection[]; inferenceTimeMs: number }> {
    if (!this.session) {
      throw new Error('VisionEngine session not initialized');
    }

    const startTime = performance.now();
    const { tensor, letterbox } = this.preprocess(video);

    const inputName = this.session.inputNames[0] || 'images';
    const feeds: Record<string, ort.Tensor> = { [inputName]: tensor };

    const results = await this.session.run(feeds);
    const outputName = this.session.outputNames[0] || 'output0';
    const output = results[outputName];

    const data = output.data as Float32Array;
    const dims = output.dims; // e.g., [1, 300, 6]
    const numDetections = dims[1] || 300;
    const rowSize = dims[2] || 6;

    const detections: Detection[] = [];

    for (let i = 0; i < numDetections; i++) {
      const offset = i * rowSize;
      const x1 = data[offset];
      const y1 = data[offset + 1];
      const x2 = data[offset + 2];
      const y2 = data[offset + 3];
      const score = data[offset + 4];
      const classId = Math.round(data[offset + 5]);

      if (score < confidenceThreshold) continue;

      // Class 0: person, Class 67: cell phone
      let label: string = `class_${classId}`;
      if (classId === 0) label = 'person';
      else if (classId === 67) label = 'cell phone';
      else {
        // We only track person and cell phone for Doomscroll Siren
        continue;
      }

      // Map letterboxed 640x640 coords back to normalized [0, 1] video frame coords
      const normX1 = Math.max(0, Math.min(1, (x1 - letterbox.dx) / letterbox.targetWidth));
      const normY1 = Math.max(0, Math.min(1, (y1 - letterbox.dy) / letterbox.targetHeight));
      const normX2 = Math.max(0, Math.min(1, (x2 - letterbox.dx) / letterbox.targetWidth));
      const normY2 = Math.max(0, Math.min(1, (y2 - letterbox.dy) / letterbox.targetHeight));

      detections.push({
        x1: normX1,
        y1: normY1,
        x2: normX2,
        y2: normY2,
        score,
        classId,
        label,
      });
    }

    const inferenceTimeMs = performance.now() - startTime;
    return { detections, inferenceTimeMs };
  }
}

export const visionEngine = new VisionEngine();
