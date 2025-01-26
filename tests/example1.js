const assert = require('assert');
const { Struct } = require('../index.js');
const expectedOutput = '{"field1":42,"field2":7,"field3":{"flagA":true,"flagB":"0b010","fieldC":"0b0111"}}';

function test() {
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
    const output = JSON.stringify(parsedStruct);
    assert(output === expectedOutput, `Expected value: ${expectedOutput}\nActual value: ${output}`);
}

module.exports = { test };