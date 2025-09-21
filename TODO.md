# SubUser Component Implementation

## Plan Summary:
Create a SubUser component where sub-users can only view all users and download their resumes.

## Steps to Complete:

### 1. Create SubUserPage.jsx Component
- [ ] Create new SubUserPage.jsx component based on SubAdminPage structure
- [ ] Remove add/edit functionality (read-only access)
- [ ] Add download resume functionality using backend endpoint
- [ ] Keep search, filter, and pagination functionality

### 2. Update App.jsx
- [ ] Add new route for `/sub-user` path
- [ ] Protect route with `requiredRoles={['sub-user']}`

### 3. Update AuthProvider.jsx
- [ ] Add handling for 'sub-user' role in role-based routing
- [ ] Navigate to `/sub-user` when role is 'sub-user'

### 4. Test Implementation
- [ ] Verify component renders correctly
- [ ] Test download functionality
- [ ] Check role-based access control
