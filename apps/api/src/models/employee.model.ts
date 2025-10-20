/**
 * Employee Model
 * Data model and validation for employee records
 */

import { z } from 'zod';

// Employee data schema
export const EmployeeSchema = z.object({
  id: z.number().optional(),
  firstname: z.string().max(10, 'First name must be 10 characters or less'),
  lastname: z.string().max(10, 'Last name must be 10 characters or less'),
  gender: z.string().max(6, 'Gender must be 6 characters or less'),
  country: z.string().max(20, 'Country must be 20 characters or less'),
  age: z.number().min(0).max(99, 'Age must be between 0 and 99'),
  date: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Employee data type
export type Employee = z.infer<typeof EmployeeSchema>;

// Employee creation data (without id and timestamps)
export const EmployeeCreateSchema = EmployeeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EmployeeCreate = z.infer<typeof EmployeeCreateSchema>;

// Employee update data (partial)
export const EmployeeUpdateSchema = EmployeeCreateSchema.partial();

export type EmployeeUpdate = z.infer<typeof EmployeeUpdateSchema>;

// Employee search filters
export interface EmployeeFilters {
  firstname?: string;
  lastname?: string;
  gender?: string;
  country?: string;
  ageMin?: number;
  ageMax?: number;
  dateFrom?: string;
  dateTo?: string;
}

// Employee statistics
export interface EmployeeStats {
  totalRecords: number;
  genderDistribution: Record<string, number>;
  countryDistribution: Record<string, number>;
  averageAge: number;
  recordsToday: number;
}

// Employee model class
export class EmployeeModel {
  /**
   * Validate employee data
   */
  static validate(data: unknown): Employee {
    return EmployeeSchema.parse(data);
  }

  /**
   * Validate employee creation data
   */
  static validateCreate(data: unknown): EmployeeCreate {
    return EmployeeCreateSchema.parse(data);
  }

  /**
   * Validate employee update data
   */
  static validateUpdate(data: unknown): EmployeeUpdate {
    return EmployeeUpdateSchema.parse(data);
  }

  /**
   * Safe parse employee data
   */
  static safeParse(data: unknown): { success: boolean; data?: Employee; error?: z.ZodError } {
    const result = EmployeeSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      error: result.success ? undefined : result.error,
    };
  }

  /**
   * Format employee data for database
   */
  static formatForDatabase(employee: EmployeeCreate): any {
    return {
      ...employee,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Format employee data for API response
   */
  static formatForResponse(employee: any): Employee {
    return {
      id: employee.id,
      firstname: employee.firstname,
      lastname: employee.lastname,
      gender: employee.gender,
      country: employee.country,
      age: employee.age,
      date: employee.date,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }
}
