export const getNewOrderToastId = (orderId: string) =>
  `new-order:${orderId}`;

export const shouldDismissNewOrderToast = (status?: string) =>
  Boolean(status && status.toUpperCase() !== "PLACED");
