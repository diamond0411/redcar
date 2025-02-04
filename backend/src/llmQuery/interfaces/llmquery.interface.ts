
export interface LLMQueryServiceInterface { 
    streamLLMResponse(prompt: string,  domain: string): MessageEvent;
}