import { Handler } from 'aws-lambda';
import * as https from 'https';
import { UrlStatus } from '../shared/enums';

interface LivenessEvent {
    pk: string;
    sk: string;
    original_url: string;
}

interface LivenessResult {
    pk: string;
    sk: string;
    status: UrlStatus.ACTIVE | UrlStatus.INACTIVE;
}

export const handler: Handler<LivenessEvent, LivenessResult> = async (event) => {
    const { pk, sk, original_url } = event;
    console.log(`Checking liveness for: ${original_url}`);

    try {
        await checkUrl(original_url);
        console.log('URL is live');
        return { pk, sk, status: UrlStatus.ACTIVE };
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
        const err = error as any;
        if (err.code === 'ENOTFOUND' || err.statusCode === 404 || err.statusCode === 410) {
            return { pk, sk, status: UrlStatus.INACTIVE };
        }

        // Protected resources (401/403) are technically "Alive"
        if (err.statusCode === 401 || err.statusCode === 403) {
            console.log(`URL is protected (${err.statusCode}), marking as ACTIVE`);
            return { pk, sk, status: UrlStatus.ACTIVE };
        }

        throw error; // Let SF retry for 5xx or timeouts
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
