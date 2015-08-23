/*
 * style-manager
 * https://github.com/qiu8310/style-manager
 *
 * Copyright (c) 2015 Zhonglei Qiu
 * Licensed under the MIT license.
 */



import util from './util';
import RuleControl from './RuleControl';


/*
 sheet 的结构体

 CSSStyleSheet
    cssRules:   CSSRuleList
    rules:      CSSRuleList     # cssRules 的别名，建议不要使用 rules，不兼容 IE
    disabled:   Boolean
    media:      MediaList       # 这里的 media 一般是一个空的 MediaList
    ownerNode:  Node
    ownerRule:
    href:       String
    title:      String
    type:       String

 CSSRuleList
    [ CSSRule ] # CSSRule 包含了 CSSMediaRule 和 CSSStyleRule
    length:     Number


 CSSRule                # 可以理解成 CSSMediaRule 和 CSSStyleRule 的父类
    cssText:            String
    parentRule:         CSSRule
    parentStyleSheet:   CSSStyleSheet
    type:               Number

    # @NOTE CSSMediaRule 上才有的属性
    media:              MediaList

    # @NOTE CSSStyleRule 上才有的属性
    selectorText:       String
    style:              CSSStyleDeclaration  # 类似于 element.style，也是 CSSStyleRule 上专有的属性


    CSSRule type 支持的值：
        CSSRule.STYLE_RULE
        CSSRule.MEDIA_RULE
        CSSRule.FONT_FACE_RULE
        CSSRule.PAGE_RULE
        CSSRule.IMPORT_RULE
        CSSRule.CHARSET_RULE
        CSSRule.UNKNOWN_RULE
        CSSRule.KEYFRAMES_RULE
        CSSRule.KEYFRAME_RULE

        # @NOTE reversed for future use
        CSSRule.NAMESPACE_RULE
        CSSRule.COUNTER_STYLE_RULE
        CSSRule.SUPPORTS_RULE
        CSSRule.DOCUMENT_RULE
        CSSRule.FONT_FEATURE_VALUES_RULE
        CSSRule.VIEWPORT_RULE
        CSSRule.REGION_STYLE_RULE


 MediaList
    [ media query string]
    length:     Number
    mediaText:  String


 */


export default class StyleManager {
    /**
     * @param {Node|String} style - Style or Link Node Element or ID Selector
     * @param {Document} pageDocument
     */
    constructor(style, pageDocument) {

        this.rc = RuleControl;
        this.rules = [];
        this.document = pageDocument || document;

        if (style.nodeType === Node.ELEMENT_NODE && style.sheet) {
            this.sheet = style.sheet;

            if (style.id) this.id = style.id;
            else this.id = style.id = '__sm__' + Date.now();

        } else if (typeof style === 'string') {

            this.sheet = null;
            this.id = '__sm__' + style.replace(/[^\w-]/, '');
        } else {
            throw new Error('StyleManager constructor\'s parameter style is illegal .');
        }

        // init
        this._initSheet();
    }

    get length () { return this.rules.length; }

    // 初始化获取 sheet
    _initSheet() {
        let style,
            rc = this.rc,
            doc = this.document;
        let {id, sheet} = this;

        if (!sheet) {
            style = doc.querySelector('#' + id);
            if (!style) style = util.createStyleElement(doc, id);
            sheet = this.sheet = style.sheet;
        }

        rc.flatStyleSheetRules(sheet);

        let rules = sheet.cssRules;
        for (let i = 0; i < rules.length; i++) {
            this.rules.push(rc.createRuleByCssRule(rules[i], this));
        }
    }

    /**
     * 返回 rule 在当前 styleSheet 中的位置
     * @param {Rule} rule
     * @returns {Number}
     */
    index(rule) {
        return this.rules.indexOf(rule);
    }

    /**
     * 返回指定位置上的 rule
     * @param {Number} index
     * @returns {Rule}
     */
    get(index) {
        return this.rules[index];
    }

    /**
     * 遍历当前所有的 rules
     * @param {Function} fn
     */
    each(fn) {
        for (let i = 0; i < this.rules.length; i++)
            fn(this.rules[i], i, this.rules);
    }

    /**
     * 在当前 Stylesheet 中插入 cssText
     *
     * @param {String} cssText
     * @param {Number} index
     * @returns {CssRule}
     */
    insertCssText(cssText, index) {
        this.sheet.insertRule(cssText, index);
        return this.sheet.cssRules[index];
    }

    deleteCssRule(index) {
        this.sheet.deleteRule(index);
    }

    /**
     * 获取当前 Stylesheet 中的所有 CSSRule
     * @returns {CssRule[]|CSSRule[]}
     */
    getCssRules() {
        return this.sheet.cssRules;
    }

    /**
     *
     * @param {CSSRule.type} ruleType
     * @param {Object} ruleOpts
     * @param {Number} [insertIndex] - 默认插入文档的最后
     */
    create(ruleType, ruleOpts, insertIndex) {
        if (insertIndex == null || insertIndex > this.rules.length) insertIndex = this.rules.length;

        let rule = this.rc.createRuleByOpts(ruleType, ruleOpts, insertIndex, this);
        this.rules.splice(insertIndex, 0, rule);
        return rule;
    }


    /**
     * 修改指定的 rule 的位置，如果 index 和它本来的位置一样，则什么也不做
     * @param {Rule} rule
     * @param {Number} index
     * @returns {Rule}
     */
    move(rule, index) {
        let ruleIndex = this.index(rule);
        let sheet = this.sheet;
        let cssRule;

        if (ruleIndex !== index) {
            this.remove(rule);

            if (ruleIndex < index) index--;

            this.insertCssText(rule.getCssText(), index);
            cssRule = sheet.cssRules[index];

            rule = this.rc.createRuleByCssRule(cssRule, this);
            this.rules.splice(index, 0, rule);
        }

        return rule;
    }

    /**
     * 删除指定的 rule
     * @param {Rule} rule
     * @returns {Number} Removed rule's index
     */
    remove(rule) {
        let index = this.index(rule);
        if (index < 0) throw new Error(`Rule ${rule} not in current style, can not be removed.`);

        this.sheet.deleteRule(index);
        this.rules.splice(index, 1);
        return index;
    }

    /**
     * 清空此 styleSheet 下面的所有样式
     */
    empty() {
        for (let i = 0; i < this.rules.length; i++) this.sheet.deleteRule(0);
        this.rules.length = 0;
    }

}

