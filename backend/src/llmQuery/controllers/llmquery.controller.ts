import {Controller, Post, Body, Sse, UseGuards, Request} from '@nestjs/common';
import { LLMQueryService } from '../services/llmquery.service';
import { Observable } from 'rxjs';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller("llmquery")
export class LLMQueryController {
    constructor(private readonly llmQueryService: LLMQueryService) {}

    @Post('stream')
    @Sse('stream')
    @UseGuards(AuthGuard)
    async stream(@Request() req, @Body() body: {prompt: string, domain: string}): Promise<Observable<MessageEvent>> {
        return this.llmQueryService.streamLLMResponse(body.prompt, body.domain, req.user ? req.user.id : null);
    }
}