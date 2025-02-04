
export interface LLMQueryService { 
    streamLLMResponse(prompt: string,  domain: string): MessageEvent;
}