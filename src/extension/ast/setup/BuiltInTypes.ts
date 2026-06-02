import { Variable } from "../structures/Variable";
import { VariableType } from "./VariableType";


export const BuiltInTypes = new Map<string, VariableType>();

export const ByteType : VariableType = {
    identifier : "byte",
    comment : "8 bits integer"
}


export const ShortType : VariableType = {
    identifier : "short",
    comment : "16 bits integer"
}
export const IntType : VariableType = {
    identifier : "int",
    comment : "32 bits integer"
}

export const LongType : VariableType = {
    identifier : "long",
    comment : "64 bits integer"
}

export const UnsignedByteType : VariableType = {
    identifier : "ubyte",
    comment : "8 unsigned bits integer"
}


export const UnsignedShortType : VariableType = {
    identifier : "ushort",
    comment : "16 unsigned bits integer"
}
export const UnsignedIntType : VariableType = {
    identifier : "uint",
    comment : "32 unsigned bits integer"
}

export const UnsignedLongType : VariableType = {
    identifier : "ulong",
    comment : "64 unsigned bits integer"
}

export const CharType : VariableType = {
    identifier: "char",
    comment : "single characther value"
}

export const StringType : VariableType = {
    identifier : "string",
    comment : "sequence of characthers"
}

export const BooleanType : VariableType = {
    identifier: "boolean",
    comment: "logical value representing true or false"
}

export const AutoType : VariableType = {
    identifier: "auto",
    comment: "Type is inferred automatically from the initializer expression"
}

export const ArrayType : VariableType = {
    identifier: "Array<T>",
    comment : "Fixed-size contiguous collection of elements of type T"
}

export const ListType : VariableType = {
    identifier: "List<T>",
    comment : "Resizable dynamic array with automatic memory growth"
}

export const HashMapType : VariableType = {
    identifier: "HashMap<A, B>",
    comment : "Key-value associative container mapping A → B with average O(1) lookup"
}

export const Pointer : VariableType = {
    identifier: "Pointer<T>",
    comment: "Raw memory address reference (non-owning, unsafe by default)"
}


export function setup(){

    BuiltInTypes.set(ByteType.identifier, ByteType);
    BuiltInTypes.set(ShortType.identifier, ShortType);
    BuiltInTypes.set(IntType.identifier, IntType);
    BuiltInTypes.set(LongType.identifier, LongType);

    BuiltInTypes.set(UnsignedByteType.identifier, UnsignedByteType);
    BuiltInTypes.set(UnsignedShortType.identifier, UnsignedShortType);
    BuiltInTypes.set(UnsignedIntType.identifier, UnsignedIntType);
    BuiltInTypes.set(UnsignedLongType.identifier, UnsignedLongType);

    BuiltInTypes.set(CharType.identifier, CharType);
    BuiltInTypes.set(StringType.identifier, StringType);
    BuiltInTypes.set(BooleanType.identifier, BooleanType);
    BuiltInTypes.set(AutoType.identifier, AutoType);
    BuiltInTypes.set(ArrayType.identifier, ArrayType);
    BuiltInTypes.set(ListType.identifier, ListType);
    BuiltInTypes.set(HashMapType.identifier, HashMapType);
    BuiltInTypes.set(Pointer.identifier, Pointer);



}





