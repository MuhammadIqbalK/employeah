import { pgTable, serial, text, varchar, char, integer, date, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';

export const trxEmployee = pgTable('trx_employee', {
  id: serial('id').primaryKey(),
  firstname: varchar('firstname', { length: 10 }).notNull(),
  lastname: varchar('lastname', { length: 10 }).notNull(),
  gender: char('gender', { length: 6 }).notNull(),
  country: varchar('country', { length: 20 }).notNull(),
  age: integer('age').notNull(),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  idIdx: index('idx_trx_employee_id').on(table.id),
  firstnameIdx: index('idx_trx_employee_firstname').on(table.firstname),
}));

export const uploadJobs = pgTable('upload_jobs', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  totalRecords: integer('total_records'),
  processedRecords: integer('processed_records').default(0),
  failedRecords: integer('failed_records').default(0),
  errorDetails: jsonb('error_details'),
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const uploadErrors = pgTable('upload_errors', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => uploadJobs.id),
  rowNumber: integer('row_number').notNull(),
  errorType: varchar('error_type', { length: 50 }).notNull(),
  errorMessage: text('error_message').notNull(),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
