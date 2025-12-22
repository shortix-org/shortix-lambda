import { createResponse, successResponse, errorResponse } from '../../shared/response';

describe('response utility', () => {
    test('createResponse should return formatted APIGatewayProxyResult', () => {
        const result = createResponse(200, { foo: 'bar' });
        expect(result.statusCode).toBe(200);
        expect(result.body).toBe(JSON.stringify({ foo: 'bar' }));
        expect(result.headers).toEqual({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        });
    });

    test('successResponse should return 200 by default', () => {
        const result = successResponse({ ok: true });
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual({ ok: true });
    });

    test('errorResponse should return 500 by default', () => {
        const result = errorResponse('something went wrong');
        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body)).toEqual({ message: 'something went wrong' });
    });
});
