# structjs

structjs is a powerful JavaScript library for handling binary data structures, bitfields, and data streaming using DataView. The library allows you to define custom structs, parse them from binary buffers, and seamlessly handle complex data formats. The project is licensed under the BSD-3-Clause License.

## Installation

Install the package directly from the repository:

```bash
npm i @urayu/structjs
```

## Features

- Define binary structs using simple syntax.
- Support for primitive types and nested structs.
- Bitfield manipulation for various lengths (8, 16, 32, 64 bits).
- Data streaming via DataViewStream for easy reading from buffers.

## Usage examples

1. Defining and using a `Struct`

```JS
const { Struct } = require('@urayu/structjs');

// Define a new struct
const myStruct = new Struct(`
    u16 field1
    u8 field2
    Bitfield16{flagA: 1, flagB: 3, fieldC: 4} field3
`, 'MyStruct');

// Reading the struct from binary data
const buffer = new ArrayBuffer(16);
const view = new DataView(buffer);
view.setUint16(0, 42, true); // field1 = 42
view.setUint8(2, 7);         // field2 = 7
view.setUint16(3, 0b1010011100000000, true); // field3 with flags and field

const parsedStruct = myStruct.read(view, 0, true);
console.log(JSON.stringify(parsedStruct, null, 2));
/*
{
  "field1": 42,
  "field2": 7,
  "field3": {
    "flagA": true,
    "flagB": "0b010",
    "fieldC": "0b0111"
  }
}
*/
```

2. Using `DataViewStream` for sequential reading

```JS
const { DataViewStream } = require('@urayu/structjs');

const buffer = new ArrayBuffer(10);
const stream = new DataViewStream(buffer);

stream.seek(2);
console.log(stream.tell()); // 2

const value = stream.readNext('u8');
console.log(value); // Value read at position 2
console.log(stream.tell()); // 3
```

3. Using `Bitfield`s

```JS
const { Bitfield16 } = require('@urayu/structjs');

// Define a Bitfield16 with custom fields
const bitfield = new Bitfield16(0b1010101010101010, { flag1: 1, flag2: 3, data: 12 });

console.log(bitfield.toJSON());
/*
{
    flag1: true,
    flag2: '0b010',
    data: '0b101010101010'
}
*/

// Update bitfield values
bitfield.flag2 = 0b110;
console.log(bitfield.toString()); // "0b1110101010101010"
```

## API Reference

### `Struct`
- `new Struct(structInfo: string, structName: string)` - Creates and registers a new struct type.
    - `structInfo` - A string representing the structure's layout. Each field is defined on a new line, specifying the data type (including array length or bitfield options if applicable) field name. The syntax supports primitive types, custom structs, and bitfields.
        Supported Types:
        - Primitive Types: `u8`, `u16`, `u32`, `u64`, `s8`, `s16`, `s32`, `s64`, `float`, `double`, `char`, `bool`
        - Custom Structs: Other registered `Struct` types.
        - Bitfields: `Bitfield8`, `Bitfield16`, `Bitfield32`, `Bitfield64` with named fields (e.g., `Bitfield16{flag1: 1, flag2: 3, data: 12}`)

        Example:
        ```
        `char[4] magic
        u8 flags
        SomeStruct nested_struct
        Bitfield16{flag1: 1, flag2: 3, data: 12} bitfield`
        ```
    - `structName` - The unique name of the struct used for registration and future reference.

- `Struct.registerFromClass(Class: class)` - Registers a new struct from a JavaScript class.
    - `Class` - A JavaScript class with (at least) a static `name` property, a static `sizeof` property, and a static `read` method.

- `Struct.readValue(data: DataView, position: number, type: string[, isLittleEndian: boolean=false, options])` - Reads an instance of a registered struct type from a DataView.
    - `data` - The DataView containing the binary data.
    - `position` - The offset at which to start reading.
    - `type` - The name of the type or struct to read.
    - `[isLittleEndian=false]` - Whether to use little-endian byte order.
    - `[options]` - Optional parameter to pass to the read function.
    - Returns: `{count: number, value: *}` An object containing the size of the value and the parsed value.

- `read(data: DataView, position: number[, isLittleEndian: boolean=false])` - Reads an instance of the struct from a DataView.
    - `data` - The DataView containing the binary data.
    - `position` - The offset at which to start reading.
    - `[isLittleEndian=false]` - Whether to use little-endian byte order.
    - Returns: `Object` An object representing the struct's fields and values.

- `write(data: DataView, position: number, value: Object[, isLittleEndian: boolean = false])` - Writes an instance of the struct to a DataView.
	 - `data` - The DataView to write to.
	 - `position` - The offset at which to start writing.
	 - `value` - The value to write.
	 - `[isLittleEndian=false]` - Whether to use little-endian byte order.
     - Returns: `number` - The number of bytes written.

- `Struct.writeStruct(data: DataView, position: number, value: Object, structName: string[, isLittleEndian: boolean = false])` - Writes an instance of the a registered struct type to a DataView.
     - `data` - The DataView to write to.
	 - `position` - The offset at which to start writing.
	 - `value` - The value to write.
	 - `structName` - The name of the struct to write.
	 - `[isLittleEndian=false]` - Whether to use little-endian byte order.
	 - Returns: `number` - The number of bytes written.

- `Struct.writeValue(data: DataView, position: Number, value: any, type: string[, isLittleEndian: boolean = false, options: Object])` - Writes a value of a registered type (primitive or struct) to a DataView.
	 - `data` - The DataView to write to.
	 - `position` - The offset at which to start writing.
	 - `value` - The value to write.
	 - `type` - The name of the type or struct to write.
	 - `[isLittleEndian=false]` - Whether to use little-endian byte order.
	 - `[options]` - Optional parameter to pass to the write function.
	 - Returns: `number` - The number of bytes written.

- `toClass()` - Statically converts a registered Struct instance to a JavaScript class.
    - Returns: `string` The code of a JavaScript class made from the current Struct instance.


### `DataViewStream`

- `new DataViewStream(buffer: ArrayBuffer[, offset: number=0])` - Creates a new DataViewStream for a given ArrayBuffer.
    - `buffer` - The binary data buffer.
    - `[offset=0]` - The offset into the buffer where the stream starts.

- `seek(offset: number[, whence: number=DataViewStream.SEEK_SET])` - Moves the read head to a specific position.
    - `offset` - The position to seek to.
    - `[whence=DataViewStream.SEEK_SET]` - The seek mode (SEEK_SET, SEEK_CUR, SEEK_END) to which the offset will be relative to.
    - Returns: `DataViewStream` The stream instance (for chaining).

- `tell()` - Get the current position of the read head.
    - Returns: `number` The current position.

- `readNext(type: string[, isLittleEndian: boolean=false, options])` - Reads a value of a given type from the current position and advances the read head.
    - `type` - The name of the type or struct to read.
    - `[isLittleEndian=false]` - Whether to use little-endian byte order.
    - `[options]` - Optional parameter to pass to the read function.

- `readAt(offset: number, type: string[, isLittleEndian: boolean=false, options])` - Reads a value of a given type from a specific position without modifying the read head.
    - `offset` - The position to read from.
    - `type` - The name of the type or struct to read.
    - `[isLittleEndian=false]` - Whether to use little-endian byte order.
    - `[options]` - Optional parameter to pass to the read function.

- `writeNext(value: any, type: string[, isLittleEndian: boolean = false, options: Object])` - Writes a value of a given type at the current position and advances the read/write head.
	 - `value` - The value to write.
	 - `type` - The name of the type or struct to write.
	 - `[isLittleEndian=false]` - Whether to use little-endian byte order.
	 - `[options]` - Optional parameter to pass to the read function.
	 - Returns: `number` - The number of bytes written.

- `writeAt(offset: number, value: any, type: string[, isLittleEndian: boolean = false, options: Object])` - Writes a value of a given type at a specific position.
	 - `offset` - The offset at which to start writing.
	 - `value` - The value to write.
	 - `type` - The name of the type or struct to write.
	 - `[isLittleEndian=false]` - Whether to use little-endian byte order.
	 - `[options]` - Optional parameter to pass to the read function.
	 - Returns: `number` - The number of bytes written.


### Bitfield Classes

#### `Bitfield8`, `Bitfield16`, `Bitfield32`, `Bitfield64`

- `new Bitfield<size>(value: number, fields: Object)` - Creates a new `Bitfield<8|16|32|64|>` object with named fields defined in the `fields` object.
    - `value` - The initial raw bitfield value.
    - `fields` - An object defining the named fields and their bit lengths. Each key is the field name, and the corresponding value is the number of bits allocated to that field.
        - Field names can be any valid identifier. Identifiers starting with the character `#` will not be enumerable and will not appear in the JSON representation of the bitfield (e.g. for padding).
        - The sum of bit lengths should not exceed the bit length of the derived class (e.g., 8 for `Bitfield8`).
        - Example: `{flag1: 1 /* 1-bit field */ , flag2: 3 /* 3-bit field */, data: 12 /* 12-bit field */}`


- `Bitfield<size>.read(data: DataView, position: number[, isLittleEndian: boolean, options: object])` - Reads a `<size>`-bit bitfield from the data view and returns an instance of Bitfield`<size>`.
    - `data` - The DataView containing the binary data.
    - `position` - The position in the DataView where the bitfield starts.
    - `[isLittleEndian=false]` - Indicates if the data is in little-endian format.
    - `[options]` - Field mapping options for bit names and lengths.

- `BitField<size>.write(data: DataView, position: number, value: Bitfield<size>[, isLittleEndian: boolean = false])` - Writes a <8|16|32|64>-bit bitfield to the data view.
	 - `data` - The DataView to write to.
	 - `position` - The position in the DataView at which to start writing.
	 - `value` - The value to write.
	 - `[isLittleEndian=false]` - Indicates if the data is in little-endian format.
	 - Returns: `number` - The number of bytes written.

- `write(data: DataView, position: number[, isLittleEndian: boolean = false])` - Writes this bitfield to the data view.
	 - `data` - The DataView to write to.
	 - `position` - The position in the DataView at which to start writing.
	 - `[isLittleEndian=false]` - Indicates if the data is in little-endian format.
	 - Returns: `number` - The number of bytes written.

## License

This project is licensed under the BSD-3-Clause License. See the LICENSE file for details.
