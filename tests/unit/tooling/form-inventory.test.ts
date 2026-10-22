import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? sources(join(directory, entry.name)) : entry.name.endsWith(".tsx") ? [join(directory, entry.name)] : []);
}

it("todos los formularios y campos visibles usan los componentes compartidos", () => {
  const violations: string[] = [];
  let forms = 0;
  for (const file of sources(join(process.cwd(), "src"))) {
    const path = relative(process.cwd(), file).replaceAll("\\", "/");
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node: ts.Node, insideField = false) {
      let field = insideField;
      if (ts.isJsxElement(node)) field ||= node.openingElement.tagName.getText(source) === "Field";
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(source);
        const hidden = node.attributes.properties.some(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === "type"
          && attribute.initializer && ts.isStringLiteral(attribute.initializer) && attribute.initializer.text === "hidden");
        if (tag === "Form") forms++;
        if (tag === "form" && path !== "src/components/forms/form.tsx") violations.push(`${path}: form aislado`);
        if (tag === "label" && path !== "src/components/forms/field.tsx") violations.push(`${path}: label aislado`);
        if (["input", "select", "textarea"].includes(tag) && !hidden && !field) violations.push(`${path}: ${tag} sin Field`);
      }
      ts.forEachChild(node, child => visit(child, field));
    }
    visit(source);
  }
  expect(violations).toEqual([]);
  expect(forms).toBeGreaterThanOrEqual(38);
});
