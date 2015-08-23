(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.StyleManager = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _rulesRuleJs = require('./rules/Rule.js');

var _rulesRuleJs2 = _interopRequireDefault(_rulesRuleJs);

var _rulesMediaRuleJs = require('./rules/MediaRule.js');

var _rulesMediaRuleJs2 = _interopRequireDefault(_rulesMediaRuleJs);

var _rulesStyleRuleJs = require('./rules/StyleRule.js');

var _rulesStyleRuleJs2 = _interopRequireDefault(_rulesStyleRuleJs);

var _rulesImportRuleJs = require('./rules/ImportRule.js');

var _rulesImportRuleJs2 = _interopRequireDefault(_rulesImportRuleJs);

var _rulesFontFaceRuleJs = require('./rules/FontFaceRule.js');

var _rulesFontFaceRuleJs2 = _interopRequireDefault(_rulesFontFaceRuleJs);

var _rulesKeyframesRuleJs = require('./rules/KeyframesRule.js');

var _rulesKeyframesRuleJs2 = _interopRequireDefault(_rulesKeyframesRuleJs);

var RuleCtors = [_rulesMediaRuleJs2['default'], _rulesStyleRuleJs2['default'], _rulesImportRuleJs2['default'], _rulesFontFaceRuleJs2['default'], _rulesKeyframesRuleJs2['default']];

var RuleCtorsMap = {};
RuleCtors.forEach(function (RuleCtor) {
    return RuleCtorsMap['type-' + RuleCtor.type] = RuleCtor;
});

function getRuleCtorByType(type) {
    var result = RuleCtorsMap['type-' + type];
    if (!result) throw new Error('Not supported rule type ' + type);
    return result;
}

/**
 * 扁平化 sheet rules:
 *
 * 1. 将 CSSMediaRule 中的 CSSStyleRule 独立出来，即使得一个 CSSMediaRule 中只能含有一个 CSSStyleRule
 * 2. 将 CSSStyleRule 中的 多 selector 拆分成单个 selector，例如将一个： a, b {} 拆分成两个： a {}  b {}
 * 3. 将 @media [only] all {} 中的 CSSStyleRule 放到全局中来
 * 4. 将 不含有任何 CSSStyleRule 的 CSSMediaRule 去掉
 *
 * @param {Stylesheet} sheet
 */
function flatStyleSheetRules(sheet) {
    var rules = sheet.cssRules,
        rulesLength = rules.length,
        rule = undefined,
        ruleCtor = undefined,
        i = 0,
        next = undefined;

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
    var Ctor = getRuleCtorByType(cssRule.type);

    if (!opts) {
        if (!Ctor.parseCssRuleToOpts) throw new _rulesRuleJs2['default']('Rule type ' + cssRule.type + ' not support create by cssRule');
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
    var Ctor = getRuleCtorByType(type);
    if (!Ctor.parseOptsToCssText) throw new Error('Rule type ' + type + ' not support create by opts.');

    if (Ctor.validateUserOpts && !Ctor.validateUserOpts(opts)) throw new Error('Rule type ' + type + '\'s opts is invalid.');

    if (Ctor.unifyUserOpts) opts = Ctor.unifyUserOpts(opts);

    styleManager.insertCssText(Ctor.parseOptsToCssText(opts), insertIndex);
    var cssRule = styleManager.getCssRules()[insertIndex];

    return createRuleByCssRule(cssRule, styleManager, opts);
}

exports['default'] = {
    Rule: _rulesRuleJs2['default'],
    RuleCtors: RuleCtors,
    getRuleCtorByType: getRuleCtorByType,
    flatStyleSheetRules: flatStyleSheetRules,
    createRuleByCssRule: createRuleByCssRule,
    createRuleByOpts: createRuleByOpts
};
module.exports = exports['default'];

},{"./rules/FontFaceRule.js":3,"./rules/ImportRule.js":4,"./rules/KeyframesRule.js":5,"./rules/MediaRule.js":6,"./rules/Rule.js":7,"./rules/StyleRule.js":8}],2:[function(require,module,exports){
/*
 * style-manager
 * https://github.com/qiu8310/style-manager
 *
 * Copyright (c) 2015 Zhonglei Qiu
 * Licensed under the MIT license.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

var _RuleControl = require('./RuleControl');

var _RuleControl2 = _interopRequireDefault(_RuleControl);

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

var StyleManager = (function () {
    /**
     * @param {Node|String} style - Style or Link Node Element or ID Selector
     * @param {Document} pageDocument
     */

    function StyleManager(style, pageDocument) {
        _classCallCheck(this, StyleManager);

        this.rc = _RuleControl2['default'];
        this.rules = [];
        this.document = pageDocument || document;

        if (style.nodeType === Node.ELEMENT_NODE && style.sheet) {
            this.sheet = style.sheet;

            if (style.id) this.id = style.id;else this.id = style.id = '__sm__' + Date.now();
        } else if (typeof style === 'string') {

            this.sheet = null;
            this.id = '__sm__' + style.replace(/[^\w-]/, '');
        } else {
            throw new Error('StyleManager constructor\'s parameter style is illegal .');
        }

        // init
        this._initSheet();
    }

    _createClass(StyleManager, [{
        key: '_initSheet',

        // 初始化获取 sheet
        value: function _initSheet() {
            var style = undefined,
                rc = this.rc,
                doc = this.document;
            var id = this.id;
            var sheet = this.sheet;

            if (!sheet) {
                style = doc.querySelector('#' + id);
                if (!style) style = _util2['default'].createStyleElement(doc, id);
                sheet = this.sheet = style.sheet;
            }

            rc.flatStyleSheetRules(sheet);

            var rules = sheet.cssRules;
            for (var i = 0; i < rules.length; i++) {
                this.rules.push(rc.createRuleByCssRule(rules[i], this));
            }
        }

        /**
         * 返回 rule 在当前 styleSheet 中的位置
         * @param {Rule} rule
         * @returns {Number}
         */
    }, {
        key: 'index',
        value: function index(rule) {
            return this.rules.indexOf(rule);
        }

        /**
         * 返回指定位置上的 rule
         * @param {Number} index
         * @returns {Rule}
         */
    }, {
        key: 'get',
        value: function get(index) {
            return this.rules[index];
        }

        /**
         * 遍历当前所有的 rules
         * @param {Function} fn
         */
    }, {
        key: 'each',
        value: function each(fn) {
            for (var i = 0; i < this.rules.length; i++) {
                fn(this.rules[i], i, this.rules);
            }
        }

        /**
         * 在当前 Stylesheet 中插入 cssText
         *
         * @param {String} cssText
         * @param {Number} index
         * @returns {CssRule}
         */
    }, {
        key: 'insertCssText',
        value: function insertCssText(cssText, index) {
            this.sheet.insertRule(cssText, index);
            return this.sheet.cssRules[index];
        }
    }, {
        key: 'deleteCssRule',
        value: function deleteCssRule(index) {
            this.sheet.deleteRule(index);
        }

        /**
         * 获取当前 Stylesheet 中的所有 CSSRule
         * @returns {CssRule[]|CSSRule[]}
         */
    }, {
        key: 'getCssRules',
        value: function getCssRules() {
            return this.sheet.cssRules;
        }

        /**
         *
         * @param {CSSRule.type} ruleType
         * @param {Object} ruleOpts
         * @param {Number} [insertIndex] - 默认插入文档的最后
         */
    }, {
        key: 'create',
        value: function create(ruleType, ruleOpts, insertIndex) {
            if (insertIndex == null || insertIndex > this.rules.length) insertIndex = this.rules.length;

            var rule = this.rc.createRuleByOpts(ruleType, ruleOpts, insertIndex, this);
            this.rules.splice(insertIndex, 0, rule);
            return rule;
        }

        /**
         * 修改指定的 rule 的位置，如果 index 和它本来的位置一样，则什么也不做
         * @param {Rule} rule
         * @param {Number} index
         * @returns {Rule}
         */
    }, {
        key: 'move',
        value: function move(rule, index) {
            var ruleIndex = this.index(rule);
            var sheet = this.sheet;
            var cssRule = undefined;

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
    }, {
        key: 'remove',
        value: function remove(rule) {
            var index = this.index(rule);
            if (index < 0) throw new Error('Rule ' + rule + ' not in current style, can not be removed.');

            this.sheet.deleteRule(index);
            this.rules.splice(index, 1);
            return index;
        }

        /**
         * 清空此 styleSheet 下面的所有样式
         */
    }, {
        key: 'empty',
        value: function empty() {
            for (var i = 0; i < this.rules.length; i++) {
                this.sheet.deleteRule(0);
            }this.rules.length = 0;
        }
    }, {
        key: 'length',
        get: function get() {
            return this.rules.length;
        }
    }]);

    return StyleManager;
})();

exports['default'] = StyleManager;
module.exports = exports['default'];

},{"./RuleControl":1,"./util":10}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Rule2 = require('./Rule');

var _Rule3 = _interopRequireDefault(_Rule2);

var FontFaceRule = (function (_Rule) {
  _inherits(FontFaceRule, _Rule);

  function FontFaceRule() {
    _classCallCheck(this, FontFaceRule);

    _get(Object.getPrototypeOf(FontFaceRule.prototype), 'constructor', this).apply(this, arguments);
  }

  return FontFaceRule;
})(_Rule3['default']);

exports['default'] = FontFaceRule;

FontFaceRule.type = CSSRule.FONT_FACE_RULE;
module.exports = exports['default'];

},{"./Rule":7}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Rule2 = require('./Rule');

var _Rule3 = _interopRequireDefault(_Rule2);

var ImportRule = (function (_Rule) {
  _inherits(ImportRule, _Rule);

  function ImportRule() {
    _classCallCheck(this, ImportRule);

    _get(Object.getPrototypeOf(ImportRule.prototype), 'constructor', this).apply(this, arguments);
  }

  return ImportRule;
})(_Rule3['default']);

exports['default'] = ImportRule;

ImportRule.type = CSSRule.IMPORT_RULE;
module.exports = exports['default'];

},{"./Rule":7}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Rule2 = require('./Rule');

var _Rule3 = _interopRequireDefault(_Rule2);

var KeyframesRule = (function (_Rule) {
  _inherits(KeyframesRule, _Rule);

  function KeyframesRule() {
    _classCallCheck(this, KeyframesRule);

    _get(Object.getPrototypeOf(KeyframesRule.prototype), 'constructor', this).apply(this, arguments);
  }

  return KeyframesRule;
})(_Rule3['default']);

exports['default'] = KeyframesRule;

KeyframesRule.type = CSSRule.KEYFRAMES_RULE;
module.exports = exports['default'];

},{"./Rule":7}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Rule2 = require('./Rule');

var _Rule3 = _interopRequireDefault(_Rule2);

var _StyleRule = require('./StyleRule');

var _StyleRule2 = _interopRequireDefault(_StyleRule);

var _libsMedia = require('./libs/Media');

var _libsMedia2 = _interopRequireDefault(_libsMedia);

var _util = require('../util');

var MediaRule = (function (_Rule) {
    _inherits(MediaRule, _Rule);

    function MediaRule() {
        _classCallCheck(this, MediaRule);

        _get(Object.getPrototypeOf(MediaRule.prototype), 'constructor', this).apply(this, arguments);
    }

    _createClass(MediaRule, [{
        key: 'getSelectorSpecificity',
        value: function getSelectorSpecificity() {
            return _Rule3['default'].calculateSelectorSpecificity(this.opts.selector);
        }
    }, {
        key: 'getMediaText',
        value: function getMediaText() {
            return this.cssRule.media.mediaText;
        }

        /**
         * 验证用户提供的 opts 是否合法
         * @param {Object} opts
         * @returns {Boolean}
         */
    }], [{
        key: 'validateUserOpts',
        value: function validateUserOpts(opts) {
            return _StyleRule2['default'].validateUserOpts(opts) && (0, _util.checkType)(opts.media, ['string', 'array', 'object']);
        }

        /**
         *
         * @param {Object} opts
         * @returns {Object}
         */
    }, {
        key: 'unifyUserOpts',
        value: function unifyUserOpts(opts) {
            opts.media = new _libsMedia2['default'](opts.media);
            return opts;
        }

        /**
         * @param {Object} opts
         * @param {Media} opts.media
         * @param {String} opts.selector
         * @param {Object} opts.style
         * @returns {String}
         */
    }, {
        key: 'parseOptsToCssText',
        value: function parseOptsToCssText(opts) {
            return '@media ' + opts.media.toMediaText() + ' { ' + _StyleRule2['default'].parseOptsToCssText(opts) + ' }';
        }

        /**
         * @param {CSSRule|CssRule} cssRule
         * @returns {Object}
         */
    }, {
        key: 'parseCssRuleToOpts',
        value: function parseCssRuleToOpts(cssRule) {
            var opts = _StyleRule2['default'].parseCssRuleToOpts(cssRule.cssRules[0]);
            opts.media = new _libsMedia2['default'](cssRule.media.mediaText);

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
    }, {
        key: 'flat',
        value: function flat(cssMediaRule, index, sheet) {
            var mediaText = cssMediaRule.media.mediaText;
            var i = 0,
                next = undefined,
                rules = cssMediaRule.cssRules,
                rulesLength = rules.length;

            // media 中没有定义任何的 styleRule，则直接删除这个 mediaRule
            if (!rulesLength) {
                sheet.deleteRule(index);
                return index;
            }

            // 执行第 1 点
            while (i < rulesLength) {
                next = _StyleRule2['default'].flat(rules[i], i, cssMediaRule);
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
                        sheet.insertRule('@media ' + mediaText + ' {' + rules[1].cssText + '}', index);
                        cssMediaRule.deleteRule(1);
                    }
                }

            return index + 1;
        }
    }]);

    return MediaRule;
})(_Rule3['default']);

exports['default'] = MediaRule;

MediaRule.type = CSSRule.MEDIA_RULE;
MediaRule.Media = _libsMedia2['default'];
module.exports = exports['default'];

},{"../util":10,"./Rule":7,"./StyleRule":8,"./libs/Media":9}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _util = require('../util');

var _util2 = _interopRequireDefault(_util);

var CSS_PSEUDO_ELEMENTS = ['after', 'before', 'first-line', 'first-letter', 'selection', 'placeholder'];

var Rule = (function () {

    /**
     * @param {CSSRule|CssRule} cssRule
     * @param {Object} opts
     * @param {StyleManager} sm
     */

    function Rule(cssRule, opts, sm) {
        _classCallCheck(this, Rule);

        this.cssRule = cssRule;
        this.opts = opts;
        this.sm = sm;

        this._nextTickId = null;
        this._cbs = [];
    }

    /**
     * 带 vendor 前缀的要放非带 vendor 前缀的前面
     *
     * @param {Array} styleKeys
     * @returns {Array}
     */

    _createClass(Rule, [{
        key: '_updateSheetLater',
        value: function _updateSheetLater(cb) {
            var _this = this;

            if (typeof cb === 'function') this._cbs.push(cb);

            if (this._nextTickId) clearTimeout(this._nextTickId);
            this._nextTickId = setTimeout(function () {
                var result = _this._updateSheet();
                for (var i = 0; i < _this._cbs.length; i++) {
                    _this._cbs[i](result);
                }_this._cbs.length = 0;
            }, 0);
        }
    }, {
        key: '_updateSheet',
        value: function _updateSheet() {
            var sm = this.sm;
            var cssText = this.constructor.parseOptsToCssText(this.opts);

            // 不用更新
            if (cssText === this.getCssText()) return true;

            var index = sm.index(this);
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
    }, {
        key: 'setOpts',
        value: function setOpts(opts, cb) {
            _util2['default'].assign(this.opts, opts);
            this._updateSheetLater(cb);
        }

        /**
         * @param {Object} opts
         * @param {Function} [cb]
         */
    }, {
        key: 'replaceOpts',
        value: function replaceOpts(opts, cb) {
            this.opts = opts || {};
            this._updateSheetLater(cb);
        }

        /**
         * @param {Function} [cb]
         * @returns {Boolean}
         */
    }, {
        key: 'forceUpdateSheet',
        value: function forceUpdateSheet(cb) {
            return this._updateSheetLater(cb);
        }
    }, {
        key: 'getCssText',
        value: function getCssText() {
            return this.cssRule.cssText;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return this.cssRule.cssText;
        }

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
    }], [{
        key: 'calculateSelectorSpecificity',
        value: function calculateSelectorSpecificity(selector) {
            var specificity = 0;
            var parsed = selector.replace(/[\*\+>~]/g, ' ') // 去掉全局选择器和特殊分隔符号
            .replace(/:not(\(.*?\))/g, '$1') // :not 只需要使用它内部的选择器即可
            .replace(/\([^\)]*\)/g, '') // 去掉其它无用的括号
            .replace(/\[[^\]]*\]/g, function () {
                // 计算属性选择器的权重，并去掉它们
                specificity += 10;
                return '';
            }).replace(/:?:([\w-]+)/g, function (_, m) {
                // 计算伪类和伪元素的权值，计算完就把它们去掉
                specificity += CSS_PSEUDO_ELEMENTS.indexOf(stripVendors(m)) < 0 ? 10 : 1;
                return '';
            }).replace(/([#\.]?)[\w-]+/g, function (_, m) {
                specificity += ({ '#': 100, '.': 10 })[m] || 1;
                return '';
            });

            if (parsed.trim() !== '') throw new Error('Selector \'' + selector + '\' is invalid, parse result \'' + parsed + '\'.');

            return specificity;
        }

        /**
         * @param {Object} style
         * @returns {string}
         */
    }, {
        key: 'styleObjectToCssCode',
        value: function styleObjectToCssCode(style) {
            var keys = Object.keys(style).map(kebabCaseStyleKey);
            if (!keys.length) return '';

            keys = sortStyleVendorKeys(keys);

            return keys.map(function (key) {
                return key + ': ' + style[key] + ';';
            }).join('\n');
        }

        /**
         * @param {String} cssCode
         * @returns {Object}
         */
    }, {
        key: 'cssCodeToStyleObject',
        value: function cssCodeToStyleObject(cssCode) {
            var rules = cssCode.trim().split(';').map(function (rule) {
                return rule.trim();
            }).filter(function (rule) {
                return rule && rule.indexOf(':') > 0;
            });

            return rules.reduce(function (result, rule) {
                var parts = rule.split(':');
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
    }, {
        key: 'parseOptsToCssText',
        value: function parseOptsToCssText(opts) {
            return opts.cssText;
        }

        /**
         * 此方法是用在 RuleControl.createRuleByCssRule 中的，当首次从一个文档中已经存在的 Stylesheet 中解析 rules 时，
         * 具体的 Rule 应该用此方法将 cssRule 解析成 opts 并保存，方便之后取用
         * @param {CSSRule|CssRule} cssRule
         */
    }, {
        key: 'parseCssRuleToOpts',
        value: function parseCssRuleToOpts(cssRule) {
            return { cssText: cssRule.cssText };
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

    }]);

    return Rule;
})();

exports['default'] = Rule;
function sortStyleVendorKeys(styleKeys) {
    var vendorStyleKeys = styleKeys.filter(function (key) {
        return key[0] === '-';
    });

    // 没有带 vendor 前缀的属性，直接返回
    if (!vendorStyleKeys.length) return styleKeys;

    var result = [];
    var vendorStyleKeysMirror = vendorStyleKeys.map(function (key) {
        return key.replace(/^-\w+-/, '');
    });

    styleKeys.forEach(function (key) {
        if (key[0] !== '-') {
            for (var i = 0, l = vendorStyleKeysMirror.length; i < l; i++) {
                if (vendorStyleKeysMirror[i] === key) result.push(vendorStyleKeys[i]);
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
    styleKey = _util2['default'].kebabCase(styleKey);
    if (['o', 'ms', 'moz', 'webkit'].some(function (k) {
        return styleKey.indexOf(k + '-') === 0;
    })) {
        return '-' + styleKey;
    }
    return styleKey;
}

function stripVendors(str) {
    return str.replace(/^-(o|ms|moz|webkit)-/, '');
}
module.exports = exports['default'];

},{"../util":10}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Rule2 = require('./Rule');

var _Rule3 = _interopRequireDefault(_Rule2);

var _util = require('../util');

var StyleRule = (function (_Rule) {
    _inherits(StyleRule, _Rule);

    function StyleRule() {
        _classCallCheck(this, StyleRule);

        _get(Object.getPrototypeOf(StyleRule.prototype), 'constructor', this).apply(this, arguments);
    }

    _createClass(StyleRule, [{
        key: 'getSelectorSpecificity',
        value: function getSelectorSpecificity() {
            return _Rule3['default'].calculateSelectorSpecificity(this.opts.selector);
        }

        /**
         * 验证用户提供的 opts 是否合法
         * @param {Object} opts
         * @returns {Boolean}
         */
    }], [{
        key: 'validateUserOpts',
        value: function validateUserOpts(opts) {
            return (0, _util.checkType)(opts.selector, 'string') && (0, _util.checkType)(opts.style, 'object');
        }

        /**
         * @param {Object} opts
         * @param {String} opts.selector
         * @param {Object} opts.style
         *
         * @returns {String}
         */
    }, {
        key: 'parseOptsToCssText',
        value: function parseOptsToCssText(opts) {
            return opts.selector + ' { ' + _Rule3['default'].styleObjectToCssCode(opts.style) + ' }';
        }

        /**
         * @param {CSSRule|CssRule} cssRule
         * @returns {Object}
         */
    }, {
        key: 'parseCssRuleToOpts',
        value: function parseCssRuleToOpts(cssRule) {
            var selector = cssRule.selectorText,
                cssCode = cssRule.cssText.replace(selector, '');

            cssCode = cssCode.replace(/^\s*\{|\s*\}$/g, '');

            return { selector: selector, style: _Rule3['default'].cssCodeToStyleObject(cssCode) };
        }

        /**
         * 将 CSSStyleRule 中的 多 selector 拆分成单个 selector，例如将一个： a, b {} 拆分成两个： a {}  b {}
         *
         * @param {CSSRule|CssRule|CSSStyleRule} cssStyleRule
         * @param {Number} index
         * @param {Stylesheet|CSSRule|CssRule} sheet - 也有可能是 CSSMediaRule（需要将它下面的 CSSStyleRule 扁平化）
         * @returns {Number} - sheet 中下一个要处理的 rule
         */
    }, {
        key: 'flat',
        value: function flat(cssStyleRule, index, sheet) {
            var selectorText = cssStyleRule.selectorText;

            if (selectorText.indexOf(',') > 0) {
                (function () {
                    var selectors = selectorText.split(',');
                    var code = cssStyleRule.cssText.replace(selectorText, '');

                    sheet.deleteRule(index);
                    index--;

                    selectors.forEach(function (selector) {
                        index += 1;
                        sheet.insertRule(selector + code, index);
                    });
                })();
            }

            return index + 1;
        }
    }]);

    return StyleRule;
})(_Rule3['default']);

exports['default'] = StyleRule;

StyleRule.type = CSSRule.STYLE_RULE;
module.exports = exports['default'];

},{"../util":10,"./Rule":7}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _util = require('../../util');

var MEDIA_TYPES = ['all', 'print', 'screen', 'speech', 'aural', 'braille', 'handheld', 'projection', 'tty', 'tv', 'embossed'];

var MEDIA_FEATURES = ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height', 'aspect-ratio', 'min-aspect-ratio', 'max-aspect-ratio', 'device-width', 'min-device-width', 'max-device-width', 'device-height', 'min-device-height', 'max-device-height', 'device-aspect-ratio', 'min-device-aspect-ratio', 'max-device-aspect-ratio', 'color', 'min-color', 'max-color', 'color-index', 'min-color-index', 'max-color-index', 'monochrome', 'min-monochrome', 'max-monochrome', 'resolution', 'min-resolution', 'max-resolution', 'scan', // progressive, interlace
'grid', 'orientation' // portrait, landscape
];

var checkType = function checkType(type) {
    if (MEDIA_TYPES.indexOf(type) < 0) throw new Error('Media type \'' + type + '\' is invalid, need one of ' + MEDIA_TYPES.join(', ') + '.');
};

var checkFeature = function checkFeature(feature) {
    if (MEDIA_FEATURES.indexOf(feature) < 0) throw new Error('Media feature \'' + feature + '\' is invalid, need one of ' + MEDIA_FEATURES.join(', ') + '.');
};

/*
 media_query_list: <media_query> [, <media_query> ]*
 media_query: [[only | not]? <media_type> [ and <expression> ]*] | <expression> [ and <expression> ]*
 expression: ( <media_feature> [: <value>]? )
 media_type: all | print | projection | screen ...
 media_feature: width | min-width | max-width ...
 */

// 注意，真正插入 Document 中，此函数返回的值可能会被浏览器优化或者改变 features 顺序，比如：
// @media all and (width: 300px), all and (height: 400px) 会被优化成
// @media all and (width: 300px), (height: 400px)
// 所以插入 Document 中后就需要用原生的 media.mediaText 去获取系统中的 mediaText，而不能以此函数为准

/**
 * 将一个对象或用户自定的的mediaText 解析成一个统一的 mediaText，
 * 保证得到的 mediaText 在 features 相同的情况下，它也是一致的
 *
 * Object opt structure:
 *      only:           Boolean
 *      not:            Boolean - only 和 not 最多只能有一个为 true
 *      type:           String - one of MEDIA_TYPES
 *      features:       Object
 *
 * @param {Object|Array<Object>|String} opts
 * @returns {String}
 *
 * @example
 *
 * input: {type: 'all', features: {width: {min: '30px', max: '200px'}}}
 * input: {type: 'all', features: {maxWidth: '200px', minWidth: '30px'}}
 * input: 'all and (max-width: 200px) and (min-width: 30px)'
 *
 * all output: all and (min-width: 30px) and (max-width: 200px)
 *
 */

var MediaQuery = (function () {
    function MediaQuery(modifier, type, features) {
        _classCallCheck(this, MediaQuery);

        this.modifier = modifier;
        this.type = type;
        this.features = features;
    }

    _createClass(MediaQuery, [{
        key: 'only',
        value: function only() {
            this.modifier = 'only';
        }
    }, {
        key: 'reverse',
        value: function reverse() {
            this.modifier = 'not';
        }
    }, {
        key: 'setType',
        value: function setType(type) {
            checkType(type);
            this.type = type;
        }
    }, {
        key: 'setFeatures',
        value: function setFeatures(features) {
            this.features = parseObjectFeaturesToArray(features);
        }
    }, {
        key: 'appendFeatures',
        value: function appendFeatures(features) {
            var _features;

            (_features = this.features).push.apply(_features, _toConsumableArray(parseObjectFeaturesToArray(features)));
        }
    }, {
        key: 'toMediaText',
        value: function toMediaText() {
            var text = this.modifier;
            var features = this.features;
            var allFeatures = MEDIA_FEATURES;

            text += (text ? ' ' : '') + this.type;

            if (features.length) {
                // 对 features 进行排序，保证输出的 text 的一致性
                features = [].concat(features); // 克隆一份，保证原有顺序不变
                features.sort(function (a, b) {
                    return allFeatures.indexOf(a.key) - allFeatures.indexOf(b.key);
                });

                text += ' and (' + features.map(function (f) {
                    return f.key + ('value' in f ? ': ' + f.value : '');
                }).join(') and (') + ')';
            }

            return text;
        }
    }]);

    return MediaQuery;
})();

var Media = (function () {
    function Media(opts) {
        _classCallCheck(this, Media);

        var list = this.list = [];

        var type = (0, _util.getType)(opts);

        if (type === 'array' || type === 'object') {
            [].concat(opts).forEach(function (opt) {
                return list.push(parseObjectOptToQuery(opt));
            });
        } else if (type === 'string') {
            opts.trim().split(/\s*,\s*/).forEach(function (opt) {
                return list.push(parseStringOptToQuery(opt));
            });
        } else {
            throw new Error('Not supported media argument parameter.');
        }
    }

    _createClass(Media, [{
        key: 'get',

        /**
         * @param {Number} index
         */
        value: function get(index) {
            return this.list[index];
        }
    }, {
        key: 'toMediaText',
        value: function toMediaText() {
            return this.list.map(function (query) {
                return query.toMediaText();
            }).join(', ');
        }
    }, {
        key: 'equals',
        value: function equals(mediaQuery) {
            return this.toMediaText() === mediaQuery.toMediaText();
        }
    }, {
        key: 'length',
        get: function get() {
            return this.list.length;
        }
    }], [{
        key: 'normalize',
        value: function normalize(opts) {
            return new Media(opts).toMediaText();
        }
    }]);

    return Media;
})();

exports['default'] = Media;

Media.TYPES = MEDIA_TYPES;
Media.FEATURES = MEDIA_FEATURES;

// ============== 解析成统一的对象

function parseStringOptToQuery(opt) {
    var parts = opt.trim().split(/\s+and\s+/);
    var types = MEDIA_TYPES;
    var type = 'all',
        modifier = '',
        features = {};

    parts[0].replace(/^(?:(only|not)\s+)?([-\w]+)$/, function (_, m, t) {
        if (types.indexOf(t) >= 0) {
            if (m) modifier = m;
            type = t;
            parts.shift();
        }
    });

    parts.forEach(function (part) {
        var kv = part.replace(/^\(\s*(.*?)\s*\)$/, '$1').split(/\s*:\s*/);
        if (kv.length === 1) features[kv[0]] = true;else if (kv.length === 2) features[kv[0]] = kv[1];else throw new Error('Parse media string error.');
    });

    features = parseObjectFeaturesToArray(features);

    return new MediaQuery(modifier, type, features);
}

function parseObjectOptToQuery(opt) {
    var type = undefined,
        modifier = undefined,
        features = undefined;

    if (opt.type) {
        checkType(opt.type);
        type = opt.type;
    } else {
        type = 'all';
    }

    if (opt.not && opt.only) throw new Error('Media type modifier "not" and "only" should only use one of them.');

    modifier = opt.not ? 'not' : opt.only ? 'only' : '';

    features = parseObjectFeaturesToArray(opt.features);

    return new MediaQuery(modifier, type, features);
}

function parseObjectFeaturesToArray() {
    var features = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var result = [],
        keys = undefined;

    features = normalizeObjectFeatures(features);

    keys = Object.keys(features);

    keys.forEach(function (key) {
        checkFeature(key);
        if (features[key] === true || features[key] === '') {
            result.push({ key: key });
        } else {
            result.push({ key: key, value: features[key].toString() });
        }
    });

    return result;
}

function flatObjectFeatureValue(key, feature, result) {
    Object.keys(feature).forEach(function (subKey) {
        return result[subKey + '-' + key] = feature[subKey];
    });
}

function normalizeObjectFeatures() {
    var features = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var key = undefined,
        feat = undefined,
        result = {};

    for (key in features) {
        if (features.hasOwnProperty(key)) {
            feat = features[key];
            key = (0, _util.kebabCase)(key);
            if ((0, _util.getType)(feat) === 'object') {
                flatObjectFeatureValue(key, feat, result);
            } else {
                result[key] = feat;
            }
        }
    }
    return result;
}
module.exports = exports['default'];

},{"../../util":10}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function toString(target) {
    return Object.prototype.toString.call(target);
}

function toArray(target) {
    var l = target.length;
    var a = new Array(l);
    for (var i = 0; i < l; i++) a[i] = target[i];
    return a;
}

function getType(target) {
    return toString(target).slice(8, -1).toLowerCase();
}

function checkType(target, types) {
    var type = getType(target);
    if (Array.isArray(types)) return types.indexOf(type) >= 0;
    if (typeof types === 'function') return target instanceof types;
    return types === type;
}

function assign(src) {
    if (getType(src) !== 'object') src = {};

    for (var _len = arguments.length, targets = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        targets[_key - 1] = arguments[_key];
    }

    for (var i = 0, l = targets.length; i < l; i++) {
        var target = targets[i];
        if (getType(target) === 'object') {
            for (var key in target) {
                if (target.hasOwnProperty(key)) {
                    src[key] = target[key];
                }
            }
        }
    }

    return src;
}

function assert(target, type) {
    var targetType = getType(target);
    if (type !== targetType) throw new Error('Assert error, target %o\'s type is %o, not %o.', target, type, targetType);
}

function kebabCase(str) {
    return str.replace(/[A-Z]/g, function (r) {
        return '-' + r.toLowerCase();
    });
}

//============== StyleSheet 相关

var IS_SAFARI = toString(window.HTMLElement).indexOf('Constructor') > 0;

/**
 *
 * @param {Document} doc
 * @param {String} [id]
 * @returns {HTMLStyleElement}
 */
function createStyleElement(doc, id) {
    var style = doc.createElement('style');

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
    if (cssText.indexOf('@media') !== 0) throw new Error('cssText is illegal, not a media cssText.');

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
    var rule = undefined,
        cssText = undefined,
        isSafari = IS_SAFARI;

    var tempSelector = '.safari---temp';
    var mediaContent = isSafari ? tempSelector + ' {}' : '';

    cssText = '@media ' + mediaText + ' { ' + mediaContent + ' }';
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

exports['default'] = {
    toString: toString,
    toArray: toArray,
    getType: getType,
    checkType: checkType,
    assign: assign,
    assert: assert,
    kebabCase: kebabCase,

    createStyleElement: createStyleElement,
    createCssMediaRuleWithCssText: createCssMediaRuleWithCssText,
    createEmptyCssMediaRule: createEmptyCssMediaRule,
    clearCssMediaRule: clearCssMediaRule
};
module.exports = exports['default'];

},{}]},{},[2])(2)
});