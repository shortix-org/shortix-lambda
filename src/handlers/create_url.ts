
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const dynamoDb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        if (!TABLE_NAME) {
            throw new Error('TABLE_NAME environment variable is not set');
        }

        const { body, requestContext } = event;
        const userId = requestContext.authorizer?.claims?.sub;

        if (!userId) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' }),
                headers: { 'Access-Control-Allow-Origin': '*' },
            };
        }

        if (!body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing request body' }),
                headers: { 'Access-Control-Allow-Origin': '*' },
            };
        }

        const { url } = JSON.parse(body);

        if (!url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'URL is required' }),
                headers: { 'Access-Control-Allow-Origin': '*' },
            };
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch (e) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid URL format' }),
                headers: { 'Access-Control-Allow-Origin': '*' },
            };
        }

        const shortCode = uuidv4().substring(0, 8); // Simple short code generation
        const createdAt = new Date().toISOString();

        const item = {
            pk: `URL#${shortCode}`,
            sk: 'INFO',
            gsi1_pk: `USER#${userId}`,
            gsi1_sk: createdAt, // Use gsi1_sk for sorting if needed, or stick to spec created_at
            created_at: createdAt,
            original_url: url,
            short_code: shortCode,
            user_id: userId,
            clicks: 0
        };

        await dynamoDb.put({
            TableName: TABLE_NAME,
            Item: item,
            ConditionExpression: 'attribute_not_exists(pk)'
        }).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({
                short_code: shortCode,
                short_url: `${process.env.API_URL}/${shortCode}`, // API_URL might need to be passed or constructed
                created_at: createdAt
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            } as { [header: string]: string | number | boolean; },
        };

    } catch (error) {
        console.error('Error creating URL:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
            headers: { 'Access-Control-Allow-Origin': '*' },
        };
    }
};
