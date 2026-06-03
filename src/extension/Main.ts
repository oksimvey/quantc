import * as vscode from "vscode";
import { BuiltInTypes, setupTypes } from "./ast/setup/BuiltInTypes";

import { Keywords, setupKeywords } from "./ast/setup/Keywords";

import { setupOperators, BuiltInOperators } from "./ast/setup/BuiltInOperators";

interface Statement {
  text: string;
  start: number;
  end: number;
}




function processBraces(ch: string, braceBalance: number): [number, boolean] {
  if (ch === "{") {
    return [braceBalance + 1, false];
  }
  if (ch === "}") {
    const newBalance = braceBalance - 1;
    return [newBalance, newBalance < 0];
  }
  return [braceBalance, false];
}

function addStatement(statements: Statement[], text: string, start: number, end: number): void {
  const raw = text.slice(start, end).trim();
  if (raw.length > 0) {
    statements.push({ text: raw, start, end });
  }
}




/**
 * Função que faz scan do texto inteiro
 * usando um ponteiro único (i)
 */

function scanStatements(text: string): boolean {
  const statements: Statement[] = [];

  let i = 0;
  let start = 0;

  let braceBalance = 0;

  while (i < text.length) {
    const ch = text[i];

    // update brace balance and detect early negative balance
    const [newBalance, negative] = processBraces(ch, braceBalance);
    braceBalance = newBalance;
    if (negative) return true; // sinaliza erro

    // handle statement delimiters
    if (ch === ";" || ch === "\n") {
      addStatement(statements, text, start, i);
      i++;
      start = i;
      continue;
    }

    i++;
  }

  if (braceBalance > 0) return true;

  return false;
}
export function activate(context: vscode.ExtensionContext) {
  setupKeywords();

  setupTypes();

  setupOperators();

  const diagnostics = vscode.languages.createDiagnosticCollection("myLang");

  function reportError(document: vscode.TextDocument) {
    const text = document.getText();
    const diags: vscode.Diagnostic[] = [];

    const index = text.indexOf("{");

    if (index !== -1 && scanStatements(text)) {
      const start = document.positionAt(index);

      const range = new vscode.Range(start, start);

      diags.push(
        new vscode.Diagnostic(
          range,
          "Syntax Error detected: Missing brackets",
          vscode.DiagnosticSeverity.Error,
        ),
      );
    }

    diagnostics.set(document.uri, diags);
  }

  function update(doc: vscode.TextDocument) {
    if (doc.languageId !== "qc") return;
    reportError(doc);
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(update),
    vscode.workspace.onDidChangeTextDocument((e) => update(e.document)),
  );

  if (vscode.window.activeTextEditor) {
    update(vscode.window.activeTextEditor.document);
  }

  // autocomplete
  const completion2 = vscode.languages.registerCompletionItemProvider("qc", {
    provideCompletionItems() {
      const arr: vscode.CompletionItem[] = [];

      for (const [key, value] of BuiltInTypes) {
        const item = new vscode.CompletionItem(
          key,
          vscode.CompletionItemKind.Variable,
        );
        item.insertText = key;
        item.detail = value.comment;
        item.documentation = new vscode.MarkdownString("### " + key);
        arr.push(item);
      }

      for (const [key, value] of Keywords) {
        const item = new vscode.CompletionItem(
          key,
          vscode.CompletionItemKind.Keyword,
        );
        item.insertText = key;
        item.detail = value.comment;
        item.documentation = new vscode.MarkdownString("### " + key);
        arr.push(item);
      }

      return arr;
    },
  });

  // hover
  const hover = vscode.languages.registerHoverProvider("qc", {
    provideHover(document, position) {
      // 1. Try normal word first (works for identifiers, keywords, types)
      const range = document.getWordRangeAtPosition(position);
      const word = range ? document.getText(range) : "";

      // helper to build hover
      const makeHover = (key: string, value: any) => {
        const md = new vscode.MarkdownString();
        md.appendMarkdown("### " + key + "\n\n");
        md.appendMarkdown(value.comment + "\n\n");
        return new vscode.Hover(md);
      };

      // 2. Normal lookup (fast path)
      for (const [key, value] of BuiltInTypes) {
        if (word === key) return makeHover(key, value);
      }

      for (const [key, value] of Keywords) {
        if (word === key) return makeHover(key, value);
      }

      // 3. Operator handling (window scan)
      const windowRange = new vscode.Range(
        position.translate(0, -1), // look left
        position.translate(0, 2), // look right
      );

      const windowText = document.getText(windowRange);

      const ops = [...BuiltInOperators.keys()].sort(
        (a, b) => b.length - a.length,
      ); // important

      for (const op of ops) {
        if (windowText.includes(op)) {
          return makeHover(op, BuiltInOperators.get(op));
        }
      }

      return null;
    },
  });

  context.subscriptions.push(completion2, hover);
}
