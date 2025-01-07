export interface VercelRequest {
  method: string;
  url: string;
  headers: { [key: string]: string | string[] | undefined };
  query: { [key: string]: string | string[] };
  cookies: { [key: string]: string };
  body: any;
}

export interface VercelResponse {
  setHeader: (name: string, value: string | number | readonly string[]) => void;
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => void;
  send: (body: any) => void;
  end: (chunk?: any, encoding?: string, callback?: () => void) => void;
  redirect: (statusOrUrl: string | number, url?: string) => void;
} 