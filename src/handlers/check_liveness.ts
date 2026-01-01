import { Handler } from 'aws-lambda';
import * as https from 'https';
import { UrlStatus } from '../shared/enums';

interface LivenessEvent {
    pk: string;
    sk: string;
    original_url: string;
}

interface LivenessResult {
    status: UrlStatus.ACTIVE | UrlStatus.INACTIVE;
}

export const handler: Handler<LivenessEvent, LivenessResult> = async (event) => {
    const { original_url } = event;
    console.log(`Checking liveness for: ${original_url}`);

    try {
        await checkUrl(original_url);
        console.log('URL is live');
        return { status: UrlStatus.ACTIVE };
    } catch (error) {
        console.log('URL check failed:', error);
        // Throw error to trigger Step Functions Retry if it's a transient error?
        // But for 404, we should return INACTIVE.
        // Step Functions Retry is good for 500s or timeouts.
        // Here we will treat reachable as ACTIVE, unreachable as INACTIVE (after retries handled by SF or code).
        // If we throw, SF will retry. If we return INACTIVE, SF continues.
        // Let's rely on SF Retry for Network errors.
        // But if we return status, the SF task succeeds.

        // Simplification: If error is 404, return INACTIVE. If network error, throw to let SF retry.
        if ((error as any).code === 'ENOTFOUND' || (error as any).statusCode === 404) {
            return { status: UrlStatus.INACTIVE };
        }
        throw error; // Let SF retry
    }
};

const checkUrl = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
                resolve();
            } else {
                const err = new Error(`Status code: ${res.statusCode}`);
                (err as any).statusCode = res.statusCode;
                reject(err);
            }
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
};
