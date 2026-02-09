import { IsEnum, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/** Query param values for list documents (lowercase, matches API). */
export enum ListDocumentType {
  INVOICE = 'invoice',
  PURCHASE_ORDER = 'purchase_order',
  RECEIPT = 'receipt',
  OTHER = 'other',
}

export class ListDocumentsQueryDto {
  @IsOptional()
  @Transform(({ value }: { value?: string }) => (value != null && value !== '' ? Number(value) : 20))
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Transform(({ value }: { value?: string }) => (value != null && value !== '' ? Number(value) : 0))
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsEnum(ListDocumentType)
  type?: ListDocumentType;

  @IsOptional()
  @IsString()
  q?: string;
}
