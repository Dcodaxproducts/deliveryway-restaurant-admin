import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormSelect } from "@/components/ui/form-select";

describe("FormSelect", () => {
  it("renders the shadcn select trigger instead of browser-default select chrome", () => {
    const markup = renderToStaticMarkup(
      <FormSelect value="CONFIRMED" onChange={() => undefined}>
        <option value="ALL">All</option>
        <option value="CONFIRMED">Confirmed</option>
      </FormSelect>,
    );

    expect(markup).toContain('data-slot="select-trigger"');
    expect(markup).toContain('role="combobox"');
    expect(markup.match(/<select/g)).toHaveLength(1);
    expect(markup).toContain('<select aria-hidden="true"');
  });
});
