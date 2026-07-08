/**
 * Unit Tests for ApiResponse Utility
 */

const ApiResponse = require('../../../utils/ApiResponse');

describe('ApiResponse Utility', () => {
    let mockRes;

    beforeEach(() => {
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe('success', () => {
        it('should send success response with default values', () => {
            ApiResponse.success(mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Success',
                    data: null,
                    timestamp: expect.any(String)
                })
            );
        });

        it('should send success response with custom data', () => {
            const data = { user_id: 1, username: 'test' };
            ApiResponse.success(mockRes, data, 'User created', 201);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'User created',
                    data
                })
            );
        });
    });

    describe('error', () => {
        it('should send error response', () => {
            ApiResponse.error(mockRes, 'Something went wrong', 500);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Something went wrong',
                    timestamp: expect.any(String)
                })
            );
        });
    });

    describe('unauthorized', () => {
        it('should send 401 unauthorized response', () => {
            ApiResponse.unauthorized(mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Unauthorized access'
                })
            );
        });
    });

    describe('notFound', () => {
        it('should send 404 not found response', () => {
            ApiResponse.notFound(mockRes, 'Resource not found');

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Resource not found'
                })
            );
        });
    });

    describe('validationError', () => {
        it('should send validation error response', () => {
            const errors = [
                { field: 'username', message: 'Username is required' },
                { field: 'password', message: 'Password is too short' }
            ];

            ApiResponse.validationError(mockRes, errors);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Validation failed',
                    errors
                })
            );
        });
    });
});
