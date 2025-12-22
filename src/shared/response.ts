import { APIGatewayProxyResult } from 'aws-lambda';

export const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
    return {
        statusCode,
        body: JSON.stringify(body),
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        },
    };
};

export const successResponse = (body: any, statusCode = 200) => createResponse(statusCode, body);

export const errorResponse = (message: string, statusCode = 500) => createResponse(statusCode, { message });
