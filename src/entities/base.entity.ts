/**
 * Base entity shape: id, timestamps, and optional relations list.
 * Concrete entities extend this; persistence uses Prisma (no ORM decorators here).
 */
export abstract class BaseEntity {
  id!: string;
  createdAt!: Date;
  updatedAt?: Date;

  abstract relations: string[];

  /** Placeholder for id/timestamps before persist. Use in createFromDto. */
  static readonly UNINITIALIZED_DATE = new Date(0);

  /** Set id and createdAt to uninitialized state. Call from createFromDto before setting other fields. */
  protected setUninitialized(): void {
    this.id = '';
    this.createdAt = BaseEntity.UNINITIALIZED_DATE;
  }
}
