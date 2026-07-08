/**
 * Integration Tests for Authentication API
 */

const request = require('supertest');
const app = require('../../server');

describe('Authentication API', () => {
    // Generate unique usernames for each test run
    const timestamp = Date.now();
    const testUsername = `testuser_${timestamp}`;
    const testPassword = 'TestPassword123!';

    describe('POST /api/auth/register', () => {
        it('should register a new student successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: testUsername,
                    password: testPassword,
                    role: 'student',
                    current_semester: 3,
                    major_program: 'Computer Science'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('user_id');
            expect(response.body.data.username).toBe(testUsername);
            expect(response.body.data.role).toBe('student');
        });

        it('should register a faculty member', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: `faculty_${timestamp}`,
                    password: testPassword,
                    role: 'faculty',
                    department: 'Computer Science'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.role).toBe('faculty');
        });

        it('should reject registration with weak password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: `weakpass_${timestamp}`,
                    password: 'weak',
                    role: 'student'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should reject registration with short username', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'ab',
                    password: testPassword,
                    role: 'student'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should reject registration with invalid role', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: `invalid_${timestamp}`,
                    password: testPassword,
                    role: 'superadmin'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should prevent duplicate username registration', async () => {
            // Try to register with same username again
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: testUsername,
                    password: testPassword,
                    role: 'student'
                });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: testUsername,
                    password: testPassword
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user.username).toBe(testUsername);
        });

        it('should reject login with incorrect password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: testUsername,
                    password: 'WrongPassword123!'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid');
        });

        it('should reject login with non-existent username', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'nonexistent_user_xyz',
                    password: testPassword
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should reject login with missing credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/profile', () => {
        let authToken;

        beforeAll(async () => {
            // Login to get token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: testUsername,
                    password: testPassword
                });

            authToken = loginResponse.body.data.token;
        });

        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toHaveProperty('username');
            expect(response.body.data.user).toHaveProperty('role');
        });

        it('should reject profile request without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should reject profile request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid_token_xyz');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/health', () => {
        it('should return healthy status', async () => {
            const response = await request(app)
                .get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('healthy');
        });
    });
});
