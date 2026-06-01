export enum LexerDiagnosticType {
    UnterminatedString = "LEX_UNTERMINATED_STRING",
    InvalidCharacter = "LEX_INVALID_CHARACTER",
    InvalidNumberFormat = "LEX_INVALID_NUMBER_FORMAT",
    UnexpectedEOF = "LEX_UNEXPECTED_EOF",
    InvalidEscapeSequence = "LEX_INVALID_ESCAPE_SEQUENCE",
}