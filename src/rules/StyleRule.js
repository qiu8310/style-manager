
import Rule from './Rule';
import {checkType} from '../util';

export default class StyleRule extends Rule {

    getSelectorSpecificity() {
        return Rule.calculateSelectorSpecificity(this.opts.selector);
    }

    /**
     * 验证用户提供的 opts 是否合法
     * @param {Object} opts
     * @returns {Boolean}
     */
    static validateUserOpts(opts) {
        return checkType(opts.selector, 'string') && checkType(opts.style, 'object');
    }

    /**
     * @param {Object} opts
     * @param {String} opts.selector
     * @param {Object} opts.style
     *
     * @returns {String}
     */
    static parseOptsToCssText(opts) {
        return opts.selector + ' { ' + Rule.styleObjectToCssCode(opts.style) + ' }';
    }

    /**
     * @param {CSSRule|CssRule} cssRule
     * @returns {Object}
     */
    static parseCssRuleToOpts(cssRule) {
        let selector = cssRule.selectorText,
            cssCode = cssRule.cssText.replace(selector, '');

        cssCode = cssCode.replace(/^\s*\{|\s*\}$/g, '');

        return {selector, style: Rule.cssCodeToStyleObject(cssCode)};
    }


    /**
     * 将 CSSStyleRule 中的 多 selector 拆分成单个 selector，例如将一个： a, b {} 拆分成两个： a {}  b {}
     *
     * @param {CSSRule|CssRule|CSSStyleRule} cssStyleRule
     * @param {Number} index
     * @param {Stylesheet|CSSRule|CssRule} sheet - 也有可能是 CSSMediaRule（需要将它下面的 CSSStyleRule 扁平化）
     * @returns {Number} - sheet 中下一个要处理的 rule
     */
    static flat(cssStyleRule, index, sheet) {
        let selectorText = cssStyleRule.selectorText;

        if (selectorText.indexOf(',') > 0) {
            let selectors = selectorText.split(',');
            let code = cssStyleRule.cssText.replace(selectorText, '');

            sheet.deleteRule(index);
            index--;

            selectors.forEach((selector) => {
                index += 1;
                sheet.insertRule( selector + code, index);
            });
        }

        return index + 1;
    }

}

StyleRule.type = CSSRule.STYLE_RULE;
