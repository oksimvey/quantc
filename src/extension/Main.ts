import * as vscode from "vscode";
import {OBJECTS, setupRegistry} from "./ast/ObjectRegistry"

interface Statement {
    text: string;
    start: number;
    end: number;
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

        if (ch === "{") {
            braceBalance++;
        }

        else if (ch === "}") {
            braceBalance--;

            if (braceBalance < 0) {
                return true; // sinaliza erro
            }
        }

        if (ch === ";") {
            const raw = text.slice(start, i).trim();

            if (raw.length > 0) {
                statements.push({
                    text: raw,
                    start,
                    end: i
                });
            }

            i++;
            start = i;
            continue;
        }

        if (ch === "\n") {
            const raw = text.slice(start, i).trim();

            if (raw.length > 0) {
                statements.push({
                    text: raw,
                    start,
                    end: i
                });
            }

            i++;
            start = i;
            continue;
        }

        i++;
    }

    if (braceBalance > 0) {
        return true;
    }

    return false;
}
export function activate(context: vscode.ExtensionContext) {

    setupRegistry();

    const diagnostics =
        vscode.languages.createDiagnosticCollection("myLang");

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
                    vscode.DiagnosticSeverity.Error
                )
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
        vscode.workspace.onDidChangeTextDocument(e => update(e.document))
    );

    if (vscode.window.activeTextEditor) {
        update(vscode.window.activeTextEditor.document);
    }

  

      // autocomplete
      const completion2 = vscode.languages.registerCompletionItemProvider(
        "qc",
        {
           
            provideCompletionItems() {

                const arr : vscode.CompletionItem[] = [];

                for (const [key, value] of OBJECTS) {
                    console.log(key, value);

 

                    const item = new vscode.CompletionItem(
                        key, vscode.CompletionItemKind.Variable
                    );
                    item.insertText = key;
                    item.detail = value.comment;
                    item.documentation = new vscode.MarkdownString('### ' + key)
                    arr.push(item);
                }

                return arr;
            }
        }
    );

    // hover
    const hover = vscode.languages.registerHoverProvider(
        "qc",
        {
            provideHover(document, position) {

                const range = document.getWordRangeAtPosition(position);
                const word = document.getText(range);

                for (const [key, value] of OBJECTS){
                    if (word == key){
                        const md = new vscode.MarkdownString();

                        md.appendMarkdown('### ' + key + "\n\n");
                        md.appendMarkdown(value.comment + "\n\n");

                        return new vscode.Hover(md);
                    }
                }

                return null;
            }
        }
    );

    context.subscriptions.push(completion2, hover);
}
