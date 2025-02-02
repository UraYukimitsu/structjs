const Struct = require('./Struct.js');

class Bitfield {
    value;
    #fields;
    #bitOffsets = new Object;

    bitlen() {}

    constructor(value = 0, fields = {}) {
        this.value = value;
        this.#fields = fields;

        let length = Object.values(fields).reduce((sum, l) => sum + l);
        if (typeof length !== 'number' || Number.isNaN(length))
            throw new TypeError(`Invalid bitfield definition '${JSON.stringify(fields)}'.`);
        if (length > this.bitlen())
            throw new Error(`The sum of the fields' bit lengths should not exceed ${this.bitlen()}, got ${length} instead.`);

        let currentBit = 0;
        for (const [name, length] of Object.entries(this.#fields)) {
            this.#bitOffsets[name] = currentBit;
            Object.defineProperty(this, name, {
                get: () => (this.value >> (this.bitlen() - this.#bitOffsets[name] - length)) & ((1 << length) - 1),
                set: (bitValue) => {
                    const mask = ((1 << length) - 1) << (this.bitlen() - this.#bitOffsets[name] - length);
                    this.value = (this.value & ~mask) | ((bitValue << (this.bitlen() - this.#bitOffsets[name] - length)) & mask);
                },
                enumerable: !name.startsWith('#'),
                configurable: false,
            });
            currentBit += length;
        }
    }

    toJSON() {
        let ret = new Object;
        for (const [name, length] of Object.entries(this.#fields)) {
            if (name.startsWith('#')) continue;
            if (length === 1)
                ret[name] = Boolean(this[name]);
            else
                ret[name] = '0b'+ this[name].toString(2).padStart(length, '0');
        }
        return ret;
    }
}

class Bitfield8 extends Bitfield {
    static get sizeof() { return 1; }
    bitlen() { return 8; }

    static get name() { return 'Bitfield8'; }

    /**
     * Reads a 8-bit bitfield from the data view and returns an instance of Bitfield8.
     * @param {DataView} data - The DataView containing the binary data.
     * @param {number} position - The position in the DataView where the bitfield starts.
     * @param {boolean} [isLittleEndian=false] - Indicates if the data is in little-endian format.
     * @param {object} [options] - Field mapping options for bit names and lengths.
     * @returns {Bitfield8} - An instance of Bitfield8 with named fields.
     */
    static read(data, position, isLittleEndian = false, options = {}) {
        const rawValue = Struct.readValue(data, position, 'u8', isLittleEndian).value;
        return new Bitfield8(rawValue, options);
    }

    /**
     * Writes a 8-bit bitfield to the data view.
     * @param {DataView} data - The DataView to write to.
     * @param {number} position - The position in the DataView at which to start writing.
     * @param {Bitfield8} value - The value to write.
     * @param {boolean} [isLittleEndian=false] - Indicates if the data is in little-endian format.
     * @returns {number} - The number of bytes written.
     */
    static write(data, position, value, isLittleEndian = false) {
        return Struct.writeValue(data, position, value.value, 'u8', isLittleEndian).value;;
    }

    /**
     * Writes this bitfield to the data view.
     * @param {DataView} data - The DataView to write to.
     * @param {number} position - The position in the DataView at which to start writing.
     * @param {boolean} [isLittleEndian=false] - Indicates if the data is in little-endian format.
     * @returns {number} - The number of bytes written.
     */
    write(data, position, isLittleEndian = false) {
        return Struct.writeValue(data, position, this.value, 'u8', isLittleEndian).value;;
    }

    /**
     * Returns the raw bitfield value as a binary string.
     */
    toString() {
        return `0b${this.value.toString(2).padStart(8, '0')}`;
    }

    static {
        Struct.registerFromClass(Bitfield8);
    }
}

class Bitfield16 extends Bitfield {
    static get sizeof() { return 2; }
    bitlen() { return 16; }

    static get name() { return 'Bitfield16'; }

    /**
     * Reads a 16-bit bitfield from the data view and returns an instance of Bitfield16.
     * @param {DataView} data - The DataView containing the binary data.
     * @param {number} position - The position in the DataView where the bitfield starts.
     * @param {boolean} [isLittleEndian=false] - Indicates if the data is in little-endian format.
     * @param {object} [options] - Field mapping options for bit names and lengths.
     * @returns {Bitfield16} - An instance of Bitfield16 with named fields.
     */
    static read(data, position, isLittleEndian = false, options = {}) {
        const rawValue = Struct.readValue(data, position, 'u16', isLittleEndian).value;
        return new Bitfield16(rawValue, options);
    }

    /**
     * Writes a 16-bit bitfield to the data view.
     * @param {DataView} data - The DataView to write to.
     * @param {number} position - The position in the DataView at which to start writing.
     * @param {Bitfield16} value - The value to write.
     * @param {boolean} [isLittleEndian=false] - Indicates if the data is in little-endian format.
     * @returns {number} - The number of bytes written.
     */
    static write(data, position, value, isLittleEndian = false) {
        return Struct.writeValue(data, position, value.value, 'u16', isLittleEndian).value;;
    }

    /**
     * Writes this bitfield to the data view.
     * @param {DataView} data - The DataView to write to.
     * @param {number} position - The position in the DataView at which to start writing.
     * @param {boolean} [isLittleEndian=false] - Indicates if the data is in little-endian format.
     * @returns {number} - The number of bytes written.
     */
    write(data, position, isLittleEndian = false) {
        return Struct.writeValue(data, position, this.value, 'u16', isLittleEndian).value;;
    }

    /**
     * Returns the raw bitfield value as a binary string.
     */
    toString() {
        return `0b${this.value.toString(2).padStart(16, '0')}`;
    }

    static {
        Struct.registerFromClass(Bitfield16);
    }
}

class Bitfield32 extends Bitfield {
    static get sizeof() { return 4; }
    bitlen() { return 32; }

    static get name() { return 'Bitfield32'; }

    /**
     * Reads a 32-bit bitfield from the data view and returns an instance of Bitfield32.
     * @param {DataView} data - The DataView containing the binary data.
     * @param {number} position - The position in the DataView where the bitfield starts.
     * @param {boolean} [isLittleEndian=false] - Indicates if the data is in little-endian format.
     * @param {object} [options] - Field mapping options for bit names and lengths.
     * @returns {Bitfield32} - An instance of Bitfield32 with named fields.
     */
    static read(data, position, isLittleEndian = false, options = {}) {
        const rawValue = Struct.readValue(data, position, 'u32', isLittleEndian).value;
        return new Bitfield32(rawValue, options);
    }

    /**
     * Writes a 32-bit bitfield to the data view.
     * @param {DataView} data - The DataView to write to.
     * @param {number} position - The position in the DataView at which to start writing.
     * @param {Bitfield32} value - The value to write.
     * @param {boolean} [isLittleEndian=false] - Indicates if the data is in little-endian format.
     * @returns {number} - The number of bytes written.
     */
    static write(data, position, value, isLittleEndian = false) {
        return Struct.writeValue(data, position, value.value, 'u32', isLittleEndian).value;;
    }

    /**
     * Writes this bitfield to the data view.
     * @param {DataView} data - The DataView to write to.
     * @param {number} position - The position in the DataView at which to start writing.
     * @param {boolean} [isLittleEndian=false] - Indicates if the data is in little-endian format.
     * @returns {number} - The number of bytes written.
     */
    write(data, position, isLittleEndian = false) {
        return Struct.writeValue(data, position, this.value, 'u32', isLittleEndian).value;;
    }

    /**
     * Returns the raw bitfield value as a binary string.
     */
    toString() {
        return `0b${this.value.toString(2).padStart(32, '0')}`;
    }

    static {
        Struct.registerFromClass(Bitfield32);
    }
}

class Bitfield64 extends Bitfield {
    static get sizeof() { return 8; }
    bitlen() { return 64; }

    static get name() { return 'Bitfield64'; }

    /**
     * Reads a 64-bit bitfield from the data view and returns an instance of Bitfield64.
     * @param {DataView} data - The DataView containing the binary data.
     * @param {number} position - The position in the DataView where the bitfield starts.
     * @param {boolean} [isLittleEndian=false] - Indicates if the data is in little-endian format.
     * @param {object} [options] - Field mapping options for bit names and lengths.
     * @returns {Bitfield64} - An instance of Bitfield64 with named fields.
     */
    static read(data, position, isLittleEndian = false, options = {}) {
        const rawValue = Struct.readValue(data, position, 'u64', isLittleEndian).value;
        return new Bitfield64(rawValue, options);
    }

    /**
     * Writes a 64-bit bitfield to the data view.
     * @param {DataView} data - The DataView to write to.
     * @param {number} position - The position in the DataView at which to start writing.
     * @param {Bitfield64} value - The value to write.
     * @param {boolean} [isLittleEndian=false] - Indicates if the data is in little-endian format.
     * @returns {number} - The number of bytes written.
     */
    static write(data, position, value, isLittleEndian = false) {
        return Struct.writeValue(data, position, value.value, 'u64', isLittleEndian).value;;
    }

    /**
     * Writes this bitfield to the data view.
     * @param {DataView} data - The DataView to write to.
     * @param {number} position - The position in the DataView at which to start writing.
     * @param {boolean} [isLittleEndian=false] - Indicates if the data is in little-endian format.
     * @returns {number} - The number of bytes written.
     */
    write(data, position, isLittleEndian = false) {
        return Struct.writeValue(data, position, this.value, 'u64', isLittleEndian).value;;
    }

    /**
     * Returns the raw bitfield value as a binary string.
     */
    toString() {
        return `0b${this.value.toString(2).padStart(64, '0')}`;
    }

    static {
        Struct.registerFromClass(Bitfield64);
    }
}

module.exports = { Bitfield8, Bitfield16, Bitfield32, Bitfield64 };