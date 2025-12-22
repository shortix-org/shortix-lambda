
import { APIGatewayProxyHandler } from 'aws-lambda';
import { getDynamoDb, TABLE_NAME } from '../shared/dynamo';
import { errorResponse } from '../shared/response';

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const { pathParameters } = event;
        const shortCode = pathParameters?.short_code;

        if (!shortCode) {
            return errorResponse('Short code is required', 400);
        }

        const params = {
            TableName: TABLE_NAME,
            Key: {
                pk: `URL#${shortCode}`,
                sk: 'INFO',
            },
        };

        const result = await getDynamoDb().get(params).promise();

        if (!result.Item || !result.Item.original_url) {
            return errorResponse('URL not found', 404);
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
        return errorResponse('Internal Server Error');
    }
};
