import { IsString, MinLength } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @MinLength(1, { message: 'question is required' })
  question!: string;
}
