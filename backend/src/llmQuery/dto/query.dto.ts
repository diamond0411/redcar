import { IsString} from 'class-validator';
import { MessageContent } from '@langchain/core/messages';

export class QueryDTO {
    @IsString()
    prompt: string;
    
    @IsString()
    domain: string;
}

export class ResponseDTO {
    @IsString()
    response: MessageContent;
}