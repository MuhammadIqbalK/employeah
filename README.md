# Employeah - Employee Management System

A comprehensive employee management system with bulk Excel upload capabilities and an intuitive dashboard for employee data visualization and management.

## Tech Stack

- **Backend**: Bun + Hono + PostgreSQL + Drizzle ORM + PgBoss + Redis
- **Frontend**: Vue.js 3 + TailwindCSS + Chart.js
- **Build Tool**: Turborepo + Vite
- **Queue System**: PgBoss for background job processing
- **Caching**: Redis for performance optimization

## Features

### ✅ MVP Features Implemented

1. **Bulk Excel Upload**
   - Drag & drop file upload interface
   - Excel file validation (.xlsx, .xls)
   - Real-time processing status with progress bar
   - Background processing using PgBoss queues
   - Detailed error reporting per row
   - Template download functionality

2. **Employee Dashboard**
   - Key metrics cards (total records, records today, average age, countries)
   - Interactive charts (gender distribution, country distribution, age distribution, timeline)
   - Real-time data updates
   - Responsive design

3. **Record Management**
   - Paginated record listing
   - Advanced search and filtering
   - Bulk operations (update, delete)
   - Inline editing capabilities
   - CSV export functionality

4. **Database Schema**
   - `trx_employee` table with proper indexes
   - Upload job tracking
   - Error logging system

## Project Structure

```
employeah/
├── apps/
│   ├── api/                 # Backend API (Hono + Bun)
│   │   ├── src/
│   │   │   ├── config/     # PgBoss, Redis configurations
│   │   │   ├── controllers/ # API controllers
│   │   │   ├── services/   # Business logic services
│   │   │   ├── workers/    # Background workers
│   │   │   ├── db/         # Database schema and migrations
│   │   │   └── index.ts    # Main server file
│   │   └── package.json
│   └── web/                # Frontend (Vue.js)
│       ├── src/
│       │   ├── views/       # Page components
│       │   ├── services/    # API services
│       │   ├── router/      # Vue Router
│       │   └── style.css    # TailwindCSS styles
│       └── package.json
├── packages/               # Shared packages
└── turbo.json            # Turborepo configuration
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- Bun 1.3.0+
- PostgreSQL 14+
- Redis 6+

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd employeah
bun install
```

### 2. Database Setup

Create a PostgreSQL database and update the connection string in `apps/api/.env`:

```bash
# apps/api/.env
DATABASE_URL=postgresql://username:password@localhost:5432/employeah
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. Run Database Migrations

```bash
cd apps/api
bun run db:generate
bun run db:migrate
```

### 4. Start Services

#### Start Redis
```bash
redis-server
```

#### Start Backend API
```bash
cd apps/api
bun run dev
```

#### Start Frontend
```bash
cd apps/web
bun run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health

## API Endpoints

### Upload Endpoints
- `POST /api/upload/excel` - Upload Excel file
- `GET /api/upload/status/:jobId` - Get upload status
- `GET /api/upload/errors/:jobId` - Get upload errors
- `GET /api/upload/template` - Download Excel template

### Records Endpoints
- `GET /api/records` - List records with pagination and filters
- `GET /api/records/:id` - Get single record
- `PUT /api/records/:id` - Update record
- `DELETE /api/records/:id` - Delete record
- `POST /api/records/bulk-update` - Bulk update records

### Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/charts/:type` - Get chart data
- `GET /api/dashboard/countries` - Get countries list

## Excel Template Format

The Excel file must contain the following columns:

| Column | Required | Format | Description |
|--------|----------|--------|-------------|
| firstname | Yes | VARCHAR(10) | Employee first name (max 10 characters) |
| lastname | Yes | VARCHAR(10) | Employee last name (max 10 characters) |
| gender | Yes | CHAR(6) | Gender (max 6 characters) |
| country | Yes | VARCHAR(20) | Country name (max 20 characters) |
| age | Yes | INTEGER | Age (0-99) |
| date | Yes | DATE | Date in YYYY-MM-DD format |

## Architecture Highlights

### Efficient File Processing
- **Background Processing**: Files are processed asynchronously using PgBoss queues
- **Batch Processing**: Records are inserted in batches of 100 for optimal performance
- **Error Handling**: Comprehensive error tracking with detailed row-level reporting
- **File Cleanup**: Automatic cleanup of uploaded files after processing

### Performance Optimizations
- **Redis Caching**: Dashboard statistics and search results are cached
- **Database Indexes**: Optimized indexes on frequently queried columns
- **Pagination**: Efficient pagination for large datasets
- **Connection Pooling**: Optimized database connection management

### Scalability Features
- **Queue System**: PgBoss handles concurrent file processing
- **Worker Separation**: Background workers are separated from API processes
- **Horizontal Scaling**: Designed to support multiple worker instances
- **Caching Strategy**: Multi-level caching for improved performance

## Development

### Running in Development Mode

```bash
# Start all services
bun run dev

# Or start individually
cd apps/api && bun run dev
cd apps/web && bun run dev
```

### Database Migrations

```bash
cd apps/api
bun run db:generate  # Generate migration files
bun run db:migrate  # Run migrations
```

### Linting and Formatting

```bash
bun run lint
bun run format
```

## Production Deployment

### Environment Variables

Create production environment files:

**Backend (`apps/api/.env`)**:
```
DATABASE_URL=postgresql://username:password@host:5432/database
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=redis-password
PORT=3000
```

**Frontend (`apps/web/.env`)**:
```
VITE_API_URL=https://your-api-domain.com
```

### Build for Production

```bash
bun run build
```

### Docker Deployment

```dockerfile
# Example Dockerfile for API
FROM oven/bun:1.3.0
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
```

## Monitoring and Maintenance

### Health Checks
- API health endpoint: `GET /health`
- Worker status monitoring
- Database connection monitoring
- Redis connection monitoring

### Logging
- Structured logging for all operations
- Error tracking and alerting
- Performance metrics collection

### Backup Strategy
- Regular database backups
- File storage backup
- Configuration backup

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository or contact the development team.