declare module 'react-mathjax2' {
  import { ReactNode } from 'react';

  interface MathJaxContextProps {
    input?: 'tex' | 'ascii' | 'mathml';
    children: ReactNode;
  }

  interface MathJaxNodeProps {
    inline?: boolean;
    children: string;
  }

  export const Context: React.FC<MathJaxContextProps>;
  export const Node: React.FC<MathJaxNodeProps>;
} 