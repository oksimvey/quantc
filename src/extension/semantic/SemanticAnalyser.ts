import { ProgramNode } from "../ast/ProgramNode";
import { ASTNode } from "../ast/ASTNode";
import { VariableDeclarationNode } from "../ast/VariableDeclarationNode";
import { AssignmentNode } from "../ast/AssignmentNode";
import { ExpressionNode } from "../ast/ExpressionNode";

import { IntegerLiteralNode } from "../ast/IntegerLiteralNode";
import { StringLiteralNode } from "../ast/StringLiteralNode";

import { TypeRegistry } from "./TypeRegistry";
import { Scope } from "./Scope";
import { VariableSymbol } from "./VariableSymbol";
import { Diagnostic } from "./Diagnostic";

import { MutabilityType } from "../lexer/MutabilityType";

export class SemanticAnalyzer {

    private diagnostics: Diagnostic[] = [];

    private types = new TypeRegistry();

    private scope: Scope = new Scope();

    // =========================
    // ENTRY POINT
    // =========================
    analyze(program: ProgramNode) {

        for (const node of program.declarations) {
            this.analyzeNode(node);
        }

        return this.diagnostics;
    }

    // =========================
    // DISPATCHER
    // =========================
    private analyzeNode(node: ASTNode) {

        if (node instanceof VariableDeclarationNode) {
            this.analyzeVariableDeclaration(node);
            return;
        }

        if (node instanceof AssignmentNode) {
            this.analyzeAssignment(node);
            return;
        }

    }

    // =========================
    // VARIABLE DECLARATION
    // =========================
    private analyzeVariableDeclaration(node: VariableDeclarationNode) {

        // 1. tipo existe?
        const type = this.types.get(node.typeToken.lexeme);

        if (!type) {
            this.error(
                node.typeToken,
                `Unknown type '${node.typeToken.lexeme}'`
            );
            return;
        }

        // 2. nome não pode ser tipo
        if (this.types.get(node.nameToken.lexeme)) {
            this.error(
                node.nameToken,
                `Variable name cannot be a type name`
            );
        }

        // 3. const/constexpr precisa initializer
        if (
            (node.mutability === MutabilityType.Const ||
                node.mutability === MutabilityType.Constexpr) &&
            !node.initializer
        ) {
            this.error(
                node.nameToken,
                `${node.mutability === MutabilityType.Constexpr ? "Constexpr" : "Const"} variable must be initialized`
            );
        }

        // 4. duplicação no escopo atual
        const ok = this.scope.define(
            new VariableSymbol(
                node.nameToken.lexeme,
                type,
                node.mutability === MutabilityType.Mutable
            )
        );

        if (!ok) {
            this.error(
                node.nameToken,
                `Variable '${node.nameToken.lexeme}' already declared`
            );
        }

        // 5. salva tipo resolvido na AST
        node.resolvedType = type;

        // 6. checa initializer
        if (node.initializer) {

            const initType =
                this.resolveExpressionType(node.initializer);

            if (
                initType &&
                initType.name !== type.name
            ) {
                this.error(
                    node.initializer.start,
                    `Cannot assign '${initType.name}' to '${type.name}'`
                );
            }
        }
    }

    // =========================
    // ASSIGNMENT
    // =========================
    private analyzeAssignment(node: AssignmentNode) {
        const symbol = this.scope.resolve(node.nameToken.lexeme);

        if (!symbol) {
            this.error(
                node.nameToken,
                `Undefined variable '${node.nameToken.lexeme}'`
            );
            return;
        }

        if (!symbol.mutable) {
            this.error(
                node.nameToken,
                `Cannot assign to const variable '${node.nameToken.lexeme}'`
            );
            return;
        }

        const valueType = this.resolveExpressionType(node.value);

        if (valueType && valueType.name !== symbol.type.name) {
            this.error(
                node.value.start,
                `Cannot assign '${valueType.name}' to '${symbol.type.name}'`
            );
        }
    }

    // =========================
    // TYPE RESOLUTION
    // =========================
    private resolveExpressionType(expr: ExpressionNode) {

        // literal int
        if (expr instanceof IntegerLiteralNode) {
            return this.types.get("int");
        }

        // literal string
        if (expr instanceof StringLiteralNode) {
            return this.types.get("string");
        }

        // futuro:
        // VariableAccessNode
        // BinaryExpressionNode
        // CallExpressionNode

        return undefined;
    }

    // =========================
    // DIAGNOSTICS
    // =========================
    private error(token: any, message: string) {

        this.diagnostics.push(
            new Diagnostic(token, message)
        );
    }

}