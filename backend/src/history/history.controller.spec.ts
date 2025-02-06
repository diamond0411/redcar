import { Test, TestingModule } from '@nestjs/testing';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { HistoryDTO } from './dto/history.dto';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';

describe('HistoryController', () => {
  let historyController: HistoryController;
  let historyService: HistoryService;

  beforeEach(async () => {
    const mockHistoryService = {
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoryController],
      providers: [
        { provide: HistoryService, useValue: mockHistoryService },
        { provide: getModelToken('History'), useValue: {} },
        JwtService 
      ],
    }).compile();

    historyController = module.get<HistoryController>(HistoryController);
    historyService = module.get<HistoryService>(HistoryService);
  });

  describe('findHistory', () => {
    it('should return history records for the current user', async () => {
      const userID = 'user123';
      const mockHistory = [new HistoryDTO(userID, 'test-prompt', 'test-response')];
      historyService.findOne = jest.fn().mockResolvedValue(mockHistory);
      const req = { user: { id: userID } };

      const result = await historyController.findHistory(req);

      expect(historyService.findOne).toHaveBeenCalledWith(userID);
      expect(result).toEqual(mockHistory);
    });
  });

  describe('create', () => {
    it('should create a new history record for the current user', async () => {
      const userID = 'user123';
      const createHistoryDTO = new HistoryDTO(userID, 'test-prompt', 'test-response');
      const mockCreatedHistory = { ...createHistoryDTO };
      historyService.create = jest.fn().mockResolvedValue(mockCreatedHistory);
      const req = { user: { id: userID } };

      const result = await historyController.create(req, createHistoryDTO);

      expect(historyService.create).toHaveBeenCalledWith(userID, createHistoryDTO);
      expect(result).toEqual(mockCreatedHistory);
    });
  });
});
