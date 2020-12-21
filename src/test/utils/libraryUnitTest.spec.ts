import {calculateAfcEsclateCredits, doesListContainElement, normalizeString} from '../../utils/library';
import chai, { expect } from 'chai';
const should = chai.should();

describe('Test logic for calculation of AFC escalation credits', function() {

    it('Must correctly compute single range', function() {
        const answer = calculateAfcEsclateCredits('1-10');
        answer.should.equal(10);
    });

    it('Must correctly compute multiple page ranges including spaces', function() {
        const answer = calculateAfcEsclateCredits('1-10, 90-95, 23-28');
        answer.should.equal(22);
    });

    it('Must return -1 for nonnumeric page ranges', function() {
        const answer = calculateAfcEsclateCredits('hello');
        expect(answer !== answer).equal(true);
    });
});

describe('Test normalization logic for string', function() {
    it('Must not do any change for lowercase alphanumeric string', function() {
        normalizeString('hello').should.equal('hello');
    });

    it('Must lowercase the string', function() {
        normalizeString('hEllO').should.not.equal('hEllO');
        normalizeString('hEllO').should.equal('hello');
    });

    it('Must strip the white spaces and lowercase string', function() {
        normalizeString('Hello   World ').should.not.equal('Hello   World ');
        normalizeString('Hello   World ').should.equal('helloworld');
    });

});

describe('Test list contains normalized string or not', function() {
    it('Must detect capitalized string as normalized string', () => {
const items = ['hello', 'Hi', 'red  Apple'];
expect(doesListContainElement(items, 'hi')).equal(true);
expect(doesListContainElement(items, 'Red apple')).equal(true);
expect(doesListContainElement(items, 'Redapple')).equal(true);
expect(doesListContainElement(items, 'hie')).equal(false);
expect(doesListContainElement([], 'hie')).equal(false);
    });

    it('Must work with undefined list', () => {
        const items = undefined;
        expect(doesListContainElement(items, "hello")).equal(false);
            });
        
});
