import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HistoryService } from './history.service';
import { History } from './entities/history.entity';
import { HistoryDTO } from './dto/history.dto';

describe('HistoryService', () => {
    let historyService: HistoryService;
    let historyModel: any;
  
    beforeEach(async () => {
      const mockHistoryModel = {
        create: jest.fn(),
        find: jest.fn().mockReturnThis(), 
      };
  
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          HistoryService,
          { provide: getModelToken(History.name), useValue: mockHistoryModel },
        ],
      }).compile();
  
      historyService = module.get<HistoryService>(HistoryService);
      historyModel = module.get(getModelToken(History.name));
    });
  
    describe('create', () => {
      it('should create and save a history record', async () => {
        const userID = 'user123';
        const createHistoryDTO = new HistoryDTO(userID, 'test-prompt', 'test-response');
        const mockHistory = { ...createHistoryDTO, save: jest.fn().mockResolvedValue(createHistoryDTO) };
        historyModel.create.mockResolvedValue(mockHistory);
  
        const result = await historyService.create(userID, createHistoryDTO);
        expect(historyModel.create).toHaveBeenCalledWith(createHistoryDTO);
        expect(mockHistory.save).toHaveBeenCalled();
        expect(result).toEqual(createHistoryDTO);
      });
    });
  });
  