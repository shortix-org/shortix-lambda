import { Handler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { UrlStatus, MalwareScanResult } from '../shared/enums';

const dynamodb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || '';

interface UpdateStatusEvent {
    pk: string;
    sk: string;
    livenessResult?: UrlStatus.ACTIVE | UrlStatus.INACTIVE;
    malwareResult?: MalwareScanResult;
    manualStatus?: UrlStatus;
}

export const handler: Handler<UpdateStatusEvent, void> = async (event) => {
    const { pk, sk, livenessResult, malwareResult, manualStatus } = event;
    console.log(`Updating status for ${pk}. Manual: ${manualStatus}, Liveness: ${livenessResult}, Malware: ${malwareResult}`);

    let finalStatus = UrlStatus.ACTIVE;

    if (manualStatus) {
        finalStatus = manualStatus;
    } else {
        if (malwareResult === MalwareScanResult.MALWARE) {
            finalStatus = UrlStatus.BANNED;
        } else if (livenessResult === UrlStatus.INACTIVE) {
            finalStatus = UrlStatus.INACTIVE;
        }
    }

    const params = {
        TableName: TABLE_NAME,
        Key: { pk, sk },
        UpdateExpression: 'set #status = :status',
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':status': finalStatus,
        },
    };

    try {
        await dynamodb.update(params).promise();
        console.log(`Status updated to ${finalStatus}`);
    } catch (error) {
        console.error('Failed to update status:', error);
        throw error;
    }
};
