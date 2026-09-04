import { IsString, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'A mensagem não pode ser vazia' })
  message: string;
}
