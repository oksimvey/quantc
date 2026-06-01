export enum TokenType {

    // ── Trivia ────────────────────────────────────────────────────────────────
    // Kept in the token stream so formatters and hover providers can use them.
    // The parser skips all trivia tokens via a helper.
    Whitespace,
    Newline,
    LineComment,
    BlockComment,

    // ── Identifiers & reserved words ─────────────────────────────────────────
    Identifier,
    Keyword,
    Type,
    Builtin,

    // ── Literals ─────────────────────────────────────────────────────────────
    // A single NumberLiteral covers all numeric types (byte, short, int, long,
    // float, double). The lexeme encodes enough information for the semantic
    // analyser to narrow the type:
    //   42        → integer, no suffix
    //   42L/42l   → explicitly long
    //   3.14      → floating-point, no suffix  (float or double by context)
    //   3.14f     → explicitly float
    //   0xFF      → hex integer
    //   0b1010    → binary integer
    NumberLiteral,
    StringLiteral,
    CharLiteral,
    BooleanLiteral, // true | false  (removed from KEYWORDS to avoid dual classification)
    NullLiteral,    // null          (same reason)

    // ── Arithmetic operators ──────────────────────────────────────────────────
    Plus,       // +
    Minus,      // -
    Star,       // *
    Slash,      // /
    Percent,    // %
    StarStar,   // **

    // ── Assignment operators ──────────────────────────────────────────────────
    // NOTE: isAssignment() relies on these being contiguous in declaration order.
    // Do not insert unrelated tokens between Equal and GreaterGreaterEqual.
    Equal,               // =
    PlusEqual,           // +=
    MinusEqual,          // -=
    StarEqual,           // *=
    SlashEqual,          // /=
    PercentEqual,        // %=
    StarStarEqual,       // **=
    AmpersandEqual,      // &=
    PipeEqual,           // |=
    CaretEqual,          // ^=
    LessLessEqual,       // <<=
    GreaterGreaterEqual, // >>=

    // ── Comparison operators ──────────────────────────────────────────────────
    EqualEqual,   // ==
    BangEqual,    // !=
    Less,         // <
    LessEqual,    // <=
    Greater,      // >
    GreaterEqual, // >=

    // ── Logical operators ─────────────────────────────────────────────────────
    AmpersandAmpersand, // &&
    PipePipe,           // ||
    Bang,               // !

    // ── Bitwise operators ─────────────────────────────────────────────────────
    Ampersand,      // &
    Pipe,           // |
    Caret,          // ^
    Tilde,          // ~
    LessLess,       // <<
    GreaterGreater, // >>

    // ── Increment / decrement ─────────────────────────────────────────────────
    PlusPlus,   // ++
    MinusMinus, // --

    // ── Arrows ────────────────────────────────────────────────────────────────
    Arrow,    // ->   return type annotation:  function foo() -> int
    FatArrow, // =>   lambda / expression body: (x) => x * 2

    // ── Null-safety & ternary ─────────────────────────────────────────────────
    Question,         // ?
    QuestionQuestion, // ??
    QuestionDot,      // ?.
    QuestionColon,    // ?:   Elvis operator

    // ── Annotations ──────────────────────────────────────────────────────────
    At, // @   e.g. @Override, @Deprecated

    // ── Punctuation ───────────────────────────────────────────────────────────
    Dot,        // .
    DotDot,     // ..
    DotDotDot,  // ...
    Comma,      // ,
    Colon,      // :
    ColonColon, // ::
    Semicolon,  // ;

    // ── Grouping ──────────────────────────────────────────────────────────────
    LParen,   // (
    RParen,   // )
    LBrace,   // {
    RBrace,   // }
    LBracket, // [
    RBracket, // ]

    // ── Custom Unicode operators ──────────────────────────────────────────────
    // Emitted when the Lexer matches a registered Unicode symbol (e.g. √, ∑).
    // token.lexeme holds the symbol; the Parser looks it up in the operator registry.
    CustomOperator,

    // ── Special ───────────────────────────────────────────────────────────────
    Unknown, // Unrecognised character — Lexer recovers and continues.
    EOF,
}

// ── Token-group helpers ───────────────────────────────────────────────────────
// Used by the parser (skip trivia), formatter (spacing rules), and highlighter.

export function isTrivia(t: TokenType): boolean {
    return t === TokenType.Whitespace
        || t === TokenType.Newline
        || t === TokenType.LineComment
        || t === TokenType.BlockComment;
}

export function isLiteral(t: TokenType): boolean {
    return t === TokenType.NumberLiteral
        || t === TokenType.StringLiteral
        || t === TokenType.CharLiteral
        || t === TokenType.BooleanLiteral
        || t === TokenType.NullLiteral;
}

// FRAGILE: relies on assignment operators being contiguous in the enum.
// If you add a new token inside the Equal..GreaterGreaterEqual range, update this.
export function isAssignment(t: TokenType): boolean {
    return t >= TokenType.Equal && t <= TokenType.GreaterGreaterEqual;
}

export function isComparisonOperator(t: TokenType): boolean {
    return t === TokenType.EqualEqual
        || t === TokenType.BangEqual
        || t === TokenType.Less
        || t === TokenType.LessEqual
        || t === TokenType.Greater
        || t === TokenType.GreaterEqual;
}

export function isBitwiseOperator(t: TokenType): boolean {
    return t === TokenType.Ampersand
        || t === TokenType.Pipe
        || t === TokenType.Caret
        || t === TokenType.Tilde
        || t === TokenType.LessLess
        || t === TokenType.GreaterGreater;
}