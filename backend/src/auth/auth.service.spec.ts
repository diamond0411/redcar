import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let userModel: any;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockUserModel = {
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(), 
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_EXPIRES') return '1h';
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken('User'));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('signUp', () => {
    it('should return a JWT token on successful signup', async () => {
      const signupDto = { email: 'test@example.com', password: 'password123' };
      const hashedPassword = await bcrypt.hash(signupDto.password, 10);

      const mockUser = {
        id: '123',
        email: signupDto.email,
        password: hashedPassword,
        save: jest.fn(),
      };

      userModel.create.mockResolvedValue(mockUser);
      const mockSign = jwtService.sign as jest.Mock;
      mockSign.mockReturnValue('test-jwt-token');

      const result = await authService.signUp(signupDto);

      expect(userModel.create).toHaveBeenCalledWith({
        email: signupDto.email,
        password: expect.any(String),
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith(
        { id: mockUser.id },
        {
          secret: 'test-secret',
          expiresIn: '1h',
        },
      );
      expect(result).toEqual({ token: 'test-jwt-token' });
    });
  });

  describe('login', () => {
    it('should return a JWT token on successful login', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);

      const mockUser = {
        id: '123',
        email: loginDto.email,
        password: hashedPassword,
      };

      userModel.findOne.mockResolvedValue(mockUser);
      const mockSign = jwtService.sign as jest.Mock;
      mockSign.mockReturnValue('test-jwt-token');

      const result = await authService.login(loginDto);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: loginDto.email });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { id: mockUser.id },
        {
          secret: 'test-secret',
        },
      );
      expect(result).toEqual({ token: 'test-jwt-token' });
    });
  });
});