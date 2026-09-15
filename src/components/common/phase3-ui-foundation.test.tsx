import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";
import {
  FormActions,
  FormLayout,
  FormSection,
} from "@/components/common/FormLayout";
import { FormField } from "@/components/common/FormField";
import {
  DetailLayout,
  DetailPanel,
  InfoList,
} from "@/components/common/DetailLayout";
import { SettingsLayout } from "@/components/common/SettingsLayout";
import {
  getResponsiveDialogPresentation,
  ResponsiveDialog,
} from "@/components/common/ResponsiveDialog";
import { ConfirmDialog } from "@/components/common/dialogs/delete-dialog";
import { ModalActions } from "@/components/common/modal-actions";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("Phase 3 shared form patterns", () => {
  it("composes a responsive form, preview, sections, and typed action regions", () => {
    const markup = renderToStaticMarkup(
      <FormLayout
        aside={<div>Live preview</div>}
        actions={
          <FormActions
            destructive={<Button variant="destructive">Delete</Button>}
            secondary={<Button variant="outline">Cancel</Button>}
            primary={<Button>Save</Button>}
            sticky
          />
        }
      >
        <FormSection title="Basics" description="Restaurant identity" columns={2}>
          <FormField id="name" label="Name" help="Shown to customers" required>
            {(controlProps) => <input {...controlProps} />}
          </FormField>
          <FormField id="slug" label="Slug" error="Slug is required">
            {(controlProps) => <input {...controlProps} />}
          </FormField>
        </FormSection>
      </FormLayout>,
    );

    expect(markup).toContain('data-slot="form-layout"');
    expect(markup).toContain('data-slot="form-layout-aside"');
    expect(markup).toContain('data-slot="form-section"');
    expect(markup).toContain("md:grid-cols-2");
    expect(markup).toContain('data-slot="form-actions"');
    expect(markup).toContain('data-sticky="true"');
    expect(markup).toContain('id="name"');
    expect(markup).toContain('required=""');
    expect(markup).toContain('aria-describedby="name-help"');
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('aria-describedby="slug-error"');
  });

  it("keeps the former modal-actions name as the canonical FormActions export", () => {
    expect(ModalActions).toBe(FormActions);
  });

  it("provides an accessible disclosure for optional form sections", () => {
    const markup = renderToStaticMarkup(
      <FormSection title="Advanced" collapsible toggleLabel="Toggle advanced settings">
        <div>Advanced settings</div>
      </FormSection>,
    );

    expect(markup).toContain('aria-label="Toggle advanced settings"');
    expect(markup).toContain('data-state="open"');
    expect(markup).toContain("Advanced settings");
  });
});

describe("Phase 3 shared detail and settings patterns", () => {
  it("renders summary, main/sidebar panels, and semantic metadata", () => {
    const markup = renderToStaticMarkup(
      <DetailLayout
        summary={<div>Order summary</div>}
        aside={<DetailPanel title="Customer">Customer details</DetailPanel>}
      >
        <DetailPanel title="Order">
          <InfoList
            items={[
              { id: "number", label: "Order", value: "#FF-1024" },
              { id: "payment", label: "Payment", value: null },
              { id: "hidden", label: "Hidden", value: "No", hidden: true },
            ]}
          />
        </DetailPanel>
      </DetailLayout>,
    );

    expect(markup).toContain('data-slot="detail-layout"');
    expect(markup).toContain('data-slot="detail-layout-summary"');
    expect(markup).toContain('data-slot="detail-layout-aside"');
    expect(markup).toContain('data-slot="detail-panel"');
    expect(markup).toContain("#FF-1024");
    expect(markup).toContain("—");
    expect(markup).not.toContain("Hidden");
  });

  it("renders labelled settings navigation, live status, and sticky actions", () => {
    const markup = renderToStaticMarkup(
      <SettingsLayout
        navigation={<a href="#profile">Profile</a>}
        navigationLabel="Settings pages"
        status="Unsaved changes"
        actions={<Button>Save settings</Button>}
      >
        <div id="profile">Settings content</div>
      </SettingsLayout>,
    );

    expect(markup).toContain('data-slot="settings-layout"');
    expect(markup).toContain('aria-label="Settings pages"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain("Unsaved changes");
    expect(markup).toContain('data-slot="settings-layout-actions"');
  });
});

describe("Phase 3 shared dialog patterns", () => {
  it("selects Dialog for desktop and Sheet for mobile without changing callers", () => {
    expect(getResponsiveDialogPresentation("auto", false)).toBe("dialog");
    expect(getResponsiveDialogPresentation("auto", true)).toBe("sheet");
    expect(getResponsiveDialogPresentation("dialog", true)).toBe("dialog");
    expect(getResponsiveDialogPresentation("sheet", false)).toBe("sheet");
  });

  it("exports the responsive and confirmation dialog contracts", () => {
    expect(ResponsiveDialog).toBeTypeOf("function");
    expect(ConfirmDialog).toBeTypeOf("function");
  });
});
