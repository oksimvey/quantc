#pragma once

#include "../ast/Ast.h"

#include <string>

namespace quantc {

class CppGenerator {
public:
    [[nodiscard]] std::string generate(const Program& program) const;

private:
    [[nodiscard]] std::string generateClass(const ClassDecl& declaration) const;
    [[nodiscard]] std::string generateField(const VariableDecl& declaration) const;
    [[nodiscard]] std::string generateStatement(const Statement& statement, int indent) const;
    [[nodiscard]] std::string generateExpression(const Expr& expression) const;
    [[nodiscard]] std::string generateType(const TypeRef& type) const;
    [[nodiscard]] std::string indent(int level) const;
};

} // namespace quantc
