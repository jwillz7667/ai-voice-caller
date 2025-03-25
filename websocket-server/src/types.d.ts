// Fallback type declarations in case the @types packages are not properly installed

declare module 'express' {
  import { Server } from 'http';
  
  export interface Request {
    body: any;
    params: any;
    query: any;
    headers: any;
    socket: any;
    url?: string;
  }
  
  export interface Response {
    status(code: number): Response;
    json(data: any): void;
    send(data: any): void;
    type(type: string): Response;
    setHeader(name: string, value: string): void;
  }
  
  export interface NextFunction {
    (err?: any): void;
  }
  
  export interface Application {
    use(middleware: any): Application;
    get(path: string, handler: (req: Request, res: Response) => void): void;
    post(path: string, handler: (req: Request, res: Response) => void | Promise<void>): void;
    all(path: string, handler: (req: Request, res: Response) => void): void;
    listen(port: number, callback?: () => void): Server;
  }
  
  export default function express(): Application;
  
  export namespace express {
    export function json(options?: any): any;
    export function urlencoded(options?: any): any;
    export function static(root: string, options?: any): any;
  }
}

declare module 'cors' {
  import { Request, Response, NextFunction } from 'express';
  
  interface CorsOptions {
    origin?: string | string[] | boolean | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }
  
  export default function cors(options?: CorsOptions): (req: Request, res: Response, next: NextFunction) => void;
} 