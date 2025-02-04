import {Controller, Post, Body, Sse} from '@nestjs/common';
import {LLMQueryDTO, LLMResponseDTO} from '../dto/llmquery.dto'
import { LLMQueryService } from '../services/llmquery.service';
import { Observable } from 'rxjs';

@Controller("llmquery")
export class LLMQueryController {
    constructor(private readonly llmQueryService: LLMQueryService) {}

    @Post('stream')
    @Sse('stream')
    async stream(@Body() body: {prompt: string, domain: string}): Promise<Observable<MessageEvent>> {
        return this.llmQueryService.streamLLMResponse(body.prompt, body.domain);
    }
}