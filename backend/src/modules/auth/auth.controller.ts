import {
  Controller, Post, Get, Put, Body, Req, Res, HttpCode, UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/auth.decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new company + admin user' })
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return { success: true, message: 'Account created successfully', data };
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login and receive JWT tokens' })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto, req.ip, req.headers['user-agent']);
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      },
    };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate access token using refresh token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body: any) {
    const refreshToken = req.cookies?.refreshToken || body?.refreshToken;
    const tokens = await this.authService.refresh(refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { success: true, message: 'Token refreshed', data: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn } };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — revoke session' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response, @CurrentUser('userId') userId: string) {
    const refreshToken = req.cookies?.refreshToken || (req.body as any)?.refreshToken;
    await this.authService.logout(refreshToken, userId);
    res.clearCookie('refreshToken');
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@CurrentUser('userId') userId: string) {
    const user = await this.authService.getMe(userId);
    return { success: true, message: 'User profile fetched', data: user };
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  async changePassword(@CurrentUser('userId') userId: string, @Body() dto: ChangePasswordDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.changePassword(userId, dto);
    res.clearCookie('refreshToken');
    return { success: true, message: result.message };
  }
}
