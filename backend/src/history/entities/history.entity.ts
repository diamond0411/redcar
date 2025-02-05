import { Prop, Schema, SchemaFactory }
from '@nestjs/mongoose';
@Schema()
export class History {
    @Prop()
    userID: string;
    @Prop()
    prompt: string;
    @Prop()
    response: string;
}
export const HistorySchema = SchemaFactory.createForClass(History);