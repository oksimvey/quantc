const vscode = require('vscode');

const TokenType = Object.freeze({
  Identifier: 'Identifier',
  Keyword: 'Keyword',
  Type: 'Type',
  Builtin: 'Builtin',
  Number: 'Number',
  String: 'String',
  Character: 'Character',
  Operator: 'Operator',
  Dot: 'Dot',
  Comma: 'Comma',
  Colon: 'Colon',
  Semicolon: 'Semicolon',
  LParen: 'LParen',
  RParen: 'RParen',
  LBrace: 'LBrace',
  RBrace: 'RBrace',
  LBracket: 'LBracket',
  RBracket: 'RBracket',
  EOF: 'EOF'
});

const KEYWORDS = new Set([
  'function',
  'return',
  'if',
  'else',
  'while',
  'for',
  'true',
  'false',
  'continue',
  'break',
  'unsigned',
  'switch',
  'case',
  'default',
  'public',
  'protected',
  'abstract',
  'class',
  'private',
  'const',
  'global',
  'local',
  'this',
  'new',
  'try',
  'throw',
  'catch',
  'null',
  'super',
  'instanceof',
  'and',
  'or',
  'not',
  'delete',
  'extends',
  'pointer',
  'override',
  'enum'
]);

const TYPES = new Set([
  'byte',
  'short',
  'int',
  'long',
  'float',
  'double',
  'array',
  'hashmap',
  'list',
  'char',
  'string',
  'boolean',
  'void'
]);

const BUILTINS = new Set([
  'print',
  'sqrt',
  'abs',
  'sin',
  'cos',
  'tan',
  'min',
  'max',
  'pow',
  'atan',
  'atan2',
  'acos',
  'asin',
  'ceil',
  'floor',
  'exp',
  'log',
  'log10',
  'cosh',
  'sinh',
  'tanh',
  'acosh',
  'asinh',
  'atanh',
  'address',
  'pointing',
  'reference'
]);

const OPERATORS = [
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '++',
  '--',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '->',
  '+',
  '-',
  '*',
  '/',
  '%',
  '=',
  '!',
  '<',
  '>',
  '&',
  '|',
  '?'
];

const SINGLE_CHAR_TOKENS = new Map([
  ['.', TokenType.Dot],
  [',', TokenType.Comma],
  [':', TokenType.Colon],
  [';', TokenType.Semicolon],
  ['(', TokenType.LParen],
  [')', TokenType.RParen],
  ['{', TokenType.LBrace],
  ['}', TokenType.RBrace],
  ['[', TokenType.LBracket],
  [']', TokenType.RBracket]
]);

const OPENING_BRACKETS = new Map([
  [TokenType.LParen, TokenType.RParen],
  [TokenType.LBrace, TokenType.RBrace],
  [TokenType.LBracket, TokenType.RBracket]
]);

const CLOSING_BRACKETS = new Map([
  [TokenType.RParen, TokenType.LParen],
  [TokenType.RBrace, TokenType.LBrace],
  [TokenType.RBracket, TokenType.LBracket]
]);

const CLOSING_BRACKET_LEXEMES = new Map([
  [TokenType.LParen, ')'],
  [TokenType.LBrace, '}'],
  [TokenType.LBracket, ']']
]);

let diagnosticCollection;

function activate(context) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection('qc');
  context.subscriptions.push(diagnosticCollection);

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: 'qc' },
      new QcCompletionProvider(),
      '.',
      '('
    )
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
    vscode.workspace.onDidChangeTextDocument((event) => updateDiagnostics(event.document)),
    vscode.workspace.onDidCloseTextDocument((document) => diagnosticCollection.delete(document.uri)),
    vscode.commands.registerCommand('qc.compileAndRun', () => {
      vscode.window.showInformationMessage('QC: compile and run is not implemented yet.');
    })
  );

  for (const document of vscode.workspace.textDocuments) {
    updateDiagnostics(document);
  }
}

function deactivate() {
  if (diagnosticCollection) {
    diagnosticCollection.dispose();
  }
}

class QcCompletionProvider {
  provideCompletionItems(document, position) {
    const symbols = collectDocumentSymbols(document);
    const completions = [];

    for (const keyword of KEYWORDS) {
      completions.push(makeCompletion(keyword, vscode.CompletionItemKind.Keyword));
    }

    for (const type of TYPES) {
      completions.push(makeCompletion(type, vscode.CompletionItemKind.TypeParameter));
    }

    for (const builtin of BUILTINS) {
      const item = makeCompletion(builtin, vscode.CompletionItemKind.Function);
      item.insertText = new vscode.SnippetString(`${builtin}($0)`);
      completions.push(item);
    }

    for (const name of symbols.variables) {
      completions.push(makeCompletion(name, vscode.CompletionItemKind.Variable));
    }

    for (const name of symbols.functions) {
      const item = makeCompletion(name, vscode.CompletionItemKind.Function);
      item.insertText = new vscode.SnippetString(`${name}($0)`);
      completions.push(item);
    }

    for (const name of symbols.classes) {
      completions.push(makeCompletion(name, vscode.CompletionItemKind.Class));
    }

    return completions;
  }
}

function makeCompletion(label, kind) {
  const item = new vscode.CompletionItem(label, kind);
  item.detail = 'QC';
  return item;
}

function updateDiagnostics(document) {
  if (document.languageId !== 'qc') {
    return;
  }

  const diagnostics = [];
  const result = lex(document.getText());
  diagnostics.push(...result.diagnostics.map((diagnostic) => toVsCodeDiagnostic(document, diagnostic)));
  diagnostics.push(...findBracketDiagnostics(document, result.tokens));
  diagnosticCollection.set(document.uri, diagnostics);
}

function lex(source) {
  const tokens = [];
  const diagnostics = [];
  let index = 0;
  let line = 0;
  let column = 0;

  while (index < source.length) {
    const char = source[index];
    const startLine = line;
    const startColumn = column;

    if (isWhitespace(char)) {
      advance();
      continue;
    }

    if (char === '/' && peek(1) === '/') {
      while (index < source.length && source[index] !== '\n') {
        advance();
      }
      continue;
    }

    if (char === '/' && peek(1) === '*') {
      advance();
      advance();
      let closed = false;
      while (index < source.length) {
        if (source[index] === '*' && peek(1) === '/') {
          advance();
          advance();
          closed = true;
          break;
        }
        advance();
      }
      if (!closed) {
        diagnostics.push(makeDiagnostic('Unterminated block comment.', startLine, startColumn, line, column));
      }
      continue;
    }

    if (isAlpha(char)) {
      const lexeme = readWhile(isAlphaNumeric);
      let type = TokenType.Identifier;
      if (KEYWORDS.has(lexeme)) {
        type = TokenType.Keyword;
      } else if (TYPES.has(lexeme)) {
        type = TokenType.Type;
      } else if (BUILTINS.has(lexeme)) {
        type = TokenType.Builtin;
      }
      tokens.push(makeToken(type, lexeme, startLine, startColumn));
      continue;
    }

    if (isDigit(char)) {
      tokens.push(readNumber(startLine, startColumn));
      continue;
    }

    if (char === '"') {
      readString(startLine, startColumn);
      continue;
    }

    if (char === "'") {
      readCharacter(startLine, startColumn);
      continue;
    }

    const twoCharOperator = source.slice(index, index + 2);
    if (OPERATORS.includes(twoCharOperator)) {
      tokens.push(makeToken(TokenType.Operator, twoCharOperator, startLine, startColumn));
      advance();
      advance();
      continue;
    }

    if (OPERATORS.includes(char)) {
      tokens.push(makeToken(TokenType.Operator, char, startLine, startColumn));
      advance();
      continue;
    }

    const singleCharType = SINGLE_CHAR_TOKENS.get(char);
    if (singleCharType) {
      tokens.push(makeToken(singleCharType, char, startLine, startColumn));
      advance();
      continue;
    }

    diagnostics.push(makeDiagnostic(`Unexpected character '${char}'.`, startLine, startColumn, line, column + 1));
    advance();
  }

  tokens.push(makeToken(TokenType.EOF, '', line, column));
  return { tokens, diagnostics };

  function advance() {
    const current = source[index++];
    if (current === '\n') {
      line += 1;
      column = 0;
    } else {
      column += 1;
    }
    return current;
  }

  function peek(offset) {
    return source[index + offset] || '';
  }

  function readWhile(predicate) {
    let value = '';
    while (index < source.length && predicate(source[index])) {
      value += advance();
    }
    return value;
  }

  function readNumber(tokenLine, tokenColumn) {
    let lexeme = readWhile(isDigit);
    if (source[index] === '.' && isDigit(peek(1))) {
      lexeme += advance();
      lexeme += readWhile(isDigit);
    }
    return makeToken(TokenType.Number, lexeme, tokenLine, tokenColumn);
  }

  function readString(tokenLine, tokenColumn) {
    let lexeme = advance();
    let closed = false;

    while (index < source.length) {
      const current = advance();
      lexeme += current;

      if (current === '\\' && index < source.length) {
        lexeme += advance();
        continue;
      }

      if (current === '"') {
        closed = true;
        break;
      }

      if (current === '\n') {
        break;
      }
    }

    tokens.push(makeToken(TokenType.String, lexeme, tokenLine, tokenColumn));
    if (!closed) {
      diagnostics.push(makeDiagnostic('Unterminated string literal.', tokenLine, tokenColumn, line, column));
    }
  }

  function readCharacter(tokenLine, tokenColumn) {
    let lexeme = advance();
    let closed = false;
    let contentLength = 0;

    while (index < source.length) {
      const current = advance();
      lexeme += current;

      if (current === '\\' && index < source.length) {
        lexeme += advance();
        contentLength += 1;
        continue;
      }

      if (current === "'") {
        closed = true;
        break;
      }

      if (current === '\n') {
        break;
      }

      contentLength += 1;
    }

    tokens.push(makeToken(TokenType.Character, lexeme, tokenLine, tokenColumn));
    if (!closed) {
      diagnostics.push(makeDiagnostic('Unterminated character literal.', tokenLine, tokenColumn, line, column));
    } else if (contentLength !== 1) {
      diagnostics.push(makeDiagnostic('Character literal must contain exactly one character.', tokenLine, tokenColumn, line, column));
    }
  }
}

function findBracketDiagnostics(document, tokens) {
  const diagnostics = [];
  const stack = [];

  for (const token of tokens) {
    if (token.type === TokenType.EOF) {
      continue;
    }

    if (OPENING_BRACKETS.has(token.type)) {
      stack.push(token);
      continue;
    }

    if (!CLOSING_BRACKETS.has(token.type)) {
      continue;
    }

    const expectedOpening = CLOSING_BRACKETS.get(token.type);
    const opening = stack.pop();

    if (!opening || opening.type !== expectedOpening) {
      diagnostics.push(new vscode.Diagnostic(
        tokenRange(document, token),
        `Unexpected '${token.lexeme}'.`,
        vscode.DiagnosticSeverity.Error
      ));
    }
  }

  for (const token of stack) {
    diagnostics.push(new vscode.Diagnostic(
      tokenRange(document, token),
      `Missing closing '${CLOSING_BRACKET_LEXEMES.get(token.type)}'.`,
      vscode.DiagnosticSeverity.Error
    ));
  }

  return diagnostics;
}

function collectDocumentSymbols(document) {
  const tokens = lex(document.getText()).tokens;
  const symbols = {
    variables: new Set(),
    functions: new Set(),
    classes: new Set()
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const next = tokens[i + 1];
    const previous = tokens[i - 1];

    if (token.type !== TokenType.Identifier) {
      continue;
    }

    if (previous && previous.lexeme === 'function') {
      symbols.functions.add(token.lexeme);
      continue;
    }

    if (previous && previous.lexeme === 'class') {
      symbols.classes.add(token.lexeme);
      continue;
    }

    if (previous && (previous.type === TokenType.Type || previous.lexeme === 'const' || previous.lexeme === 'local' || previous.lexeme === 'global')) {
      symbols.variables.add(token.lexeme);
      continue;
    }

    if (next && next.type === TokenType.LParen && !BUILTINS.has(token.lexeme)) {
      symbols.functions.add(token.lexeme);
    }
  }

  return symbols;
}

function makeToken(type, lexeme, line, column) {
  return { type, lexeme, line, column };
}

function makeDiagnostic(message, startLine, startColumn, endLine, endColumn) {
  return { message, startLine, startColumn, endLine, endColumn };
}

function toVsCodeDiagnostic(document, diagnostic) {
  const start = new vscode.Position(diagnostic.startLine, diagnostic.startColumn);
  const end = new vscode.Position(diagnostic.endLine, diagnostic.endColumn);
  const range = document.validateRange(new vscode.Range(start, end));
  return new vscode.Diagnostic(range, diagnostic.message, vscode.DiagnosticSeverity.Error);
}

function tokenRange(document, token) {
  const start = new vscode.Position(token.line, token.column);
  const end = new vscode.Position(token.line, token.column + Math.max(token.lexeme.length, 1));
  return document.validateRange(new vscode.Range(start, end));
}

function isWhitespace(char) {
  return char === ' ' || char === '\t' || char === '\r' || char === '\n';
}

function isAlpha(char) {
  return /[A-Za-z_]/.test(char);
}

function isAlphaNumeric(char) {
  return /[A-Za-z0-9_]/.test(char);
}

function isDigit(char) {
  return /[0-9]/.test(char);
}

module.exports = {
  activate,
  deactivate
};
