#pragma once

#include "ast/Ast.h"
#include "codegen/CppGenerator.h"

#include <filesystem>
#include <string>
#include <unordered_set>
#include <vector>

namespace quantc {

class Compiler {
public:
    [[nodiscard]] std::vector<GeneratedFile> transpileProject(const std::filesystem::path& inputPath);

private:
    [[nodiscard]] Program loadProgram(
        const std::filesystem::path& inputPath,
        std::unordered_set<std::string>& visited,
        bool isEntry);
    [[nodiscard]] static std::string readFile(const std::filesystem::path& path);
};

} // namespace quantc
