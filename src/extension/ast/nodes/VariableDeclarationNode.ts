import { ASTNode } from "./ASTNode";
import { VisibilityType, MemoryModifier, MutabilityType, ScopeType } from "../Modifiers";
import { Token } from "../../lexer/Token";
import { TokenType } from "../../lexer/TokenType";
import { ExpressionNode } from "./ExpressionNode";
import { TypeSymbol } from "../../semantic/TypeSymbol";


export interface VariableDeclarationNode extends ASTNode {
    
    readonly visibility:  VisibilityType;
    readonly scope:       ScopeType;
    readonly mutability:  MutabilityType;
    readonly memoryMod:   MemoryModifier;

    readonly typeToken:   Token;   // lexeme = "int", "MyClass", etc.
    readonly nameToken:   Token;   // lexeme = the variable name

    readonly initializer?: ExpressionNode;  // rhs of =, if present
    
    // populated by semantic analyser, not the parser
    resolvedType?: TypeSymbol;
}