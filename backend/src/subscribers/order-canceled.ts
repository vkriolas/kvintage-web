import { Modules } from '@medusajs/utils';
import { INotificationModuleService, IOrderModuleService } from '@medusajs/types';
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa';

export default async function orderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {

  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION);

  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER);
  const order = await orderModuleService.retrieveOrder(data.id, { relations: [] });

  const emailTemplate = `
    <h1>Order Canceled</h1>
    <p>Dear ${order.shipping_address.first_name} ${order.shipping_address.last_name},</p>
    <p>Your order has been canceled. If you have any questions, please feel free to reach out to our support team.</p>
    <p><strong>Order ID:</strong> ${(order as any).display_id}</p>
    <p>Sincerely,<br>The Kriolas Vintage Team</p>
  `;

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: emailTemplate, 
      data: { 
        subject: 'Your Order Has Been Canceled'
      }
    });
  } catch (error) {
    console.error('Error sending order cancellation notification:', error);
  }
}

export const config: SubscriberConfig = {
  event: 'order.canceled'
};
