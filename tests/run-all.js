const testList = [
    './example1.js',
];

for (let testFile of testList) {
    require(testFile).test();
}