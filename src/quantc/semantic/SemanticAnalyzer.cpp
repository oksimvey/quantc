#include "SemanticAnalyzer.h"

#include <stdexcept>
#include <unordered_set>

namespace quantc {

AnalysisResult SemanticAnalyzer::analyze(Program& program) {
    program_ = &program;
    AnalysisResult result;
    std::unordered_map<std::string, std::string> currentTypes;
    std::unordered_map<std::string, std::string> explicitTypes;

    for (auto& statement : program.statements) {
        if (statement.kind == Statement::Kind::VariableDeclaration) {
            const auto declaredType = statement.variable.type.name;
            explicitTypes[statement.variable.name] = declaredType;
            currentTypes[statement.variable.name] = declaredType;
            if (statement.variable.initializer) {
                const auto initializerType = analyzeExpression(*statement.variable.initializer, currentTypes);
                if (!initializerType.empty() && initializerType != declaredType) {
                    throw std::runtime_error(
                        "Cannot initialize '" + statement.variable.name + "' of type '" + declaredType +
                        "' with value of type '" + initializerType + "'");
                }
            }
            continue;
        }

        if (statement.kind == Statement::Kind::Assignment) {
            auto& assignment = statement.assignment;
            const auto assignedType = analyzeExpression(*assignment.value, currentTypes);
            assignment.assignedType = assignedType;

            const auto explicitIt = explicitTypes.find(assignment.name);
            if (explicitIt != explicitTypes.end()) {
                if (!assignedType.empty() && assignedType != explicitIt->second) {
                    throw std::runtime_error(
                        "Cannot assign value of type '" + assignedType + "' to '" + assignment.name +
                        "' of type '" + explicitIt->second + "'");
                }
                currentTypes[assignment.name] = explicitIt->second;
                continue;
            }

            assignment.inferredTarget = true;
            appendUnique(result.inferredVariables[assignment.name].possibleTypes, assignedType);
            currentTypes[assignment.name] = assignedType;
            continue;
        }

        if (statement.expression) {
            (void)analyzeExpression(*statement.expression, currentTypes);
        }
    }

    for (auto& [_, info] : result.inferredVariables) {
        info.dynamic = info.possibleTypes.size() > 1;
    }

    std::unordered_set<std::string> declared;
    for (auto& statement : program.statements) {
        if (statement.kind != Statement::Kind::Assignment || !statement.assignment.inferredTarget) continue;
        auto& assignment = statement.assignment;
        const auto& info = result.inferredVariables.at(assignment.name);
        assignment.declares = declared.insert(assignment.name).second;
        assignment.dynamic = info.dynamic;
        assignment.possibleTypes = info.possibleTypes;
    }

    return result;
}

std::string SemanticAnalyzer::analyzeExpression(
    Expr& expression,
    const std::unordered_map<std::string, std::string>& currentTypes) {
    switch (expression.kind) {
        case Expr::Kind::Identifier: {
            const auto it = currentTypes.find(expression.value);
            if (it != currentTypes.end()) expression.resolvedType = it->second;
            return expression.resolvedType;
        }
        case Expr::Kind::Number:
            expression.resolvedType = expression.value.find('.') == std::string::npos ? "int" : "double";
            return expression.resolvedType;
        case Expr::Kind::String:
            expression.resolvedType = "string";
            return expression.resolvedType;
        case Expr::Kind::Character:
            expression.resolvedType = "char";
            return expression.resolvedType;
        case Expr::Kind::Boolean:
            expression.resolvedType = "boolean";
            return expression.resolvedType;
        case Expr::Kind::Null:
            expression.resolvedType = "null";
            return expression.resolvedType;
        case Expr::Kind::New:
            for (auto& child : expression.children) (void)analyzeExpression(*child, currentTypes);
            expression.resolvedType = expression.type.name;
            if (!findClass(expression.resolvedType)) {
                throw std::runtime_error("Unknown class '" + expression.resolvedType + "'");
            }
            return expression.resolvedType;
        case Expr::Kind::MemberAccess: {
            if (expression.children.empty()) throw std::runtime_error("Invalid member access expression");
            const auto objectType = analyzeExpression(*expression.children.front(), currentTypes);
            const auto* classDecl = findClass(objectType);
            if (!classDecl) {
                throw std::runtime_error(
                    "Type '" + objectType + "' has no member '" + expression.value + "'");
            }
            const auto* field = findField(*classDecl, expression.value);
            if (!field) {
                throw std::runtime_error(
                    "Class '" + objectType + "' has no field '" + expression.value + "'");
            }
            if (field->modifiers.visibility == Visibility::Private) {
                throw std::runtime_error(
                    "Field '" + objectType + "." + expression.value + "' is private");
            }
            expression.resolvedType = field->type.name;
            return expression.resolvedType;
        }
        case Expr::Kind::Call: {
            if (expression.children.empty()) return {};
            auto& callee = *expression.children.front();
            for (std::size_t i = 1; i < expression.children.size(); ++i) {
                (void)analyzeExpression(*expression.children[i], currentTypes);
            }
            if (callee.kind == Expr::Kind::Identifier && callee.value == "print") {
                expression.resolvedType = "void";
                return expression.resolvedType;
            }
            (void)analyzeExpression(callee, currentTypes);
            return expression.resolvedType;
        }
        case Expr::Kind::Binary:
            if (expression.children.size() == 2) {
                const auto left = analyzeExpression(*expression.children[0], currentTypes);
                const auto right = analyzeExpression(*expression.children[1], currentTypes);
                expression.resolvedType = left == right ? left : "double";
            }
            return expression.resolvedType;
        case Expr::Kind::Unary:
            if (!expression.children.empty()) {
                expression.resolvedType = analyzeExpression(*expression.children.front(), currentTypes);
            }
            return expression.resolvedType;
    }
    return {};
}

const ClassDecl* SemanticAnalyzer::findClass(const std::string& name) const {
    if (!program_) return nullptr;
    for (const auto& declaration : program_->classes) {
        if (declaration.name == name) return &declaration;
    }
    return nullptr;
}

const VariableDecl* SemanticAnalyzer::findField(const ClassDecl& declaration, const std::string& name) const {
    for (const auto& field : declaration.fields) {
        if (field.name == name) return &field;
    }
    return nullptr;
}

void SemanticAnalyzer::appendUnique(std::vector<std::string>& values, const std::string& value) {
    if (value.empty()) return;
    for (const auto& existing : values) {
        if (existing == value) return;
    }
    values.push_back(value);
}

} // namespace quantc
