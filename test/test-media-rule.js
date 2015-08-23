import assert from 'power-assert';
import should from 'should';
import StyleManager from '../src/StyleManager.js';
import MediaRule from '../src/rules/MediaRule.js';


describe('MediaRule', () => {

    let sm,
        strip;
    before(function() {
        sm = new StyleManager('media-rule');
        strip = (str) => str.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
    });


    it.only('should be updated', (done) => {

        let rule = sm.create(CSSRule.MEDIA_RULE, {
            selector: '.a',
            style: {},
            media: {only: true, type: 'screen'}
        });


        sm.length.should.eql(1);
        strip(rule.getCssText()).should.eql('@media only screen { .a { } }');

        rule.setOpts({selector: '.c', style: {color: 'red'}});

        let mediaQuery = rule.opts.media.get(0);
        mediaQuery.reverse();
        mediaQuery.setFeatures({height: '300px'});
        mediaQuery.appendFeatures({width: {max: '600px'}});

        rule.setOpts({selector: '.b'}, () => {
            assert.ok(rule.opts.media.equals(new MediaRule.Media(rule.getMediaText())));
            sm.length.should.eql(1);
            done();
        });
    });

});
