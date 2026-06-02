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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateTableReservationStatus } from "@/hooks/useTableReservations";
import {
  TABLE_RESERVATION_STATUS_OPTIONS,
  type TableReservation,
  type TableReservationStatusUpdateValue,
} from "@/types/table-reservations";
import {
  tableReservationStatusUpdateSchema,
  type TableReservationStatusUpdateValues,
} from "@/validations/table-reservations";

type TableReservationStatusUpdateDialogProps = {
  open: boolean;
  reservation: TableReservation | null;
  restaurantId?: string;
  branchId?: string;
  onOpenChange: (open: boolean) => void;
};

const isStatusUpdateValue = (
  status: string | undefined
): status is TableReservationStatusUpdateValue => {
  return TABLE_RESERVATION_STATUS_OPTIONS.some((option) => option.value === status);
};

export function TableReservationStatusUpdateDialog({
  open,
  reservation,
  restaurantId,
  branchId,
  onOpenChange,
}: TableReservationStatusUpdateDialogProps) {
  const updateStatusMutation = useUpdateTableReservationStatus();
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<TableReservationStatusUpdateValues>({
    resolver: zodResolver(tableReservationStatusUpdateSchema),
    defaultValues: {
      status: "REQUESTED",
    },
    values: {
      status: isStatusUpdateValue(reservation?.status)
        ? reservation.status
        : "REQUESTED",
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset({ status: "REQUESTED" });
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: TableReservationStatusUpdateValues) => {
    if (!reservation) return;

    const scopedBranchId = reservation.branchId || branchId;

    await updateStatusMutation.mutateAsync({
      reservationId: reservation.id,
      payload: {
        status: values.status,
        ...(restaurantId ? { restaurantId } : {}),
        ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
        ...(reservation.customer?.id ? { customerId: reservation.customer.id } : {}),
      },
    });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[420px] rounded-[20px] p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold">
            Update Reservation Status
          </DialogTitle>
          <DialogDescription>
            Select the current status for this table reservation.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="reservation-status">Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="reservation-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {TABLE_RESERVATION_STATUS_OPTIONS.map((status) => (
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
