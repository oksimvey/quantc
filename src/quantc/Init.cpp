#include "Compiler.h"

#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>

namespace {
void printUsage() {
    std::cout << "QuantC transpiler\n"
              << "Usage: QuantC <input.qc> [-o output.cpp] [--stdout]\n";
}
}

int main(int argc, char** argv) {
    if (argc < 2) {
        printUsage();
        return 1;
    }

    try {
        std::filesystem::path inputPath = argv[1];
        std::filesystem::path outputPath = inputPath;
        outputPath.replace_extension(".cpp");
        bool writeStdout = false;

        for (int i = 2; i < argc; ++i) {
            const std::string arg = argv[i];
            if (arg == "--stdout") {
                writeStdout = true;
            } else if (arg == "-o") {
                if (i + 1 >= argc) throw std::runtime_error("Missing path after -o");
                outputPath = argv[++i];
            } else {
                throw std::runtime_error("Unknown argument: " + arg);
            }
        }

        const std::string generated = quantc::Compiler{}.transpileFile(inputPath);
        if (writeStdout) {
            std::cout << generated;
            return 0;
        }

        std::ofstream output(outputPath, std::ios::binary);
        if (!output) throw std::runtime_error("Unable to open output file: " + outputPath.string());
        output << generated;
        std::cout << "Transpiled " << inputPath.string() << " -> " << outputPath.string() << '\n';
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "QuantC error: " << error.what() << '\n';
        return 1;
    }
}
