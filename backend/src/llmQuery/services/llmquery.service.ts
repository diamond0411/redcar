import { Injectable } from "@nestjs/common";
import { LLMQueryServiceInterface } from "../interfaces/llmquery.interface";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts"
import { Observable } from "rxjs";
import { WebBrowser } from 'langchain/tools/webbrowser';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";

@Injectable()
export class LLMQueryService implements LLMQueryServiceInterface {
    private llm: ChatOpenAI;
    private webBrowser: WebBrowser;
    private prompt: ChatPromptTemplate;
    constructor() {
        this.llm = new ChatOpenAI({
            model: process.env.MODEL,
            temperature: 0.7,
            openAIApiKey: process.env.OPENAI_API_KEY,
            streaming: true
        });
        this.prompt = ChatPromptTemplate.fromMessages([
            ["system", 
                "You are a helpful assistant that explains companies based off of their website and your background knowledge. Do not hallucinate any information about the company. Here is an answer to the question {question} you gave from the data on the company website: {result}"],
            ["human", "Polish this answer such that if you do not know the answer or it's possible to find on external sources, mention that the information is not on the website and the sources where they could find this information. Do not mention text and only talk in terms of the website. Format acronyms such as B2B as one token and format the website url like redcar.io to be in one token."],
        ]);

        this.webBrowser = new WebBrowser({
            model: this.llm,
            embeddings: new OpenAIEmbeddings(),
        });
    }

    streamLLMResponse(prompt: string, domain: string): Observable<MessageEvent> {
        if (!prompt || !domain) {
            throw new Error('Prompt and domain must be provided');
        }
        return new Observable((subscriber) => {
            const runStream = async () => {
                try {
                    const url = domain.startsWith('http') ? domain : `https://${domain}`;
                    const result = await this.webBrowser.invoke(`${url}, ${prompt}`);
                    const chain = this.prompt.pipe(this.llm)
                    const stream = await chain.stream({result: result, question: prompt});
                    for await (const chunk of stream) {
                        subscriber.next({
                            data: chunk.content, 
                            type: 'message',
                        } as MessageEvent);
                    }
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