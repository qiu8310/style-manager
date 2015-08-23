
function toString(target) { return Object.prototype.toString.call(target); }

function toArray(target) {
    var l = target.length;
    var a = new Array(l);
    for (var i = 0; i < l; i++) a[i] = target[i];
    return a;
}

function getType(target) { return toString(target).slice(8, -1).toLowerCase(); }

function checkType(target, types) {
    let type = getType(target);
    if (Array.isArray(types)) return types.indexOf(type) >= 0;
    if (typeof types === 'function') return target instanceof types;
    return types === type;
}

function assign(src, ...targets) {
    if (getType(src) !== 'object') src = {};

    for (let i = 0, l = targets.length; i < l; i++) {
        let target = targets[i];
        if (getType(target) === 'object') {
            for (let key in target) {
                if (target.hasOwnProperty(key)) {
                    src[key] = target[key];
                }
            }
        }
    }

    return src;
}

function assert(target, type) {
    let targetType = getType(target);
    if (type !== targetType)
        throw new Error(`Assert error, target %o's type is %o, not %o.`, target, type, targetType);
}

function kebabCase(str) { return str.replace(/[A-Z]/g, r => '-' + r.toLowerCase()); }



//============== StyleSheet 相关

const IS_SAFARI = toString(window.HTMLElement).indexOf('Constructor') > 0;

/**
 *
 * @param {Document} doc
 * @param {String} [id]
 * @returns {HTMLStyleElement}
 */
function createStyleElement(doc, id) {
    let style = doc.createElement('style');

    style.type = 'text/css';
    style.rel = 'stylesheet';
    if (id) style.id = id;

    doc.getElementsByTagName('head')[0].appendChild(style);

    if (IS_SAFARI) style.appendChild(doc.createTextNode(''));

    return style;
}

/**
 *
 * @param {Stylesheet} sheet
 * @param {String} cssText
 * @param {Number} [index]
 * @returns {CssRule|CSSRule}
 */
function createCssMediaRuleWithCssText(sheet, cssText, index) {
    if (cssText.indexOf('@media') !== 0)
        throw new Error('cssText is illegal, not a media cssText.');

    index = sheet.insertRule(cssText, index != null ? index : sheet.cssRules.length);
    return sheet.cssRules[index];
}

/**
 *
 * @param {Stylesheet} sheet
 * @param {String} mediaText
 * @param {Number} [index]
 * @returns {CssRule|CSSRule}
 */
function createEmptyCssMediaRule(sheet, mediaText, index) {
    mediaText = mediaText.toLowerCase().trim();
    let rule, cssText, isSafari = IS_SAFARI;

    let tempSelector = '.safari---temp';
    let mediaContent = isSafari ? tempSelector + ' {}' : '';

    cssText = `@media ${mediaText} { ${mediaContent} }`;
    index = sheet.insertRule(cssText, index != null ? index : sheet.cssRules.length);
    rule = sheet.cssRules[index];

    if (isSafari && rule.cssRules[0].selectorText === tempSelector) rule.deleteRule(0);

    return rule;
}

/**
 * @param {CssRule|CSSRule} cssMediaRule
 * @returns {CssRule|CSSRule}
 */
function clearCssMediaRule(cssMediaRule) {
    var sheet = cssMediaRule.parentStyleSheet,
        index = toArray(sheet.cssRules).indexOf(cssMediaRule);

    sheet.deleteRule(index);
    return createEmptyCssMediaRule(sheet, cssMediaRule.media.mediaText, index);
}


export default {
    toString,
    toArray,
    getType,
    checkType,
    assign,
    assert,
    kebabCase,

    createStyleElement,
    createCssMediaRuleWithCssText,
    createEmptyCssMediaRule,
    clearCssMediaRule
};
