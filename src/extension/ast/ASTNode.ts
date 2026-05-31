import { Token } from "../lexer/Token";

export interface ASTNode {
    start: Token;
    end: Token;
}