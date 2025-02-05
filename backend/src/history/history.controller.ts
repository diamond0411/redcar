import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryDTO } from './dto/history.dto';
import {AuthGuard} from '../auth/auth.guard' 
import { UseGuards } from '@nestjs/common';
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}
  

  @Get()
  @UseGuards(AuthGuard)
  async findHistory(@Request() req) {
    const id = req.user.id;
    const history = await this.historyService.findOne(id);
    return history;
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Request() req, @Body() historyDTO: HistoryDTO) {
    const id = req.user.id;
    return await this.historyService.create(id, historyDTO);
  }

}