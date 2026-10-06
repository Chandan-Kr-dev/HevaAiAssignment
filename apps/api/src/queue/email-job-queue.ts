// Outbound port for order-confirmation emails. The BullMQ implementation
// arrives later; callers depend only on this token so the swap is seamless.
export abstract class EmailJobQueue {
  abstract enqueueOrderConfirmation(orderId: string): Promise<void>;
}
