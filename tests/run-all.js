const testList = [
    './example1.js',
    './example-write.js',
];

let allOK = true;

for (let testFile of testList) {
    try {
        require(testFile).test();
        console.log(`${testFile} PASS`);
    } catch (err) {
        console.error(`${testFile} FAIL:`);
        console.error(err);
        allOK = false;
    }
}

if (!allOK) throw new Error('Some tests failed.');