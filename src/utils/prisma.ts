/**
 * Cast a value to the shape Prisma expects for Json fields.
 * Use only at the DB boundary when passing data into Prisma (e.g. document.extractedData).
 */
export function toPrismaJson(value: unknown): object {
  return value as object;
}
