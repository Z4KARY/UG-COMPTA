declare module 'react-to-print' {
  import { RefObject } from 'react';
  
  export interface UseReactToPrintOptions {
    content?: () => any;
    documentTitle?: string;
    onAfterPrint?: () => void;
    onBeforeGetContent?: () => void | Promise<void>;
    onPrintError?: (errorLocation: string, error: Error) => void;
    removeAfterPrint?: boolean;
    suppressErrors?: boolean;
    pageStyle?: string | (() => string);
    copyStyles?: boolean;
    bodyClass?: string;
  }

  export function useReactToPrint(options: UseReactToPrintOptions): () => void;
}
