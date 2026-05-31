export enum TokenType {

    // ── Trivia ────────────────────────────────────────────────────────────────
    Whitespace,
    Newline,
    LineComment,
    BlockComment,

    // ── Identifiers & reserved words ─────────────────────────────────────────
    Identifier,
    Keyword,
    Type,
    Builtin,
    BooleanLiteral,
    NullLiteral,

    // ── Literals ─────────────────────────────────────────────────────────────
    IntegerLiteral,
    FloatLiteral,
    StringLiteral,
    CharLiteral,

    // ── Arithmetic operators ──────────────────────────────────────────────────
    Plus,        // +
    Minus,       // -
    Star,        // *
    Slash,       // /
    Percent,     // %
    StarStar,    // **

    // ── Assignment operators ──────────────────────────────────────────────────
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

    // ── Null-safety & ternary ─────────────────────────────────────────────────
    Question,         // ?
    QuestionQuestion, // ??
    QuestionDot,      // ?.
    QuestionColon,    // ?:

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
    CustomOperator,

    // ── Special ──────────────────────────────────────────────────────────────
    Unknown,
    EOF,
}