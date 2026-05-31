import { TokenType } from "./TokenType";

export interface Token {

    type: TokenType;

    lexeme: string;

    line: number;

    column: number;

}