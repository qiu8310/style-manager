
import Rule from './Rule';
import StyleRule from './StyleRule';
import Media from './libs/Media';
import {checkType} from '../util';

export default class MediaRule extends Rule {

    getSelectorSpecificity() {
        return Rule.calculateSelectorSpecificity(this.opts.selector);
    }

    getMediaText() {
        return this.cssRule.media.mediaText;
    }

    /**
     * 验证用户提供的 opts 是否合法
     * @param {Object} opts
     * @returns {Boolean}
     */
    static validateUserOpts(opts) {
        return StyleRule.validateUserOpts(opts) && checkType(opts.media, ['string', 'array', 'object']);
    }

    /**
     *
     * @param {Object} opts
     * @returns {Object}
     */
    static unifyUserOpts(opts) {
        opts.media = new Media(opts.media);
        return opts;
    }

    /**
     * @param {Object} opts
     * @param {Media} opts.media
     * @param {String} opts.selector
     * @param {Object} opts.style
     * @returns {String}
     */
    static parseOptsToCssText(opts) {
        return '@media ' + opts.media.toMediaText() + ' { ' + StyleRule.parseOptsToCssText(opts) + ' }';
    }

    /**
     * @param {CSSRule|CssRule} cssRule
     * @returns {Object}
     */
    static parseCssRuleToOpts(cssRule) {
        let opts = StyleRule.parseCssRuleToOpts(cssRule.cssRules[0]);
        opts.media = new Media(cssRule.media.mediaText);

        return opts;
    }


    /**
     * 1. 将 CSSStyleRule 中的多 selector 扁平成单一的 selector
     * 2. 将 @media [only] all {} 中的 CSSStyleRule 放到全局中来
     * 3. 将 CSSMediaRule 中的 CSSStyleRule 独立出来，即使得一个 CSSMediaRule 中只能含有一个 CSSStyleRule
     *
     * @param {CSSRule|CssRule|CSSMediaRule} cssMediaRule
     * @param {Number} index
     * @param {Stylesheet} sheet
     * @returns {Number} - sheet 中下一个要处理的 rule
     */
    static flat(cssMediaRule, index, sheet) {
        let mediaText = cssMediaRule.media.mediaText;
        let i = 0, next,
            rules = cssMediaRule.cssRules,
            rulesLength = rules.length;

        // media 中没有定义任何的 styleRule，则直接删除这个 mediaRule
        if (!rulesLength) {
            sheet.deleteRule(index);
            return index;
        }

        // 执行第 1 点
        while (i < rulesLength) {
            next = StyleRule.flat(rules[i], i, cssMediaRule);
            rulesLength += next - i - 1;
            i = next;
        }


        // 执行第 2 点
        if (mediaText === 'all' || mediaText === 'only all') {
            sheet.deleteRule(index);
            index--;

            for (i = 0; i < rulesLength; i++) {
                index += 1;
                sheet.insertRule(rules[i].cssText, index);
            }

        // 执行第 3 点
        } else if (rulesLength > 1) {
            for (i = 1; i < rulesLength; i++) {
                index += 1;
                sheet.insertRule(`@media ${mediaText} {${rules[1].cssText}}`, index);
                cssMediaRule.deleteRule(1);
            }
        }

        return index + 1;
    }
}

MediaRule.type = CSSRule.MEDIA_RULE;
MediaRule.Media = Media;
