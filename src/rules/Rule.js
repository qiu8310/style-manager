import util from '../util';

const CSS_PSEUDO_ELEMENTS = [
    'after', 'before', 'first-line', 'first-letter', 'selection', 'placeholder'
];

export default class Rule {

    /**
     * @param {CSSRule|CssRule} cssRule
     * @param {Object} opts
     * @param {StyleManager} sm
     */
    constructor(cssRule, opts, sm) {
        this.cssRule = cssRule;
        this.opts = opts;
        this.sm = sm;

        this._nextTickId = null;
        this._cbs = [];
    }

    remove() { this.sm.remove(this); }

    is(type) { return this.constructor.type === type; }

    _updateSheetLater(cb) {
        if (typeof cb === 'function') this._cbs.push(cb);

        if (this._nextTickId) clearTimeout(this._nextTickId);
        this._nextTickId = setTimeout(() => {
            let result = this._updateSheet();
            for (let i = 0; i < this._cbs.length; i++)
                this._cbs[i](result);
            this._cbs.length = 0;
        }, 0);
    }

    _updateSheet() {
        let sm = this.sm;
        let cssText = this.constructor.parseOptsToCssText(this.opts);

        // 不用更新
        if (cssText === this.getCssText()) return true;

        console.debug('Transform opts %o to css text %o', this.opts, cssText);

        let index = sm.index(this);
        try {
            this.cssRule = sm.insertCssText(cssText, index + 1);
        } catch (e) {
            console.warn('Update rule %o failed. insert cssText: %o, error: %o', this, cssText, e);
            return false;
        }

        // 插入成功才删除之前的 cssRule
        sm.deleteCssRule(index);
        return true;
    }

    /**
     * @param {Object} opts
     * @param {Function} [cb]
     */
    setOpts(opts, cb) {
        util.assign(this.opts, opts);
        this._updateSheetLater(cb);
    }

    /**
     * @param {Object} opts
     * @param {Function} [cb]
     */
    replaceOpts(opts, cb) {
        this.opts = opts || {};
        this._updateSheetLater(cb);
    }

    /**
     * @param {Function} [cb]
     * @returns {Boolean}
     */
    forceUpdateSheet(cb) { return this._updateSheetLater(cb); }

    getCssText() { return this.cssRule.cssText; }

    toString() { return this.cssRule.cssText; }

    //========== 工具函数:

    /**
     * 计算单个 CSS 选择器的权重
     * @param {String} selector
     *
     * https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity
     *
     * Elements and pseudo-elements: 1
     * Classes, attributes and pseudo-classes: 10
     * Id: 100
     *
     */
    static calculateSelectorSpecificity(selector) {
        let specificity = 0;
        let parsed = selector
            .replace(/[\*\+>~]/g, ' ')          // 去掉全局选择器和特殊分隔符号
            .replace(/:not(\(.*?\))/g, '$1')    // :not 只需要使用它内部的选择器即可
            .replace(/\([^\)]*\)/g, '')         // 去掉其它无用的括号
            .replace(/\[[^\]]*\]/g, () => {     // 计算属性选择器的权重，并去掉它们
                specificity += 10;
                return '';
            })
            .replace(/:?:([\w-]+)/g, (_, m) => {    // 计算伪类和伪元素的权值，计算完就把它们去掉
                specificity += CSS_PSEUDO_ELEMENTS.indexOf(stripVendors(m)) < 0 ? 10 : 1;
                return '';
            })
            .replace(/([#\.]?)[\w-]+/g, (_, m) => {
                specificity += ({'#': 100, '.': 10})[m] || 1;
                return '';
            });

        if (parsed.trim() !== '')
            throw new Error(`Selector '${selector}' is invalid, parse result '${parsed}'.`);

        return specificity;
    }

    /**
     * @param {Object} style
     * @returns {string}
     */
    static styleObjectToCssCode(style) {
        let keys = Object.keys(style).map(kebabCaseStyleKey);
        if (!keys.length) return '';

        keys = sortStyleVendorKeys(keys);

        return keys.map(key => key + ': ' + style[key] + ';').join('\n');
    }

    /**
     * @param {String} cssCode
     * @returns {Object}
     */
    static cssCodeToStyleObject(cssCode) {
        let rules = cssCode.trim().split(';')
            .map(rule => rule.trim())
            .filter(rule => rule && rule.indexOf(':') > 0);

        return rules.reduce((result, rule) => {
            let parts = rule.split(':');
            result[parts.shift().trim()] = parts.join(':').trim();
            return result;
        }, {});
    }


     //========== 子类要必需实现的方法:

    /**
     * 此方法是给 RuleControl.createRuleByOpts 用的，根据用户输入的参数，解析得到 cssText，
     * RuleControl 再将这 cssText 插入 Stylesheet 中，生成 cssRule 创建 Rule
     * @param {Object} opts
     */
    static parseOptsToCssText(opts) {
        return opts.cssText;
    }

    /**
     * 此方法是用在 RuleControl.createRuleByCssRule 中的，当首次从一个文档中已经存在的 Stylesheet 中解析 rules 时，
     * 具体的 Rule 应该用此方法将 cssRule 解析成 opts 并保存，方便之后取用
     * @param {CSSRule|CssRule} cssRule
     */
    static parseCssRuleToOpts(cssRule) {
        return {cssText: cssRule.cssText};
    }

    //=========== 子类可选择实现的方法

    /**
     * 此方法用在 RuleControl.createRuleByOpts，执行 parseOptsToCssText 并生成 cssRule 之前
     * 用于对用户传来的 opts 做进一步加工成 Rule 可以直接使用的 opts
     * @param {Object} opts
     * @returns {Object}
     */
    //static unifyUserOpts(opts) {}

    /**
     * 验证用户提供的 opts 是否合法
     * @param {Object} opts
     * @returns {Boolean}
     */
    //static validateUserOpts(opts) {}

}


/**
 * 带 vendor 前缀的要放非带 vendor 前缀的前面
 *
 * @param {Array} styleKeys
 * @returns {Array}
 */
function sortStyleVendorKeys(styleKeys) {
    let vendorStyleKeys = styleKeys.filter(key => key[0] === '-');

    // 没有带 vendor 前缀的属性，直接返回
    if (!vendorStyleKeys.length) return styleKeys;

    let result = [];
    let vendorStyleKeysMirror = vendorStyleKeys.map(key => key.replace(/^-\w+-/, ''));

    styleKeys.forEach(key => {
        if (key[0] !== '-') {
            for (let i = 0, l = vendorStyleKeysMirror.length; i < l; i++) {
                if (vendorStyleKeysMirror[i] === key)
                    result.push(vendorStyleKeys[i]);
            }
            result.push(key);
        }
    });

    return styleKeys;
}

/**
 * 将 JS 中的驼峰式的样式 key 转成 中划线式的
 * @param {String} styleKey
 * @returns {String}
 *
 */
function kebabCaseStyleKey(styleKey) {
    styleKey = util.kebabCase(styleKey);
    if (['o', 'ms', 'moz', 'webkit'].some(k => styleKey.indexOf(k + '-') === 0)) {
        return '-' + styleKey;
    }
    return styleKey;
}

function stripVendors(str) { return str.replace(/^-(o|ms|moz|webkit)-/, ''); }
