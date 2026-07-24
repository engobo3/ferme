import axios from "axios";

// In production, use Firebase Functions config:
// firebase functions:config:set pawapay.token="YOUR_TOKEN" pawapay.url="https://api.sandbox.pawapay.cloud"
const PAWAPAY_API_URL = process.env.PAWAPAY_API_URL || "https://api.sandbox.pawapay.cloud";
const PAWAPAY_AUTH_TOKEN = process.env.PAWAPAY_AUTH_TOKEN || "TEST_TOKEN";

export interface PayoutRequest {
    payoutId: string;
    amount: number;
    currency: string;
    recipientPhone: string;
    correspondent?: string;
    country?: string;
}

/**
 * Send a payout via PawaPay mobile money API.
 * Currently mocked for MVP. Uncomment the axios call for production.
 */
export async function sendPayout(request: PayoutRequest): Promise<{ success: boolean; message: string }> {
    try {
        /*
        // Real API Call (uncomment for production)
        const response = await axios.post(`${PAWAPAY_API_URL}/payouts`, {
            payoutId: request.payoutId,
            amount: request.amount,
            currency: request.currency,
            correspondent: request.correspondent || "AIRTEL_MONEY",
            recipient: {
                type: "MSISDN",
                address: request.recipientPhone,
                country: request.country || "COD",
            },
        }, {
            headers: { "Authorization": `Bearer ${PAWAPAY_AUTH_TOKEN}` },
        });
        return { success: true, message: `Payout ${request.payoutId} sent successfully` };
        */

        // Mock Success (replace with real API call in production)
        return { success: true, message: `Mock payout ${request.payoutId} processed` };
    } catch (error) {
        console.error("PawaPay API Failed:", error);
        return { success: false, message: "Payment provider failed" };
    }
}
