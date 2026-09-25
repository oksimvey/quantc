#include "Parser.h"

#include <stdexcept>
#include <unordered_map>
#include <utility>

namespace quantc {
namespace {
const std::unordered_map<std::string, int> kPrecedence = {
    {"or", 1}, {"||", 1}, {"and", 2}, {"&&", 2}, {"==", 3}, {"!=", 3},
    {"<", 4}, {"<=", 4}, {">", 4}, {">=", 4}, {"+", 5}, {"-", 5},
    {"*", 6}, {"/", 6}, {"%", 6}, {"**", 7}
};
} // namespace

Parser::Parser(std::vector<Token> tokens) : tokens_(std::move(tokens)) {}

Program Parser::parseProgram() {
    Program program;
    skipTrivia();
    while (!check(TokenType::EndOfFile)) {
        if (checkLexeme("import")) {
            program.imports.push_back(parseImport());
        } else {
            const auto modifiers = parseModifiers();
            if (checkLexeme("class")) {
                program.classes.push_back(parseClass(modifiers));
            } else if (checkLexeme("auto") && peek(1).type == TokenType::Identifier) {
                if (modifiers.visibility != Visibility::Default || modifiers.mutability != Mutability::Mutable ||
                    modifiers.storage != Storage::Default || modifiers.isAbstract || modifiers.isOverride) {
                    fail(peek(), "Modifiers are not supported on auto declarations yet");
                }
                program.statements.push_back(parseAutoVariable());
            } else if (looksLikeTypedVariable()) {
                Statement statement;
                statement.kind = Statement::Kind::VariableDeclaration;
                statement.variable = parseTypedVariable(modifiers);
                program.statements.push_back(std::move(statement));
            } else if (modifiers.visibility != Visibility::Default ||
                       modifiers.mutability != Mutability::Mutable ||
                       modifiers.storage != Storage::Default || modifiers.isAbstract || modifiers.isOverride) {
                fail(peek(), "Modifiers are only valid on declarations");
            } else {
                program.statements.push_back(parseTopLevelStatement());
            }
        }
        skipTrivia();
    }
    return program;
}

Modifiers Parser::parseModifiers() {
    Modifiers modifiers;
    while (isModifier(peek().lexeme)) {
        const auto value = advance().lexeme;
        if (value == "public") modifiers.visibility = Visibility::Public;
        else if (value == "private") modifiers.visibility = Visibility::Private;
        else if (value == "const") modifiers.mutability = Mutability::Const;
        else if (value == "constexpr") modifiers.mutability = Mutability::Constexpr;
        else if (value == "mutable") modifiers.mutability = Mutability::Mutable;
        else if (value == "global") modifiers.storage = Storage::Global;
        else if (value == "local") modifiers.storage = Storage::Local;
        else if (value == "abstract") modifiers.isAbstract = true;
        else if (value == "override") modifiers.isOverride = true;
    }
    return modifiers;
}

ClassDecl Parser::parseClass(Modifiers modifiers) {
    advance();
    ClassDecl declaration;
    declaration.modifiers = modifiers;
    declaration.name = expectIdentifier("Expected class name after 'class'");
    expect(TokenType::LeftBrace, "Expected '{' after class name");
    skipTrivia();

    while (!check(TokenType::RightBrace) && !check(TokenType::EndOfFile)) {
        const auto fieldModifiers = parseModifiers();
        if (!looksLikeTypedVariable()) {
            fail(peek(), "Expected a field declaration inside class '" + declaration.name + "'");
        }
        declaration.fields.push_back(parseTypedVariable(fieldModifiers));
        skipTrivia();
    }

    expect(TokenType::RightBrace, "Expected '}' after class body");
    if (check(TokenType::Semicolon)) advance();
    return declaration;
}

ImportDecl Parser::parseImport() {
    advance();
    ImportDecl declaration;
    if (check(TokenType::String)) {
        declaration.name = advance().lexeme;
        if (declaration.name.size() >= 2) {
            declaration.name = declaration.name.substr(1, declaration.name.size() - 2);
        }
    } else {
        declaration.name = expectIdentifier("Expected module or class name after 'import'");
    }
    consumeTerminator();
    return declaration;
}

VariableDecl Parser::parseTypedVariable(Modifiers modifiers) {
    VariableDecl declaration;
    declaration.modifiers = modifiers;
    declaration.type = parseTypeRef();
    declaration.name = expectIdentifier("Expected variable name after type");
    if (matchLexeme("=")) declaration.initializer = parseExpression();
    consumeTerminator();
    return declaration;
}

Statement Parser::parseAutoVariable() {
    advance();
    Statement statement;
    statement.kind = Statement::Kind::Assignment;
    statement.assignment.name = expectIdentifier("Expected variable name after 'auto'");
    expect(TokenType::Operator, "Expected '=' in auto declaration");
    if (previous().lexeme != "=") fail(previous(), "Expected '=' in auto declaration");
    statement.assignment.value = parseExpression();
    consumeTerminator();
    return statement;
}

Statement Parser::parseTopLevelStatement() {
    if (peek().type == TokenType::Identifier && peek(1).lexeme == "=") {
        Statement statement;
        statement.kind = Statement::Kind::Assignment;
        statement.assignment.name = advance().lexeme;
        advance();
        statement.assignment.value = parseExpression();
        consumeTerminator();
        return statement;
    }

    Statement statement;
    statement.kind = Statement::Kind::Expression;
    statement.expression = parseExpression();
    consumeTerminator();
    return statement;
}

std::unique_ptr<Expr> Parser::parseExpression() { return parseBinary(1); }

std::unique_ptr<Expr> Parser::parseBinary(int minPrecedence) {
    auto left = parseUnary();
    while (true) {
        const auto it = kPrecedence.find(peek().lexeme);
        const int precedence = it == kPrecedence.end() ? 0 : it->second;
        if (precedence < minPrecedence) break;
        const std::string op = advance().lexeme;
        auto right = parseBinary(precedence + (op == "**" ? 0 : 1));
        auto binary = std::make_unique<Expr>();
        binary->kind = Expr::Kind::Binary;
        binary->value = op;
        binary->children.push_back(std::move(left));
        binary->children.push_back(std::move(right));
        left = std::move(binary);
    }
    return left;
}

std::unique_ptr<Expr> Parser::parseUnary() {
    if (checkLexeme("!") || checkLexeme("not") || checkLexeme("-") || checkLexeme("+")) {
        auto unary = std::make_unique<Expr>();
        unary->kind = Expr::Kind::Unary;
        unary->value = advance().lexeme;
        unary->children.push_back(parseUnary());
        return unary;
    }
    return parsePostfix();
}

std::unique_ptr<Expr> Parser::parsePostfix() {
    auto expression = parsePrimary();
    while (true) {
        if (match(TokenType::Dot)) {
            auto member = std::make_unique<Expr>();
            member->kind = Expr::Kind::MemberAccess;
            member->value = expectIdentifier("Expected member name after '.'");
            member->children.push_back(std::move(expression));
            expression = std::move(member);
            continue;
        }
        if (match(TokenType::LeftParen)) {
            auto call = std::make_unique<Expr>();
            call->kind = Expr::Kind::Call;
            call->children.push_back(std::move(expression));
            if (!check(TokenType::RightParen)) {
                do call->children.push_back(parseExpression()); while (match(TokenType::Comma));
            }
            expect(TokenType::RightParen, "Expected ')' after call arguments");
            expression = std::move(call);
            continue;
        }
        break;
    }
    return expression;
}

std::unique_ptr<Expr> Parser::parsePrimary() {
    const Token token = peek();

    if (matchLexeme("new")) {
        auto expression = std::make_unique<Expr>();
        expression->kind = Expr::Kind::New;
        expression->type = parseTypeRef();
        expect(TokenType::LeftParen, "Expected '(' after type in new expression");
        if (!check(TokenType::RightParen)) {
            do expression->children.push_back(parseExpression()); while (match(TokenType::Comma));
        }
        expect(TokenType::RightParen, "Expected ')' after constructor arguments");
        return expression;
    }

    if (token.type == TokenType::Number) {
        advance();
        auto expression = std::make_unique<Expr>();
        expression->kind = Expr::Kind::Number;
        expression->value = token.lexeme;
        return expression;
    }
    if (token.type == TokenType::String) {
        advance();
        auto expression = std::make_unique<Expr>();
        expression->kind = Expr::Kind::String;
        expression->value = token.lexeme;
        return expression;
    }
    if (token.type == TokenType::Character) {
        advance();
        auto expression = std::make_unique<Expr>();
        expression->kind = Expr::Kind::Character;
        expression->value = token.lexeme;
        return expression;
    }
    if (token.lexeme == "true" || token.lexeme == "false") {
        advance();
        auto expression = std::make_unique<Expr>();
        expression->kind = Expr::Kind::Boolean;
        expression->value = token.lexeme;
        return expression;
    }
    if (token.lexeme == "null") {
        advance();
        auto expression = std::make_unique<Expr>();
        expression->kind = Expr::Kind::Null;
        return expression;
    }
    if (match(TokenType::LeftParen)) {
        auto expression = parseExpression();
        expect(TokenType::RightParen, "Expected ')' after expression");
        return expression;
    }
    if (token.type == TokenType::Identifier) {
        advance();
        auto expression = std::make_unique<Expr>();
        expression->kind = Expr::Kind::Identifier;
        expression->value = token.lexeme;
        return expression;
    }

    fail(token, "Expected expression");
}

TypeRef Parser::parseTypeRef() {
    TypeRef type;
    type.name = expectIdentifier("Expected type name");
    if (match(TokenType::Less)) {
        if (!check(TokenType::Greater)) {
            do type.genericArgs.push_back(parseTypeRef()); while (match(TokenType::Comma));
        }
        expect(TokenType::Greater, "Expected '>' after generic type arguments");
    }
    return type;
}

bool Parser::looksLikeTypedVariable() const {
    if (peek().type != TokenType::Identifier) return false;
    std::size_t offset = 1;
    if (peek(offset).type == TokenType::Less) {
        int depth = 0;
        do {
            const auto& token = peek(offset++);
            if (token.type == TokenType::Less) ++depth;
            else if (token.type == TokenType::Greater) --depth;
            if (token.type == TokenType::EndOfFile) return false;
        } while (depth > 0);
    }
    return peek(offset).type == TokenType::Identifier;
}

bool Parser::isTerminator(const Token& token) const {
    return token.type == TokenType::Semicolon || token.type == TokenType::NewLine ||
           token.type == TokenType::EndOfFile || token.type == TokenType::RightBrace;
}

bool Parser::isModifier(const std::string& text) const {
    return text == "public" || text == "private" || text == "const" || text == "constexpr" ||
           text == "mutable" || text == "global" || text == "local" || text == "abstract" ||
           text == "override";
}

bool Parser::check(TokenType type) const { return peek().type == type; }
bool Parser::checkLexeme(const std::string& lexeme) const { return peek().lexeme == lexeme; }

bool Parser::match(TokenType type) {
    if (!check(type)) return false;
    advance();
    return true;
}

bool Parser::matchLexeme(const std::string& lexeme) {
    if (!checkLexeme(lexeme)) return false;
    advance();
    return true;
}

const Token& Parser::peek(std::size_t offset) const {
    const auto position = index_ + offset;
    return position < tokens_.size() ? tokens_[position] : tokens_.back();
}

const Token& Parser::previous() const { return index_ == 0 ? tokens_.front() : tokens_[index_ - 1]; }

const Token& Parser::advance() {
    if (!check(TokenType::EndOfFile)) ++index_;
    return previous();
}

const Token& Parser::expect(TokenType type, const std::string& message) {
    if (check(type)) return advance();
    fail(peek(), message);
}

std::string Parser::expectIdentifier(const std::string& message) {
    if (peek().type != TokenType::Identifier) fail(peek(), message);
    return advance().lexeme;
}

void Parser::consumeTerminator() {
    if (match(TokenType::Semicolon)) {
        while (match(TokenType::NewLine)) {}
        return;
    }
    if (match(TokenType::NewLine)) {
        while (match(TokenType::NewLine)) {}
        return;
    }
    if (!isTerminator(peek())) fail(peek(), "Expected ';' or end of line");
}

void Parser::skipTrivia() { while (match(TokenType::NewLine) || match(TokenType::Semicolon)) {} }

[[noreturn]] void Parser::fail(const Token& token, const std::string& message) const {
    throw std::runtime_error(
        message + " at " + std::to_string(token.line + 1) + ":" + std::to_string(token.column + 1) +
        (token.lexeme.empty() ? "" : " near '" + token.lexeme + "'"));
}

} // namespace quantc
