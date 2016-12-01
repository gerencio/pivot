var chai_1 = require('chai');
var formatter_1 = require('./formatter');
describe('General', function () {
    describe('getMiddleNumber', function () {
        it('works in simple case', function () {
            var values = [100, 10, 1, 0];
            chai_1.expect(formatter_1.getMiddleNumber(values)).to.equal(10);
        });
        it('works in more complex case', function () {
            var values = [0, 0, -1000, -100, 10, 1, 0, 0, 0, 0];
            chai_1.expect(formatter_1.getMiddleNumber(values)).to.equal(10);
        });
    });
    describe('formatterFromData', function () {
        it('works in simple case', function () {
            var values = [100, 10, 1, 0];
            var formatter = formatter_1.formatterFromData(values, '0,0 a');
            chai_1.expect(formatter(10)).to.equal('10');
        });
        it('works in k case', function () {
            var values = [50000, 5000, 5000, 5000, 5000, 100, 10, 1, 0];
            var formatter = formatter_1.formatterFromData(values, '0,0.000 a');
            chai_1.expect(formatter(10)).to.equal('0.010 k');
            chai_1.expect(formatter(12345)).to.equal('12.345 k');
        });
        it('works in KB case', function () {
            var values = [50000, 5000, 5000, 5000, 5000, 100, 10, 1, 0];
            var formatter = formatter_1.formatterFromData(values, '0,0.000 b');
            chai_1.expect(formatter(10)).to.equal('0.010 KB');
            chai_1.expect(formatter(12345)).to.equal('12.056 KB');
        });
    });
});
//# sourceMappingURL=formatter.mocha.js.map