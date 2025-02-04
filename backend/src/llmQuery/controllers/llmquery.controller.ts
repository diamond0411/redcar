import {Controller, Post, Body} from '@nestjs/common';
import {LLMQueryDTO, LLMResponseDTO} from '../dto/llmquery.dto'

@Controller("llmquery")
export class LLMQueryController {
    constructor(private readonly queryService: )
}