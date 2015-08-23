import assert from 'power-assert';
import should from 'should';
import StyleManager from '../src/StyleManager.js';


describe('StyleRule', () => {

    let sm,
        strip;
    before(function() {
        sm = new StyleManager('style-rule');
        strip = (str) => str.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
    });


    it('should be updated', (done) => {

        let rule = sm.create(CSSRule.STYLE_RULE, {selector: '.a', style: {}});
        rule.getCssText().should.eql('.a { }');
        sm.length.should.eql(1);

        rule.setOpts({selector: '.x'});
        rule.setOpts({selector: '.y', style: {color: 'red'}});
        rule.setOpts({selector: '.b'}, () => {
            rule.getCssText().should.eql('.b { color: red; }');
            sm.length.should.eql(1);
            done();
        });
    });

});
