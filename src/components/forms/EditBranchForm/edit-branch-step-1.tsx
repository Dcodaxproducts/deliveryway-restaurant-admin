"use client";

import { Label } from "@/components/ui/label";
import Section from "../Promotions/Section";
import FormInput from "@/components/register/form/FormInput";
import { Switch } from "@/components/ui/switch";

export default function EditBranchStepOne({ data, setData }: any) {
  if (!data) return null;

  const update = (path: string[], value: any) => {
    const newData = { ...data };
    let obj = newData;

    for (let i = 0; i < path.length - 1; i++) {
      obj[path[i]] = obj[path[i]] || {};
      obj = obj[path[i]];
    }

    obj[path[path.length - 1]] = value;
    setData(newData);
  };

  return (
    <div className="rounded-[14px] space-y-8">

      {/* ================= BASIC INFO ================= */}
      <Section label="Add branch Info">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Branch Name *"
            value={data.name || ""}
            onChange={(val) => update(["name"], val)}
          />

          <FormInput
            label="Description"
            value={data.description || ""}
            onChange={(val) => update(["description"], val)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Street"
            value={data.address?.street || ""}
            onChange={(val) => update(["address", "street"], val)}
          />

          <FormInput
            label="Area"
            value={data.address?.area || ""}
            onChange={(val) => update(["address", "area"], val)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="City"
            value={data.address?.city || ""}
            onChange={(val) => update(["address", "city"], val)}
          />

          <FormInput
            label="State"
            value={data.address?.state || ""}
            onChange={(val) => update(["address", "state"], val)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Country"
            value={data.address?.country || ""}
            onChange={(val) => update(["address", "country"], val)}
          />

          <div /> {/* spacing */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Latitude"
            value={data.address?.lat || ""}
            onChange={(val) => update(["address", "lat"], val)}
          />

          <FormInput
            label="Longitude"
            value={data.address?.lng || ""}
            onChange={(val) => update(["address", "lng"], val)}
          />
        </div>
      </Section>

      {/* ================= COVER IMAGE ================= */}
      {/* <Section label="Add Branch Logo">
        <div className="flex flex-col items-center text-center space-y-[12px]">
          <Label>Branch Cover Image</Label>

          <div className="w-[180px] rounded-[12px] overflow-hidden border">
            <img
              src={data.coverImage || "/branch_logo.jpg"}
              alt="Branch Logo"
              className="w-full h-[180px] object-cover"
            />
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e: any) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onloadend = () => {
                update(["coverImage"], reader.result); // base64 for now
              };
              reader.readAsDataURL(file);
            }}
          />

          <p className="text-sm text-gray-500 max-w-[420px]">
            Upload a new image to update your branch cover
          </p>
        </div>
      </Section> */}

      {/* ================= ADMIN ================= */}
      {/* <Section label="Branch Admin">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="First Name"
            value={data.branchAdmin?.firstName || ""}
            onChange={(val) =>
              update(["branchAdmin", "firstName"], val)
            }
          />

          <FormInput
            label="Last Name"
            value={data.branchAdmin?.lastName || ""}
            onChange={(val) =>
              update(["branchAdmin", "lastName"], val)
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Email"
            value={data.branchAdmin?.email || ""}
            onChange={(val) =>
              update(["branchAdmin", "email"], val)
            }
          />

          <FormInput
            label="Phone"
            value={data.branchAdmin?.phone || ""}
            onChange={(val) =>
              update(["branchAdmin", "phone"], val)
            }
          />
        </div>
      </Section> */}

      {/* ================= CONTACT ================= */}
      <Section label="Contact Info">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Phone"
            value={data.settings?.contact?.phone || ""}
            onChange={(val) =>
              update(["settings", "contact", "phone"], val)
            }
          />

          <FormInput
            label="WhatsApp"
            value={data.settings?.contact?.whatsapp || ""}
            onChange={(val) =>
              update(["settings", "contact", "whatsapp"], val)
            }
          />
        </div>
      </Section>

      {/* ================= SETTINGS ================= */}
      <Section label="Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Tax Percentage"
            value={data.settings?.taxation?.taxPercentage || ""}
            onChange={(val) =>
              update(
                ["settings", "taxation", "taxPercentage"],
                Number(val)
              )
            }
          />

          <FormInput
            label="Estimated Prep Time"
            value={data.settings?.automation?.estimatedPrepTime || ""}
            onChange={(val) =>
              update(
                ["settings", "automation", "estimatedPrepTime"],
                Number(val)
              )
            }
          />
        </div>
      </Section>

      <div className="flex items-center justify-between rounded-[12px] border p-4">
  <div>
    <p className="text-sm font-medium text-gray-900">
      Enable Table Reservations
    </p>
    <p className="text-xs text-gray-500">
      Allow customers to reserve tables for this branch
    </p>
  </div>

  <Switch
    checked={data.settings?.tableReservationsEnabled || false}
    onCheckedChange={(val) =>
      update(["settings", "tableReservationsEnabled"], val)
    }
  />
</div>

    </div>
  );
}