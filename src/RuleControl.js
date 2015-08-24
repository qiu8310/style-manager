import Rule from './rules/Rule.js';
import MediaRule from './rules/MediaRule.js';
import StyleRule from './rules/StyleRule.js';
import ImportRule from './rules/ImportRule.js';
import FontFaceRule from './rules/FontFaceRule.js';
import KeyframesRule from './rules/KeyframesRule.js';

let RuleCtors = [
    MediaRule,
    StyleRule,
    ImportRule,
    FontFaceRule,
    KeyframesRule
];

let RuleCtorsMap = {};
RuleCtors.forEach(RuleCtor => RuleCtorsMap['type-' + RuleCtor.type] = RuleCtor);


function getRuleCtorByType(type) {
    let result = RuleCtorsMap['type-' + type];
    if (!result) throw new Error('Not supported rule type ' + type);
    return result;
}


/**
 * 扁平化 sheet rules:
 *
 * 1. 将 CSSMediaRule 中的 CSSStyleRule 独立出来，即使得一个 CSSMediaRule 中只能含有一个 CSSStyleRule
 * 2. 将 CSSStyleRule 中的 多 selector 拆分成单个 selector，例如将一个： a, b {} 拆分成两个： a {}  b {}
 * // NO 3. 将 @media [only] all {} 中的 CSSStyleRule 放到全局中来
 * // NO 4. 将 不含有任何 CSSStyleRule 的 CSSMediaRule 去掉
 *
 * @param {Stylesheet} sheet
 */
function flatStyleSheetRules(sheet) {
    let rules = sheet.cssRules,
        rulesLength = rules.length,

        rule, ruleCtor,
        i = 0, next;

    while (i < rulesLength) {
        rule = rules[i];
        ruleCtor = getRuleCtorByType(rule.type);
        if (ruleCtor.flat) {
            next = ruleCtor.flat(rule, i, sheet);
            rulesLength += next - i - 1;
            i = next;
        } else {
            i++;
        }
    }
}

/**
 * 根据 cssRule 创建一个封装了的自定义的 rule
 * @param {CssRule|CSSRule} cssRule
 * @param {StyleManager} styleManager
 * @param {Object} [opts]
 * @returns {Rule}
 */
function createRuleByCssRule(cssRule, styleManager, opts) {
    let Ctor = getRuleCtorByType(cssRule.type);

    if (!opts) {
        if (!Ctor.parseCssRuleToOpts)
            throw new Rule(`Rule type ${cssRule.type} not support create by cssRule`);
        opts = Ctor.parseCssRuleToOpts(cssRule);
    }

    return new Ctor(cssRule, opts, styleManager);
}

/**
 * 根据一些自定义的参数创建 Rule，具体需要什么参数有具体的 Rule 自己实现
 * @param {CSSRule.type} type
 * @param {Object} opts
 * @param {Number} insertIndex
 * @param {StyleManager} styleManager
 * @returns {Rule}
 */
function createRuleByOpts(type, opts, insertIndex, styleManager) {
    let Ctor = getRuleCtorByType(type);
    if (!Ctor.parseOptsToCssText)
        throw new Error(`Rule type ${type} not support create by opts.`);

    if (Ctor.validateUserOpts && !Ctor.validateUserOpts(opts))
        throw new Error(`Rule type ${type}'s opts is invalid.`);

    if (Ctor.unifyUserOpts)
        opts = Ctor.unifyUserOpts(opts);

    styleManager.insertCssText(Ctor.parseOptsToCssText(opts), insertIndex);
    let cssRule = styleManager.getCssRules()[insertIndex];

    return createRuleByCssRule(cssRule, styleManager, opts);
}


export default {
    Rule,
    RuleCtors,
    getRuleCtorByType,
    flatStyleSheetRules,
    createRuleByCssRule,
    createRuleByOpts
};
