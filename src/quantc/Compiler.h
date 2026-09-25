#pragma once

#include "ast/Ast.h"

#include <filesystem>
#include <string>
#include <unordered_set>

namespace quantc {

class Compiler {
public:
    [[nodiscard]] std::string transpileFile(const std::filesystem::path& inputPath);

private:
    [[nodiscard]] Program loadProgram(
        const std::filesystem::path& inputPath,
        std::unordered_set<std::string>& visited);
    [[nodiscard]] static std::string readFile(const std::filesystem::path& path);
};

} // namespace quantc
