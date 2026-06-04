#include <iostream>
#include <fstream>
#include <chrono>


int main() {

      auto start = std::chrono::high_resolution_clock::now();
  

   
    std::ofstream file("../src/quantc/Output.cpp"); // cria ou sobrescreve

    std::ofstream header("../src/quantc/Output.h");

    if (!file.is_open()) {
        std::cerr << "Erro ao abrir arquivo\n";
        return 1;
    }
    if (!header.is_open()) {
        std::cerr << "Erro ao abrir arquivo\n";
        return 1;
    }

    header << "#pragma once\n";
    header << "#include <string>\n";
    header << "class Output {\n";
    header << "public : \n";
    header << "static std::string greet(std::string name) ;\n";
    header << "};\n";

    file << "#include \"Output.h\"\n";
    file << "std::string Output::greet(std::string name)  {\n";
    file << "    return \"Hello \" + name + \"!\";\n";
    file << "}\n";

  

    file.close();

    header.close();
    
  auto end = std::chrono::high_resolution_clock::now();

    std::chrono::duration<double> duration = end - start;

    std::cout << "Time: " << duration.count() << " seconds\n";


    return 0;
}