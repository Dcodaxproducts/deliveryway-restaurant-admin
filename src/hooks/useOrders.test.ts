import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateOrderStatus } from "@/hooks/useOrders";

const mocks = vi.hoisted(() => ({
  mutationOptions: undefined as
    | {
        onSuccess?: (
          order: { id: string; branchId?: string },
          variables: {
            orderId: string;
            payload: { status: string };
          },
        ) => void;
      }
    | undefined,
  printAccepted: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: typeof mocks.mutationOptions) => {
    mocks.mutationOptions = options;
    return options;
  },
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    restaurantId: "restaurant-1",
    branchId: "branch-1",
    isBranchAdmin: false,
    isPosPrinter: true,
  }),
}));

vi.mock("@/lib/accepted-order-printing", () => ({
  printAcceptedOrderIfConfigured: mocks.printAccepted,
}));

vi.mock("@/services/orders/orders.api", () => ({
  downloadOrderInvoicePdf: vi.fn(),
  failPaymentTransaction: vi.fn(),
  getOrderById: vi.fn(),
  getOrders: vi.fn(),
  markPaymentTransactionPaid: vi.fn(),
  refundPaymentTransaction: vi.fn(),
  sendOrderInvoiceEmail: vi.fn(),
  updateOrderStatus: vi.fn(),
  updatePaymentTransactionStatus: vi.fn(),
}));

describe("useUpdateOrderStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutationOptions = undefined;
    mocks.printAccepted.mockResolvedValue("printed");
  });

  it("prints a CONFIRMED order accepted by a POS printer session", async () => {
    useUpdateOrderStatus();

    mocks.mutationOptions?.onSuccess?.(
      { id: "order-1", branchId: "branch-1" },
      { orderId: "order-1", payload: { status: "CONFIRMED" } },
    );
    await Promise.resolve();

    expect(mocks.printAccepted).toHaveBeenCalledWith({
      orderId: "order-1",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    });
  });
});
