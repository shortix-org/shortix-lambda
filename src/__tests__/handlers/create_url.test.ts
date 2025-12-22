import AWSMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import { handler } from '../../handlers/create_url';
import { getDynamoDb, resetDynamoDb } from '../../shared/dynamo';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Must be set before importing handlers if they use it at module level
// But our handler uses it from'../shared/dynamo' which is evaluated on import
process.env.TABLE_NAME = 'TestTable';
process.env.AWS_REGION = 'us-east-1';
process.env.NODE_ENV = 'test';

describe('create_url handler', () => {
    beforeEach(() => {
        resetDynamoDb();
        AWSMock.setSDKInstance(AWS);
    });

    afterEach(() => {
        AWSMock.restore();
    });

    test('should create a short URL successfully', async () => {
        AWSMock.mock('DynamoDB.DocumentClient', 'put', (params: any, callback: Function) => {
            callback(null, {});
        });

        const event = {
            requestContext: {
                authorizer: {
                    claims: { sub: 'user-123' }
                }
            },
            body: JSON.stringify({ url: 'https://example.com' })
        } as unknown as APIGatewayProxyEvent;

        const result = await handler(event, {} as Context, () => { });

        if (!result) throw new Error('Result is undefined');

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.body);
        expect(body.short_code).toBeDefined();
        expect(body.short_code.length).toBe(8);
    });

    test('should return 401 if unauthorized', async () => {
        const event = {
            requestContext: {
                authorizer: {}
            },
            body: JSON.stringify({ url: 'https://example.com' })
        } as unknown as APIGatewayProxyEvent;

        const result = await handler(event, {} as Context, () => { });

        if (!result) throw new Error('Result is undefined');
        expect(result.statusCode).toBe(401);
    });

    test('should return 400 if URL is invalid', async () => {
        const event = {
            requestContext: {
                authorizer: {
                    claims: { sub: 'user-123' }
                }
            },
            body: JSON.stringify({ url: 'not-a-url' })
        } as unknown as APIGatewayProxyEvent;

        const result = await handler(event, {} as Context, () => { });

        if (!result) throw new Error('Result is undefined');
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toBe('Invalid URL format');
    });
});
