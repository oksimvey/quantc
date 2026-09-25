#include "Compiler.h"

#include "codegen/CppGenerator.h"
#include "lexer/Lexer.h"
#include "parser/Parser.h"

#include <fstream>
#include <sstream>
#include <stdexcept>
#include <utility>

namespace quantc {

std::string Compiler::transpileFile(const std::filesystem::path& inputPath) {
    std::unordered_set<std::string> visited;
    auto program = loadProgram(inputPath, visited);
    return CppGenerator{}.generate(program);
}

Program Compiler::loadProgram(
    const std::filesystem::path& inputPath,
    std::unordered_set<std::string>& visited) {
    const auto absolute = std::filesystem::absolute(inputPath).lexically_normal();
    const auto key = absolute.string();
    if (visited.contains(key)) return {};
    visited.insert(key);

    const auto source = readFile(absolute);
    Parser parser(Lexer(source).scan());
    Program current = parser.parseProgram();
    Program merged;

    for (const auto& import : current.imports) {
        bool alreadyDeclared = false;
        for (const auto& declaration : current.classes) {
            if (declaration.name == import.name) {
                alreadyDeclared = true;
                break;
            }
        }
        if (alreadyDeclared) continue;

        std::filesystem::path importedPath = import.name;
        if (importedPath.extension().empty()) importedPath += ".qc";
        if (importedPath.is_relative()) importedPath = absolute.parent_path() / importedPath;
        if (!std::filesystem::exists(importedPath)) {
            throw std::runtime_error(
                "Unable to resolve import '" + import.name + "' from " + absolute.string());
        }

        auto imported = loadProgram(importedPath, visited);
        for (auto& declaration : imported.classes) {
            merged.classes.push_back(std::move(declaration));
        }
    }

    for (auto& declaration : current.classes) {
        merged.classes.push_back(std::move(declaration));
    }
    for (auto& statement : current.statements) {
        merged.statements.push_back(std::move(statement));
    }
    return merged;
}

std::string Compiler::readFile(const std::filesystem::path& path) {
    std::ifstream input(path, std::ios::binary);
    if (!input) throw std::runtime_error("Unable to open input file: " + path.string());
    std::ostringstream buffer;
    buffer << input.rdbuf();
    return buffer.str();
}

} // namespace quantc
