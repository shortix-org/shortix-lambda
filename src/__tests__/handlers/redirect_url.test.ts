import AWSMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import { handler } from '../../handlers/redirect_url';
import { resetDynamoDb } from '../../shared/dynamo';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

process.env.TABLE_NAME = 'TestTable';
process.env.AWS_REGION = 'us-east-1';
process.env.NODE_ENV = 'test';

describe('redirect_url handler', () => {
    beforeEach(() => {
        resetDynamoDb();
        AWSMock.setSDKInstance(AWS);
    });

    afterEach(() => {
        AWSMock.restore();
    });

    test('should redirect if URL found', async () => {
        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params: any, callback: Function) => {
            callback(null, { Item: { original_url: 'https://google.com' } });
        });

        const event = {
            pathParameters: { short_code: 'abc' }
        } as unknown as APIGatewayProxyEvent;

        const result = await handler(event, {} as Context, () => { });

        if (!result) throw new Error('Result is undefined');
        expect(result.statusCode).toBe(301);
        expect(result.headers?.Location).toBe('https://google.com');
    });

    test('should return 404 if URL not found', async () => {
        AWSMock.mock('DynamoDB.DocumentClient', 'get', (params: any, callback: Function) => {
            callback(null, {});
        });

        const event = {
            pathParameters: { short_code: 'notfound' }
        } as unknown as APIGatewayProxyEvent;

        const result = await handler(event, {} as Context, () => { });

        if (!result) throw new Error('Result is undefined');
        expect(result.statusCode).toBe(404);
    });
});
