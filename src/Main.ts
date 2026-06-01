import * as vscode from "vscode";

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

        // 🔥 bloco
        if (ch === "{") {
            braceBalance++;
        }

        else if (ch === "}") {
            braceBalance--;

            // ❌ erro: fecha sem abrir
            if (braceBalance < 0) {
                return true; // sinaliza erro
            }
        }

        // 🔥 fim de statement
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

        // 🔥 newline como separador
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

    // ❌ falta fechar {
    if (braceBalance > 0) {
        return true;
    }

    return false;
}
export function activate(context: vscode.ExtensionContext) {

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

    // 🔥 ESSA PARTE QUE FALTAVA
    function update(doc: vscode.TextDocument) {
        if (doc.languageId !== "qc") return;
        reportError(doc);
    }

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(update),
        vscode.workspace.onDidChangeTextDocument(e => update(e.document))
    );

    // 🔥 IMPORTANTE: arquivo já aberto
    if (vscode.window.activeTextEditor) {
        update(vscode.window.activeTextEditor.document);
    }

    // autocomplete
    const completion = vscode.languages.registerCompletionItemProvider(
        "qc",
        {
            provideCompletionItems() {

                const intItem = new vscode.CompletionItem(
                    "int",
                    vscode.CompletionItemKind.Variable
                );

                intItem.insertText = "int";
                intItem.detail = "32-bit integer";
                intItem.documentation = new vscode.MarkdownString(`### int`);

                return [intItem];
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

                if (word === "int") {
                    return new vscode.Hover(
                        new vscode.MarkdownString(`### int`)
                    );
                }

                return null;
            }
        }
    );

    context.subscriptions.push(completion, hover);
}
