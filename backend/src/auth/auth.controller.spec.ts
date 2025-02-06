import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const mockAuthService = {
      signUp: jest.fn().mockResolvedValue({ token: 'test-jwt-token' }),
      login: jest.fn().mockResolvedValue({ token: 'test-jwt-token' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('signUp', () => {
    it('should return a JWT token on successful signup', async () => {
      const signupDto: SignupDto = { email: 'test@example.com', password: 'password123' };
      const result = await authController.signUp(signupDto);

      expect(authService.signUp).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual({ token: 'test-jwt-token' });
    });
  });

  describe('signin', () => {
    it('should return a JWT token on successful login', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const result = await authController.signin(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual({ token: 'test-jwt-token' });
    });
  });
});