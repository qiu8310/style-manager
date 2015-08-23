'use strict';


/*
 ASSERT:
 ok(value, [message])
 equal(actual, expected, [message])
 notEqual(actual, expected, [message])
 deepEqual(actual, expected, [message])
 notDeepEqual(actual, expected, [message])
 strictEqual(actual, expected, [message])
 notStrictEqual(actual, expected, [message])
 throws(block, [error], [message])
 doesNotThrow(block, [error], [message])
 ifError(value)

 SHOULD.JS:
 http://shouldjs.github.io/

 Some test frameworks:
 sinon:  function spy
 nock: mock http request
 supertest: test http server
 rewire: modify the behaviour of a module such that you can easily inject mocks and manipulate private variables

 More on http://www.clock.co.uk/blog/tools-for-unit-testing-and-quality-assurance-in-node-js
 */



import assert from 'power-assert';
import should from 'should';
import {normalize} from '../src/rules/libs/Media.js';

describe('Media', () => {
    it('should create single media query', () => {

        normalize({
            type: 'all',
            features: {
                width: {min: '30px', max: '200px'}
            }
        }).should.eql('all and (min-width: 30px) and (max-width: 200px)');
    });

    it('should sort media query features according pre-defined feature keys\'s order', () => {

        normalize({
            type: 'all',
            features: {
                minHeight: '400px',
                color: true,
                width: {min: '30px'}
            }
        }).should.eql('all and (min-width: 30px) and (min-height: 400px) and (color)');
    });

    it('should support multiple medias', () => {
        normalize(
            [
                {
                    type: 'screen',
                    only: true
                },
                {
                    type: 'print',
                    features: {
                        width: '20px'
                    }
                }
            ]
        ).should.eql('only screen, print and (width: 20px)');
    });

    it('should support string media text', () => {

        normalize('all and (height: 500px) and (max-width: 300px)')
            .should.eql('all and (max-width: 300px) and (height: 500px)');
    });
});


