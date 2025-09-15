# Dynamic Forms Backend

A Node.js Express backend API for the Dynamic Forms application with MySQL database integration.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Form Management**: Create, read, update, delete dynamic forms with multiple steps and fields
- **Form Submissions**: Handle form submissions with validation and file uploads
- **Email Notifications**: Send notifications for form submissions
- **Rate Limiting**: Protect against abuse with configurable rate limits
- **Security**: Helmet.js for security headers, CORS configuration
- **Database**: MySQL with connection pooling and migrations

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Security**: Helmet.js, bcryptjs
- **Email**: Nodemailer
- **Rate Limiting**: express-rate-limit

## Prerequisites

- Node.js 18 or higher
- MySQL 8.0 or higher
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=dynamic_forms
   DB_USER=root
   DB_PASSWORD=your_password

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d

   # Email Configuration (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password

   # CORS Configuration
   FRONTEND_URL=http://localhost:5173
   ```

4. **Set up MySQL database:**

   ```bash
   # Create database and run migrations
   npm run migrate
   ```

5. **Start the development server:**

   ```bash
   npm run dev
   ```

   Or for production:

   ```bash
   npm start
   ```

## Database Schema

The application uses the following main tables:

- **users**: User accounts and authentication
- **forms**: Form definitions and metadata
- **form_steps**: Form steps/panels
- **form_fields**: Individual form fields
- **field_options**: Options for select/radio/checkbox fields
- **form_submissions**: Form submission data
- **marketing_settings**: Form branding and social media settings
- **social_media_buttons**: Social media links
- **file_uploads**: File upload metadata

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Forms

- `GET /api/forms` - Get all forms (user's forms or all if admin)
- `GET /api/forms/:id` - Get form by ID
- `GET /api/forms/slug/:slug` - Get form by slug (public access)
- `POST /api/forms` - Create new form
- `PUT /api/forms/:id` - Update form
- `PUT /api/forms/:id/steps` - Update form steps and fields
- `DELETE /api/forms/:id` - Delete form
- `GET /api/forms/:id/submissions` - Get form submissions
- `GET /api/forms/:id/stats` - Get form statistics

### Submissions

- `POST /api/submissions` - Submit form
- `GET /api/submissions` - Get all submissions (admin only)
- `GET /api/submissions/:id` - Get submission by ID
- `GET /api/submissions/user/my-submissions` - Get user's submissions
- `GET /api/submissions/stats/overview` - Get submission statistics
- `DELETE /api/submissions/:id` - Delete submission (admin only)

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Default Admin User

After running migrations, a default admin user is created:

- **Email**: admin@dynamicforms.com
- **Password**: admin123

## Rate Limiting

The API includes rate limiting to prevent abuse:

- **General**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Form Submissions**: 10 requests per minute per IP
- **API Calls**: 200 requests per 15 minutes per IP

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

## Development

### Running Tests

```bash
npm test
```

### Database Migrations

```bash
npm run migrate
```

### Environment Variables

| Variable         | Description           | Default               |
| ---------------- | --------------------- | --------------------- |
| `PORT`           | Server port           | 3001                  |
| `NODE_ENV`       | Environment           | development           |
| `DB_HOST`        | Database host         | localhost             |
| `DB_PORT`        | Database port         | 3306                  |
| `DB_NAME`        | Database name         | dynamic_forms         |
| `DB_USER`        | Database user         | root                  |
| `DB_PASSWORD`    | Database password     | -                     |
| `JWT_SECRET`     | JWT secret key        | -                     |
| `JWT_EXPIRES_IN` | JWT expiration        | 7d                    |
| `FRONTEND_URL`   | Frontend URL for CORS | http://localhost:5173 |

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper database credentials
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx/Apache)
6. Set up monitoring and logging
7. Configure backup strategy for database

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens have expiration times
- Rate limiting prevents abuse
- CORS is configured for specific origins
- Helmet.js provides security headers
- Input validation prevents injection attacks
- SQL queries use parameterized statements

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
