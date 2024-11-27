const Struct = require('./struct.js');

/**
 * A stream-like wrapper around DataView for sequential and random-access reading of binary data.
 */
class DataViewStream {
    /**
     * Seek mode: Set the position relative to the beginning of the stream.
     * @type {number}
     * @readonly
     */
    static get SEEK_SET () { return 0; }
    /**
     * Seek mode: Set the position relative to the current position.
     * @type {number}
     * @readonly
     */
    static get SEEK_CUR () { return 1; }
    /**
     * Seek mode: Set the position relative to the end of the stream.
     * @type {number}
     * @readonly
     */
    static get SEEK_END () { return 2; }

    #buffer;
    /**
     * The underlying buffer of the stream.
     * @type {ArrayBuffer}
     * @readonly
     */
    get buffer() { return this.#buffer; }
    #data;
    #seek_head;

    /**
     * Creates a new DataViewStream for a given ArrayBuffer.
     * @param {ArrayBuffer} buffer - The binary data buffer.
     * @param {number} [offset=0] - The offset into the buffer where the stream starts.
     * @throws {TypeError} If `buffer` is not an ArrayBuffer.
     */
    constructor(buffer, offset = 0) {
        if (!ArrayBuffer.prototype.isPrototypeOf(buffer)) {
            throw new TypeError('Parameter buffer is not of type ArrayBuffer.');
        }

        this.#buffer = buffer;
        this.#data = new DataView(buffer, offset);

        this.#seek_head = 0;
    }

    /**
     * Moves the read head to a specific position.
     * @param {number} offset - The position to seek to.
     * @param {number} [whence=DataViewStream.SEEK_SET] - The seek mode (SEEK_SET, SEEK_CUR, SEEK_END).
     * @returns {DataViewStream} The stream instance (for chaining).
     * @throws {TypeError} If `offset` is not a number or `whence` is not a valid seek mode.
     * @throws {RangeError} If the resulting position is out of bounds.
     */
    seek(offset, whence = DataViewStream.SEEK_SET) {
        if (typeof offset !== 'number')
            throw new TypeError('Parameter offset should be of type number.');
        else if (Number.isNaN(offset))
            throw new Error('Parameter offset should not be NaN.');
        switch (whence) {
            case DataViewStream.SEEK_SET:
                this.#seek_head = offset;
                break;
            
            case DataViewStream.SEEK_CUR:
                this.#seek_head += offset;
                break;

            case DataViewStream.SEEK_END:
                this.#seek_head = this.#data.byteLength + offset;
                break;

            default:
                throw new TypeError('Invalid value for parameter whence.');
        }

        return this;
    }

    /**
     * Returns the current position of the read head.
     * @returns {number} The current position.
     */
    tell() {
        return this.#seek_head;
    }

    /**
     * Reads a value of a given type from the current position and advances the read head.
     * @param {string} type - The name of the type or struct to read.
     * @param {boolean} [isLittleEndian=false] - Whether to use little-endian byte order.
     * @returns {*} The parsed value or struct.
     */
    readNext(type, isLittleEndian = false) {
        let readValue = Struct.readValue(this.#data, this.#seek_head, type, isLittleEndian);
        this.#seek_head += readValue.count;
        return readValue.value;
    }

    /**
     * Reads a value of a given type from a specific position without modifying the read head.
     * @param {number} offset - The position to read from.
     * @param {string} type - The name of the type or struct to read.
     * @param {boolean} [isLittleEndian=false] - Whether to use little-endian byte order.
     * @returns {*} The parsed value or struct.
     * @throws {TypeError} If `offset` is not a number.
     */
    readAt(offset, type, isLittleEndian = false) {
        if (typeof offset !== 'number')
            throw new TypeError('Parameter offset should be of type number.');
        else if (Number.isNaN(offset))
            throw new Error('Parameter offset should not be NaN.');
        let readValue = Struct.readValue(this.#data, offset, type, isLittleEndian);
        return readValue.value;
    }

    /**
     * Iterates through the stream, yielding values of the specified type.
     * @param {string} [type='u8'] - The name of the type or struct to read.
     * @param {boolean} [isLittleEndian=false] - Whether to use little-endian byte order.
     * @yields {*} The parsed value or struct.
     */
    *[Symbol.iterator](type = 'u8', isLittleEndian = false) {
        while (this.#seek_head < this.#data.byteLength) {
            yield this.readNext(type, isLittleEndian);
        }
    }
}

module.exports = DataViewStream;