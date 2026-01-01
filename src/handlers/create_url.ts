import { APIGatewayProxyHandler } from 'aws-lambda';
import { nanoid } from 'nanoid';
import { StepFunctions } from 'aws-sdk';
import { getDynamoDb, TABLE_NAME } from '../shared/dynamo';
import { successResponse, errorResponse } from '../shared/response';
import { UrlStatus } from '../shared/enums';



const stepFunctions = new StepFunctions();
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN || '';

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const { body, requestContext } = event;
        const userId = requestContext.authorizer?.claims?.sub;

        if (!userId) {
            return errorResponse('Unauthorized', 401);
        }

        if (!body) {
            return errorResponse('Missing request body', 400);
        }

        const { url } = JSON.parse(body);

        if (!url) {
            return errorResponse('URL is required', 400);
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch (e) {
            return errorResponse('Invalid URL format', 400);
        }

        const shortCode = nanoid(8);
        const createdAt = new Date().toISOString();

        const item = {
            pk: `URL#${shortCode}`,
            sk: 'INFO',
            gsi1_pk: `USER#${userId}`,
            gsi1_sk: createdAt,
            created_at: createdAt,
            original_url: url,
            short_code: shortCode,
            user_id: userId,
            clicks: 0,
            status: UrlStatus.PENDING
        };

        await getDynamoDb().put({
            TableName: TABLE_NAME,
            Item: item,
            ConditionExpression: 'attribute_not_exists(pk)'
        }).promise();

        // Trigger Step Function Verification
        if (STATE_MACHINE_ARN) {
            try {
                await stepFunctions.startExecution({
                    stateMachineArn: STATE_MACHINE_ARN,
                    input: JSON.stringify(item),
                    name: `verify-${shortCode}` // Ensure uniqueness
                }).promise();
            } catch (sfError) {
                console.error('Failed to trigger verification workflow:', sfError);
                // Continue, don't fail the request. Status remains PROCESSING.
            }
        }

        return successResponse({
            short_code: shortCode,
            short_url: `${process.env.API_URL}/${shortCode}`,
            created_at: createdAt
        }, 201);

    } catch (error) {
        console.error('Error creating URL:', error);
        return errorResponse('Internal Server Error');
    }
};
