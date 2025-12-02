# User Roles and Role-Based Access Control

## Overview
The Dental Tutor application uses role-based access control (RBAC) to provide different experiences and permissions based on user roles.

## Available Roles

### 1. **Patient** (Default)
- **Role Value**: `'patient'`
- **Default Role**: Yes - All new registrations default to 'patient'
- **Access**: Full patient portal access
- **Features**:
  - Book and manage appointments
  - View payment history
  - Upload documents and images
  - Request referrals
  - View recommendations
  - Manage prescriptions and insurance
  - Access loyalty program
  - Chat with AI assistant

### 2. **Dentist**
- **Role Value**: `'dentist'`
- **Default Role**: No - Must be set manually
- **Access**: Professional dashboard
- **Features**:
  - View schedule/appointments
  - Access patient records (when authorized)
  - Chat with AI assistant
  - Manage profile

### 3. **Admin**
- **Role Value**: `'admin'`
- **Default Role**: No - Must be set manually
- **Access**: Full administrative access
- **Features**:
  - Manage all appointments
  - Access support center
  - View all patient records
  - System administration

### 4. **Staff**
- **Role Value**: `'staff'`
- **Default Role**: No - Must be set manually
- **Access**: Administrative access (similar to admin)
- **Features**:
  - Manage appointments
  - Access support center
  - View patient records
  - Administrative functions

## Role Hierarchy

```
Admin/Staff > Dentist > Patient
```

- **Admin/Staff**: Highest privileges, can manage everything
- **Dentist**: Professional access, can view schedules and patient data
- **Patient**: Standard user access, can manage own data

## How Roles Are Set

### During Registration
- All new users are automatically assigned the `'patient'` role
- See: `src/app/api/auth/register/route.ts` (line 61)

### Manual Role Assignment
To change a user's role, update the database directly:

```sql
-- Set user as admin
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

-- Set user as dentist
UPDATE users SET role = 'dentist' WHERE email = 'dentist@example.com';

-- Set user as staff
UPDATE users SET role = 'staff' WHERE email = 'staff@example.com';

-- Set user back to patient
UPDATE users SET role = 'patient' WHERE email = 'user@example.com';
```

## Role-Based UI Display

### Page Titles
Titles automatically adjust based on role:

- **Dashboard**:
  - Patient: "Patient Dashboard"
  - Dentist: "Dentist Dashboard"
  - Admin/Staff: "Admin Dashboard"

- **Appointments**:
  - Patient: "My Appointments"
  - Dentist: "My Schedule"
  - Admin/Staff: "Manage Appointments"

- **Home Page**:
  - Patient: "Welcome back, [Name]!"
  - Dentist: "Welcome, Dr. [Name]"
  - Admin/Staff: "Welcome, [Name] (role)"

### Navigation Menu
The header navigation shows different links based on role:
- **Patient**: All patient features visible
- **Dentist**: Schedule and professional features
- **Admin/Staff**: Administrative features

## Database Schema

The `users` table includes:
```sql
role VARCHAR(50) DEFAULT 'patient'
```

- Default value: `'patient'`
- Indexed for performance: `idx_users_role`
- Can be: `'patient'`, `'dentist'`, `'admin'`, `'staff'`

## API Endpoints

### Authentication
- **POST /api/auth/register**: Creates user with `'patient'` role
- **POST /api/auth/login**: Returns user with role
- **GET /api/auth/me**: Returns current user's role

### Role Checking
The `requireRole` middleware can be used to restrict API access:

```typescript
import { requireRole } from '@/lib/middleware/auth';

// Only admins can access
const user = requireRole(req, 'admin');

// Admins or staff can access
const user = requireRole(req, 'admin', 'staff');
```

## Frontend Role Detection

### useAuth Hook
The `useAuth` hook provides role information:

```typescript
const { user, isAuthenticated } = useAuth();
const isAdmin = user?.role === 'admin' || user?.role === 'staff';
const isDentist = user?.role === 'dentist';
const isPatient = user?.role === 'patient' || !user?.role;
```

### Role-Based Rendering
```typescript
{isAdmin && <AdminComponent />}
{isDentist && <DentistComponent />}
{isPatient && <PatientComponent />}
```

## Migration

Run the migration to ensure role column exists:

```bash
npm run db:migrate
```

This will:
1. Add `role` column if it doesn't exist
2. Set default to `'patient'` for existing users
3. Create index for performance

## Security Notes

1. **Role Assignment**: Currently, roles must be set manually in the database. Consider adding an admin interface for role management.

2. **Role Validation**: The role is stored in the JWT token**, so changes require re-login.

3. **API Protection**: Use `requireRole` middleware to protect admin endpoints.

4. **Frontend Validation**: Frontend role checks are for UX only. Always validate roles on the backend.

## Future Enhancements

- Admin interface for role management
- Role-based permissions system
- Multi-role support (user can have multiple roles)
- Role change audit log

