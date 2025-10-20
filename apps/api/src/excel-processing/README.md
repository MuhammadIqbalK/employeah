# Excel Processing Module

Clean, modular Excel processing system following MVC architecture patterns.

## 🏗️ Architecture Overview

```
src/
├── types/           # Type definitions and interfaces
├── utils/           # Utility functions and helpers
├── repositories/    # Data access layer
├── services/        # Business logic layer
├── workers/         # Background job processing
├── config/          # Configuration files
├── examples/        # Usage examples
└── excel-processing/ # Main module exports
```

## 📁 Module Structure

### Types (`types/excel.types.ts`)
- **ExcelRowSchema**: Zod validation schema
- **ExcelRowData**: Core data interface
- **ProcessedRow**: Row processing result
- **ValidationError**: Error record structure
- **ParseValidateResult**: Parsing result
- **ProcessingResult**: Complete processing result
- **Job Interfaces**: ExcelJobData, DataInsertJobData, ErrorLoggingJobData
- **WorkerStatus**: Worker status interface

### Utils (`utils/`)
- **ExcelUtils**: Excel file processing utilities
- **Logger**: Centralized logging with structured output

### Repositories (`repositories/excel.repository.ts`)
- **ExcelRepository**: Database operations
  - `insertEmployeeBatch()`: Bulk employee insertions
  - `insertErrorBatch()`: Bulk error logging
  - `updateJobStatus()`: Job status updates
  - `getJobById()`: Job retrieval
  - `getJobErrors()`: Error retrieval

### Services (`services/excel.service.ts`)
- **ExcelService**: Main business logic
  - `parseValidate()`: Parse and validate Excel files
  - `insertDataChunk()`: Insert data chunks
  - `logErrors()`: Log error records
  - `processExcelFile()`: Legacy method (backward compatibility)

### Workers (`workers/unified-excel.worker.ts`)
- **UnifiedExcelWorker**: Three-step processing pipeline
  - Parse & Validate (teamSize: 1)
  - Data Insert (teamSize: 5)
  - Error Logging (teamSize: 1)

## 🚀 Usage

### Basic Usage

```typescript
import { 
  unifiedExcelWorker, 
  UnifiedExcelWorker, 
  Logger 
} from './excel-processing';

// Start worker
await unifiedExcelWorker.start();

// Process Excel file
const jobId = await UnifiedExcelWorker.sendExcelJob(
  1, 
  '/path/to/file.xlsx', 
  'employees.xlsx', 
  'admin'
);

// Check status
const status = unifiedExcelWorker.getStatus();
Logger.info('Worker status', status);
```

### Advanced Usage

```typescript
import { 
  ExcelService, 
  ExcelRepository, 
  ExcelUtils,
  Logger 
} from './excel-processing';

// Parse and validate
const result = await ExcelService.parseValidate('/path/to/file.xlsx', 1);

// Insert data
await ExcelService.insertDataChunk(1, result.validChunks[0]);

// Log errors
await ExcelService.logErrors(1, result.errorRecords);
```

## 🔧 Configuration

### Queue Configuration (`config/pgboss.ts`)

```typescript
export const QUEUE_NAMES = {
  EXCEL_PARSE_VALIDATE: 'excel-parse-validate',
  DATA_INSERT: 'data-insert',
  ERROR_LOGGING: 'error-logging',
};
```

### Worker Configuration

```typescript
private readonly WORKER_CONFIG = {
  PARSE_VALIDATE: { teamSize: 1, teamConcurrency: 1 },
  DATA_INSERT: { teamSize: 5, teamConcurrency: 5 },
  ERROR_LOGGING: { teamSize: 1, teamConcurrency: 1 },
};
```

## 📊 Processing Pipeline

1. **Parse & Validate**: Excel file parsing and validation
2. **Data Insert**: Bulk insertion of valid records
3. **Error Logging**: Logging of validation and insertion errors

## 🛡️ Error Handling

- **Structured Error Types**: ValidationError, InsertionError
- **Centralized Logging**: Logger utility with levels
- **Graceful Degradation**: Partial success handling
- **Retry Mechanisms**: Built into PgBoss queue system

## 🧪 Testing

```typescript
// Test individual components
import { ExcelUtils } from './excel-processing';

const isValid = ExcelUtils.validateHeaders(['firstname', 'lastname', 'gender']);
const chunks = ExcelUtils.chunkArray(data, 100);
```

## 📈 Performance

- **Chunked Processing**: 100 records per chunk
- **Parallel Processing**: 5 concurrent data insert workers
- **Bulk Operations**: Efficient database operations
- **Memory Management**: Streaming file processing

## 🔄 Migration from Legacy

The legacy `processExcelFile()` method is maintained for backward compatibility while the new modular system provides:

- Better separation of concerns
- Improved testability
- Enhanced error handling
- Cleaner code organization
- Type safety throughout
