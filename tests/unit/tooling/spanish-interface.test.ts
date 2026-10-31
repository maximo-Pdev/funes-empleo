import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? sources(join(directory, entry.name)) : /\.tsx?$/.test(entry.name) ? [join(directory, entry.name)] : []);
}

it("no renderiza códigos crudos ni vocabulario inglés en vistas o mensajes", () => {
  const violations: string[] = [];
  const codedFields = new Set(["status", "availability", "channel", "decision", "action", "reason_code", "newStatus",
    "previous_state", "new_state", "reported_outcome"]);
  const english = /\b(feedback|dashboard|pending_review|changes_requested|active|incomplete|suspended|archived|draft|upload|download|submit)\b/i;
  for (const file of sources(join(process.cwd(), "src"))) {
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function report(node: ts.Node) {
      violations.push(`${relative(process.cwd(), file)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
    }
    function visit(node: ts.Node) {
      if (ts.isStringLiteral(node) && /\s(?:feedback|email)(?:[.!?,;:]|\s)/i.test(node.text)) report(node);
      if (ts.isJsxText(node) && english.test(node.text)) report(node);
      if (ts.isJsxAttribute(node) && ["label", "title", "description", "placeholder", "aria-label", "busyLabel"].includes(node.name.getText(source))
        && node.initializer && ts.isStringLiteral(node.initializer) && english.test(node.initializer.text)) report(node);
      if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent) && node.expression) {
        const expression = ts.isBinaryExpression(node.expression) && node.expression.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
          ? node.expression.left : node.expression;
        if (ts.isPropertyAccessExpression(expression) && codedFields.has(expression.name.text)) report(node);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  expect(violations).toEqual([]);
});

it("la medición reutiliza etiquetas españolas y el select de disponibilidad sin cambiar sus valores", () => {
  const benchmark = readFileSync("tests/quality/demo-performance.mjs", "utf8");
  expect(benchmark).toMatch(/getByRole\("region",\{name:"Oferta y empresa",exact:true\}\)\.getByText\("Publicada",\{exact:true\}\)/);
  expect(benchmark).toContain('filter({hasText:"Resultado o estado vigente"}).getByText(n===1?"Preseleccionada":"Persona contratada",{exact:true})');
  expect(benchmark).not.toContain("Resultado o estado vigente:");
  expect(benchmark).toMatch(/getByLabel\("Disponibilidad",\s*\{exact:true\}\)\.selectOption\("available"\)/);
  expect(benchmark).not.toMatch(/Estado: (?:published|pending_review|draft)/);
});

it("los controles de ingreso esperan el panel correspondiente al rol", () => {
  const benchmark = readFileSync("tests/quality/demo-performance.mjs", "utf8");
  expect(benchmark.match(/waitForURL\("\*\*\/admin"\)/g)).toHaveLength(2);
  expect(benchmark).not.toContain('waitForURL("**/account")');
  const smoke = readFileSync("tests/quality/demo-smoke.mjs", "utf8");
  expect(smoke).toContain('role === "admin" ? "/admin" : role === "candidate" ? "/dashboard" : "/empresa"');
  expect(smoke).toContain('await page.waitForURL(`**${panel}`)');
});
