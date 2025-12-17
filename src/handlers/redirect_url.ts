
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        if (!TABLE_NAME) {
            throw new Error('TABLE_NAME environment variable is not set');
        }

        const { pathParameters } = event;
        const shortCode = pathParameters?.short_code;

        if (!shortCode) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Short code is required' }),
                headers: { 'Access-Control-Allow-Origin': '*' },
            };
        }

        const params = {
            TableName: TABLE_NAME,
            Key: {
                pk: `URL#${shortCode}`,
                sk: 'INFO',
            },
        };

        const result = await dynamoDb.get(params).promise();

        if (!result.Item || !result.Item.original_url) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'URL not found' }),
                headers: { 'Access-Control-Allow-Origin': '*' },
            };
        }

        // Optional: Increment click count async (fire and forget or use stream)
        // For now we just redirect.

        return {
            statusCode: 301,
            headers: {
                'Location': result.Item.original_url,
                'Access-Control-Allow-Origin': '*',
            } as { [header: string]: string | number | boolean; },
            body: '',
        };

    } catch (error) {
        console.error('Error redirecting:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
            headers: { 'Access-Control-Allow-Origin': '*' },
        };
    }
};
