/** "Where by id" shape for Prisma calls. */
const idWhere = (id: string) => ({ id }) as { id: string };

/**
 * Delegate interface compatible with a Prisma model delegate (e.g. prisma.document).
 * Used by BaseRepository to perform actual DB operations; subclasses can wrap or replace for caching etc.
 */
export interface BaseRepositoryDelegate<TModel, TCreate, TUpdate> {
  create(args: { data: TCreate }): Promise<TModel>;
  update(args: { where: { id: string }; data: TUpdate }): Promise<TModel>;
  findUnique(args: { where: { id: string } }): Promise<TModel | null>;
  findMany(args?: { where?: unknown; orderBy?: unknown; take?: number; skip?: number }): Promise<TModel[]>;
  upsert(args: { where: { id: string }; create: TCreate; update: TUpdate }): Promise<TModel>;
  count(args?: { where?: unknown }): Promise<number>;
}

export type FindManyArgs = Parameters<BaseRepositoryDelegate<unknown, unknown, unknown>['findMany']>[0];

/**
 * Base repository for a Prisma model with string id.
 * Subclass and pass the delegate (e.g. prisma.document); override methods to add caching or other behavior.
 */
export abstract class BaseRepository<TModel, TCreate, TUpdate> {
  constructor(protected readonly delegate: BaseRepositoryDelegate<TModel, TCreate, TUpdate>) {}

  /** Insert one row. */
  protected create(data: TCreate): Promise<TModel> {
    return this.delegate.create({ data });
  }

  /** Update one row by id. */
  protected update(id: string, data: TUpdate): Promise<TModel> {
    return this.delegate.update({ where: idWhere(id), data });
  }

  /** Find one row by id, or null. */
  protected findById(id: string): Promise<TModel | null> {
    return this.delegate.findUnique({ where: idWhere(id) });
  }

  /** List rows with optional filters and pagination. */
  protected findMany(args?: FindManyArgs): Promise<TModel[]> {
    return this.delegate.findMany(args ?? {});
  }

  /** Create or update by id (Prisma upsert). */
  protected upsert(id: string, create: TCreate, update: TUpdate): Promise<TModel> {
    return this.delegate.upsert({ where: idWhere(id), create, update });
  }

  /** Count rows, optionally with a where clause. */
  protected count(where?: unknown): Promise<number> {
    return this.delegate.count(where !== undefined ? { where } : {});
  }
}
