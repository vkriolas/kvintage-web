import { Modules } from '@medusajs/utils';
import { INotificationModuleService, IOrderModuleService } from '@medusajs/types';
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa';
import { OrderDTO, OrderAddressDTO } from '@medusajs/types/dist/order/common';

export default async function deliveryFailedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {

  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION);

  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER);
  const order: OrderDTO = await orderModuleService.retrieveOrder(data.id, { relations: ['shipping_address'] });

  const shippingAddress: OrderAddressDTO = await (orderModuleService as any).orderAddressService_.retrieve(order.shipping_address.id);

  const emailTemplate = `
    <h1>Delivery Attempt Failed</h1>
    <p>Dear ${shippingAddress.first_name} ${shippingAddress.last_name},</p>
    <p>We attempted to deliver your order, but it was unsuccessful. Please contact us to reschedule or provide additional instructions.</p>
    <p><strong>Order ID:</strong> ${(order as any).display_id}</p>
    <p>Sincerely,<br>The Kriolas Vintage Team</p>
  `;

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: emailTemplate, 
      data: { 
        subject: 'Delivery Attempt Failed for Your Order'
      }
    });
  } catch (error) {
    console.error('Error sending delivery failure notification:', error);
  }
}

export const config: SubscriberConfig = {
  event: 'order.delivery_failed'
};
