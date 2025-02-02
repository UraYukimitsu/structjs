const primitiveTypes = {
    u8: {
        sizeof: 1,
        read: (data, position) => data.getUint8(position),
        write: (data, position, value) => data.setUint8(position, value)
    },
    s8: {
        sizeof: 1,
        read: (data, position) => data.getInt8(position),
        write: (data, position, value) => data.setInt8(position, value)
    },
    u16: {
        sizeof: 2,
        read: (data, position, isLittleEndian) => data.getUint16(position, isLittleEndian),
        write: (data, position, value, isLittleEndian) => data.setUint16(position, value, isLittleEndian)
    },
    s16: {
        sizeof: 2,
        read: (data, position, isLittleEndian) => data.getInt16(position, isLittleEndian),
        write: (data, position, value, isLittleEndian) => data.setInt16(position, value, isLittleEndian)
    },
    u32: {
        sizeof: 4,
        read: (data, position, isLittleEndian) => data.getUint32(position, isLittleEndian),
        write: (data, position, value, isLittleEndian) => data.setUint32(position, value, isLittleEndian)
    },
    s32: {
        sizeof: 4,
        read: (data, position, isLittleEndian) => data.getInt32(position, isLittleEndian),
        write: (data, position, value, isLittleEndian) => data.setInt32(position, value, isLittleEndian)
    },
    u64: {
        sizeof: 8,
        read: (data, position, isLittleEndian) => data.getBigUint64(position, isLittleEndian),
        write: (data, position, value, isLittleEndian) => data.setBigUint64(position, value, isLittleEndian)
    },
    s64: {
        sizeof: 8,
        read: (data, position, isLittleEndian) => data.getBigInt64(position, isLittleEndian),
        write: (data, position, value, isLittleEndian) => data.setBigInt64(position, value, isLittleEndian)
    },
    float: {
        sizeof: 4,
        read: (data, position, isLittleEndian) => data.getFloat32(position, isLittleEndian),
        write: (data, position, value, isLittleEndian) => data.setFloat32(position, value, isLittleEndian)
    },
    double: {
        sizeof: 8,
        read: (data, position, isLittleEndian) => data.getFloat64(position, isLittleEndian),
        write: (data, position, value, isLittleEndian) => data.setFloat64(position, value, isLittleEndian)
    },
    char: {
        sizeof: 1,
        read: (data, position) => String.fromCharCode(data.getUint8(position)),
        write: (data, position, value) => data.setUint8(position, value.charCodeAt(0))
    },
    bool: {
        sizeof: 4,
        read: (data, position, isLittleEndian) => Boolean(data.getUint32(position, isLittleEndian)),
        write: (data, position, value) => data.setUint8(position, Boolean(value))
    },
    string: {
        sizeof: undefined,
        read: (data, position) => {
            let ret = new Array
            for (let i = position; data.getUint8(i) != 0; i++) {
                ret.push(String.fromCharCode(data.getUint8(i)));
            }
            return(ret.join(''));
        }
    }
};

module.exports = primitiveTypes;