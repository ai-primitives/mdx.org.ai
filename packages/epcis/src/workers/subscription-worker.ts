import { ClickhouseClient } from '../clickhouse';
import type { Subscription, EPCISEvent } from '../types';

async function processScheduledSubscriptions(clickhouse: ClickhouseClient): Promise<void> {
  const subscriptions = await clickhouse.getActiveScheduledSubscriptions();

  for (const subscription of subscriptions) {
    try {
      // Get events since last execution
      const events = await clickhouse.queryEvents({
        GE_recordTime: subscription.lastExecutedAt || subscription.initialRecordTime,
        LT_recordTime: new Date().toISOString()
      });

      if (events.length > 0 || subscription.reportIfEmpty) {
        await deliverWebhook(subscription, events);
      }

      // Update last executed time
      await clickhouse.updateSubscriptionLastExecuted(subscription.id);
    } catch (error) {
      // Update subscription status on error
      await clickhouse.updateSubscriptionStatus(
        subscription.id,
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}

async function deliverWebhook(subscription: Subscription, events: EPCISEvent[]): Promise<void> {
  const response = await fetch(subscription.destination, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(subscription.signatureToken && {
        'X-EPCIS-Signature': subscription.signatureToken
      })
    },
    body: JSON.stringify({
      '@context': 'https://ref.gs1.org/standards/epcis/epcis-context.jsonld',
      type: 'EPCISQueryDocument',
      schemaVersion: '2.0',
      creationDate: new Date().toISOString(),
      epcisBody: {
        queryName: subscription.queryName,
        subscriptionID: subscription.id,
        queryResults: events
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Webhook delivery failed: ${response.statusText}`);
  }
}

export { processScheduledSubscriptions };
