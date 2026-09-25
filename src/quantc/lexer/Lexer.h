#pragma once

#include "Token.h"

#include <string>
#include <vector>

namespace quantc {

class Lexer {
public:
    explicit Lexer(std::string source);

    [[nodiscard]] std::vector<Token> scan();

private:
    void scanOne();
    void scanIdentifier();
    void scanNumber();
    void scanString(char quote, TokenType type);
    void scanBlockComment();
    void emit(TokenType type, std::size_t count = 1);
    void advance();

    [[nodiscard]] char peek(std::size_t offset = 0) const;
    [[nodiscard]] bool startsWith(const std::string& text) const;

    std::string source_;
    std::size_t index_{};
    std::size_t line_{};
    std::size_t column_{};
    std::vector<Token> tokens_;
};

} // namespace quantc
