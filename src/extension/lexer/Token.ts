import { TokenType } from "./TokenType";

export interface Token {
    type: TokenType;

    lexeme: string;

    start: number;
    end: number;

    line: number;
    column: number;
}