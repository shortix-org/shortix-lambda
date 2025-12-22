import { DynamoDB } from 'aws-sdk';

let _dynamoDb: DynamoDB.DocumentClient;

export const getDynamoDb = () => {
    if (!_dynamoDb) {
        _dynamoDb = new DynamoDB.DocumentClient();
    }
    return _dynamoDb;
};

export const resetDynamoDb = () => {
    _dynamoDb = undefined as any;
};

export const TABLE_NAME = process.env.TABLE_NAME || '';

if (!TABLE_NAME && process.env.NODE_ENV !== 'test') {
    console.warn('TABLE_NAME environment variable is not set');
}
