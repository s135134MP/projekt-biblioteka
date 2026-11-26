import { InferSelectModel } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp} from 'drizzle-orm/pg-core';

export const books = pgTable('books', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true }).$onUpdate(() => new Date().toISOString()).notNull(),
});

export type Book = InferSelectModel<typeof books>;
