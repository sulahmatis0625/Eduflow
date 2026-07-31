import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "node:crypto";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createInMemoryModel(modelName: string) {
  const store = new Map<string, Record<string, unknown>>();

  const getItem = (where?: Record<string, unknown>) => {
    if (!where) return null;

    const entries = Array.from(store.values());

    return entries.find((item) => {
      if (where.id !== undefined && item.id !== where.id) {
        return false;
      }

      if (where.email !== undefined) {
        const expected = String(where.email);
        const candidate = String(item.email ?? "");
        if (typeof where.email === "object" && where.email !== null) {
          const emailFilter = where.email as { equals?: unknown; mode?: string };
          if (emailFilter.equals !== undefined) {
            return candidate.toLowerCase() === String(emailFilter.equals).toLowerCase();
          }
        }

        return candidate.toLowerCase() === expected.toLowerCase();
      }

      return true;
    }) ?? null;
  };

  return {
    findMany: async () => Array.from(store.values()),
    findFirst: async ({ where }: { where?: Record<string, unknown> } = {}) => getItem(where as Record<string, unknown> | undefined),
    findUnique: async ({ where }: { where?: Record<string, unknown> } = {}) => getItem(where as Record<string, unknown> | undefined),
    count: async () => store.size,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const item = {
        id: String(data.id ?? randomUUID()),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      store.set(String(item.id), item as Record<string, unknown>);
      return item;
    },
    createMany: async ({ data }: { data: Record<string, unknown>[] }) => ({ count: data.length }),
    update: async ({ where, data }: { where?: Record<string, unknown>; data: Record<string, unknown> }) => {
      const existing = getItem(where as Record<string, unknown> | undefined);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date() };
      store.set(String(existing.id), updated as Record<string, unknown>);
      return updated;
    },
    updateMany: async () => ({ count: 0 }),
    delete: async ({ where }: { where?: Record<string, unknown> }) => {
      const existing = getItem(where as Record<string, unknown> | undefined);
      if (!existing) return null;
      store.delete(String(existing.id));
      return existing;
    },
    deleteMany: async () => ({ count: 0 }),
    upsert: async ({ where, create, update }: { where?: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => {
      const existing = getItem(where as Record<string, unknown> | undefined);
      if (existing) {
        const updated = { ...existing, ...update, updatedAt: new Date() };
        store.set(String(existing.id), updated as Record<string, unknown>);
        return updated;
      }

      const item = {
        id: String(create.id ?? randomUUID()),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...create,
      };
      store.set(String(item.id), item as Record<string, unknown>);
      return item;
    },
    aggregate: async () => ({ _count: { _all: store.size } }),
  };
}

function createMissingDbClient() {
  const modelCache = new Map<string, ReturnType<typeof createInMemoryModel>>();

  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") return undefined;

        const modelName = String(prop);
        if (!modelCache.has(modelName)) {
          modelCache.set(modelName, createInMemoryModel(modelName));
        }

        return modelCache.get(modelName);
      },
    },
  ) as unknown as PrismaClient;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

  if (!connectionString) {
    return createMissingDbClient();
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
