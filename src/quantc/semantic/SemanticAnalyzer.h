#pragma once

#include "../ast/Ast.h"

#include <string>
#include <unordered_map>
#include <vector>

namespace quantc {

struct InferredVariableInfo {
    std::vector<std::string> possibleTypes;
    bool dynamic{false};
};

struct AnalysisResult {
    std::unordered_map<std::string, InferredVariableInfo> inferredVariables;
};

class SemanticAnalyzer {
public:
    [[nodiscard]] AnalysisResult analyze(Program& program);

private:
    [[nodiscard]] std::string analyzeExpression(
        Expr& expression,
        const std::unordered_map<std::string, std::string>& currentTypes);
    [[nodiscard]] const ClassDecl* findClass(const std::string& name) const;
    [[nodiscard]] const VariableDecl* findField(const ClassDecl& declaration, const std::string& name) const;
    static void appendUnique(std::vector<std::string>& values, const std::string& value);

    Program* program_{};
};

} // namespace quantc
