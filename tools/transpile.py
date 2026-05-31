#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple


# -----------------------------
# LEXER
# -----------------------------

@dataclass(frozen=True)
class Position:
    line: int
    col: int

    def to_dict(self) -> dict:
        return {"line": self.line, "col": self.col}


@dataclass(frozen=True)
class Span:
    start: Position
    end: Position

    def to_dict(self) -> dict:
        return {"start": self.start.to_dict(), "end": self.end.to_dict()}


@dataclass
class Token:
    kind: str
    value: str
    span: Span


KEYWORDS = {
    "func",
    "let",
    "return",
    "print",
}


class LexerError(Exception):
    pass


class Lexer:
    def __init__(self, source: str) -> None:
        self.source = source
        self.i = 0
        self.line = 1
        self.col = 1

    def _peek(self) -> str:
        return self.source[self.i] if self.i < len(self.source) else "\0"

    def _advance(self) -> str:
        ch = self._peek()
        if ch == "\0":
            return ch
        self.i += 1
        if ch == "\n":
            self.line += 1
            self.col = 1
        else:
            self.col += 1
        return ch

    def _pos(self) -> Position:
        return Position(self.line, self.col)

    def tokenize(self) -> List[Token]:
        tokens: List[Token] = []
        while True:
            ch = self._peek()

            if ch == "\0":
                tokens.append(Token("EOF", "", Span(self._pos(), self._pos())))
                return tokens

            if ch in " \t\r":
                self._advance()
                continue

            if ch == "\n":
                start = self._pos()
                self._advance()
                tokens.append(Token("NEWLINE", "\n", Span(start, self._pos())))
                continue

            if ch == "/" and self._lookahead(1) == "/":
                while self._peek() not in ("\0", "\n"):
                    self._advance()
                continue

            start = self._pos()

            if ch.isalpha() or ch == "_":
                value = self._read_identifier()
                kind = value if value in KEYWORDS else "IDENT"
                tokens.append(Token(kind, value, Span(start, self._pos())))
                continue

            if ch == "√":
                self._advance()
                tokens.append(Token("SQRT", "√", Span(start, self._pos())))
                continue

            if ch.isdigit():
                value = self._read_number()
                tokens.append(Token("NUMBER", value, Span(start, self._pos())))
                continue

            single_char_tokens = {
                "{": "LBRACE",
                "}": "RBRACE",
                "(": "LPAREN",
                ")": "RPAREN",
                ",": "COMMA",
                "=": "EQUAL",
                "+": "PLUS",
                "-": "MINUS",
                "*": "STAR",
                "/": "SLASH",
                ";": "SEMICOLON",
            }
            if ch in single_char_tokens:
                self._advance()
                tokens.append(Token(single_char_tokens[ch], ch, Span(start, self._pos())))
                continue

            raise LexerError(f"Unexpected character {ch!r} at {self.line}:{self.col}")

    def _lookahead(self, n: int) -> str:
        idx = self.i + n
        return self.source[idx] if idx < len(self.source) else "\0"

    def _read_identifier(self) -> str:
        out = []
        while True:
            ch = self._peek()
            if ch.isalnum() or ch == "_":
                out.append(self._advance())
            elif ch == "√":
                out.append(self._advance())
            else:
                break
        return "".join(out)

    def _read_number(self) -> str:
        out = []
        dot_seen = False
        while True:
            ch = self._peek()
            if ch.isdigit():
                out.append(self._advance())
            elif ch == "." and not dot_seen and self._lookahead(1).isdigit():
                dot_seen = True
                out.append(self._advance())
            else:
                break
        return "".join(out)


# -----------------------------
# AST
# -----------------------------

@dataclass
class Node:
    span: Span


@dataclass
class Expr(Node):
    pass


@dataclass
class Number(Expr):
    value: str


@dataclass
class Identifier(Expr):
    name: str


@dataclass
class Unary(Expr):
    op: str
    expr: Expr


@dataclass
class Binary(Expr):
    left: Expr
    op: str
    right: Expr


@dataclass
class Call(Expr):
    callee: str
    args: List[Expr]


@dataclass
class Stmt(Node):
    pass


@dataclass
class LetStmt(Stmt):
    name: str
    expr: Expr


@dataclass
class ReturnStmt(Stmt):
    expr: Expr


@dataclass
class PrintStmt(Stmt):
    expr: Expr


@dataclass
class ExprStmt(Stmt):
    expr: Expr


@dataclass
class Block(Node):
    statements: List[Stmt]


@dataclass
class FunctionDef(Node):
    name: str
    body: Block


@dataclass
class Program(Node):
    functions: List[FunctionDef]


# -----------------------------
# PARSER
# -----------------------------

class ParserError(Exception):
    pass


class Parser:
    def __init__(self, tokens: List[Token]) -> None:
        self.tokens = tokens
        self.pos = 0

    def _cur(self) -> Token:
        return self.tokens[self.pos]

    def _match(self, *kinds: str) -> bool:
        return self._cur().kind in kinds

    def _advance(self) -> Token:
        tok = self._cur()
        if tok.kind != "EOF":
            self.pos += 1
        return tok

    def _consume(self, kind: str, msg: str) -> Token:
        if self._match(kind):
            return self._advance()
        tok = self._cur()
        raise ParserError(f"{msg} at {tok.span.start.line}:{tok.span.start.col}, found {tok.kind}")

    def _skip_separators(self) -> None:
        while self._match("NEWLINE", "SEMICOLON"):
            self._advance()

    def parse_program(self) -> Program:
        functions: List[FunctionDef] = []
        self._skip_separators()
        start = self._cur().span.start

        while not self._match("EOF"):
            functions.append(self.parse_function())
            self._skip_separators()

        end = self._cur().span.end
        return Program(Span(start, end), functions)

    def parse_function(self) -> FunctionDef:
        func_tok = self._consume("func", "Expected 'func'")
        name_tok = self._consume("IDENT", "Expected function name")
        self._consume("LPAREN", "Expected '(' after function name")
        self._consume("RPAREN", "Expected ')' after function parameters")
        body = self.parse_block()
        return FunctionDef(
            span=Span(func_tok.span.start, body.span.end),
            name=name_tok.value,
            body=body,
        )

    def parse_block(self) -> Block:
        lbrace = self._consume("LBRACE", "Expected '{'")
        statements: List[Stmt] = []
        self._skip_separators()
        while not self._match("RBRACE", "EOF"):
            statements.append(self.parse_statement())
            self._skip_separators()
        rbrace = self._consume("RBRACE", "Expected '}'")
        return Block(Span(lbrace.span.start, rbrace.span.end), statements)

    def parse_statement(self) -> Stmt:
        if self._match("let"):
            return self.parse_let()
        if self._match("return"):
            return self.parse_return()
        if self._match("print"):
            return self.parse_print()

        expr = self.parse_expression()
        span = expr.span
        return ExprStmt(span, expr)

    def parse_let(self) -> LetStmt:
        let_tok = self._consume("let", "Expected 'let'")
        name_tok = self._consume("IDENT", "Expected variable name")
        self._consume("EQUAL", "Expected '=' in let statement")
        expr = self.parse_expression()
        return LetStmt(Span(let_tok.span.start, expr.span.end), name_tok.value, expr)

    def parse_return(self) -> ReturnStmt:
        ret_tok = self._consume("return", "Expected 'return'")
        expr = self.parse_expression()
        return ReturnStmt(Span(ret_tok.span.start, expr.span.end), expr)

    def parse_print(self) -> PrintStmt:
        p_tok = self._consume("print", "Expected 'print'")
        self._consume("LPAREN", "Expected '(' after print")
        expr = self.parse_expression()
        self._consume("RPAREN", "Expected ')' after print argument")
        return PrintStmt(Span(p_tok.span.start, expr.span.end), expr)

    def parse_expression(self) -> Expr:
        return self.parse_addition()

    def parse_addition(self) -> Expr:
        expr = self.parse_multiplication()
        while self._match("PLUS", "MINUS"):
            op = self._advance()
            right = self.parse_multiplication()
            expr = Binary(Span(expr.span.start, right.span.end), expr, op.value, right)
        return expr

    def parse_multiplication(self) -> Expr:
        expr = self.parse_unary()
        while self._match("STAR", "SLASH"):
            op = self._advance()
            right = self.parse_unary()
            expr = Binary(Span(expr.span.start, right.span.end), expr, op.value, right)
        return expr

    def parse_unary(self) -> Expr:
        if self._match("SQRT"):
            op = self._advance()
            expr = self.parse_unary()
            return Unary(Span(op.span.start, expr.span.end), op.value, expr)
        return self.parse_primary()

    def parse_primary(self) -> Expr:
        tok = self._cur()

        if self._match("NUMBER"):
            self._advance()
            return Number(tok.span, tok.value)

        if self._match("IDENT"):
            self._advance()
            if self._match("LPAREN"):
                lparen = self._advance()
                args: List[Expr] = []
                if not self._match("RPAREN"):
                    args.append(self.parse_expression())
                    while self._match("COMMA"):
                        self._advance()
                        args.append(self.parse_expression())
                rparen = self._consume("RPAREN", "Expected ')' after function call")
                return Call(Span(tok.span.start, rparen.span.end), tok.value, args)
            return Identifier(tok.span, tok.value)

        if self._match("LPAREN"):
            lparen = self._advance()
            expr = self.parse_expression()
            rparen = self._consume("RPAREN", "Expected ')' after expression")
            return expr

        raise ParserError(f"Expected expression at {tok.span.start.line}:{tok.span.start.col}, found {tok.kind}")


# -----------------------------
# SOURCE MAP + CODEGEN
# -----------------------------

@dataclass
class MappingEntry:
    kind: str
    original: Span
    generated: Span
    note: str = ""

    def to_dict(self) -> dict:
        data = {
            "kind": self.kind,
            "original": self.original.to_dict(),
            "generated": self.generated.to_dict(),
        }
        if self.note:
            data["note"] = self.note
        return data


class Writer:
    def __init__(self) -> None:
        self.parts: List[str] = []
        self.line = 1
        self.col = 1

    def pos(self) -> Position:
        return Position(self.line, self.col)

    def write(self, text: str) -> None:
        self.parts.append(text)
        for ch in text:
            if ch == "\n":
                self.line += 1
                self.col = 1
            else:
                self.col += 1

    def text(self) -> str:
        return "".join(self.parts)


class CodeGenerator:
    def __init__(self) -> None:
        self.w = Writer()
        self.map: List[MappingEntry] = []

    def emit_program(self, program: Program) -> Tuple[str, List[MappingEntry]]:
        self.w.write("#include <cmath>\n")
        self.w.write("#include <iostream>\n\n")
        for fn in program.functions:
            self.emit_function(fn)
            self.w.write("\n")
        return self.w.text(), self.map

    def emit_function(self, fn: FunctionDef) -> None:
        start = self.w.pos()
        self.w.write(f"int {fn.name}() {{\n")
        self.emit_block(fn.body, indent=1)

        has_return = any(self._contains_return(stmt) for stmt in fn.body.statements)
        if fn.name == "main" and not has_return:
            self.w.write("    return 0;\n")

        self.w.write("}\n")
        self.map.append(MappingEntry("function", fn.span, Span(start, self.w.pos()), note=fn.name))

    def emit_block(self, block: Block, indent: int) -> None:
        for stmt in block.statements:
            self.emit_stmt(stmt, indent)

    def emit_stmt(self, stmt: Stmt, indent: int) -> None:
        pad = "    " * indent
        start = self.w.pos()

        if isinstance(stmt, LetStmt):
            self.w.write(pad + "auto " + stmt.name + " = ")
            self.emit_expr(stmt.expr)
            self.w.write(";\n")
            self.map.append(MappingEntry("let", stmt.span, Span(start, self.w.pos()), note=stmt.name))
            return

        if isinstance(stmt, ReturnStmt):
            self.w.write(pad + "return ")
            self.emit_expr(stmt.expr)
            self.w.write(";\n")
            self.map.append(MappingEntry("return", stmt.span, Span(start, self.w.pos())))
            return

        if isinstance(stmt, PrintStmt):
            self.w.write(pad + "std::cout << ")
            self.emit_expr(stmt.expr)
            self.w.write(" << std::endl;\n")
            self.map.append(MappingEntry("print", stmt.span, Span(start, self.w.pos())))
            return

        if isinstance(stmt, ExprStmt):
            self.w.write(pad)
            self.emit_expr(stmt.expr)
            self.w.write(";\n")
            self.map.append(MappingEntry("expr_stmt", stmt.span, Span(start, self.w.pos())))
            return

        raise TypeError(f"Unsupported statement: {type(stmt).__name__}")

    def emit_expr(self, expr: Expr) -> None:
        start = self.w.pos()

        if isinstance(expr, Number):
            self.w.write(expr.value)
        elif isinstance(expr, Identifier):
            self.w.write(expr.name)
        elif isinstance(expr, Unary):
            if expr.op == "√":
                self.w.write("std::sqrt(")
                self.emit_expr(expr.expr)
                self.w.write(")")
            else:
                raise TypeError(f"Unknown unary operator {expr.op!r}")
        elif isinstance(expr, Binary):
            self.w.write("(")
            self.emit_expr(expr.left)
            self.w.write(f" {expr.op} ")
            self.emit_expr(expr.right)
            self.w.write(")")
        elif isinstance(expr, Call):
            self.w.write(expr.callee + "(")
            for i, arg in enumerate(expr.args):
                if i:
                    self.w.write(", ")
                self.emit_expr(arg)
            self.w.write(")")
        else:
            raise TypeError(f"Unsupported expression: {type(expr).__name__}")

        self.map.append(MappingEntry(type(expr).__name__.lower(), expr.span, Span(start, self.w.pos())))

    def _contains_return(self, stmt: Stmt) -> bool:
        if isinstance(stmt, ReturnStmt):
            return True
        return False


# -----------------------------
# PIPELINE
# -----------------------------

def transpile(source_path: Path, out_dir: Path) -> Tuple[Path, Path]:
    source = source_path.read_text(encoding="utf-8")
    tokens = Lexer(source).tokenize()
    program = Parser(tokens).parse_program()

    generator = CodeGenerator()
    cpp, mappings = generator.emit_program(program)

    out_dir.mkdir(parents=True, exist_ok=True)
    cpp_path = out_dir / (source_path.stem + ".cpp")
    map_path = out_dir / (source_path.stem + ".map.json")
    cpp_path.write_text(cpp, encoding="utf-8")
    map_path.write_text(json.dumps([m.to_dict() for m in mappings], indent=2, ensure_ascii=False), encoding="utf-8")
    return cpp_path, map_path


def compile_cpp(cpp_path: Path, out_dir: Path, output_name: Optional[str] = None) -> Path:
    compiler = shutil.which("g++") or shutil.which("clang++")
    if not compiler:
        raise RuntimeError("No C++ compiler found. Install g++ (MinGW) or clang++ and put it on PATH.")

    if output_name is None:
        output_name = cpp_path.stem

    exe_name = output_name + (".exe" if sys.platform.startswith("win") else "")
    exe_path = out_dir / exe_name

    cmd = [
        compiler,
        "-std=c++20",
        "-O2",
        str(cpp_path),
        "-o",
        str(exe_path),
    ]
    print("[compile]", " ".join(cmd))
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        print(proc.stdout, end="")
        print(proc.stderr, end="", file=sys.stderr)
        raise SystemExit(proc.returncode)

    return exe_path


def run_exe(exe_path: Path) -> int:
    proc = subprocess.run([str(exe_path)], text=True)
    return proc.returncode


def main() -> None:
    ap = argparse.ArgumentParser(description="Transpile .my to C++ and compile it")
    ap.add_argument("source", type=Path, help="Input .my file")
    ap.add_argument("--out", type=Path, default=Path("src"), help="Output directory")
    ap.add_argument("--emit-only", action="store_true", help="Only generate C++ and source map")
    ap.add_argument("--run", action="store_true", help="Run the compiled executable after building")
    args = ap.parse_args()

    try:
        cpp_path, map_path = transpile(args.source, args.out)
        print(f"[emit] {cpp_path}")
        print(f"[map ] {map_path}")

        if not args.emit_only:
            exe_path = compile_cpp(cpp_path, args.out, output_name=args.source.stem)
            print(f"[bin ] {exe_path}")
            if args.run:
                rc = run_exe(exe_path)
                raise SystemExit(rc)

    except (LexerError, ParserError, RuntimeError) as e:
        print(f"error: {e}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
