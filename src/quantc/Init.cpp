#include <bit>
#include <cstddef>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

int main() {

    int x1 = 2;


    std::string x2 = "Hello world";

     auto* x = reinterpret_cast<std::byte*>(&x1);

    // Reinterpret the bytes as an int
    int xtemp = *reinterpret_cast<int*>(x);

    // Print the integer value and the string
    std::cout << xtemp << std::endl;

    x = reinterpret_cast<std::byte*>(&x2);

    std::string xtemp2 = *reinterpret_cast<std::string*>(x);

    std::cout << xtemp2 << std::endl;

    return 0;
}