"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import RestaurantPicker from "../common/RestaurantPicker";
import { useAuth } from "@/hooks/useAuth";
import { useCreateBranch } from "@/hooks/useBranches";

interface CreateBranchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateBranchModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateBranchModalProps) {
  const [branchName, setBranchName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [country, setCountry] = useState("");
  const [area, setArea] = useState("");
  const [isMain, setIsMain] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [availability, setAvailability] = useState(true);

  const { user, loading } = useAuth();
  const createBranchMutation = useCreateBranch();

  const inputBase =
    "h-[44px] rounded-[10px] px-3 text-sm placeholder:text-gray-400 border-gray-300 focus-visible:ring-1 focus-visible:ring-primary";

  /**
   * ==============================
   * CREATE HANDLER (UPDATED)
   * ==============================
   */
  const handleCreateBranch = async () => {
    try {
      const restaurantId = user?.restaurantId;

      if (!restaurantId) {
        toast.error("User not authenticated");
        return;
      }

      await createBranchMutation.mutateAsync({
        restaurantId,
        name: branchName,
        street,
        city,
        state: stateVal,
        country,
        area,
        lat,
        lng,
        isMain,
        branchAdmin: {
          email: adminEmail,
          password: adminPassword,
          firstName: adminFirstName,
          lastName: adminLastName,
          phone: adminPhone,
        },
      });

      //  Success handled in hook, but keeping UX flow
      onOpenChange(false);
      onSuccess?.();

      /**
       * RESET FORM
       */
      setBranchName("");
      setStreet("");
      setCity("");
      setStateVal("");
      setCountry("");
      setArea("");
      setIsMain(false);
      setAdminEmail("");
      setAdminPassword("");
      setAdminFirstName("");
      setAdminLastName("");
      setAdminPhone("");
      setLat("");
      setLng("");
      setAvailability(true);
    } catch (error: any) {
      //  No duplicate toast (already handled in hook)
      void error;
    }
  };

  return (
    <>
      {/* {!loading && (!user?.restaurantId || !user?.branchId) && (
        <RestaurantPicker />
      )} */}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[480px] rounded-[20px] p-6 bg-[#F5F5F5] max-h-[95vh] overflow-auto">
          {/* Header */}
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-semibold">Create Branch</DialogTitle>
            <p className="text-sm text-gray-500">Create a new branch from here</p>
          </DialogHeader>

          {/* Card */}
          <div className="mt-4 rounded-[16px] bg-white p-5 space-y-4">
            <div className="space-y-1">
              <Label className="text-sm">
                Branch Name <span className="text-primary">*</span>
              </Label>
              <Input
                placeholder="eg. Main Branch"
                className={`${inputBase} border-primary bg-primary/5`}
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Street</Label>
              <Input
                placeholder="Street 12"
                className={inputBase}
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">City</Label>
              <Input
                placeholder="eg. Lahore"
                className={inputBase}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">State</Label>
              <Input
                placeholder="eg. Punjab"
                className={inputBase}
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Country</Label>
              <Input
                placeholder="eg. Pakistan"
                className={inputBase}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Area</Label>
              <Input
                placeholder="eg. DHA Phase 5"
                className={inputBase}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Latitude</Label>
              <Input
                placeholder="eg. 31.5204"
                className={inputBase}
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Longitude</Label>
              <Input
                placeholder="eg. 74.3587"
                className={inputBase}
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Main Branch</Label>
              <Switch
                checked={isMain}
                onCheckedChange={setIsMain}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <hr className="border-gray-200 my-2" />

            <h4 className="text-sm font-medium text-gray-900">Branch Admin Info</h4>

            <Input placeholder="First Name" className={inputBase} value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} />
            <Input placeholder="Last Name" className={inputBase} value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} />
            <Input placeholder="Email" className={inputBase} value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            <Input placeholder="Password" type="password" className={inputBase} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
            <Input placeholder="Phone" className={inputBase} value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />

            <div className="flex items-center justify-between pt-2">
              <Label className="text-sm">Availability</Label>
              <Switch
                checked={availability}
                onCheckedChange={setAvailability}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              className="text-gray-700 text-[17px]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              className="px-8 py-2 rounded-[10px] bg-primary hover:bg-primary/90 text-[17px]"
              onClick={handleCreateBranch}
              disabled={createBranchMutation.isPending}
            >
              {createBranchMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}