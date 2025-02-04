import { Injectable } from "@nestjs/common";
import { LLMQueryServiceInterface } from "../interfaces/llmquery.interface";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts"
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
    private prompt: ChatPromptTemplate;
    private webBrowser: WebBrowser;

    constructor() {
        this.llm = new ChatOpenAI({
            model: process.env.MODEL,
            temperature: 0.7,
            openAIApiKey: process.env.OPENAI_API_KEY,
            streaming: true
        });

        this.prompt = ChatPromptTemplate.fromMessages([
            ["system", 
                "You are a helpful assistant that explains companies based off of their website and your background knowledge. Do not hallucinate any information about the company. Here is the company website:\n {context}"],
            ["human", "{input}"],
        ]);

        this.webBrowser = new WebBrowser({
            model: this.llm,
            embeddings: new OpenAIEmbeddings(),
        });
    }

    streamLLMResponse(prompt: string, domain: string): Observable<MessageEvent> {
        return new Observable((subscriber) => {
            const runStream = async () => {
                try {
                    const url = domain.startsWith('http') ? domain : `https://${domain}`;
                    const result = await this.webBrowser.invoke({url});
                    const splitter = new RecursiveCharacterTextSplitter({
                        chunkSize: 1000,
                        chunkOverlap: 200,
                    });
                    
                    const docs = await splitter.createDocuments([result]);
                    const vectorStore = await MemoryVectorStore.fromDocuments(
                        docs,
                        new OpenAIEmbeddings()
                    );
                    const documentChain = await createStuffDocumentsChain({
                        llm: this.llm,
                        prompt: this.prompt,
                    });
                    const retrievalChain = await createRetrievalChain({
                        combineDocsChain: documentChain,
                        retriever: vectorStore.asRetriever(),
                    });
                    const stream = await retrievalChain.stream({
                        input: prompt,
                        context: result  
                    });
                    for await (const chunk of stream) {
                        subscriber.next({
                            data: chunk.answer, 
                            type: 'message',
                        } as MessageEvent);
                    }
                    subscriber.complete();
                } catch (error) {
                    subscriber.error(error);
                }
            };

            runStream();
        });
    }
}