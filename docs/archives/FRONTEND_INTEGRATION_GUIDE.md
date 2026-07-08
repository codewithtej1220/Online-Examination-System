# Frontend Integration Guide for Codex/v0.dev

## ✅ VALIDATION FIX APPLIED

The backend validation has been updated to accept:
- Missing optional fields
- Empty strings (`""`) for optional fields
- `null` values for optional fields

## API Base URL
```
http://localhost:5000
```

## Authentication Endpoints

### 1. Register User
**Endpoint:** `POST /api/auth/register`

**Required Fields:**
- `username` (string, 3-50 chars, alphanumeric + underscore)
- `password` (string, min 8 chars, must contain uppercase, lowercase, and number)
- `role` (string, one of: "student", "faculty", "admin")

**Optional Fields (all roles):**
- `current_semester` (integer, 1-12) - for students only
- `major_program` (string, max 100 chars) - for students only
- `department` (string, max 100 chars) - for faculty only
- `email` (valid email) - for admin only

**Valid Request Examples:**

```json
// Student with NO optional fields (✅ This works now!)
{
  "username": "john_doe",
  "password": "SecurePass123",
  "role": "student"
}

// Student with empty strings (✅ This works now!)
{
  "username": "john_doe",
  "password": "SecurePass123",
  "role": "student",
  "current_semester": "",
  "major_program": ""
}

// Student with actual values
{
  "username": "john_doe",
  "password": "SecurePass123",
  "role": "student",
  "current_semester": 3,
  "major_program": "Computer Science"
}

// Faculty without department
{
  "username": "prof_smith",
  "password": "SecurePass123",
  "role": "faculty"
}

// Faculty with department
{
  "username": "prof_smith",
  "password": "SecurePass123",
  "role": "faculty",
  "department": "Computer Science"
}

// Admin without email
{
  "username": "admin_user",
  "password": "SecurePass123",
  "role": "admin"
}

// Admin with email
{
  "username": "admin_user",
  "password": "SecurePass123",
  "role": "admin",
  "email": "admin@university.edu"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": 1,
    "username": "john_doe",
    "role": "student"
  },
  "timestamp": "2026-06-15T03:31:20.000Z"
}
```

**Error Response (400 - Validation Failed):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "value": "weak"
    }
  ],
  "timestamp": "2026-06-15T03:31:20.000Z"
}
```

**Error Response (409 - User Exists):**
```json
{
  "success": false,
  "message": "Username already exists",
  "timestamp": "2026-06-15T03:31:20.000Z"
}
```

### 2. Login User
**Endpoint:** `POST /api/auth/login`

**Required Fields:**
- `username` (string)
- `password` (string)

**Request Example:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "username": "john_doe",
      "role": "student"
    }
  },
  "timestamp": "2026-06-15T03:31:26.000Z"
}
```

**Error Response (401 - Invalid Credentials):**
```json
{
  "success": false,
  "message": "Invalid username or password",
  "timestamp": "2026-06-15T03:31:26.000Z"
}
```

### 3. Get User Profile
**Endpoint:** `GET /api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "user_id": 1,
      "username": "john_doe",
      "role": "student",
      "created_at": "2026-06-15T03:31:20.000Z",
      "current_semester": 3,
      "major_program": "Computer Science"
    }
  },
  "timestamp": "2026-06-15T03:32:00.000Z"
}
```

## Password Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

**Valid Examples:**
- `SecurePass123`
- `MyPassword1`
- `TestUser99`

**Invalid Examples:**
- `password` (no uppercase or number)
- `PASSWORD123` (no lowercase)
- `Password` (no number)
- `Pass1` (too short)

## Username Requirements
- 3-50 characters
- Only letters, numbers, and underscores
- Valid: `john_doe`, `user123`, `test_user_99`
- Invalid: `jo` (too short), `user@123` (special chars), `user-name` (hyphen)

## Token Management
- Store the JWT token received on login
- Include it in the `Authorization` header for protected endpoints: `Bearer <token>`
- Token expires in 24 hours
- On token expiration, user must login again

## Rate Limits
- Registration: 50 attempts per 15 minutes per IP
- Login: 50 attempts per 15 minutes per IP

## Testing the Fix

The validation issue has been fixed! You can now:

1. Register students WITHOUT sending `current_semester` or `major_program`
2. Register students WITH empty strings for those fields
3. Register faculty WITHOUT sending `department`
4. Register admin WITHOUT sending `email`

All of these will work correctly now.

## Frontend Implementation Checklist

✅ Use the exact field names as documented above
✅ Don't send optional fields if you don't have values (preferred)
✅ Or send empty strings for optional fields (also works now)
✅ Validate password requirements on frontend before submission
✅ Store JWT token securely (localStorage or sessionStorage)
✅ Include Authorization header for protected routes
✅ Handle 401 errors by redirecting to login
✅ Show user-friendly validation error messages

## Test Accounts Available

See `TEST_CREDENTIALS.txt` for pre-created test accounts.

## Need Help?
If you encounter any issues, check the browser console for detailed error messages and verify the request format matches the examples above.
