// Expand orders with multiple line items into separate order records
function expandOrdersByLineItems(orders) {
  const expandedOrders = [];
  orders.forEach(order => {
    if (order.lineItems && order.lineItems.length > 1) {
      // Create a separate order for each line item
      order.lineItems.forEach((lineItem, index) => {
        expandedOrders.push({
          ...order,
          id: `${order.id}-${index}`, // Make unique ID for each line item
          orderNumber: `${order.orderNumber}-${index}`, // Make unique ID for each line item
          lineItems: [lineItem], // Single line item per order
          // Update totals to reflect only this line item
          subtotal: lineItem.unitPricePaid,
          // grandTotal: lineItem.unitPricePaid,
          _originalOrderId: order.id,
          _lineItemIndex: index
        });
      });
    } else {
      // Single line item, keep as is
      expandedOrders.push(order);
    }
  });
  return expandedOrders;
}

module.exports = { expandOrdersByLineItems };
