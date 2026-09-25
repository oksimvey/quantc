#include "Compiler.h"

#include "lexer/Lexer.h"
#include "parser/Parser.h"
#include "semantic/SemanticAnalyzer.h"

#include <fstream>
#include <sstream>
#include <stdexcept>
#include <utility>

namespace quantc {

std::vector<GeneratedFile> Compiler::transpileProject(const std::filesystem::path& inputPath) {
    std::unordered_set<std::string> visited;
    auto program = loadProgram(inputPath, visited, true);
    const auto analysis = SemanticAnalyzer{}.analyze(program);
    return CppGenerator{analysis}.generate(program);
}

Program Compiler::loadProgram(
    const std::filesystem::path& inputPath,
    std::unordered_set<std::string>& visited,
    bool isEntry) {
    const auto absolute = std::filesystem::absolute(inputPath).lexically_normal();
    const auto key = absolute.string();
    if (visited.contains(key)) return {};
    visited.insert(key);

    const auto source = readFile(absolute);
    Parser parser(Lexer(source).scan());
    Program current = parser.parseProgram();
    Program merged;

    for (const auto& import : current.imports) {
        bool declaredLocally = false;
        for (const auto& declaration : current.classes) {
            if (declaration.name == import.name) {
                declaredLocally = true;
                break;
            }
        }
        if (declaredLocally) continue;

        std::filesystem::path importedPath = import.name;
        if (importedPath.extension().empty()) importedPath += ".qc";
        if (importedPath.is_relative()) importedPath = absolute.parent_path() / importedPath;
        if (!std::filesystem::exists(importedPath)) {
            throw std::runtime_error(
                "Unable to resolve import '" + import.name + "' from " + absolute.string());
        }

        auto imported = loadProgram(importedPath, visited, false);
        for (auto& declaration : imported.classes) {
            merged.classes.push_back(std::move(declaration));
        }
    }

    for (auto& declaration : current.classes) {
        merged.classes.push_back(std::move(declaration));
    }

    if (isEntry) {
        for (auto& statement : current.statements) {
            merged.statements.push_back(std::move(statement));
        }
    } else if (!current.statements.empty()) {
        throw std::runtime_error(
            "Imported module '" + absolute.string() + "' contains top-level executable statements; "
            "only the entry file may contain them for now");
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
