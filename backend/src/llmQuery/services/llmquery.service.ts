import { Injectable } from "@nestjs/common";
import { LLMQueryServiceInterface } from "../interfaces/llmquery.interface";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts"


@Injectable()
export class LLMQueryService implements LLMQueryServiceInterface {
    private llm : ChatOpenAI;
    private prompt: ChatPromptTemplate;
    constructor() {
        this.llm = new ChatOpenAI({
            model: process.env.MODEL,
            temperature: 0.7,
            openAIApiKey: process.env.OPENAI_API_KEY
        })
        this.prompt = ChatPromptTemplate.fromMessages([
            ["system", "You are a helpful assistant that explains companies based off of their domain name. Do not hallucinate any information about the company."],
            ["human", "{input}"],
        ])
    }
    streamLLMResponse(prompt: string, domain: string): MessageEvent {
        
    }
}