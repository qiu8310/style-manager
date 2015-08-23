import assert from 'power-assert';
import should from 'should';
import StyleManager from '../src/StyleManager.js';

describe('StyleManager', () => {

    let sm,
        strip;
    before(function() {
        sm = new StyleManager('sm');
        strip = (str) => str.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
    });

    it('should create new style rule', () => {

        let rule = sm.create(CSSRule.STYLE_RULE, {selector: '.a', style: {color: 'red'}});

        rule.getCssText().should.eql('.a { color: red; }')
    });

    it('should create new media rule', () => {
        let rule = sm.create(CSSRule.MEDIA_RULE, {
            selector: '.a',
            style: {color: 'green'},
            media: {only: true, type: 'screen', features: {minWidth: '300px'}}
        });

        strip(rule.getCssText()).should.eql('@media only screen and (min-width: 300px) { .a { color: green; } }');
    });

    it('should move second rule to first', () => {
        let second = sm.get(1), first = sm.get(0);
        let newSecond = sm.move(second, 0);

        newSecond.getCssText().should.eql(second.getCssText());
        first.getCssText().should.eql(sm.get(1).getCssText());
    });


    it('should remove first rule', () => {
        let second = sm.get(1);
        sm.remove(sm.get(0));

        second.getCssText().should.eql(sm.get(0).getCssText());
        sm.length.should.eql(1);
    });

    it('should empty sheet', () => {

        sm.create(CSSRule.STYLE_RULE, {selector: '.a', style: {color: 'red'}});
        sm.length.should.eql(2);
        sm.empty();
        sm.length.should.eql(0);

    });

});
