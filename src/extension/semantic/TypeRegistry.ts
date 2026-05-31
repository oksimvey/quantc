export class TypeRegistry {

    private types = new Map<string, any>();

    constructor() {

        [
            "byte","short","int","long",
            "float","double",
            "char","string","boolean",
            "array","list","hashmap",
            "void"
        ].forEach(t => this.types.set(t, { name: t }));
    }

    get(name: string) {
        return this.types.get(name);
    }
}