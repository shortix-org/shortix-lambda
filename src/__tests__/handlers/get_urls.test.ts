import AWSMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import { handler } from '../../handlers/get_urls';
import { resetDynamoDb } from '../../shared/dynamo';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

process.env.TABLE_NAME = 'TestTable';
process.env.AWS_REGION = 'us-east-1';
process.env.NODE_ENV = 'test';

describe('get_urls handler', () => {
    beforeEach(() => {
        resetDynamoDb();
        AWSMock.setSDKInstance(AWS);
    });

    afterEach(() => {
        AWSMock.restore();
    });

    test('should return list of URLs for a user', async () => {
        const mockItems = [
            { pk: 'URL#1', original_url: 'https://a.com' },
            { pk: 'URL#2', original_url: 'https://b.com' }
        ];

        AWSMock.mock('DynamoDB.DocumentClient', 'query', (params: any, callback: Function) => {
            callback(null, { Items: mockItems });
        });

        const event = {
            requestContext: {
                authorizer: {
                    claims: { sub: 'user-123' }
                }
            }
        } as unknown as APIGatewayProxyEvent;

        const result = await handler(event, {} as Context, () => { });

        if (!result) throw new Error('Result is undefined');
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual(mockItems);
    });
});
