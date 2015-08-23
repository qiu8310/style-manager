import {getType, kebabCase} from '../../util';

const MEDIA_TYPES = [
    'all',
    'print',
    'screen',
    'speech',
    'aural',
    'braille',
    'handheld',
    'projection',
    'tty',
    'tv',
    'embossed'
];

const MEDIA_FEATURES = [
    'width',
    'min-width',
    'max-width',

    'height',
    'min-height',
    'max-height',

    'aspect-ratio',
    'min-aspect-ratio',
    'max-aspect-ratio',

    'device-width',
    'min-device-width',
    'max-device-width',

    'device-height',
    'min-device-height',
    'max-device-height',

    'device-aspect-ratio',
    'min-device-aspect-ratio',
    'max-device-aspect-ratio',

    'color',
    'min-color',
    'max-color',

    'color-index',
    'min-color-index',
    'max-color-index',

    'monochrome',
    'min-monochrome',
    'max-monochrome',

    'resolution',
    'min-resolution',
    'max-resolution',

    'scan', // progressive, interlace
    'grid',
    'orientation'  // portrait, landscape
];

let checkType = (type) => {
    if (MEDIA_TYPES.indexOf(type) < 0)
        throw new Error(`Media type '${type}' is invalid, need one of ${MEDIA_TYPES.join(', ')}.`);
};

let checkFeature = (feature) => {
    if (MEDIA_FEATURES.indexOf(feature) < 0)
        throw new Error(`Media feature '${feature}' is invalid, need one of ${MEDIA_FEATURES.join(', ')}.`);
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

class MediaQuery {
    constructor(modifier, type, features) {
        this.modifier = modifier;
        this.type = type;
        this.features = features;
    }

    only() {
        this.modifier = 'only';
    }

    reverse() {
        this.modifier = 'not';
    }

    setType(type) {
        checkType(type);
        this.type = type;
    }

    setFeatures(features) {
        this.features = parseObjectFeaturesToArray(features);
    }

    appendFeatures(features) {
        this.features.push(...parseObjectFeaturesToArray(features))
    }

    toMediaText() {
        let text = this.modifier;
        let features = this.features;
        let allFeatures = MEDIA_FEATURES;

        text += (text ? ' ' : '') + this.type;

        if (features.length) {
            // 对 features 进行排序，保证输出的 text 的一致性
            features = [].concat(features); // 克隆一份，保证原有顺序不变
            features.sort((a, b) => allFeatures.indexOf(a.key) - allFeatures.indexOf(b.key));

            text += ' and (' + features.map(f => f.key + (('value' in f) ? ': ' + f.value : '')).join(') and (') + ')';
        }

        return text;
    }
}


export default class Media {
    constructor(opts) {
        let list = this.list = [];

        let type = getType(opts);

        if (type === 'array' || type === 'object') {
            [].concat(opts).forEach(opt => list.push(parseObjectOptToQuery(opt)));
        } else if (type === 'string') {
            opts.trim().split(/\s*,\s*/).forEach(opt => list.push(parseStringOptToQuery(opt)));
        } else {
            throw new Error(`Not supported media argument parameter.`);
        }
    }

    get length() {
        return this.list.length;
    }

    /**
     * @param {Number} index
     */
    get(index) {
        return this.list[index];
    }

    toMediaText() {
        return this.list.map(query => query.toMediaText()).join(', ');
    }

    equals(mediaQuery) {
        return this.toMediaText() === mediaQuery.toMediaText();
    }

    static normalize(opts) {
        return new Media(opts).toMediaText();
    }
}


Media.TYPES = MEDIA_TYPES;
Media.FEATURES = MEDIA_FEATURES;


// ============== 解析成统一的对象

function parseStringOptToQuery(opt) {
    let parts = opt.trim().split(/\s+and\s+/);
    let types = MEDIA_TYPES;
    let type = 'all', modifier = '', features = {};

    parts[0].replace(/^(?:(only|not)\s+)?([-\w]+)$/, (_, m, t) => {
        if (types.indexOf(t) >= 0) {
            if (m) modifier = m;
            type = t;
            parts.shift();
        }
    });

    parts.forEach(part => {
        let kv = part.replace(/^\(\s*(.*?)\s*\)$/, '$1').split(/\s*:\s*/);
        if (kv.length === 1) features[kv[0]] = true;
        else if (kv.length === 2) features[kv[0]] = kv[1];
        else throw new Error('Parse media string error.');
    });

    features = parseObjectFeaturesToArray(features);

    return new MediaQuery(modifier, type, features);
}

function parseObjectOptToQuery(opt) {
    let type, modifier, features;

    if (opt.type) {
        checkType(opt.type);
        type = opt.type;
    } else {
        type = 'all';
    }

    if (opt.not && opt.only)
        throw new Error('Media type modifier "not" and "only" should only use one of them.');

    modifier = opt.not ? 'not' : (opt.only ? 'only' : '');

    features = parseObjectFeaturesToArray(opt.features);

    return new MediaQuery(modifier, type, features);
}

function parseObjectFeaturesToArray(features = {}) {
    let result = [], keys;

    features = normalizeObjectFeatures(features);

    keys = Object.keys(features);

    keys.forEach(key => {
        checkFeature(key);
        if (features[key] === true || features[key] === '') {
            result.push({key});
        } else {
            result.push({key, value: features[key].toString()});
        }
    });

    return result;
}


function flatObjectFeatureValue(key, feature, result) {
    Object.keys(feature).forEach(subKey => result[subKey + '-' + key] = feature[subKey]);
}

function normalizeObjectFeatures(features = {}) {
    let key, feat, result = {};

    for (key in features) {
        if (features.hasOwnProperty(key)) {
            feat = features[key];
            key = kebabCase(key);
            if (getType(feat) === 'object') {
                flatObjectFeatureValue(key, feat, result);
            } else {
                result[key] = feat;
            }
        }
    }
    return result;
}

