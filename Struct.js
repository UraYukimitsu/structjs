const varPattern = /^(.+) +(#?[a-zA-Z_][a-zA-Z0-9_]*?)$/;
const arrayPattern = /([a-zA-Z_][a-zA-Z0-9]*)\[([0-9]+)\]/;
const bitfieldPattern = /^(Bitfield(?:16|32|64))\{(.+)\}$/;

const primitiveTypes = {
    u8:     { sizeof: 1, read: (data, position) => data.getUint8(position) },
    s8:     { sizeof: 1, read: (data, position) => data.getInt8(position) },
    u16:    { sizeof: 2, read: (data, position, isLittleEndian) => data.getUint16(position, isLittleEndian) },
    s16:    { sizeof: 2, read: (data, position, isLittleEndian) => data.getInt16(position, isLittleEndian) },
    u32:    { sizeof: 4, read: (data, position, isLittleEndian) => data.getUint32(position, isLittleEndian) },
    s32:    { sizeof: 4, read: (data, position, isLittleEndian) => data.getInt32(position, isLittleEndian) },
    u64:    { sizeof: 8, read: (data, position, isLittleEndian) => data.getBigUint64(position, isLittleEndian) },
    s64:    { sizeof: 8, read: (data, position, isLittleEndian) => data.getBigInt64(position, isLittleEndian) },
    float:  { sizeof: 4, read: (data, position, isLittleEndian) => data.getFloat32(position, isLittleEndian) },
    double: { sizeof: 8, read: (data, position, isLittleEndian) => data.getFloat64(position, isLittleEndian) },
    char:   { sizeof: 1, read: (data, position) => String.fromCharCode(data.getUint8(position)) },
    bool:   { sizeof: 4, read: (data, position, isLittleEndian) => Boolean(data.getUint32(position, isLittleEndian)) },
    string: { sizeof: undefined, read: (data, position) => {
        let ret = new Array
        for (let i = position; data.getUint8(i) != 0; i++) {
            ret.push(String.fromCharCode(data.getUint8(i)));
        }
        return(ret.join(''));
    }}
}

/**
 * Represents a binary data structure and provides methods for defining and reading binary data.
 */
class Struct {
    static #loadedStructs = new Object;
    
    /**
     * Retrieves all registered structs and primitive types.
     * @type {Object.<string, {sizeof: number, read: function}>}
     * @readonly
     */
    static get loadedStructs() { return Struct.#loadedStructs; }
    static {
        for (let i in primitiveTypes)
            this.#loadedStructs[i] = primitiveTypes[i];
    }

    #sizeof = 0;
    /**
     * The total size (in bytes) of the struct.
     * @type {number}
     * @readonly
     */
    get sizeof() { return this.#sizeof; }

    #props = new Array;
    /**
     * The list of properties (members) in the struct.
     * @type {Array.<{type: string, name: string, arrayLength: number}>}
     * @readonly
     */
    get props() { return this.#props; }

    #name;
    /**
     * The name of the struct.
     * @type {string}
     * @readonly
     */
    get name() { return this.#name; }

    /**
     * Creates and registers a new struct type.
     * @param {string} structInfo - A string defining the struct's members (e.g., "u16 id\nu8 age").
     * @param {string} structName - The unique name of the struct.
     * @throws {Error} If the struct name conflicts with a primitive type or an existing struct.
     */
    constructor(structInfo, structName) {
        structInfo = structInfo.replaceAll('\r', '');
        if (typeof primitiveTypes[structName]  !== 'undefined')
            throw new Error(`Cannot redefine primitive type '${structName}'.`);
        if (typeof Struct.loadedStructs[structName] !== 'undefined')
            throw new Error(`struct named '${structName}' already registered.`);

        let lines = structInfo.split('\n');

        this.#name = structName;
    
        for(let line of lines) {
            line = line.trim();
            if (line.length == 0) continue;
            let varSize = 0;
            if (!varPattern.test(line))
                throw new Error(`Invalid field declaration '${line}'`);
            let [varType, varName] = varPattern.exec(line).slice(1);
            if (varType == 'string')
                throw new Error("Struct members cannot be of type 'string'. Please use a char[] array.");
            let arrayLength = 1;
            if (bitfieldPattern.test(varType)) {
                let bitfieldOptions;
                [varType, bitfieldOptions] = bitfieldPattern.exec(varType).slice(1);
                try {
                    bitfieldOptions = JSON.parse(`{ ${bitfieldOptions.split(/, */).map(f => f.replace(/^(#?[a-zA-Z][a-zA-Z0-9_]*)/, '"$1"')).join(', ')} }`);
                } catch(e) {
                    throw new Error(`Malformed bitfield descriptor '${bitfieldOptions}'.`, {cause: e});
                }
                this.#props.push({ "type": varType, "name": varName, arrayLength, "options": bitfieldOptions });
                this.#sizeof += Struct.loadedStructs[varType].sizeof;
                continue;
            } else if (arrayPattern.test(varType)) {
                [varType, arrayLength] = arrayPattern.exec(varType).slice(1);
                arrayLength = parseInt(arrayLength);
            }
            if (typeof Struct.loadedStructs[varType] === 'undefined') {
                throw new Error(`No struct or type named '${varType}' registered.`);
            } else {
                varSize = arrayLength * Struct.loadedStructs[varType].sizeof;
            }
    
            this.#props.push({ "type": varType, "name": varName, arrayLength });
            this.#sizeof += varSize;
        }

        Object.freeze(this.#props);

        Struct.#loadedStructs[structName] = this;
    }

    /**
     * Registers a new struct from a JavaScript class.
     * @param {class} Class A JavaScript class with (at least) a static `name` property, a static `sizeof` property, and a static `read` method.
     * @throws {TypeError} If `Class` is not a JavaScript class or it does not have the required elements.
     */
    static registerFromClass(Class) {
        if (typeof Class !== 'function')
            throw new TypeError(`Class is not a JavaScript class.`);
        if (typeof Class.name !== 'string')
            throw new TypeError(`Class should have a static property 'name' of type string.`);
        if (typeof Class.sizeof !== 'number')
            throw new TypeError(`Class should have a static property 'sizeof' of type number.`);
        if (typeof Class.read !== 'function')
            throw new TypeError(`Class should have a static 'read' method.`);

        Struct.#loadedStructs[Class.name] = Class;
    }

    /**
     * Reads an instance of the struct from a DataView.
     * @param {DataView} data - The DataView containing the binary data.
     * @param {number} position - The offset at which to start reading.
     * @param {boolean} [isLittleEndian=false] - Whether to use little-endian byte order.
     * @returns {Object} An object representing the struct's fields and values.
     * @throws {TypeError} If `data` is not a DataView.
     */
    read(data, position, isLittleEndian = false) {
        return Struct.readStruct(data, position, this.name, isLittleEndian);
    }

    /**
     * Reads an instance of a registered struct type from a DataView.
     * @param {DataView} data - The DataView containing the binary data.
     * @param {number} position - The offset at which to start reading.
     * @param {string} structName - The name of the struct to read.
     * @param {boolean} [isLittleEndian=false] - Whether to use little-endian byte order.
     * @returns {Object} An object representing the struct's fields and values.
     * @throws {Error} If the struct name is not registered.
     * @throws {TypeError} If `data` is not a DataView.
     */
    static readStruct(data, position, structName, isLittleEndian = false) {
        if (!DataView.prototype.isPrototypeOf(data))
            throw new TypeError('Parameter data is not of type DataView.');
    
        if (typeof Struct.#loadedStructs[structName] === 'undefined')
            throw new Error(`No struct named '${structName}' registered.`);
    
        let iter = position;
        let struct = Struct.#loadedStructs[structName];
        let ret = {};
    
        for (let p in struct.props) {
            let prop = struct.props[p];
            if (prop.arrayLength == 1) {
                let read = Struct.readValue(data, iter, prop.type, isLittleEndian, prop.options);
                iter += read.count;
                ret[prop.name] = read.value;
            } else {
                let value = [];
                for (let i = 0; i < prop.arrayLength; i++) {
                    let read = Struct.readValue(data, iter, prop.type, isLittleEndian, prop.options);
                    iter += read.count;
                    value.push(read.value);
                }
                ret[prop.name] = value;
            }
        }
        return ret;
    }

    /**
     * Reads a value of a registered type (primitive or struct) from a DataView.
     * @param {DataView} data - The DataView containing the binary data.
     * @param {number} position - The offset at which to start reading.
     * @param {string} type - The name of the type or struct to read.
     * @param {boolean} [isLittleEndian=false] - Whether to use little-endian byte order.
     * @param {object} [options] - Optional parameter to pass to the read function.
     * @returns {{count: number, value: *}} An object containing the size of the value and the parsed value.
     * @throws {Error} If the type is not registered.
     * @throws {TypeError} If `data` is not a DataView.
     */
    static readValue(data, position, type, isLittleEndian = false, options) {
        if (!DataView.prototype.isPrototypeOf(data))
            throw new TypeError('Parameter data is not of type DataView.');
    
        let ret = {count: 0, value: 0};
        let t;
    
        if (typeof Struct.#loadedStructs[type] !== 'undefined') {
            t = Struct.#loadedStructs[type];
        } else {
            throw new Error(`No struct named '${type}' registered.`);
        }
    
        ret.value = t.read(data, position, isLittleEndian, options);
        if (type === 'string') {
            ret.count = ret.value.length + 1;
        } else {
            ret.count = t.sizeof;
        }
    
        return ret;
    }

    /**
     * Converts a registered Struct instance to a JavaScript class.
     * @returns The code of a JavaScript class made from the current Struct instance.
     */
    toClass() {
        let ret = `const { Struct } = require('structjs');\n\n`;

        ret += `class ${this.name} {\n`;
        ret += `    static get sizeof() { return ${this.sizeof}; }\n`;
        ret += `    static get name() { return '${this.name}'; }\n\n`;

        for (let prop of this.props) {
            ret += `    ${prop.name};\n`;
        }
        ret += `\n`;

        let pos = 0;
        ret += `    static read(data, position, isLittleEndian) {\n`;
        ret += `        let fromObj = new Object;\n`;
        for (let prop of this.props) {
            if (prop.arrayLength > 1) {
                ret += `        fromObj['${prop.name}'] = new Array;\n`;
                for (let i = 0; i < prop.arrayLength; i++) {
                    ret += `        fromObj['${prop.name}'].push(Struct.readValue(data, position + ${pos}, '${prop.type}', isLittleEndian, ${JSON.stringify(prop.options)}).value);\n`;
                    pos += Struct.loadedStructs[prop.type].sizeof;
                }
            } else {
                ret += `        fromObj['${prop.name}'] = Struct.readValue(data, position + ${pos}, '${prop.type}', isLittleEndian, ${JSON.stringify(prop.options)}).value;\n`;
                pos += Struct.loadedStructs[prop.type].sizeof;
            }
        }
        ret += `\n`;
        ret += `        return new ${this.name}({fromObj});\n`;
        ret += `    }\n\n`;

        ret += `    constructor(options) {\n`
        ret += `        if (typeof options.fromObj === 'object') {\n`;
        for (let prop of this.props) {
            ret += `            this.${prop.name} = options.fromObj['${prop.name}'];\n`;
        }
        ret += `        }\n`
        ret += `    }\n\n`;

        ret += `    static {\n`;
        ret += `        Struct.registerFromClass(${this.name});\n`;
        ret += `    }\n`;

        ret += '}\n\n';

        ret += `module.exports = ${this.name};`;
        return ret;
    }
}

module.exports = Struct;