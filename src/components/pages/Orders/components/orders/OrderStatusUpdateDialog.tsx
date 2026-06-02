"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { ORDER_STATUS_OPTIONS } from "@/types/orders";
import {
  orderStatusUpdateSchema,
  type OrderStatusUpdateValues,
} from "@/validations/orders";

type OrderStatusUpdateDialogProps = {
  open: boolean;
  order: { id: string; status?: string } | null;
  onOpenChange: (open: boolean) => void;
};

const defaultValues: OrderStatusUpdateValues = {
  status: "",
  deliveryOtp: "",
};

export function OrderStatusUpdateDialog({
  open,
  order,
  onOpenChange,
}: OrderStatusUpdateDialogProps) {
  const updateStatusMutation = useUpdateOrderStatus();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<OrderStatusUpdateValues>({
    resolver: zodResolver(orderStatusUpdateSchema),
    defaultValues,
    values: {
      status: order?.status || "",
      deliveryOtp: "",
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset(defaultValues);
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: OrderStatusUpdateValues) => {
    if (!order) return;

    await updateStatusMutation.mutateAsync({
      orderId: order.id,
      payload: {
        status: values.status,
        ...(values.deliveryOtp?.trim()
          ? { deliveryOtp: values.deliveryOtp.trim() }
          : {}),
      },
    });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[440px] rounded-[20px] p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold">
            Update Order Status
          </DialogTitle>
          <DialogDescription>
            Select the next status for this order.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="order-status">Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="order-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status?.message ? (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-delivery-otp">Delivery OTP</Label>
            <Input
              id="order-delivery-otp"
              placeholder="Optional"
              {...register("deliveryOtp")}
            />
            {errors.deliveryOtp?.message ? (
              <p className="text-sm text-red-500">{errors.deliveryOtp.message}</p>
            ) : null}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
