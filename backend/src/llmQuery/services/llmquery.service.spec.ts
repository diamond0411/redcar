import { Test, TestingModule } from '@nestjs/testing';
import { LLMQueryService } from './llmquery.service';
import { HistoryService } from '../../history/history.service';
import { getModelToken } from '@nestjs/mongoose';
import { History } from '../../history/entities/history.entity';
import { MessageEvent} from '@nestjs/common';
jest.mock('langchain/tools/webbrowser', () => ({
  WebBrowser: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue('mocked web result'),
  })),
}));

jest.mock('@langchain/openai', () => ({
    ChatOpenAI: jest.fn().mockImplementation(() => ({
        stream: jest.fn().mockImplementation(async function* () {
            yield 'This is a';
            yield ' company';
            yield ' about tech.';
        }),
    })),
    OpenAIEmbeddings: jest.fn().mockImplementation(() => ({
    embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    embedDocuments: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    })),
}));

jest.mock('langchain/tools/webbrowser', () => ({
    WebBrowser: jest.fn().mockImplementation(() => ({
        invoke: jest.fn().mockResolvedValue('mocked web result'),
    })),
}));

describe('LLMQueryService', () => {
    let llmQueryService: LLMQueryService;
    let historyService: HistoryService;
    let historyModel: any;



    beforeEach(async () => {
        const mockHistoryDocument = {
            save: jest.fn().mockResolvedValue({
              _id: 'mockId',
              userID: 'user123',
              prompt: 'test prompt',
              response: 'test response',
            }),
        };
      
        historyModel = {
            create: jest.fn().mockReturnValue(mockHistoryDocument),
        };
        const module: TestingModule = await Test.createTestingModule({
        providers: [
            LLMQueryService,
            {
                provide: HistoryService,
                useValue: {
                    create: jest.fn(),
                },
            },
            { provide: getModelToken(History.name), useValue: historyModel },
        ],
        }).compile();

        llmQueryService = module.get<LLMQueryService>(LLMQueryService);
        historyService = module.get<HistoryService>(HistoryService);
});

describe('streamLLMResponse', () => {
    it('should stream LLM response and save history', (done) => {
        const userID = 'user123';
        const prompt = 'What is the company about?';
        const domain = 'example.com';

        const stream$ = llmQueryService.streamLLMResponse(prompt, domain, userID);

        const receivedChunks: string [] = [];
        stream$.subscribe({
            next: (messageEvent: MessageEvent) => {
                if (typeof messageEvent.data === 'string') {
                    receivedChunks.push(messageEvent.data);
                } else {
                    receivedChunks.push(JSON.stringify(messageEvent.data));
                }
            },
            complete: () => {
                expect(receivedChunks).toEqual([
                    "This is a",
                    " company",
                    " about tech.",
                ]);
                expect(historyModel.create).toHaveBeenCalled();
                done();
            },
            error: (err) => done.fail(err),
        });
    });
  });
});