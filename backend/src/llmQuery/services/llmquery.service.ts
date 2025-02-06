import { Injectable } from "@nestjs/common";
import { LLMQueryServiceInterface } from "../interfaces/llmquery.interface";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts"
import { Observable } from "rxjs";
import { WebBrowser } from 'langchain/tools/webbrowser';
import { OpenAIEmbeddings } from '@langchain/openai';
import { HistoryService } from "../../history/history.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { History } from "../../history/entities/history.entity";
import { HistoryDTO } from "../../history/dto/history.dto";

@Injectable()
export class LLMQueryService implements LLMQueryServiceInterface {
    private llm: ChatOpenAI;
    private webBrowser: WebBrowser;
    private prompt: ChatPromptTemplate;
    private historyService: HistoryService;
    private summaryPrompt: ChatPromptTemplate;

    constructor(@InjectModel(History.name) private historyModel: Model<History>) {
        this.llm = new ChatOpenAI({
            model: process.env.MODEL,
            temperature: 0.7,
            openAIApiKey: process.env.OPENAI_API_KEY,
            streaming: true
        });
        this.prompt = ChatPromptTemplate.fromMessages([
            ["system", 
                "You are a helpful assistant that explains companies based off of their website and your background knowledge. Do not hallucinate any information about the company. Here is an answer to the question {question} you gave from the data on the company website: {result}"],
            ["human", "Polish this answer such that if you do not know the answer to the direct question, mention that it is not on their website. Otherwise ignore any follow through information if it is not on the site. Do not add the links. Do not mention text and only talk in terms of the website."],
        ]);
        this.summaryPrompt = ChatPromptTemplate.fromMessages([
            ["system", 
                "Do not hallucinate. You are a helpful assistant that answers question about a company. Summarize the following response while ignoring sections you do not know about in 2-3 concise sentences. {answer}"],
        ]);
        this.webBrowser = new WebBrowser({
            model: this.llm,
            embeddings: new OpenAIEmbeddings(),
        });
        this.historyService = new HistoryService(historyModel);
    }

    streamLLMResponse(prompt: string, domain: string, userID: string): Observable<MessageEvent> {
        if (!prompt || !domain) {
            throw new Error('Prompt and domain must be provided');
        }
        if (!userID) {
            throw new Error('Invalid Authentication');
        }
        return new Observable((subscriber) => {
            const runStream = async () => {
                try {
                    const url = domain.startsWith('http') ? domain : `https://${domain}`;
                    const result:string = await this.webBrowser.invoke(`${url}, ${prompt}`);
                    const chain = this.prompt.pipe(this.llm)
                    const answer = await chain.invoke({result: result, question: prompt})
                    const stream = await this.summaryPrompt.pipe(this.llm).stream({answer: answer.content});
                    let entireMessage = '';
                    for await (const chunk of stream) {
                        subscriber.next({
                            data: !(chunk.hasOwnProperty('stream')) ? chunk.content : (chunk as Object)['stream'], 
                            type: 'message',
                        } as MessageEvent);
                        entireMessage += chunk.content ? chunk.content : (chunk as Object)['stream'];
                    }
                    this.historyService.create(userID, {
                        userID: userID,
                        prompt: prompt,
                        response: entireMessage,
                    } as HistoryDTO);
                    subscriber.complete();
                } catch (error) {
                    console.log(error)
                    subscriber.error(error);
                }
            };

            runStream();
        });
    }
}