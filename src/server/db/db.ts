import { sql } from "@vercel/postgres"
import { bigint, boolean, customType, integer, pgTable, text, varchar } from "drizzle-orm/pg-core"
import { drizzle } from "drizzle-orm/vercel-postgres"
import { Address } from "viem"
import { ArbiterType } from "@/types"

const address = customType<{ data: Address }>({
  dataType: () => "varchar(255)",
  // Lowercase addresses by default to avoid match issues
  toDriver: (value) => value.toLowerCase(),
})

const arbiter = customType<{ data: ArbiterType; driverData: string }>({
  dataType: () => "jsonb",
  toDriver: (value) => JSON.stringify(value),
})

export const userDetails = pgTable("user_details", {
  xHandle: varchar("x_handle", { length: 255 }),
  email: varchar("email", { length: 255 }),
  farcasterId: varchar("farcaster_id", { length: 255 }),
  temporaryPrivateKey: varchar("temporary_private_key", { length: 255 }),
  smartAccountAddress: address("smart_account_address").notNull().primaryKey(),
  owner: varchar("owner", { length: 255 }),
  chainId: integer("chain_id").notNull(),
})

export const Beefs = pgTable("beefs", {
  address: address("address").notNull().primaryKey(),
  owner: address("owner").notNull(),
  wager: bigint("wager", { mode: "bigint" }).notNull(),
  challenger: address("challenger").notNull(),
  settleStart: bigint("settle_start", { mode: "bigint" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  arbiters: arbiter("arbiters").array().notNull(),
  joinDeadline: bigint("join_deadline", { mode: "bigint" }).notNull(),
  staking: boolean("staking").notNull(),
  isCooking: boolean("is_cooking").notNull(),
  beefGone: boolean("beef_gone").notNull(),
  chainId: integer("chain_id").notNull(),
  createdAt: bigint("created_at", { mode: "bigint" }).notNull(),
})

export const schema = { userDetails, Beefs }

export const db = drizzle(sql, { schema })
