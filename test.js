// 실행: node test.js — 차량번호 검사 규칙 확인
const fs = require('fs');
const vm = require('vm');
const ctx = {};
vm.runInNewContext(fs.readFileSync(__dirname + '/app.js', 'utf8') + ';this.isValidPlate = isValidPlate;', ctx);
const assert = require('assert');

for (const ok of ['12가3456', '12가 3456', '123가4567', '서울12가3456', ' 12 가 3456 ']) assert.ok(ctx.isValidPlate(ok), ok);
for (const bad of ['', '1234', '12가345', 'abc', '12a3456', '가3456']) assert.ok(!ctx.isValidPlate(bad), bad);
console.log('ok');
