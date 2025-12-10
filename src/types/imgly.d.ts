declare module '@imgly/background-removal' {
  export interface Config {
    publicPath?: string;
    debug?: boolean;
    device?: 'gpu' | 'cpu';
    proxyToWorker?: boolean;
    model?: 'small' | 'medium' | 'large';
    output?: {
      format?: 'image/png' | 'image/jpeg' | 'image/webp';
      quality?: number;
    };
  }

  export function removeBackground(
    image: File | Blob | string | HTMLImageElement,
    config?: Config
  ): Promise<Blob>;

  export default removeBackground;
}
