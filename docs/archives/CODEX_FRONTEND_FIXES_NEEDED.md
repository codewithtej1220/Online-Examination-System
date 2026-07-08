# Codex Frontend Fixes Required

## 🔴 CRITICAL ERROR: User Data Not Loading

### Error in Console:
```
TypeError: Cannot read properties of undefined (reading 'username')
at Pve (index-_C8jWTLt.js:428:117847)
```

### Root Cause:
The frontend is trying to access `user.username` but the user object is `undefined`. This happens because:
1. User data is not being stored properly after login
2. User data is not being loaded when the dashboard component mounts
3. No null/undefined check before accessing user properties

---

## ✅ Required Fixes for Codex/v0.dev

### Fix 1: Store User Data After Login

After successful login, store BOTH the token AND user data:

```typescript
// In your login handler
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

const data = await response.json();

if (data.success) {
  // Store token
  localStorage.setItem('token', data.data.token);
  
  // Store user data ✅ THIS IS CRITICAL
  localStorage.setItem('user', JSON.stringify(data.data.user));
  
  // Navigate to dashboard
  navigate('/dashboard');
}
```

### Fix 2: Load User Data in Dashboard/Layout

In your dashboard component or layout wrapper:

```typescript
import { useState, useEffect } from 'react';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Method 1: Load from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setLoading(false);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        // Redirect to login
        window.location.href = '/login';
      }
    } else {
      // Method 2: Fetch from API
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.data.user);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      } else {
        // Token invalid, redirect to login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      {/* Rest of your dashboard */}
    </div>
  );
}
```

### Fix 3: Add Null Checks Everywhere

Wherever you access user data, add null checks:

```typescript
// ❌ BAD - Will crash if user is undefined
<div>{user.username}</div>

// ✅ GOOD - Safe access
<div>{user?.username || 'Guest'}</div>

// ✅ BETTER - Conditional rendering
{user && <div>Welcome, {user.username}</div>}
```

### Fix 4: Create a User Context (Recommended)

Create a global user context to avoid passing user data everywhere:

```typescript
// UserContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user:', error);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
```

Then wrap your app:

```typescript
// App.tsx
import { UserProvider } from './UserContext';

function App() {
  return (
    <UserProvider>
      {/* Your routes and components */}
    </UserProvider>
  );
}
```

And use it in components:

```typescript
import { useUser } from './UserContext';

function Dashboard() {
  const { user, loading } = useUser();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
    </div>
  );
}
```

---

## 📋 Login Response Structure (For Reference)

When you login successfully at `POST /api/auth/login`, you receive:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 7,
      "username": "testuser999",
      "role": "student"
    }
  },
  "timestamp": "2026-06-15T03:36:04.314Z"
}
```

## 📋 Profile Response Structure

When you fetch profile at `GET /api/auth/profile`:

```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "user_id": 7,
      "username": "testuser999",
      "role": "student",
      "created_at": "2026-06-15T03:32:15.000Z",
      "current_semester": null,
      "major_program": null
    }
  },
  "timestamp": "2026-06-15T03:36:04.314Z"
}
```

---

## 🎯 Quick Fix Instructions for Codex

**Tell Codex:**

> "The dashboard is crashing with `Cannot read properties of undefined (reading 'username')`. 
> 
> After successful login, store both the token AND user data in localStorage:
> ```
> localStorage.setItem('token', data.data.token);
> localStorage.setItem('user', JSON.stringify(data.data.user));
> ```
>
> In the dashboard component, load user data from localStorage on mount:
> ```
> const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
> ```
>
> Add null checks before accessing user properties:
> ```
> {user?.username || 'Guest'}
> ```
>
> If user is null, redirect to login page."

---

## 🔧 Alternative: Backend Workaround (Not Recommended)

If you can't fix the frontend, I can create a modified endpoint that returns user data in a different format, but **fixing the frontend is the proper solution**.

---

## ✅ Testing Checklist

After applying fixes:
- [ ] Login successfully
- [ ] User data stored in localStorage
- [ ] Dashboard loads without errors
- [ ] Username displays correctly
- [ ] Refresh page - user still logged in
- [ ] Logout clears user data
- [ ] Accessing dashboard without login redirects to login page

---

## 🆘 If You Can't Fix Codex Frontend

If Codex can't generate proper code, I can:
1. Create a simple React frontend from scratch
2. Create a vanilla JavaScript version
3. Use the working `test.html` demo page instead

Let me know which approach you prefer!
