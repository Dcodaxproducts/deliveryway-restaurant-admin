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

  it("supports a single-chevron native mode for controls inside popovers", () => {
    const markup = renderToStaticMarkup(
      <FormSelect native value="05" onChange={() => undefined}>
        <option value="05">05</option>
        <option value="06">06</option>
      </FormSelect>,
    );

    expect(markup).toContain('data-slot="form-select-native"');
    expect(markup).toContain("appearance-none");
    expect(markup.match(/<svg/g)).toHaveLength(1);
  });
});
