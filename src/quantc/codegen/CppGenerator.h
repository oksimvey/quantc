#pragma once

#include "../ast/Ast.h"
#include "../semantic/SemanticAnalyzer.h"

#include <string>
#include <vector>

namespace quantc {

struct GeneratedFile {
    std::string path;
    std::string content;
};

class CppGenerator {
public:
    explicit CppGenerator(const AnalysisResult& analysis);
    [[nodiscard]] std::vector<GeneratedFile> generate(const Program& program) const;

private:
    [[nodiscard]] std::string generateMain(const Program& program) const;
    [[nodiscard]] std::string generateClassHeader(const ClassDecl& declaration) const;
    [[nodiscard]] std::string generateField(const VariableDecl& declaration) const;
    [[nodiscard]] std::string generateStatement(const Statement& statement, int indentLevel) const;
    [[nodiscard]] std::string generateExpression(const Expr& expression) const;
    [[nodiscard]] std::string generateType(const TypeRef& type) const;
    [[nodiscard]] std::string generateTypeName(const std::string& typeName) const;
    [[nodiscard]] std::string generateVariantType(const std::vector<std::string>& types) const;
    [[nodiscard]] std::string indent(int level) const;
    [[nodiscard]] bool isDynamicVariable(const std::string& name) const;

    const AnalysisResult& analysis_;
};

} // namespace quantc
