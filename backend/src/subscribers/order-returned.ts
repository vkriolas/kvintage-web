import { Modules } from '@medusajs/utils';
import { INotificationModuleService, IOrderModuleService } from '@medusajs/types';
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa';
import { OrderDTO, OrderAddressDTO } from '@medusajs/types/dist/order/common';

export default async function orderReturnedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {

  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION);

  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER);
  const order: OrderDTO = await orderModuleService.retrieveOrder(data.id, { relations: ['items', 'summary', 'shipping_address'] });

  const shippingAddress: OrderAddressDTO = await (orderModuleService as any).orderAddressService_.retrieve(order.shipping_address.id);

  const emailTemplate = `
    <h1>Your Order Has Been Returned</h1>
    <p>Dear ${shippingAddress.first_name} ${shippingAddress.last_name},</p>
    <p>Your order has been successfully returned. Below are the details of the returned order:</p>

    <h2>Order Summary</h2>
    <p><strong>Order ID:</strong> ${(order as any).display_id}</p>
    <p><strong>Order Date:</strong> ${order.created_at}</p>
    <p><strong>Total Refunded:</strong> ${(order as any).summary.raw_current_order_total.value} ${order.currency_code}</p>

    <h2>Shipping Address</h2>
    <p><strong>Name:</strong> ${shippingAddress.first_name} ${shippingAddress.last_name}</p>
    <p><strong>Address:</strong> ${shippingAddress.address_1}</p>
    <p><strong>City:</strong> ${shippingAddress.city}, ${shippingAddress.province} ${shippingAddress.postal_code}</p>
    <p><strong>Country:</strong> ${shippingAddress.country_code}</p>

    <h2>Returned Items</h2>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `<tr>
            <td>${item.title} - ${item.product_title}</td>
            <td>${item.quantity}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    
    <p>If you have any questions, please feel free to contact us.<br>The Kriolas Vintage Team</p>
  `;

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: emailTemplate, 
      data: { 
        subject: 'Your order has been returned'
      }
    });
  } catch (error) {
    console.error('Error sending return notification:', error);
  }
}

export const config: SubscriberConfig = {
  event: 'order.returned'
};
