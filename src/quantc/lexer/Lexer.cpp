#include "Lexer.h"

#include <cctype>
#include <stdexcept>
#include <string_view>

namespace quantc {
namespace {
constexpr std::string_view kOperators[] = {
    "**=", "<<=", ">>=", "==", "!=", "<=", ">=", "++", "--", "+=", "-=", "*=", "/=", "%=",
    "&&", "||", "::", "=>", "<<", ">>", "**", "+", "-", "*", "/", "%", "=", "!", "&", "|", "^", "~", "?"
};

bool isIdentifierStart(char c) {
    return std::isalpha(static_cast<unsigned char>(c)) != 0 || c == '_';
}

bool isIdentifierPart(char c) {
    return std::isalnum(static_cast<unsigned char>(c)) != 0 || c == '_';
}
} // namespace

Lexer::Lexer(std::string source) : source_(std::move(source)) {}

std::vector<Token> Lexer::scan() {
    while (index_ < source_.size()) {
        scanOne();
    }
    tokens_.push_back({TokenType::EndOfFile, "", index_, line_, column_});
    return tokens_;
}

void Lexer::scanOne() {
    const char c = peek();
    if (c == ' ' || c == '\t' || c == '\r') {
        advance();
        return;
    }
    if (c == '\n') {
        emit(TokenType::NewLine);
        return;
    }
    if (c == '/' && peek(1) == '/') {
        while (index_ < source_.size() && peek() != '\n') advance();
        return;
    }
    if (c == '/' && peek(1) == '*') {
        scanBlockComment();
        return;
    }
    if (c == '"') {
        scanString(c, TokenType::String);
        return;
    }
    if (c == '\'') {
        scanString(c, TokenType::Character);
        return;
    }
    if (std::isdigit(static_cast<unsigned char>(c)) != 0) {
        scanNumber();
        return;
    }
    if (isIdentifierStart(c)) {
        scanIdentifier();
        return;
    }

    for (const auto op : kOperators) {
        if (startsWith(std::string(op))) {
            emit(TokenType::Operator, op.size());
            return;
        }
    }

    switch (c) {
        case '(': emit(TokenType::LeftParen); return;
        case ')': emit(TokenType::RightParen); return;
        case '{': emit(TokenType::LeftBrace); return;
        case '}': emit(TokenType::RightBrace); return;
        case '[': emit(TokenType::LeftBracket); return;
        case ']': emit(TokenType::RightBracket); return;
        case ',': emit(TokenType::Comma); return;
        case '.': emit(TokenType::Dot); return;
        case ':': emit(TokenType::Colon); return;
        case ';': emit(TokenType::Semicolon); return;
        case '<': emit(TokenType::Less); return;
        case '>': emit(TokenType::Greater); return;
        default:
            throw std::runtime_error(
                "Unexpected character '" + std::string(1, c) + "' at " +
                std::to_string(line_ + 1) + ":" + std::to_string(column_ + 1));
    }
}

void Lexer::scanIdentifier() {
    const std::size_t start = index_;
    const std::size_t line = line_;
    const std::size_t column = column_;
    while (isIdentifierPart(peek())) advance();
    tokens_.push_back({TokenType::Identifier, source_.substr(start, index_ - start), start, line, column});
}

void Lexer::scanNumber() {
    const std::size_t start = index_;
    const std::size_t line = line_;
    const std::size_t column = column_;

    while (std::isdigit(static_cast<unsigned char>(peek())) != 0) advance();
    if (peek() == '.' && std::isdigit(static_cast<unsigned char>(peek(1))) != 0) {
        advance();
        while (std::isdigit(static_cast<unsigned char>(peek())) != 0) advance();
    }

    tokens_.push_back({TokenType::Number, source_.substr(start, index_ - start), start, line, column});
}

void Lexer::scanString(char quote, TokenType type) {
    const std::size_t start = index_;
    const std::size_t line = line_;
    const std::size_t column = column_;
    advance();
    bool escaped = false;

    while (index_ < source_.size()) {
        const char c = peek();
        if (!escaped && c == quote) {
            advance();
            tokens_.push_back({type, source_.substr(start, index_ - start), start, line, column});
            return;
        }
        if (!escaped && c == '\n') {
            throw std::runtime_error(
                "Unterminated literal at " + std::to_string(line + 1) + ":" + std::to_string(column + 1));
        }
        escaped = !escaped && c == '\\';
        if (c != '\\') escaped = false;
        advance();
    }

    throw std::runtime_error(
        "Unterminated literal at " + std::to_string(line + 1) + ":" + std::to_string(column + 1));
}

void Lexer::scanBlockComment() {
    const std::size_t line = line_;
    const std::size_t column = column_;
    advance();
    advance();
    while (index_ < source_.size() && !(peek() == '*' && peek(1) == '/')) advance();
    if (index_ >= source_.size()) {
        throw std::runtime_error(
            "Unterminated block comment at " + std::to_string(line + 1) + ":" + std::to_string(column + 1));
    }
    advance();
    advance();
}

void Lexer::emit(TokenType type, std::size_t count) {
    const std::size_t start = index_;
    const std::size_t line = line_;
    const std::size_t column = column_;
    for (std::size_t i = 0; i < count; ++i) advance();
    tokens_.push_back({type, source_.substr(start, index_ - start), start, line, column});
}

void Lexer::advance() {
    const char c = index_ < source_.size() ? source_[index_++] : '\0';
    if (c == '\n') {
        ++line_;
        column_ = 0;
    } else {
        ++column_;
    }
}

char Lexer::peek(std::size_t offset) const {
    const auto position = index_ + offset;
    return position < source_.size() ? source_[position] : '\0';
}

bool Lexer::startsWith(const std::string& text) const {
    return source_.compare(index_, text.size(), text) == 0;
}

} // namespace quantc
