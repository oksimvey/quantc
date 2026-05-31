import * as vscode from "vscode";

import { ProgramNode } from "./extension/ast/ProgramNode";
import { VariableDeclarationNode } from "./extension/ast/VariableDeclarationNode";
import { AssignmentNode } from "./extension/ast/AssignmentNode";
import { IntegerLiteralNode } from "./extension/ast/IntegerLiteralNode";
import { StringLiteralNode } from "./extension/ast/StringLiteralNode";
import { ExpressionNode } from "./extension/ast/ExpressionNode";
import { ASTNode } from "./extension/ast/ASTNode";
import { SemanticAnalyzer } from "./extension/semantic/SemanticAnalyser";
import { Diagnostic as QcDiagnostic } from "./extension/semantic/Diagnostic";
import { Token } from "./extension/lexer/Token";
import { TokenType } from "./extension/lexer/TokenType";
import { TYPES } from "./extension/lexer/Lexer";
import { MutabilityType } from "./extension/lexer/MutabilityType";
import { StorageType } from "./extension/lexer/StorageType";
import { VisibilityType } from "./extension/lexer/VisibilityType";

let diagnostics: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext): void {
    diagnostics = vscode.languages.createDiagnosticCollection("qc");
    context.subscriptions.push(diagnostics);

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor?.document.languageId === "qc") {
        analyzeDocument(activeEditor.document);
    }

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(document => {
            if (document.languageId === "qc") {
                analyzeDocument(document);
            }
        }),
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId === "qc") {
                analyzeDocument(event.document);
            }
        }),
        vscode.workspace.onDidCloseTextDocument(document => {
            diagnostics.delete(document.uri);
        }),
        vscode.commands.registerCommand("qc.compileAndRun", () => {
            const editor = vscode.window.activeTextEditor;

            if (!editor || editor.document.languageId !== "qc") {
                void vscode.window.showWarningMessage("Open a QC file first.");
                return;
            }

            analyzeDocument(editor.document);
            void vscode.window.showInformationMessage("QC semantic analysis finished.");
        })
    );
}

export function deactivate(): void {
    diagnostics?.dispose();
}

function analyzeDocument(document: vscode.TextDocument): void {
    const program = parseProgram(document);
    const analyzer = new SemanticAnalyzer();
    const qcDiagnostics = analyzer.analyze(program);

    diagnostics.set(
        document.uri,
        qcDiagnostics.map(diagnostic => toVsCodeDiagnostic(document, diagnostic))
    );
}

function toVsCodeDiagnostic(
    document: vscode.TextDocument,
    diagnostic: QcDiagnostic
): vscode.Diagnostic {
    const start = document.positionAt(diagnostic.token.start);
    const end = document.positionAt(Math.max(diagnostic.token.end, diagnostic.token.start + 1));
    const range = new vscode.Range(start, end);

    return new vscode.Diagnostic(
        range,
        diagnostic.message,
        vscode.DiagnosticSeverity.Error
    );
}

function parseProgram(document: vscode.TextDocument): ProgramNode {
    const statements: ASTNode[] = [];
    const text = document.getText();

    for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
        const line = document.lineAt(lineIndex);
        const lineOffset = document.offsetAt(line.range.start);
        const statement =
            parseVariableDeclarationLine(text, line.text, lineOffset, lineIndex) ??
            parseAssignmentLine(text, line.text, lineOffset, lineIndex);

        if (statement) {
            statements.push(statement);
        }
    }

    return new ProgramNode(statements);
}

function parseVariableDeclarationLine(
    source: string,
    lineText: string,
    lineOffset: number,
    lineIndex: number
): VariableDeclarationNode | undefined {
    const trimmed = lineText.trim();

    if (!trimmed || trimmed.startsWith("//")) {
        return undefined;
    }

    const tokens = scanLineTokens(lineText, lineOffset, lineIndex);

    if (tokens.length < 2) {
        return undefined;
    }

    let cursor = 0;
    let visibility = VisibilityType.Private;
    let storage = StorageType.Local;
    let mutability = MutabilityType.Mutable;

    if (tokens[cursor]?.lexeme === "public" || tokens[cursor]?.lexeme === "private") {
        visibility = tokens[cursor].lexeme === "public"
            ? VisibilityType.Public
            : VisibilityType.Private;
        cursor++;
    }

    if (tokens[cursor]?.lexeme === "global" || tokens[cursor]?.lexeme === "local") {
        storage = tokens[cursor].lexeme === "global"
            ? StorageType.Global
            : StorageType.Local;
        cursor++;
    }

    if (
        tokens[cursor]?.lexeme === "mutable" ||
        tokens[cursor]?.lexeme === "const" ||
        tokens[cursor]?.lexeme === "constexpr"
    ) {
        mutability = toMutability(tokens[cursor].lexeme);
        cursor++;
    }

    const typeToken = tokens[cursor];
    const nameToken = tokens[cursor + 1];

    if (!typeToken || !nameToken || !isPossibleTypeToken(typeToken) || !isPossibleVariableNameToken(nameToken)) {
        return undefined;
    }

    const semicolon = tokens.find(token => token.type === TokenType.Semicolon);
    const endToken = semicolon ?? tokens[tokens.length - 1];
    const initializer = parseInitializer(source, tokens, cursor + 2);

    return new VariableDeclarationNode(
        tokens[0],
        endToken,
        visibility,
        storage,
        mutability,
        typeToken,
        nameToken,
        initializer
    );
}

function parseAssignmentLine(
    source: string,
    lineText: string,
    lineOffset: number,
    lineIndex: number
): AssignmentNode | undefined {
    const trimmed = lineText.trim();

    if (!trimmed || trimmed.startsWith("//")) {
        return undefined;
    }

    const tokens = scanLineTokens(lineText, lineOffset, lineIndex);

    if (tokens.length < 3) {
        return undefined;
    }

    const nameToken = tokens[0];
    const equalsToken = tokens[1];

    if (
        nameToken.type !== TokenType.Identifier ||
        equalsToken.type !== TokenType.Operator ||
        equalsToken.lexeme !== "="
    ) {
        return undefined;
    }

    const value = parseExpressionAt(source, tokens, 2);

    if (!value) {
        return undefined;
    }

    const semicolon = tokens.find(token => token.type === TokenType.Semicolon);
    const endToken = semicolon ?? tokens[tokens.length - 1];

    return new AssignmentNode(nameToken, endToken, nameToken, value);
}

function scanLineTokens(lineText: string, lineOffset: number, lineIndex: number): Token[] {
    const tokens: Token[] = [];
    const tokenPattern = /"[^"]*"|\d+|[A-Za-z_][A-Za-z0-9_]*|[=;]/g;
    let match: RegExpExecArray | null;

    while ((match = tokenPattern.exec(lineText)) !== null) {
        const lexeme = match[0];
        const start = lineOffset + match.index;
        const end = start + lexeme.length;

        tokens.push({
            type: tokenTypeFor(lexeme),
            lexeme,
            start,
            end,
            line: lineIndex,
            column: match.index
        });
    }

    return tokens;
}

function tokenTypeFor(lexeme: string): TokenType {
    if (lexeme === ";") {
        return TokenType.Semicolon;
    }

    if (lexeme === "=") {
        return TokenType.Operator;
    }

    if (/^\d+$/.test(lexeme)) {
        return TokenType.Number;
    }

    if (/^"[^"]*"$/.test(lexeme)) {
        return TokenType.String;
    }

    if (TYPES.has(lexeme)) {
        return TokenType.Type;
    }

    if (
        lexeme === "public" ||
        lexeme === "private" ||
        lexeme === "global" ||
        lexeme === "local" ||
        lexeme === "mutable" ||
        lexeme === "const" ||
        lexeme === "constexpr"
    ) {
        return TokenType.Keyword;
    }

    return TokenType.Identifier;
}

function parseInitializer(
    source: string,
    tokens: Token[],
    startIndex: number
): ExpressionNode | undefined {
    const equalsIndex = tokens.findIndex((token, index) =>
        index >= startIndex &&
        token.type === TokenType.Operator &&
        token.lexeme === "="
    );

    if (equalsIndex === -1) {
        return undefined;
    }

    return parseExpressionAt(source, tokens, equalsIndex + 1);
}

function parseExpressionAt(
    source: string,
    tokens: Token[],
    index: number
): ExpressionNode | undefined {
    const valueToken = tokens[index];

    if (!valueToken || valueToken.type === TokenType.Semicolon) {
        return undefined;
    }

    if (valueToken.type === TokenType.Number) {
        return new IntegerLiteralNode(valueToken);
    }

    if (valueToken.type === TokenType.String) {
        return new StringLiteralNode({
            ...valueToken,
            lexeme: source.slice(valueToken.start, valueToken.end)
        });
    }

    return undefined;
}

function isPossibleTypeToken(token: Token): boolean {
    return token.type === TokenType.Type || token.type === TokenType.Identifier;
}

function isPossibleVariableNameToken(token: Token): boolean {
    return token.type === TokenType.Identifier || token.type === TokenType.Type;
}

function toMutability(lexeme: string): MutabilityType {
    switch (lexeme) {
        case "const":
            return MutabilityType.Const;
        case "constexpr":
            return MutabilityType.Constexpr;
        default:
            return MutabilityType.Mutable;
    }
}
