import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  async sendMessage(jobId: string, userMessage: string) {
    // Find the job and its content
    const job = await this.prisma.scrapeJob.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new NotFoundException('Job não encontrado');
    if (!job.contentMd && !job.contentJson) {
      throw new NotFoundException('Job não possui conteúdo para chat');
    }

    // Save user message
    await this.prisma.chatMessage.create({
      data: {
        jobId,
        role: 'user',
        content: userMessage,
      },
    });

    // Get chat history
    const history = await this.prisma.chatMessage.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
      take: 20, // Last 20 messages for context
    });

    // Determine content to use
    const content = job.contentMd || JSON.stringify(job.contentJson, null, 2);

    // Get AI response
    const aiResponse = await this.gemini.chatWithContent(
      content,
      userMessage,
      history.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
    );

    // Save assistant message
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        jobId,
        role: 'assistant',
        content: aiResponse,
      },
    });

    return assistantMessage;
  }

  async getMessages(jobId: string) {
    const job = await this.prisma.scrapeJob.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new NotFoundException('Job não encontrado');

    return this.prisma.chatMessage.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
