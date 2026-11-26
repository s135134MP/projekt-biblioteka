
import { InferSelectModel } from "drizzle-orm";
import { pgTable, uuid, varchar, boolean, pgEnum, timestamp, } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [ "admin", "user", ]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'string', withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string', withTimezone: true }).$onUpdate(() => new Date().toISOString()).notNull(),
});

export type User = InferSelectModel<typeof users>;
export type AuthUser = Pick<User, "id" | "name" | "email" | "role" | "isActive"> 