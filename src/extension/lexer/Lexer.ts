import { TokenType, isTrivia } from "./TokenType";
import { Token } from "./Token";
import { LexerDiagnostic } from "./LexerDiagonistics";
import { LexerDiagnosticType } from "../diagonistic/LexerDiagnosticType"
import { DiagnosticSeverity } from "../diagonistic/DiagnosticSeverity"
import { BUILTINS, KEYWORDS, TYPES } from "./Keywords";

// ── Keyword sets ──────────────────────────────────────────────────────────────
// true/false/null are intentionally absent — they are classified as
// BooleanLiteral and NullLiteral respectively, not as Keyword tokens.



// Characters that begin a custom Unicode operator.
// Populated at startup from the language's operator registry.
// The Lexer checks this set before falling through to Unknown.
export const UNICODE_OPERATOR_CHARS = new Set<string>();

// ── Result ────────────────────────────────────────────────────────────────────

export interface LexerResult {
    tokens:      Token[];
    diagnostics: LexerDiagnostic[];
}

// ── Lexer ─────────────────────────────────────────────────────────────────────

export class Lexer {

    // ── Cursor state ──────────────────────────────────────────────────────────
    private pos    = 0;
    private line   = 1;
    private column = 1;

    private readonly tokens:      Token[]           = [];
    private readonly diagnostics: LexerDiagnostic[] = [];

    constructor(private readonly source: string) {}

    // ── Entry point ───────────────────────────────────────────────────────────

    tokenize(): LexerResult {

        while (!this.isAtEnd()) {
            this.scanToken();
        }

        this.emitAt(this.pos, TokenType.EOF, "");
        return { tokens: this.tokens, diagnostics: this.diagnostics };
    }

    // ── Main dispatch ─────────────────────────────────────────────────────────

    private scanToken(): void {

        const start = this.pos;
        const c     = this.advance();

        // ── Trivia ────────────────────────────────────────────────────────────

        if (c === "\n") {
            this.emitAt(start, TokenType.Newline, c);
            return;
        }

        if (c === "\r") {
            // treat \r\n as one Newline token
            this.match("\n");
            this.emitAt(start, TokenType.Newline, this.source.slice(start, this.pos));
            return;
        }

        if (c === " " || c === "\t") {
            // consume run of spaces/tabs as a single Whitespace token
            while (!this.isAtEnd() && (this.peek() === " " || this.peek() === "\t")) {
                this.advance();
            }
            this.emitAt(start, TokenType.Whitespace, this.source.slice(start, this.pos));
            return;
        }

        // ── Comments ──────────────────────────────────────────────────────────

        if (c === "/") {
            if (this.match("/")) { this.scanLineComment(start);  return; }
            if (this.match("*")) { this.scanBlockComment(start); return; }
            // fall through to operator handling below
            if      (this.match("=")) this.emitAt(start, TokenType.SlashEqual, "/=");
            else                      this.emitAt(start, TokenType.Slash, "/");
            return;
        }

        // ── Annotations ──────────────────────────────────────────────────────

        if (c === "@") { this.emitAt(start, TokenType.At, "@"); return; }

        // ── String & char literals ────────────────────────────────────────────

        if (c === '"') { this.scanString(start); return; }
        if (c === "'") { this.scanChar(start);   return; }

        // ── Numeric literals ──────────────────────────────────────────────────

        if (this.isDigit(c)) { this.scanNumber(start, c); return; }

        // ── Identifiers, keywords, types, builtins, booleans, null ───────────

        if (this.isIdentStart(c)) { this.scanIdentifier(start); return; }

        // ── Custom Unicode operators ──────────────────────────────────────────

        if (UNICODE_OPERATOR_CHARS.has(c)) {
            this.emitAt(start, TokenType.CustomOperator, c);
            return;
        }

        // ── Multi-character operators & punctuation ───────────────────────────

        switch (c) {

            // Arithmetic
            case "+":
                if      (this.match("+")) this.emitAt(start, TokenType.PlusPlus,   "++");
                else if (this.match("=")) this.emitAt(start, TokenType.PlusEqual,  "+=");
                else                      this.emitAt(start, TokenType.Plus,        "+");
                break;

            case "-":
                if      (this.match("-")) this.emitAt(start, TokenType.MinusMinus, "--");
                else if (this.match("=")) this.emitAt(start, TokenType.MinusEqual, "-=");
                else if (this.match(">")) this.emitAt(start, TokenType.Arrow,      "->");
                else                      this.emitAt(start, TokenType.Minus,       "-");
                break;

            case "*":
                if (this.peek() === "*") {
                    this.advance();
                    if (this.match("=")) this.emitAt(start, TokenType.StarStarEqual, "**=");
                    else                 this.emitAt(start, TokenType.StarStar,      "**");
                } else if (this.match("=")) {
                    this.emitAt(start, TokenType.StarEqual, "*=");
                } else {
                    this.emitAt(start, TokenType.Star, "*");
                }
                break;

            case "%":
                if (this.match("=")) this.emitAt(start, TokenType.PercentEqual, "%=");
                else                 this.emitAt(start, TokenType.Percent,      "%");
                break;

            // Comparison / assignment
            case "=":
                if      (this.match("=")) this.emitAt(start, TokenType.EqualEqual, "==");
                else if (this.match(">")) this.emitAt(start, TokenType.FatArrow,   "=>");
                else                      this.emitAt(start, TokenType.Equal,       "=");
                break;

            case "!":
                if (this.match("=")) this.emitAt(start, TokenType.BangEqual, "!=");
                else                 this.emitAt(start, TokenType.Bang,      "!");
                break;

            case "<":
                if (this.peek() === "<") {
                    this.advance();
                    if (this.match("=")) this.emitAt(start, TokenType.LessLessEqual, "<<=");
                    else                 this.emitAt(start, TokenType.LessLess,      "<<");
                } else if (this.match("=")) {
                    this.emitAt(start, TokenType.LessEqual, "<=");
                } else {
                    this.emitAt(start, TokenType.Less, "<");
                }
                break;

            case ">":
                if (this.peek() === ">") {
                    this.advance();
                    if (this.match("=")) this.emitAt(start, TokenType.GreaterGreaterEqual, ">>=");
                    else                 this.emitAt(start, TokenType.GreaterGreater,      ">>");
                } else if (this.match("=")) {
                    this.emitAt(start, TokenType.GreaterEqual, ">=");
                } else {
                    this.emitAt(start, TokenType.Greater, ">");
                }
                break;

            // Logical
            case "&":
                if      (this.match("&")) this.emitAt(start, TokenType.AmpersandAmpersand, "&&");
                else if (this.match("=")) this.emitAt(start, TokenType.AmpersandEqual,     "&=");
                else                      this.emitAt(start, TokenType.Ampersand,           "&");
                break;

            case "|":
                if      (this.match("|")) this.emitAt(start, TokenType.PipePipe,  "||");
                else if (this.match("=")) this.emitAt(start, TokenType.PipeEqual, "|=");
                else                      this.emitAt(start, TokenType.Pipe,       "|");
                break;

            case "^":
                if (this.match("=")) this.emitAt(start, TokenType.CaretEqual, "^=");
                else                 this.emitAt(start, TokenType.Caret,      "^");
                break;

            case "~": this.emitAt(start, TokenType.Tilde, "~"); break;

            // Null-safety & ternary
            case "?":
                if      (this.match("?")) this.emitAt(start, TokenType.QuestionQuestion, "??");
                else if (this.match(".")) this.emitAt(start, TokenType.QuestionDot,      "?.");
                else if (this.match(":")) this.emitAt(start, TokenType.QuestionColon,    "?:");
                else                      this.emitAt(start, TokenType.Question,          "?");
                break;

            // Dots & ranges
            case ".":
                if (this.peek() === ".") {
                    this.advance();
                    if (this.match(".")) this.emitAt(start, TokenType.DotDotDot, "...");
                    else                 this.emitAt(start, TokenType.DotDot,    "..");
                } else {
                    this.emitAt(start, TokenType.Dot, ".");
                }
                break;

            // Colon
            case ":":
                if (this.match(":")) this.emitAt(start, TokenType.ColonColon, "::");
                else                 this.emitAt(start, TokenType.Colon,      ":");
                break;

            // Simple punctuation
            case ",": this.emitAt(start, TokenType.Comma,    ","); break;
            case ";": this.emitAt(start, TokenType.Semicolon, ";"); break;

            // Grouping
            case "(": this.emitAt(start, TokenType.LParen,   "("); break;
            case ")": this.emitAt(start, TokenType.RParen,   ")"); break;
            case "{": this.emitAt(start, TokenType.LBrace,   "{"); break;
            case "}": this.emitAt(start, TokenType.RBrace,   "}"); break;
            case "[": this.emitAt(start, TokenType.LBracket, "["); break;
            case "]": this.emitAt(start, TokenType.RBracket, "]"); break;

            // Unknown — emit a token and recover
            default:
                this.emitAt(start, TokenType.Unknown, c);
                this.error(
                    start,
                    `Unexpected character '${c}'`,
                    LexerDiagnosticType.InvalidCharacter
                );
                break;
        }
    }

    // ── Sub-scanners ──────────────────────────────────────────────────────────

    private scanLineComment(start: number): void {
        while (!this.isAtEnd() && this.peek() !== "\n") this.advance();
        this.emitAt(start, TokenType.LineComment, this.source.slice(start, this.pos));
    }

    private scanBlockComment(start: number): void {
        while (!this.isAtEnd()) {
            if (this.advance() === "*" && this.peek() === "/") {
                this.advance(); // consume '/'
                this.emitAt(start, TokenType.BlockComment, this.source.slice(start, this.pos));
                return;
            }
        }
        // Reached EOF without closing */
        this.emitAt(start, TokenType.BlockComment, this.source.slice(start, this.pos));
        this.error(
            start,
            "Unterminated block comment",
            LexerDiagnosticType.InvalidEscapeSequence,
            "Add a closing */"
        );
    }

    private scanString(start: number): void {
        while (!this.isAtEnd() && this.peek() !== '"') {
            if (this.peek() === "\\") {
                this.advance(); // skip the backslash
                this.advance(); // skip the escaped character
                continue;
            }
            if (this.peek() === "\n") {
                // Don't consume the newline — let the next scanToken handle it
                // so line/column tracking stays correct.
                this.emitAt(start, TokenType.StringLiteral, this.source.slice(start, this.pos));
                this.error(
                    start,
                    "Unterminated string literal",
                    LexerDiagnosticType.UnterminatedString,
                    "Close the string before the line break"
                );
                return;
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            this.emitAt(start, TokenType.StringLiteral, this.source.slice(start, this.pos));
            this.error(
                start,
                "Unterminated string literal",
                LexerDiagnosticType.UnterminatedString,
                "Add a closing \""
            );
            return;
        }

        this.advance(); // closing "
        this.emitAt(start, TokenType.StringLiteral, this.source.slice(start, this.pos));
    }

    private scanChar(start: number): void {
        // A char literal is exactly one character (or one escape sequence)
        // between single quotes: 'a'  '\n'  '\\'
        if (!this.isAtEnd() && this.peek() === "\\") {
            this.advance(); // backslash
            this.advance(); // escaped char
        } else if (!this.isAtEnd() && this.peek() !== "'") {
            this.advance();
        }

        if (this.isAtEnd() || this.peek() !== "'") {
            this.emitAt(start, TokenType.CharLiteral, this.source.slice(start, this.pos));
            this.error(
                start,
                "Unterminated or malformed char literal",
                LexerDiagnosticType.InvalidCharacter,
                "A char literal must contain exactly one character: 'a'"
            );
            return;
        }

        this.advance(); // closing '
        this.emitAt(start, TokenType.CharLiteral, this.source.slice(start, this.pos));
    }

    private scanNumber(start: number, first: string): void {

        // ── Hex: 0xFF ─────────────────────────────────────────────────────────
        if (first === "0" && (this.peek() === "x" || this.peek() === "X")) {
            this.advance(); // consume 'x'
            if (!this.isHexDigit(this.peek())) {
                this.error(
                    start,
                    "Invalid hex literal — expected at least one hex digit after '0x'",
                    LexerDiagnosticType.InvalidNumberFormat
                );
            }
            while (!this.isAtEnd() && this.isHexDigit(this.peek())) this.advance();
            this.consumeNumberSuffix();
            this.emitAt(start, TokenType.NumberLiteral, this.source.slice(start, this.pos));
            return;
        }

        // ── Binary: 0b1010 ────────────────────────────────────────────────────
        if (first === "0" && (this.peek() === "b" || this.peek() === "B")) {
            this.advance(); // consume 'b'
            if (this.peek() !== "0" && this.peek() !== "1") {
                this.error(
                    start,
                    "Invalid binary literal — expected at least one binary digit after '0b'",
                    LexerDiagnosticType.InvalidNumberFormat
                );
            }
            while (!this.isAtEnd() && (this.peek() === "0" || this.peek() === "1")) this.advance();
            this.consumeNumberSuffix();
            this.emitAt(start, TokenType.NumberLiteral, this.source.slice(start, this.pos));
            return;
        }

        // ── Decimal integer or float ──────────────────────────────────────────
        while (!this.isAtEnd() && this.isDigit(this.peek())) this.advance();

        // Optional fractional part
        if (this.peek() === "." && this.isDigit(this.peekNext())) {
            this.advance(); // consume '.'
            while (!this.isAtEnd() && this.isDigit(this.peek())) this.advance();
        }

        // Optional exponent: e+10  E-3
        if (this.peek() === "e" || this.peek() === "E") {
            this.advance();
            if (this.peek() === "+" || this.peek() === "-") this.advance();
            if (!this.isDigit(this.peek())) {
                this.error(
                    start,
                    "Invalid numeric exponent",
                    LexerDiagnosticType.InvalidNumberFormat,
                    "Expected digits after exponent symbol, e.g. 1e10"
                );
            }
            while (!this.isAtEnd() && this.isDigit(this.peek())) this.advance();
        }

        this.consumeNumberSuffix();
        this.emitAt(start, TokenType.NumberLiteral, this.source.slice(start, this.pos));
    }

    // Consumes an optional type suffix: L l f F
    // These narrow the type during semantic analysis:
    //   L/l → long,  f/F → float  (no suffix = int or double by context)
    private consumeNumberSuffix(): void {
        const p = this.peek();
        if (p === "L" || p === "l" || p === "f" || p === "F") this.advance();
    }

    private scanIdentifier(start: number): void {
        while (!this.isAtEnd() && this.isIdentContinue(this.peek())) this.advance();

        const lexeme = this.source.slice(start, this.pos);

        // Classify in priority order:
        //   1. boolean literals   (true / false)
        //   2. null literal       (null)
        //   3. reserved keyword
        //   4. primitive / collection type
        //   5. builtin function
        //   6. plain identifier
        if (lexeme === "true" || lexeme === "false") {
            this.emitAt(start, TokenType.BooleanLiteral, lexeme);
        } else if (lexeme === "null") {
            this.emitAt(start, TokenType.NullLiteral, lexeme);
        } else if (KEYWORDS.has(lexeme)) {   // imported from your existing Lexer.ts
            this.emitAt(start, TokenType.Keyword, lexeme);
        } else if (TYPES.has(lexeme)) {
            this.emitAt(start, TokenType.Type, lexeme);
        } else if (BUILTINS.has(lexeme)) {
            this.emitAt(start, TokenType.Builtin, lexeme);
        } else {
            this.emitAt(start, TokenType.Identifier, lexeme);
        }
    }

    // ── Primitives ────────────────────────────────────────────────────────────

    /**
     * Consumes and returns the current character, advancing pos/line/column.
     */
    private advance(): string {
        const c = this.source[this.pos++];
        if (c === "\n") {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
        return c;
    }

    /**
     * Returns the current character without consuming it.
     * Returns '\0' at end-of-file so callers don't need null checks.
     */
    private peek(): string {
        return this.source[this.pos] ?? "\0";
    }

    /**
     * Returns the character one ahead of the cursor without consuming.
     */
    private peekNext(): string {
        return this.source[this.pos + 1] ?? "\0";
    }

    private isAtEnd(): boolean {
        return this.pos >= this.source.length;
    }

    /**
     * If the current character equals `expected`, consumes it and returns true.
     * Otherwise does nothing and returns false.
     */
    private match(expected: string): boolean {
        if (this.peek() !== expected) return false;
        this.advance();
        return true;
    }

    // ── Emit & error ──────────────────────────────────────────────────────────

    /**
     * Creates a Token and appends it to the token stream.
     * `start` is the absolute source offset where the token begins.
     * `line` and `column` reflect the position AFTER advancing — we subtract
     * lexeme.length from column to recover the start column.
     */
    private emitAt(start: number, type: TokenType, lexeme: string): void {
        this.tokens.push({
            type,
            lexeme,
            start,
            end:    this.pos,
            line:   this.line,
            column: this.column - lexeme.length,
        });
    }

    /**
     * Records a diagnostic anchored to the source offset `start`.
     * A synthetic Token is constructed so the diagnostic always has
     * a valid location for the IDE to underline.
     */
    private error(
        start:   number,
        message: string,
        code:    LexerDiagnosticType,
        hint?:   string
    ): void {
        const token: Token = {
            type:   TokenType.Unknown,
            lexeme: this.source.slice(start, Math.max(start + 1, this.pos)),
            start,
            end:    Math.max(start + 1, this.pos),
            line:   this.line,
            column: this.column,
        };
        this.diagnostics.push({
            message,
            code,
            severity: DiagnosticSeverity.Error,
            token,
            hint,
        });
    }

    // ── Character classification ──────────────────────────────────────────────

    private isDigit(c: string):        boolean { return c >= "0" && c <= "9"; }
    private isHexDigit(c: string):     boolean { return /[0-9a-fA-F]/.test(c); }
    private isIdentStart(c: string):   boolean { return /[A-Za-z_]/.test(c); }
    private isIdentContinue(c: string):boolean { return /[A-Za-z0-9_]/.test(c); }
}