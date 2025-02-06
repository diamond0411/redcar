import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Types } from 'mongoose';

describe('UserService', () => {
  let service: UserService;
  let userModel: any;

  beforeEach(async () => {
    userModel = {
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call userModel.create with the correct parameters', async () => {
      const createUserDto: CreateUserDto = {
        email: 'john.doe@example.com',
        password: 'password123',
      };
      const mockUser = {
        _id: new Types.ObjectId(),
        __v: 0,
        ...createUserDto,
      };

      userModel.create.mockResolvedValueOnce({ save: jest.fn().mockResolvedValue(mockUser) });
      const result = await service.create(createUserDto);
      expect(userModel.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOne', () => {
    it('should call userModel.findOne with the correct parameters', async () => {
      const userId = 1;
      const mockUser = {
        _id: new Types.ObjectId(),
        __v: 0,
        email: 'john.doe@example.com',
        password: 'password123',
      };
      userModel.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.findOne(userId);
      expect(userModel.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userModel.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });
});
