#pragma once

#include "../ast/Ast.h"
#include "../lexer/Token.h"

#include <cstddef>
#include <memory>
#include <string>
#include <vector>

namespace quantc {

class Parser {
public:
    explicit Parser(std::vector<Token> tokens);

    [[nodiscard]] Program parseProgram();

private:
    [[nodiscard]] Modifiers parseModifiers();
    [[nodiscard]] ClassDecl parseClass(Modifiers modifiers);
    [[nodiscard]] ImportDecl parseImport();
    [[nodiscard]] VariableDecl parseTypedVariable(Modifiers modifiers);
    [[nodiscard]] Statement parseTopLevelStatement();

    [[nodiscard]] std::unique_ptr<Expr> parseExpression();
    [[nodiscard]] std::unique_ptr<Expr> parseBinary(int minPrecedence);
    [[nodiscard]] std::unique_ptr<Expr> parseUnary();
    [[nodiscard]] std::unique_ptr<Expr> parsePostfix();
    [[nodiscard]] std::unique_ptr<Expr> parsePrimary();
    [[nodiscard]] TypeRef parseTypeRef();

    [[nodiscard]] bool looksLikeTypedVariable() const;
    [[nodiscard]] bool isTerminator(const Token& token) const;
    [[nodiscard]] bool isModifier(const std::string& text) const;
    [[nodiscard]] bool check(TokenType type) const;
    [[nodiscard]] bool checkLexeme(const std::string& lexeme) const;
    [[nodiscard]] bool match(TokenType type);
    [[nodiscard]] bool matchLexeme(const std::string& lexeme);
    [[nodiscard]] const Token& peek(std::size_t offset = 0) const;
    [[nodiscard]] const Token& previous() const;
    const Token& advance();
    const Token& expect(TokenType type, const std::string& message);
    std::string expectIdentifier(const std::string& message);
    void consumeTerminator();
    void skipTrivia();
    [[noreturn]] void fail(const Token& token, const std::string& message) const;

    std::vector<Token> tokens_;
    std::size_t index_{};
};

} // namespace quantc
