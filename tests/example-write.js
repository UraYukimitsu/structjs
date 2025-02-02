const assert = require('assert');
const { Struct } = require('../index.js');

function hexdump(buffer) {
    let array = new Uint8Array(buffer);
    let i = 0;
    let mess = '           00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\n';
    for (let l = 0; l < Math.ceil(array.length / 16); l++) {
        let line = `${(l * 16).toString(16).padStart(8, '0')} | `;
        for (let j = 0; j < 16; j++) {
            line += array[i++].toString(16).padStart(2, '0') + ' ';
            if (i >= array.length) break;
        }
        mess += line + '\n';
    }
    return mess;
}

function test() {
    const nestedStruct = new Struct(`
        char[4] magic
        float num
    `, 'ExampleWriteNested');

    const myStruct = new Struct(`
        u16 field1
        u8 field2
        Bitfield16{flagA: 1, flagB: 3, fieldC: 4} field3
        ExampleWriteNested field4
    `, 'ExampleWrite1');


    const buffer1 = new ArrayBuffer(16);
    const view1 = new DataView(buffer1);
    view1.setUint16(0, 42, true); // field1 = 42
    view1.setUint8(2, 7);         // field2 = 7
    view1.setUint16(3, 0b1010011100000000, true); // field3 with flags and field
    nestedStruct.write(view1, 5, {magic: 'UraY', num: Math.PI}, true); // field4 is a nested struct

    const parsedStruct = myStruct.read(view1, 0, true);

    const buffer2 = new ArrayBuffer(16);
    const view2 = new DataView(buffer2);
    myStruct.write(view2, 0, parsedStruct, true);

    const output1 = hexdump(buffer1);
    const output2 = hexdump(buffer2);
    assert(output1 === output2, `Output mismatch!\nbuffer1:\n${output1}\n\nbuffer2:\n${output2}`);
}

module.exports = { test };