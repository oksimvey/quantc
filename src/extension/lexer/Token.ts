import { TokenType } from "./TokenType";
 
export interface Token {
    readonly type:     TokenType;
    readonly lexeme:   string;
 
    readonly start:    number;  // inclusive byte offset
    readonly end:      number;  // exclusive byte offset
 
    readonly line:     number;  // 1-based
    readonly column:   number;  // 0-based
 
    readonly hasError?: boolean; // defaults to false
}
