
import { APIGatewayProxyHandler } from 'aws-lambda';
import { getDynamoDb, TABLE_NAME } from '../shared/dynamo';
import { successResponse, errorResponse } from '../shared/response';

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const userId = event.requestContext.authorizer?.claims?.sub;

        if (!userId) {
            return errorResponse('Unauthorized', 401);
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

        const result = await getDynamoDb().query(params).promise();

        return successResponse(result.Items || []);

    } catch (error) {
        console.error('Error fetching URLs:', error);
        return errorResponse('Internal Server Error');
    }
};
