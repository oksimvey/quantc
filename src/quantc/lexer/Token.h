#pragma once

#include <cstddef>
#include <string>

namespace quantc {

enum class TokenType {
    Identifier,
    Number,
    String,
    Character,
    NewLine,
    LeftParen,
    RightParen,
    LeftBrace,
    RightBrace,
    LeftBracket,
    RightBracket,
    Comma,
    Dot,
    Colon,
    Semicolon,
    Less,
    Greater,
    Operator,
    EndOfFile
};

struct Token {
    TokenType type{TokenType::EndOfFile};
    std::string lexeme;
    std::size_t offset{};
    std::size_t line{};
    std::size_t column{};
};

} // namespace quantc
