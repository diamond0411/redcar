import { Observable } from "rxjs";

export interface LLMQueryServiceInterface { 
    streamLLMResponse(prompt: string,  domain: string): Observable<MessageEvent>;
}