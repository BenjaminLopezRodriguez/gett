import { relations } from "drizzle-orm";
import { index, pgEnum, pgTableCreator, uniqueIndex } from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `gett_${name}`);

export const caseMemberRoleEnum = pgEnum("case_member_role", [
  "owner",
  "member",
  "lawyer",
  "viewer",
]);

export const caseStatusEnum = pgEnum("case_status", [
  "draft",
  "intake",
  "in_review",
  "with_lawyer",
  "closed",
]);

export const userPersonaEnum = pgEnum("user_persona", [
  "employee",
  "employer",
  "lawgroup",
  "insurer",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "unverified",
  "pending",
  "verified",
  "skipped",
]);

export const handoffChannelEnum = pgEnum("handoff_channel", [
  "sms",
  "web",
  "voice",
]);

export const handoffIntentEnum = pgEnum("handoff_intent", [
  "upload",
  "intake",
  "general",
]);

export const caseContactRoleEnum = pgEnum("case_contact_role", [
  "client",
  "lawyer",
  "adjuster",
]);

export const messageDirectionEnum = pgEnum("message_direction", ["in", "out"]);

export const messageChannelEnum = pgEnum("message_channel", ["sms", "call"]);

export const users = createTable(
  "user",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    kindeId: d.varchar({ length: 256 }).notNull(),
    email: d.varchar({ length: 320 }).notNull(),
    name: d.varchar({ length: 256 }),
    persona: userPersonaEnum(),
    verificationStatus: verificationStatusEnum().notNull().default("unverified"),
    verificationPayload: d.jsonb().$type<Record<string, unknown>>(),
    onboardingCompletedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [uniqueIndex("user_kinde_id_idx").on(t.kindeId)],
);

export const cases = createTable(
  "case",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    caseHash: d.varchar({ length: 64 }).notNull(),
    title: d.varchar({ length: 512 }).notNull(),
    status: caseStatusEnum().notNull().default("draft"),
    createdBy: d
      .uuid()
      .notNull()
      .references(() => users.id),
    metadata: d.jsonb().$type<Record<string, unknown>>().default({}),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("case_hash_idx").on(t.caseHash),
    index("case_created_by_idx").on(t.createdBy),
  ],
);

export const caseMembers = createTable(
  "case_member",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    caseId: d
      .uuid()
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    userId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: caseMemberRoleEnum().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("case_member_unique_idx").on(t.caseId, t.userId),
    index("case_member_user_idx").on(t.userId),
  ],
);

export const caseEvents = createTable(
  "case_event",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    caseId: d
      .uuid()
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    actorId: d.uuid().references(() => users.id, { onDelete: "set null" }),
    action: d.varchar({ length: 128 }).notNull(),
    payload: d.jsonb().$type<Record<string, unknown>>().default({}),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("case_event_case_created_idx").on(t.caseId, t.createdAt)],
);

export const documents = createTable(
  "document",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    caseId: d
      .uuid()
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    filename: d.varchar({ length: 512 }).notNull(),
    pdfAiDocId: d.varchar({ length: 256 }),
    sha256: d.varchar({ length: 64 }).notNull(),
    storageKey: d.varchar({ length: 1024 }).notNull(),
    storageBucket: d.varchar({ length: 256 }).notNull(),
    extractedText: d.text(),
    uploadedBy: d
      .uuid()
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("document_case_idx").on(t.caseId)],
);

export const intakeHandoffTokens = createTable(
  "intake_handoff_token",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    tokenHash: d.varchar({ length: 64 }).notNull(),
    channel: handoffChannelEnum().notNull(),
    phoneE164: d.varchar({ length: 20 }),
    intent: handoffIntentEnum().notNull().default("upload"),
    intentMeta: d.jsonb().$type<Record<string, string>>().default({}),
    caseId: d.uuid().references(() => cases.id, { onDelete: "set null" }),
    userId: d.uuid().references(() => users.id, { onDelete: "set null" }),
    expiresAt: d.timestamp({ withTimezone: true }).notNull(),
    consumedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("handoff_token_hash_idx").on(t.tokenHash),
    index("handoff_token_expires_idx").on(t.expiresAt),
  ],
);

export const caseContacts = createTable(
  "case_contact",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    caseId: d
      .uuid()
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    role: caseContactRoleEnum().notNull(),
    phoneE164: d.varchar({ length: 20 }).notNull(),
    displayName: d.varchar({ length: 256 }).notNull(),
    smsConsentAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("case_contact_unique_idx").on(t.caseId, t.phoneE164, t.role),
    index("case_contact_case_idx").on(t.caseId),
  ],
);

export const caseMessages = createTable(
  "case_message",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    caseId: d
      .uuid()
      .notNull()
      .references(() => cases.id, { onDelete: "cascade" }),
    direction: messageDirectionEnum().notNull(),
    templateId: d.varchar({ length: 128 }).notNull(),
    channel: messageChannelEnum().notNull(),
    actorId: d.uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [index("case_message_case_idx").on(t.caseId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  caseMemberships: many(caseMembers),
  createdCases: many(cases),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  creator: one(users, { fields: [cases.createdBy], references: [users.id] }),
  members: many(caseMembers),
  events: many(caseEvents),
  documents: many(documents),
  contacts: many(caseContacts),
  messages: many(caseMessages),
}));

export const caseMembersRelations = relations(caseMembers, ({ one }) => ({
  case: one(cases, { fields: [caseMembers.caseId], references: [cases.id] }),
  user: one(users, { fields: [caseMembers.userId], references: [users.id] }),
}));

export const caseEventsRelations = relations(caseEvents, ({ one }) => ({
  case: one(cases, { fields: [caseEvents.caseId], references: [cases.id] }),
  actor: one(users, { fields: [caseEvents.actorId], references: [users.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  case: one(cases, { fields: [documents.caseId], references: [cases.id] }),
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const intakeHandoffTokensRelations = relations(
  intakeHandoffTokens,
  ({ one }) => ({
    case: one(cases, {
      fields: [intakeHandoffTokens.caseId],
      references: [cases.id],
    }),
    user: one(users, {
      fields: [intakeHandoffTokens.userId],
      references: [users.id],
    }),
  }),
);

export const caseContactsRelations = relations(caseContacts, ({ one }) => ({
  case: one(cases, { fields: [caseContacts.caseId], references: [cases.id] }),
}));

export const caseMessagesRelations = relations(caseMessages, ({ one }) => ({
  case: one(cases, { fields: [caseMessages.caseId], references: [cases.id] }),
  actor: one(users, {
    fields: [caseMessages.actorId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type CaseMember = typeof caseMembers.$inferSelect;
export type CaseMemberRole = (typeof caseMemberRoleEnum.enumValues)[number];
export type CaseStatus = (typeof caseStatusEnum.enumValues)[number];
export type UserPersona = (typeof userPersonaEnum.enumValues)[number];
export type VerificationStatus =
  (typeof verificationStatusEnum.enumValues)[number];
export type IntakeHandoffToken = typeof intakeHandoffTokens.$inferSelect;
export type CaseContact = typeof caseContacts.$inferSelect;
export type CaseMessage = typeof caseMessages.$inferSelect;
