import { Method } from "./Method";
import { ObjectType } from "./ObjectType";


 export const OBJECTS = new Map<string, ObjectType>();

 function registryObject1(identifier : string, object : ObjectType) : void {
    OBJECTS.set(identifier, object);
  }

  function registryObject2(identifier : string, comment_ : string, methods_ : Method[]){
    const object : ObjectType = {
      identifier: identifier,
        comment: comment_,
        variables: [],
        methods: methods_
    }
    registryObject1(identifier, object);
  }

  function registryObject3(identifier: string, comment_ : string){
    registryObject2(identifier, comment_, [])
  }

  export function setupRegistry(): void {
    registryObject3("auto", "Type is inferred automatically from the initializer expression");

    registryObject3("byte", "Signed 8-bit integer (-128 to 127)");
    registryObject3("short", "Signed 16-bit integer (-32,768 to 32,767)");
    registryObject3("int", "Signed 32-bit integer");
    registryObject3("long", "Signed 64-bit integer");

    registryObject3("ubyte", "Unsigned 8-bit integer (0 to 255)");
    registryObject3("ushort", "Unsigned 16-bit integer (0 to 65,535)");
    registryObject3("uint", "Unsigned 32-bit integer");
    registryObject3("ulong", "Unsigned 64-bit integer");

    registryObject3("char", "Single UTF-8 character value");

    registryObject3("string", "Immutable sequence of characters");

    registryObject3("float", "32-bit floating point (single precision decimal)");
    registryObject3("double", "64-bit floating point (double precision decimal)");

    registryObject3("SharedPointer<T>", "Reference-counted pointer shared across multiple owners");
    registryObject3("UniquePointer<T>", "Exclusive ownership pointer with automatic deallocation");
    registryObject3("Pointer<T>", "Raw memory address reference (non-owning, unsafe by default)");

    registryObject3("boolean", "Logical value representing true or false");

    registryObject3("Array<T>", "Fixed-size contiguous collection of elements of type T");
    registryObject3("List<T>", "Resizable dynamic array with automatic memory growth");
    registryObject3("HashMap<A, B>", "Key-value associative container mapping A → B with average O(1) lookup");
}




