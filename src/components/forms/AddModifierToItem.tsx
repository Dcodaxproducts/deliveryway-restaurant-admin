"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useHttpClient } from "@/hooks/useHttpClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function AddModifierToItem({
  open,
  onOpenChange,
  item,
}: any) {
  const { token, user } = useAuth();
  const api = useHttpClient(token);

  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) fetchGroups();
  }, [open]);

  const fetchGroups = async () => {
    const res = await api.get(
      `/v1/menu/modifier-groups?restaurantId=${user?.restaurantId}`
    );

    if (!res?.error) {
      setGroups(res.data || []);
    }
  };

  const handleSubmit = async () => {
    if (!selectedGroup) {
      toast.error("Please select a modifier group");
      return;
    }

    setLoading(true);

    const res = await api.post(
      `/v1/menu/items/${item.id}/modifier-groups/${selectedGroup}`,
      {
        sortOrder,
      }
    );

    setLoading(false);

    if (res?.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Modifier group added to item");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-[20px] p-6 bg-[#F5F5F5]">

        {/* HEADER */}
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Add Modifier Group
          </DialogTitle>

          <p className="text-sm text-gray-500">
            Attach modifier group to <b>{item?.name}</b>
          </p>
        </DialogHeader>

        {/* FORM CARD */}
        <div className="mt-5 bg-white rounded-[16px] p-5 space-y-4">

          {/* ITEM INFO */}
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
            <img
              src={item?.imageUrl || "/placeholder.png"}
              className="w-12 h-12 object-cover rounded-lg"
            />
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {item?.name}
              </p>
              <p className="text-xs text-gray-400">
                {item?.category?.name}
              </p>
            </div>
          </div>

          {/* GROUP SELECT */}
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Modifier Group</p>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full h-[40px] rounded-[10px] border border-gray-300 px-3 focus:border-gray-400 outline-none bg-white"
            >
              <option value="">Select Group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* SORT ORDER */}
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Sort Order</p>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full h-[40px] rounded-[10px] border border-gray-300 px-3 focus:border-gray-400 outline-none"
            />
          </div>

          {/* BUTTON */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-[10px] mt-2 py-4 bg-primary"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Adding...
              </span>
            ) : (
              "Add Modifier Group"
            )}
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
}