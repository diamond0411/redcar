import { IsString} from 'class-validator';
import { MessageContent } from '@langchain/core/messages';

export class LLMQueryDTO {
    @IsString()
    prompt: string;
    
    @IsString()
    domain: string;
}

export class LLMResponseDTO {
    @IsString()
    response: MessageContent;
}