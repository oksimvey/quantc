#pragma once

#include <memory>
#include <string>
#include <vector>

namespace quantc {

enum class Visibility { Default, Public, Private };
enum class Mutability { Mutable, Const, Constexpr };
enum class Storage { Default, Global, Local };

struct Modifiers {
    Visibility visibility{Visibility::Default};
    Mutability mutability{Mutability::Mutable};
    Storage storage{Storage::Default};
    bool isAbstract{false};
    bool isOverride{false};
};

struct TypeRef {
    std::string name;
    std::vector<TypeRef> genericArgs;
};

struct Expr {
    enum class Kind {
        Identifier,
        Number,
        String,
        Character,
        Boolean,
        Null,
        New,
        MemberAccess,
        Call,
        Binary,
        Unary
    };

    Kind kind{Kind::Identifier};
    std::string value;
    TypeRef type;
    std::vector<std::unique_ptr<Expr>> children;
};

struct VariableDecl {
    std::string name;
    TypeRef type;
    bool inferred{false};
    Modifiers modifiers;
    std::unique_ptr<Expr> initializer;
};

struct Statement {
    enum class Kind { Variable, Expression };
    Kind kind{Kind::Expression};
    VariableDecl variable;
    std::unique_ptr<Expr> expression;
};

struct ClassDecl {
    std::string name;
    Modifiers modifiers;
    std::vector<VariableDecl> fields;
};

struct ImportDecl {
    std::string name;
};

struct Program {
    std::vector<ImportDecl> imports;
    std::vector<ClassDecl> classes;
    std::vector<Statement> statements;
};

} // namespace quantc
