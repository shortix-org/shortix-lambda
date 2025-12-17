
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        if (!TABLE_NAME) {
            throw new Error('TABLE_NAME environment variable is not set');
        }

        const userId = event.requestContext.authorizer?.claims?.sub;

        if (!userId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' }),
                headers: { 'Access-Control-Allow-Origin': '*' },
            };
        }

        const params = {
            TableName: TABLE_NAME,
            IndexName: 'UserUrlsIndex',
            KeyConditionExpression: 'gsi1_pk = :userId',
            ExpressionAttributeValues: {
                ':userId': `USER#${userId}`,
            },
            ScanIndexForward: false, // Sort by created_at descending (latest first)
        };

        const result = await dynamoDb.query(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify(result.Items || []),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            } as { [header: string]: string | number | boolean; },
        };

    } catch (error) {
        console.error('Error fetching URLs:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
            headers: { 'Access-Control-Allow-Origin': '*' } as { [header: string]: string | number | boolean; },
        };
    }
};
