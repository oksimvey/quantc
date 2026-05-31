<div align="center">

# ⚡ QuantC

### A modern, expressive compiled language that transpiles to C++

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-007ACC?logo=visual-studio-code)](https://marketplace.visualstudio.com)
[![C++ Backend](https://img.shields.io/badge/Backend-C%2B%2B17-00599C?logo=cplusplus)](https://isocpp.org)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()

> *Expressive like Java. Fast like C++. Extensible like Haskell.*

```quantc
class Vector2D {
    public float x, y;

    function Vector2D(float x, float y) {
        this.x = x;
        this.y = y;
    }

    // Define a custom operator: ⊕ for vector addition
    public function operatorAdd(Vector2D other) -> Vector2D {
        return new Vector2D(this.x + other.x, this.y + other.y);
    }
}

function main() -> void {
    Vector2D a = new Vector2D(1.0, 2.0);
    Vector2D b = new Vector2D(3.0, 4.0);
    Vector2D c = a ⊕ b;  // Custom operator in action
    print(c.x);           // 4.0
}
```

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Language Reference](#language-reference)
  - [Keywords](#keywords)
  - [Types](#types)
  - [Built-in Functions](#built-in-functions)
  - [Custom Operators](#custom-operators)
- [VS Code Extension](#vs-code-extension)
- [C++ Transpiler](#c-transpiler)
- [Foreign Language Bindings](#foreign-language-bindings)
  - [C Binding](#c-binding)
  - [C++ Binding](#c-binding-1)
  - [Java Binding](#java-binding-jni)
  - [Python Binding](#python-binding)
- [Calling C/C++ from QuantC](#calling-cc-from-quantc)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**QuantC** is a statically typed, object-oriented language designed for developers who love Java's clarity and C++'s raw performance. Instead of maintaining a separate runtime, QuantC **transpiles directly to idiomatic C++17**, giving you:

- Zero-overhead abstractions through C++ codegen
- Familiar OOP constructs — classes, inheritance, interfaces, generics
- Haskell-style **custom operator definitions** via special method naming conventions
- First-class **async/await** support
- Strong **interoperability** with C, C++, Java, and Python via generated bindings
- A polished **VS Code extension** for a complete IDE experience

---

## Features

| Feature | Description |
|---|---|
| 🔄 **C++ Transpilation** | Full source-to-source compilation targeting C++17 |
| 🧩 **Custom Operators** | Define new Unicode operators on any class (e.g. `√`, `⊕`, `∩`) |
| 🔗 **Multi-language Bindings** | Auto-generated C, C++ headers, JNI (Java), and CPython bindings |
| 🧠 **Smart VS Code Extension** | IntelliSense, error highlighting, quick fixes, cross-file class resolution |
| ⚡ **Async/Await** | First-class `await`/`wait` support transpiled to `std::future` / coroutines |
| 🛡️ **Memory Safety Helpers** | `pointer`, `reference`, `address`, `pointing` keywords make intent explicit |
| 🏗️ **Full OOP** | Classes, abstract classes, inheritance (`extends`), access modifiers |
| 🔢 **Rich Type System** | Primitives, `array`, `list`, `hashmap`, `enum`, `constexpr`, unsigned variants |

---

## Installation

### Prerequisites

- **Node.js** ≥ 18 (for the VS Code extension)
- **Clang** ≥ 14 or **GCC** ≥ 12 (C++ backend)
- **CMake** ≥ 3.20
- **Python** ≥ 3.10 *(optional, for Python bindings)*
- **JDK** ≥ 11 *(optional, for Java bindings)*

### Install the CLI

```bash
# Clone the repository
git clone https://github.com/your-org/quantc.git
cd quantc

# Install dependencies and build
npm install
npm run build

# Link the CLI globally
npm link

# Verify installation
quantc --version
```

### Install the VS Code Extension

**From the marketplace (recommended):**

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P`
3. Run `ext install your-org.quantc`

**From source:**

```bash
cd vscode-extension
npm install
npx vsce package
code --install-extension quantc-*.vsix
```

---

## Language Reference

### Keywords

QuantC's keyword set is designed to feel immediately familiar to Java and C++ developers, while adding expressive new constructs.

| Keyword | Description |
|---|---|
| `class` | Declares an object-oriented class |
| `abstract` | Marks a class or method as abstract (cannot be directly instantiated) |
| `extends` | Inherits from a parent class |
| `override` | Explicitly marks a method as overriding a parent implementation |
| `instanceof` | Runtime type check (`obj instanceof MyClass`) |
| `new` | Heap-allocates a new instance |
| `delete` | Frees a heap-allocated object |
| `this` | Reference to the current instance |
| `super` | Reference to the parent class |
| `public` / `private` | Access modifiers for class members |
| `const` | Immutable binding (value cannot be reassigned) |
| `constexpr` | Compile-time constant expression |
| `mutable` | Explicitly allows mutation inside `const` contexts |
| `global` / `local` | Scope qualifiers for variable declarations |
| `function` | Declares a function or method |
| `return` | Returns a value from a function |
| `if` / `else` | Conditional branching |
| `while` | Loop with pre-condition |
| `for` | Loop (C-style or range-based) |
| `switch` / `case` / `default` | Multi-branch selection |
| `break` / `continue` | Loop control flow |
| `try` / `catch` / `throw` | Exception handling |
| `await` / `wait` | Asynchronous suspension points |
| `null` | Null reference literal |
| `true` / `false` | Boolean literals |
| `and` / `or` / `not` | Logical operators (readable alternatives to `&&`, `\|\|`, `!`) |
| `pointer` | Declares a raw pointer type |
| `reference` | Declares an l-value reference |
| `address` | Takes the address of a variable (like C's `&`) |
| `pointing` | Dereferences a pointer (like C's `*`) |
| `unsigned` | Unsigned integer modifier |
| `enum` | Declares an enumeration |

### Types

| Type | C++ Equivalent | Description |
|---|---|---|
| `byte` | `int8_t` | 8-bit signed integer |
| `short` | `int16_t` | 16-bit signed integer |
| `int` | `int32_t` | 32-bit signed integer |
| `long` | `int64_t` | 64-bit signed integer |
| `float` | `float` | 32-bit floating point |
| `double` | `double` | 64-bit floating point |
| `char` | `char` | Single character |
| `string` | `std::string` | UTF-8 string |
| `boolean` | `bool` | Boolean value |
| `void` | `void` | No return value |
| `array<T>` | `std::array<T, N>` | Fixed-size typed array |
| `list<T>` | `std::vector<T>` | Dynamic typed list |
| `hashmap<K, V>` | `std::unordered_map<K,V>` | Hash table / dictionary |

### Built-in Functions

All built-ins map directly to their C standard library or `<cmath>` equivalents:

```quantc
print(value)          // Console output
sqrt(x)               // Square root
abs(x)                // Absolute value
pow(base, exp)        // Exponentiation
min(a, b)             // Minimum of two values
max(a, b)             // Maximum of two values
floor(x)              // Floor (round down)
ceil(x)               // Ceiling (round up)
sin(x)  cos(x)  tan(x)
asin(x) acos(x) atan(x) atan2(y, x)
sinh(x) cosh(x) tanh(x)
asinh(x) acosh(x) atanh(x)
exp(x)                // e^x
log(x)                // Natural logarithm
log10(x)              // Base-10 logarithm
```

---

### Custom Operators

One of QuantC's most distinctive features: you can **define new operators** on any class using a special naming convention, similar to Haskell's operator overloading but with Unicode symbols.

#### How It Works

Name a method `operator<Name>()` and QuantC maps it to a Unicode glyph you can use in expressions:

| Method Name | Unicode Symbol | Example Usage |
|---|---|---|
| `operatorSqrt` | `√` | `√matrix` |
| `operatorAdd` | `⊕` | `a ⊕ b` |
| `operatorIntersect` | `∩` | `setA ∩ setB` |
| `operatorUnion` | `∪` | `setA ∪ setB` |
| `operatorTensor` | `⊗` | `A ⊗ B` |
| `operatorNorm` | `‖` | `‖vector‖` |

#### Example — Matrix Square Root

```quantc
class Matrix {
    private array<array<double>> data;

    // Unary prefix operator: √matrix
    public function operatorSqrt() -> Matrix {
        return this.computeMatrixSqrt();
    }

    // Binary infix operator: A ⊗ B  (tensor product)
    public function operatorTensor(Matrix other) -> Matrix {
        return this.tensorProduct(other);
    }

    private function computeMatrixSqrt() -> Matrix { /* ... */ }
    private function tensorProduct(Matrix other) -> Matrix { /* ... */ }
}

function main() -> void {
    Matrix m = new Matrix(/* ... */);

    Matrix sqrtM = √m;         // Clean, mathematical syntax
    Matrix result = m ⊗ sqrtM; // Reads like math notation
}
```

#### Transpiled C++ Output

```cpp
// √m  becomes:
auto sqrtM = m.operatorSqrt();

// m ⊗ sqrtM  becomes:
auto result = m.operatorTensor(sqrtM);
```

---

## VS Code Extension

The QuantC VS Code extension (`vscode-extension/`) is written in TypeScript and provides a full IDE experience.

### Features

#### IntelliSense & Autocompletion

- **Keyword completions** — every keyword includes a hover doc explaining its purpose and usage
- **Type completions** — native types show their C++ equivalent and memory size
- **Built-in function completions** — signature help with parameter types and return values
- **Cross-file class resolution** — the extension indexes all `.qc` files in your workspace and suggests classes even from files you haven't opened
- **Inherited member suggestions** — when calling methods on an instance, the extension walks the full inheritance chain and suggests all available methods, including those from parent classes
- **Return type inference** — method completions show the inferred or declared return type inline
- **Import library suggestions** — classes from imported libraries appear in completions with their source shown

#### Diagnostics

- **Syntax highlighting** — full TextMate grammar for all keywords, types, operators, and string literals
- **Error highlighting** — type mismatches, undefined symbols, and invalid expressions are underlined in real time
- **Warning hints** — unused variables, shadowed names, missing `override` keywords
- **Quick Fixes** — one-click fixes for common errors:
  - Add missing `override` keyword
  - Auto-import a class used but not imported
  - Replace deprecated syntax
  - Add missing `return` statement

#### Code Navigation

- **Go to Definition** — jump to the class or function definition, even across files
- **Find All References** — locate every use of a symbol in the project
- **Rename Symbol** — safe rename across all files

#### Snippet Library

| Trigger | Expands To |
|---|---|
| `class` | Full class scaffold with constructor |
| `func` | Function declaration with return type |
| `for` | For loop with typed iterator |
| `trycatch` | Try/catch block |
| `asyncfunc` | Async function with `await` |

---

## C++ Transpiler

The transpiler (`transpiler/`) converts `.qc` source files into clean, idiomatic C++17.

### Usage

```bash
# Transpile a single file
quantc compile src/Main.qc -o build/Main.cpp

# Transpile an entire project
quantc build --src src/ --out build/

# Transpile and immediately compile with clang
quantc run src/Main.qc

# Generate bindings alongside transpilation
quantc compile src/MyLib.qc --bindings c,cpp,java,python -o build/
```

### Transpilation Pipeline

```
.qc source
     │
     ▼
 Lexer (tokenize keywords, types, operators)
     │
     ▼
 Parser (build AST)
     │
     ▼
 Semantic Analyzer (type checking, scope resolution, inheritance validation)
     │
     ▼
 IR Generation (intermediate representation)
     │
     ▼
 C++17 Code Emitter
     │
     ▼
 .cpp + .h output files
```

### Example

**Input (`Greeter.qc`):**

```quantc
class Greeter {
    private string name;

    public function Greeter(string name) {
        this.name = name;
    }

    public function greet() -> string {
        return "Hello, " + this.name + "!";
    }
}
```

**Output (`Greeter.cpp`):**

```cpp
#include "Greeter.h"
#include <string>

Greeter::Greeter(std::string name) : name(std::move(name)) {}

std::string Greeter::greet() {
    return "Hello, " + this->name + "!";
}
```

---

## Foreign Language Bindings

QuantC auto-generates bindings so your library can be consumed from C, C++, Java, and Python without any manual glue code.

### C Binding

A plain C header and shared library are generated for maximum portability.

**Generated `quantc_greeter.h`:**

```c
#ifndef QUANTC_GREETER_H
#define QUANTC_GREETER_H

#ifdef __cplusplus
extern "C" {
#endif

typedef void* QuantCGreeter;

QuantCGreeter quantc_Greeter_new(const char* name);
const char* quantc_Greeter_greet(QuantCGreeter self);
void        quantc_Greeter_free(QuantCGreeter self);

#ifdef __cplusplus
}
#endif

#endif // QUANTC_GREETER_H
```

**Usage from C:**

```c
#include "quantc_greeter.h"
#include <stdio.h>

int main(void) {
    QuantCGreeter g = quantc_Greeter_new("World");
    printf("%s\n", quantc_Greeter_greet(g));  // Hello, World!
    quantc_Greeter_free(g);
    return 0;
}
```

---

### C++ Binding

A zero-overhead C++ wrapper is generated on top of the C binding, providing RAII, method chaining, and standard C++ idioms.

**Generated `QuantCGreeter.hpp`:**

```cpp
#pragma once
#include "quantc_greeter.h"
#include <string>
#include <stdexcept>

class QuantCGreeterBinding {
    QuantCGreeter handle_;
public:
    explicit QuantCGreeterBinding(std::string const& name)
        : handle_(quantc_Greeter_new(name.c_str())) {
        if (!handle_) throw std::runtime_error("Failed to create Greeter");
    }

    ~QuantCGreeterBinding() { quantc_Greeter_free(handle_); }

    // Non-copyable, movable
    QuantCGreeterBinding(QuantCGreeterBinding const&) = delete;
    QuantCGreeterBinding& operator=(QuantCGreeterBinding const&) = delete;
    QuantCGreeterBinding(QuantCGreeterBinding&&) = default;

    std::string greet() const {
        return std::string(quantc_Greeter_greet(handle_));
    }
};
```

---

### Java Binding (JNI)

A JNI wrapper is generated so your QuantC classes can be used from any JVM language (Java, Kotlin, Scala).

**Generated `Greeter.java`:**

```java
package com.quantc.bindings;

public class Greeter implements AutoCloseable {
    static {
        System.loadLibrary("quantc_greeter");
    }

    private long nativeHandle;

    public Greeter(String name) {
        this.nativeHandle = nativeNew(name);
    }

    public String greet() {
        return nativeGreet(nativeHandle);
    }

    @Override
    public void close() {
        nativeFree(nativeHandle);
        nativeHandle = 0;
    }

    private native long   nativeNew(String name);
    private native String nativeGreet(long handle);
    private native void   nativeFree(long handle);
}
```

**Usage from Java:**

```java
try (var g = new Greeter("World")) {
    System.out.println(g.greet());  // Hello, World!
}
```

---

### Python Binding

A CPython extension module is generated using the Python C API, callable from plain Python with no extra dependencies.

**Generated `quantc_greeter.c` (compiled to `quantc_greeter.so`):**

> Automatically built via the generated `setup.py`.

**Usage from Python:**

```python
import quantc_greeter

g = quantc_greeter.Greeter("World")
print(g.greet())   # Hello, World!
del g              # Calls destructor automatically
```

**Installation:**

```bash
cd build/bindings/python
pip install .
```

---

## Calling C/C++ from QuantC

QuantC supports **extern declarations** to call into existing C or C++ libraries directly.

```quantc
// Declare an external C function
extern "C" function printf(string fmt, ...) -> int;

// Declare a C++ class method
extern "C++" function std::vector<int>::push_back(int value) -> void;

// Call a C library function
function main() -> void {
    int result = printf("Hello from C: %d\n", 42);
}
```

### Linking External Libraries

In your `quantc.config.json`:

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "links": ["m", "pthread", "z"],
  "includePaths": ["./vendor/mylib/include"],
  "libPaths": ["./vendor/mylib/lib"]
}
```

---

## Project Structure

```
quantc/
├── compiler/                  # Core transpiler (TypeScript)
│   ├── src/
│   │   ├── lexer/             # Tokenizer — keywords, types, operators
│   │   │   ├── Lexer.ts
│   │   │   ├── Token.ts
│   │   │   └── keywords.ts    # KEYWORDS, TYPES, BUILTINS sets
│   │   ├── parser/            # AST construction
│   │   │   ├── Parser.ts
│   │   │   └── nodes/         # AST node types
│   │   ├── analyzer/          # Semantic analysis & type checking
│   │   │   ├── TypeChecker.ts
│   │   │   └── ScopeResolver.ts
│   │   ├── emitter/           # C++17 code generation
│   │   │   ├── CppEmitter.ts
│   │   │   └── OperatorMapper.ts   # Unicode → method name mapping
│   │   └── bindings/          # Foreign binding generators
│   │       ├── CBindingGen.ts
│   │       ├── CppBindingGen.ts
│   │       ├── JavaBindingGen.ts
│   │       └── PythonBindingGen.ts
│   └── tests/
│
├── vscode-extension/          # VS Code extension (TypeScript)
│   ├── src/
│   │   ├── extension.ts       # Entry point — activates providers
│   │   ├── providers/
│   │   │   ├── CompletionProvider.ts    # IntelliSense
│   │   │   ├── HoverProvider.ts         # Hover docs
│   │   │   ├── DiagnosticsProvider.ts   # Error/warning underlines
│   │   │   ├── CodeActionProvider.ts    # Quick fixes
│   │   │   └── DefinitionProvider.ts    # Go-to-definition
│   │   ├── indexer/
│   │   │   └── WorkspaceIndexer.ts  # Crawls all .qc files for symbols
│   │   └── grammar/
│   │       └── quantc.tmLanguage.json  # TextMate syntax grammar
│   ├── snippets/
│   │   └── quantc.json
│   └── package.json
│
├── stdlib/                    # QuantC standard library (written in .qc)
│   ├── io/
│   ├── collections/
│   ├── math/
│   └── async/
│
├── examples/                  # Sample programs
│   ├── hello_world/
│   ├── custom_operators/
│   ├── async_example/
│   └── bindings_demo/
│
├── docs/                      # Extended documentation
├── quantc.config.json           # Default project config schema
└── README.md
```

---

## Contributing

Contributions are welcome! Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before submitting a PR.

### Development Setup

```bash
git clone https://github.com/your-org/quantc.git
cd quantc
npm install
npm run build
npm test
```

### Running Tests

```bash
# Compiler unit tests
npm run test:compiler

# Extension tests (requires VS Code)
npm run test:extension

# End-to-end transpilation tests
npm run test:e2e
```

### Reporting Issues

- 🐛 **Transpiler bugs** — open an issue with the `.qc` input and the incorrect C++ output
- 💡 **Language proposals** — open a discussion with your motivation and a syntax sketch
- 🔌 **Extension issues** — include your OS, VS Code version, and extension version

---

## License

QuantC is released under the [MIT License](LICENSE).

---

<div align="center">

Fast to write. Fast to run.

</div>
