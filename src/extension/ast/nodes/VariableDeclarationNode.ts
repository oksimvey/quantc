import { ASTNode } from "./ASTNode";
import { VisibilityType, MemoryModifier, MutabilityType, ScopeType } from "../Modifiers";
import { Token } from "../../lexer/Token";
import { TokenType } from "../../lexer/TokenType";


export  interface VariableDeclarationNode extends ASTNode {

    readonly visibility : VisibilityType;

    readonly scope : ScopeType;
    
    readonly unsigned : boolean;

    readonly mutability : MutabilityType;

    readonly isPointer : boolean;

    readonly memoryMod : MemoryModifier;
   
    readonly type: TokenType;

}