import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SOURCE_ROOTS = ["src/app", "src/components", "src/hooks", "src/validations"];
const USER_VISIBLE_ATTRIBUTES = new Set([
  "alt",
  "aria-description",
  "aria-label",
  "placeholder",
  "title",
]);
const ALLOWED_ATTRIBUTE_VALUES = new Set(["DeliveryWay", "PDF", "SKU", "URL", "WinOrder"]);
const ALLOWED_JSX_TEXT = new Set(["DeliveryWay", "PDF", "POS", "SKU", "URL", "WinOrder"]);
const USER_VISIBLE_PROPERTY_NAMES = new Set([
  "buttonText",
  "emptyMessage",
  "loadingText",
  "placeholder",
]);
const ALLOWLIST = [
  { file: "src/components/common/RestaurantPicker.tsx", kind: "notification-literal:toast.success", value: "logoutSuccess", reason: "next-intl navigation alias key" },
  { file: "src/components/layout/navbar/profile-section.tsx", kind: "notification-literal:toast.success", value: "logoutSuccess", reason: "next-intl navigation alias key" },
  { file: "src/components/pages/Menu/deals/components/AdminDealForm.tsx", kind: "raw-error-call:toast.error", value: "message", reason: "caller supplies common.invalidForm through next-intl" },
  { file: "src/components/pages/Promotions/gift-cards/components/GiftCardForm.tsx", kind: "raw-error-call:toast.error", value: "message", reason: "caller supplies common.invalidForm through next-intl" },
  { file: "src/components/pages/Printing/components/autoPrinting/AutoPrintingSettings.tsx", kind: "raw-error-call:toast.error", value: "message", reason: "value comes from getApiErrorMessage with a localized fallback" },
  { file: "src/hooks/useHttpClient.ts", kind: "raw-error-call:toast.error", value: "apiError.message", reason: "ApiError is created with the localized safe fallback" },
  { file: "src/components/pages/Settings/theme/components/theme-settings/typography-section.tsx", kind: "property:placeholder", value: "12px", reason: "locale-neutral CSS measurement example" },
  { file: "src/components/pages/branches/forms/EditBranchForm/steps/WorkingHoursStep.tsx", kind: "property:placeholder", value: "eg. 45", reason: "locale-neutral numeric example" },
  { file: "src/components/pages/branches/forms/EditBranchForm/steps/WorkingHoursStep.tsx", kind: "property:placeholder", value: "eg. 15", reason: "locale-neutral numeric example" },
  { file: "src/components/pages/branches/forms/EditBranchForm/steps/WorkingHoursStep.tsx", kind: "property:placeholder", value: "eg. 10", reason: "locale-neutral numeric example" },
];

const NON_USER_VISIBLE_FILES = [
  /\.(?:test|spec)\.[jt]sx?$/,
  /\/components\/ui\//,
];

const files = [];
for (const sourceRoot of SOURCE_ROOTS) walk(path.join(ROOT, sourceRoot));

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (/\.[jt]sx?$/.test(entry.name)) files.push(fullPath);
  }
}

const findings = [];
for (const filePath of files) {
  const relativePath = path.relative(ROOT, filePath).replaceAll(path.sep, "/");
  if (NON_USER_VISIBLE_FILES.some((pattern) => pattern.test(relativePath))) continue;
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const report = (node, kind, value) => {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!/[A-Za-zÄÖÜäöüß]/.test(normalized)) return;
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const allowed = ALLOWLIST.some((entry) => entry.file === relativePath && entry.kind === kind && entry.value === normalized);
    if (!allowed) findings.push({ file: relativePath, line: line + 1, kind, value: normalized });
  };

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const value = node.getText(sourceFile).trim();
      if (value && !ALLOWED_JSX_TEXT.has(value)) report(node, "jsx-text", value);
    }

    if (ts.isJsxAttribute(node) && USER_VISIBLE_ATTRIBUTES.has(node.name.text)) {
      const initializer = node.initializer;
      if (initializer && ts.isStringLiteral(initializer)) {
        if (!ALLOWED_ATTRIBUTE_VALUES.has(initializer.text)) {
          report(initializer, `attribute:${node.name.text}`, initializer.text);
        }
      }
    }

    if (
      ts.isStringLiteral(node) &&
      ts.isJsxExpression(node.parent) &&
      !ALLOWED_JSX_TEXT.has(node.text)
    ) {
      report(node, "jsx-expression", node.text);
    }

    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      USER_VISIBLE_PROPERTY_NAMES.has(node.name.text) &&
      (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer))
    ) {
      report(node.initializer, `property:${node.name.text}`, node.initializer.text);
    }

    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && sourceText.includes("zod")) {
      let rawValidation = false;
      if (ts.isCallExpression(node.parent) && ts.isPropertyAccessExpression(node.parent.expression)) {
        const method = node.parent.expression.name.text;
        const index = node.parent.arguments.indexOf(node);
        rawValidation = ["min", "max", "email", "url", "regex", "refine", "length", "datetime"].includes(method) &&
          index >= 0 && (index > 0 || ["email", "url", "regex", "datetime"].includes(method));
      }
      if (ts.isPropertyAssignment(node.parent)) {
        const property = node.parent.name.getText(sourceFile).replace(/["']/g, "");
        rawValidation = ["message", "required_error", "invalid_type_error"].includes(property);
      }
      if (rawValidation) report(node, "validation-literal", node.text);
    }

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      let current = node.parent;
      let translated = false;
      while (current) {
        if (ts.isCallExpression(current)) {
          const called = current.expression.getText(sourceFile);
          if (/^(?:t[A-Za-z]*|[A-Za-z]+T|getLocalizedMessage)$/.test(called)) translated = true;
          if (
            /^(?:alert|confirm)$/.test(called) ||
            /(?:^|\.)(?:error|info|success|warning)$/.test(called)
          ) {
            if (!translated && current.arguments[0] && node.pos >= current.arguments[0].pos && node.end <= current.arguments[0].end) {
              report(node, `notification-literal:${called}`, node.text);
            }
            break;
          }
        }
        current = current.parent;
      }
    }

    if (ts.isCallExpression(node)) {
      const expression = node.expression.getText(sourceFile);
      const shouldCheck =
        /^(?:alert|confirm)$/.test(expression) ||
        /(?:^|\.)(?:error|info|success|warning)$/.test(expression) ||
        expression === "Error";
      const argument = node.arguments[0];
      if (shouldCheck && argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) {
        report(argument, `call:${expression}`, argument.text);
      }
      if (shouldCheck && argument && ts.isTemplateExpression(argument)) {
        const staticText = [argument.head.text, ...argument.templateSpans.map((span) => span.literal.text)].join(" ");
        if (/[A-Za-zÄÖÜäöüß]/.test(staticText)) {
          report(argument, `dynamic-call:${expression}`, argument.getText(sourceFile));
        }
      }
      if (
        shouldCheck &&
        argument &&
        /(?:^|\.)(?:message|error)$/.test(argument.getText(sourceFile))
      ) {
        report(argument, `raw-error-call:${expression}`, argument.getText(sourceFile));
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

if (findings.length) {
  console.error("Hardcoded user-visible strings found. Use next-intl message keys instead:\n");
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.kind}] ${JSON.stringify(finding.value)}`);
  }
  console.error(`\n${findings.length} localization finding(s).`);
  process.exit(1);
}

console.log(`Localization scanner passed (${files.length} source files checked).`);
