import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { SendMessageDto } from './dto/chat.dto';

@Controller('chat')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post(':jobId')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Param('jobId') jobId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.aiService.sendMessage(jobId, dto.message);
  }

  @Get(':jobId/messages')
  async getMessages(@Param('jobId') jobId: string) {
    return this.aiService.getMessages(jobId);
  }
}
