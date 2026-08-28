declare module '@google/generative-ai' {
  export interface GenerativeModelOptions {
    model: string;
    systemInstruction?: string;
  }

  export interface GenerateContentResult {
    response: {
      text: () => string;
    };
  }

  export interface GenerativeModel {
    generateContent: (prompt: string | Array<unknown>) => Promise<GenerateContentResult>;
  }

  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(options: GenerativeModelOptions): GenerativeModel;
  }
}
