export const buildAutoOpenOrderPath = (orderId: string) =>
  `/orders/details/${orderId}?acceptOrder=1`;

export const shouldSilenceOrderAlertOnDetailsOpen = (
  acceptOrder: string | null,
) => acceptOrder !== "1";
