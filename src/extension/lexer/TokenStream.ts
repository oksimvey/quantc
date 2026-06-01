import { Token } from "../lexer/Token";
import { TokenType, isTrivia } from "../lexer/TokenType";

// ── Checkpoint ────────────────────────────────────────────────────────────────
// An opaque cursor snapshot used for speculative parsing.
// Obtain one with save(), restore it with restore() if the parse attempt fails.

export type Checkpoint = number & { readonly __brand: "Checkpoint" };

// ── TokenStream ───────────────────────────────────────────────────────────────

export class TokenStream {

    // The full token array from the Lexer, including trivia.
    // We keep trivia so tooling (formatter, hover) can access it via trivia().
    private readonly tokens: readonly Token[];

    // Index of the current non-trivia token.
    private cursor: number = 0;

    // The last token returned by advance().
    // Starts as a synthetic EOF so the parser never has to null-check it.
    private _previous: Token;

    constructor(tokens: readonly Token[]) {
        this.tokens = tokens;

        // Seed _previous as a synthetic EOF at position 0.
        // The parser reads _previous after every advance() call to build
        // AST node end positions — having a valid token here avoids null checks.
        this._previous = this.makeSyntheticEOF();

        // Move cursor to the first non-trivia token.
        this.skipTrivia();
    }

    // ── Core reads ────────────────────────────────────────────────────────────

    /**
     * Returns the current non-trivia token without consuming it.
     * Always safe to call — returns EOF at end of stream.
     */
    peek(): Token {
        return this.tokens[this.cursor] ?? this.makeSyntheticEOF();
    }

    /**
     * Returns the non-trivia token `offset` positions ahead of the cursor.
     * peek(0) === peek(), peek(1) is one ahead, etc.
     * Scans forward over trivia to find the nth non-trivia token.
     *
     * Use sparingly — O(n) over the raw token array.
     * For most grammar rules peek() and peekAt(1) are sufficient.
     */
    peekAt(offset: number): Token {
        let count = 0;
        for (let i = this.cursor; i < this.tokens.length; i++) {
            if (isTrivia(this.tokens[i].type)) continue;
            if (count === offset) return this.tokens[i];
            count++;
        }
        return this.makeSyntheticEOF();
    }

    /**
     * Consumes and returns the current non-trivia token, then advances the
     * cursor past the next run of trivia.
     */
    advance(): Token {
        const token = this.peek();
        if (token.type !== TokenType.EOF) {
            this._previous = token;
            this.cursor++;
            this.skipTrivia();
        }
        return token;
    }

    /**
     * The last token returned by advance().
     * Useful for building AST node end positions:
     *   const node = parseExpr();
     *   // stream.previous() is the last token the expression consumed
     */
    previous(): Token {
        return this._previous;
    }

    // ── Conditional reads ─────────────────────────────────────────────────────

    /**
     * If the current token's type matches, consumes it and returns true.
     * Otherwise does nothing and returns false.
     *
     *   if (stream.match(TokenType.Semicolon)) { ... }
     */
    match(type: TokenType): boolean {
        if (this.peek().type !== type) return false;
        this.advance();
        return true;
    }

    /**
     * Variant of match() that accepts several types at once.
     * Consumes and returns true if the current token matches any of them.
     *
     *   if (stream.matchAny(TokenType.Plus, TokenType.Minus)) { ... }
     */
    matchAny(...types: TokenType[]): boolean {
        if (!types.includes(this.peek().type)) return false;
        this.advance();
        return true;
    }

    /**
     * Checks the current token type without consuming.
     */
    check(type: TokenType): boolean {
        return this.peek().type === type;
    }

    /**
     * Checks whether the stream has reached EOF.
     */
    isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    // ── Expect (parser assertion) ─────────────────────────────────────────────

    /**
     * Consumes the current token if it matches `type` and returns it.
     * If it does NOT match, returns undefined and calls the provided
     * `onError` callback so the parser can emit a diagnostic and recover.
     *
     * The callback receives the actual token that was found so the parser
     * can produce a precise error message:
     *
     *   const brace = stream.expect(TokenType.LBrace, token =>
     *       diagnostics.push(missingOpenBrace(token))
     *   );
     */
    expect(
        type:    TokenType,
        onError: (found: Token) => void
    ): Token | undefined {
        if (this.peek().type === type) {
            return this.advance();
        }
        onError(this.peek());
        return undefined;
    }

    // ── Checkpoint / backtrack ────────────────────────────────────────────────
    // Used for speculative parsing — try to parse a construct, and if it
    // doesn't match, restore the cursor to where you started.
    //
    // Example: disambiguating  foo<int>  (generic) from  foo < int  (comparison)
    //
    //   const cp = stream.save();
    //   const generic = tryParseGenericArgs(stream);
    //   if (!generic) stream.restore(cp);

    save(): Checkpoint {
        return this.cursor as Checkpoint;
    }

    restore(checkpoint: Checkpoint): void {
        this.cursor = checkpoint;
        // Re-derive _previous: the non-trivia token just before the checkpoint.
        this._previous = this.findPreviousNonTrivia(checkpoint) ?? this.makeSyntheticEOF();
        // The cursor at a checkpoint always points to a non-trivia token
        // (save() is always called on a valid cursor position), so no
        // skipTrivia() call is needed here.
    }

    // ── Trivia access ─────────────────────────────────────────────────────────

    /**
     * Returns all trivia tokens (whitespace, comments) that appear immediately
     * before the token at `index` in the raw token array.
     *
     * Used by the formatter and hover provider to preserve/inspect comments.
     *
     *   const leading = stream.leadingTrivia(stream.peek());
     */
    leadingTrivia(token: Token): Token[] {
        // Find the raw index of this token
        const rawIndex = this.tokens.indexOf(token);
        if (rawIndex === -1) return [];

        const trivia: Token[] = [];
        for (let i = rawIndex - 1; i >= 0; i--) {
            if (!isTrivia(this.tokens[i].type)) break;
            trivia.unshift(this.tokens[i]);
        }
        return trivia;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    /**
     * Advances `cursor` past any trivia tokens, stopping at the next
     * non-trivia token or at the end of the array.
     */
    private skipTrivia(): void {
        while (
            this.cursor < this.tokens.length &&
            isTrivia(this.tokens[this.cursor].type)
        ) {
            this.cursor++;
        }
    }

    /**
     * Walks backward from `index` to find the nearest non-trivia token.
     * Used by restore() to recover a valid _previous reference.
     */
    private findPreviousNonTrivia(index: number): Token | undefined {
        for (let i = index - 1; i >= 0; i--) {
            if (!isTrivia(this.tokens[i].type)) return this.tokens[i];
        }
        return undefined;
    }

    /**
     * Produces a synthetic EOF token anchored at the end of the last real token.
     * Ensures peek() and previous() always return a structurally valid Token.
     */
    private makeSyntheticEOF(): Token {
        const last = this.tokens[this.tokens.length - 1];
        return {
            type:   TokenType.EOF,
            lexeme: "",
            start:  last?.end    ?? 0,
            end:    last?.end    ?? 0,
            line:   last?.line   ?? 1,
            column: last?.column ?? 0,
        };
    }
}