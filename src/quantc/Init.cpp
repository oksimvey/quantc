#include "Compiler.h"

#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>

namespace {
void printUsage() {
    std::cout << "QuantC transpiler\n"
              << "Usage: QuantC <input.qc> [-o output-directory] [--stdout]\n";
}

void writeGeneratedFiles(
    const std::filesystem::path& outputDirectory,
    const std::vector<quantc::GeneratedFile>& files) {
    std::filesystem::create_directories(outputDirectory);
    for (const auto& file : files) {
        const auto path = outputDirectory / file.path;
        std::filesystem::create_directories(path.parent_path());
        std::ofstream output(path, std::ios::binary);
        if (!output) throw std::runtime_error("Unable to open output file: " + path.string());
        output << file.content;
    }
}
}

int main(int argc, char** argv) {
    if (argc < 2) {
        printUsage();
        return 1;
    }

    try {
        const std::filesystem::path inputPath = argv[1];
        std::filesystem::path outputDirectory = inputPath.parent_path() / "quantc-out";
        bool writeStdout = false;

        for (int i = 2; i < argc; ++i) {
            const std::string arg = argv[i];
            if (arg == "--stdout") {
                writeStdout = true;
            } else if (arg == "-o") {
                if (i + 1 >= argc) throw std::runtime_error("Missing directory after -o");
                outputDirectory = argv[++i];
            } else {
                throw std::runtime_error("Unknown argument: " + arg);
            }
        }

        const auto files = quantc::Compiler{}.transpileProject(inputPath);
        if (writeStdout) {
            for (const auto& file : files) {
                std::cout << "===== " << file.path << " =====\n" << file.content << '\n';
            }
            return 0;
        }

        writeGeneratedFiles(outputDirectory, files);
        std::cout << "Transpiled " << inputPath.string() << " -> " << outputDirectory.string() << '\n';
        for (const auto& file : files) std::cout << "  " << file.path << '\n';
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "QuantC error: " << error.what() << '\n';
        return 1;
    }
}
