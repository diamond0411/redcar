import { Injectable, NotFoundException } from '@nestjs/common';
import { HistoryDTO } from './dto/history.dto';
import { InjectModel } from '@nestjs/mongoose';
import { History } from './entities/history.entity';
import { Model } from 'mongoose';

@Injectable()
export class HistoryService {
  constructor(@InjectModel(History.name) private historyModel: Model<History>) {}
  async create(userID: string, createHistoryDTO: HistoryDTO) {
    createHistoryDTO.userID = userID
    const history= await this.historyModel.create(createHistoryDTO);
    return history.save();
  }

  async findOne(id: string) {
    const history= await this.historyModel.find({ userID: id }).sort({_id:1});
    if (history) {
      return history;
    }
    throw new NotFoundException('History not found');
  }

}