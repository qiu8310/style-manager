var sm = new StyleManager('demo');
var htmlViewElement = $('.html-view');
var styleElement = $('#__sm__demo');

//=== 继承
ko.observableArray.fn.refresh = function () {
    var data = this().slice(0);
    this([]);
    this(data);
};


//=== ViewModel

//var AppView = {
//    welcome: ,
//    ruleOfThumbs:
//};

function AppView() {
    var self = this;
    self.welcome = ko.observable('Hello !');
    self.ruleOfThumbs = ko.observableArray();

    self.html = ko.observable(htmlViewElement.innerHTML);
    self.css = ko.observable(styleElement.innerHTML);

    self.rules = ko.observableArray(getRules());
    self.active = ko.observable(self.rules()[0]);

    // Editor 相关
    self.mediaEnabled = ko.pureComputed({
        owner: this,
        read: function() {
            return this.active().isMediaRule();
        },
        write: function(value) {
            var rule = this.active(), newRule;
            var index = sm.index(rule.rule);

            if (value && rule.isStyleRule()) {
                newRule = rule.toMediaRule();
            } else if (!value && rule.isMediaRule()) {
                newRule = rule.toStyleRule();
            }
            if (newRule) {
                self.replaceRule(rule, newRule);
                self.active(newRule);
            }
        }
    });


    self.replaceRule = function(rule, newRule) {
        var index = self.rules.indexOf(rule);
        self.rules.splice(index, 1, newRule);
    };


    // Rule 操作
    self.activeRule = function (rule) {
        if (!rule) rule = self.getRule(0);
        self.active(rule);
        self.mediaEnabled(rule.isMediaRule());
    };

    self.getRule = function (index) {
        return self.rules()[index];
    };

    self.updateRules = function (index) {
        sm.update();
        self.rules.removeAll();
        self.rules.push.apply(self.rules, getRules());
        self.activeRule(self.rules()[index]);
        //self.css(sm.getCssText()); 不能更新这里，更新了又会触发 subscribe 中的脚本执行
    };

    function getRules() {
        return sm.getAll().map(function(rule) { return new RuleView(rule); });
    }
}

function RuleView(rule) {
    var self = this;
    self.rule = rule;
    self.index = ko.pureComputed({
        owner: this,
        read: function () { return sm.index(self.rule) },
        write: function (newValue) {
            var value = self.index();
            newValue = parseInt(newValue, 10);
            if (!isNaN(newValue) && newValue < sm.length && newValue >= 0 && value !== newValue) {
                self.rule = new RuleView(sm.move(self.rule, newValue));
                appView.updateRules(newValue);
            }
        }
    });
    self.isMediaRule = function () { return self.rule.is(CSSRule.MEDIA_RULE); };
    self.isStyleRule = function () { return self.rule.is(CSSRule.STYLE_RULE); };
    self.toMediaRule = function () { return new RuleView(self.rule.toMediaRule()); };
    self.toStyleRule = function () { return new RuleView(self.rule.toStyleRule()); };
}


var Media = sm.rc.getRuleCtorByType(CSSRule.MEDIA_RULE).Media;
var allFeatureKeys = Media.FEATURES;
var allTypeKeys = Media.TYPES;

function MediaQueryView(mq) {
    var self = this;
    this.mq = mq;
    this.modifiers = ['', 'only', 'not'];
    this.types = allTypeKeys;

    this.features = ko.observableArray(mq.features.map(function (f) {
        return new MediaQueryFeatureView(f);
    }));

    this.type = ko.observable(mq.type);
    this.modifier = ko.observable(self.mq.modifier);

    this.addFeature = function () {
        self.features.push(new MediaQueryFeatureView({key: '', value: ''}));
    };
    this.deleteFeature = function (f) {
        self.features.remove(f);
    };

    this.getValue = function () {
        var media = {};
        media.features = self.features().map(function (f) {
            return f.getValue();
        }).reduce(function (rtn, curr) {
            rtn[curr.key] = curr.value;
            return rtn;
        }, {});

        media.type = self.type();
        media.modifier = self.modifier();
        return media;
    }
}

function MediaQueryFeatureView(f) {
    var self = this;
    this.keys = allFeatureKeys;
    this.key = ko.observable(f.key);
    this.value = ko.observable(f.value);
    this.getValue = function() {
        var rtn = {};
        if (self.key() && self.value()) {
            rtn.key = self.key();
            rtn.value = self.value();
        }
        return rtn;
    };
}

//=== 组件
ko.components.register('media-editor', {
    viewModel: function (params) {
        var self = this;
        var rule = this.rule = params.rule.rule;

        this.mediaQueries = ko.observableArray(rule.opts.media.list.map(function (mq) {
            return new MediaQueryView(mq);
        }));

        this.addMediaQuery = function () {
            self.mediaQueries.push(new MediaQueryView({type: 'all', modifier: '', features: []}))
        };
        this.deleteMediaQuery = function (mq) {
            self.mediaQueries.remove(mq);
        };

        this.getValue = function () {
            return self.mediaQueries().map(function (mq) { return mq.getValue(); });
        };

        this.update = function () {
            var index = sm.index(self.rule);
            self.rule.setOpts({media: new Media(self.getValue())}, function () {
                appView.updateRules(index);
                self.rule = sm.get(index);
            });
        };

    },
    template: '<div class="sm-inner-editor sm-media-editor frame">' +
        '<center><button data-bind="click: update">Apply to style</button></center>' +
        '<div class="media-queries" data-bind="foreach: mediaQueries">' +
            '<div class="media-query" style="margin-top: 10px;">' +
                '<button style="float: right;" class="delete" data-bind="click: $parent.deleteMediaQuery, visible: $parent.mediaQueries().length > 1">Delete this media query</button>' +
                '<div class="type">' +
                    '<span class="control-label">Type:</span>' +
                    '<select data-bind="options: modifiers, value: modifier"></select>' +
                    '<select data-bind="options: types, value: type"></select>' +
                '</div>' +
                '<div class="features">' +
                    '<span class="control-label">Features:</span>' +
                    '<!-- ko foreach: features -->' +
                    '<div class="feature">' +
                        '<select data-bind="options: keys, value: key"></select>' +
                        '<input style="width: 100px;" class="light-border" placeholder="value" data-bind="value: value"/>' +
                        '<button data-bind="click: $parent.deleteFeature">Delete this feature</button>' +
                    '</div>' +
                    '<!-- /ko -->' +
                '</div>' +
                '<button data-bind="click: addFeature">Add a feature</button>' +
            '</div>' +
        '</div>' +
        '<center><button data-bind="click: addMediaQuery">Add a media query</button></center>' +
    '</div>'
});


ko.components.register('style-editor', {
    viewModel: function (params) {
        var self = this;
        this.rule = params.rule.rule;
        this.selector = ko.pureComputed({
            owner: this,
            read: function () { return this.rule.opts.selector; },
            write: function (value) {
                if (value.trim() && value.indexOf(',') < 0) {
                    this.rule.setOpts({selector: value}, function () {
                        appView.rules.refresh();
                    });
                }
            }
        });
        this.styleValid = ko.observable(true);
        this.style = ko.pureComputed({
            owner: this,
            read: function () {
                var obj = this.rule.opts.style;
                var key, result = [];
                for (key in obj) {
                    result.push(key + ': ' + obj[key]);
                }
                return result.join('\r\n');
            },
            write: function (value) {
                var style = value.split(/[\r]?\n/)
                    .map(function (row) { return row.trim().split(':', 2); })
                    .filter(function (row) { return row.length === 2 && row[0] && row[1]; })
                    .reduce(function (rtn, cur) {
                        rtn[cur[0]] = cur[1];
                        return rtn;
                    }, {});

                self.rule.setOpts({style: style}, function (valid) {
                    self.styleValid(valid);
                    if (valid) {
                        appView.rules.refresh();
                    }
                });
            }
        });
    },
    template: '<div class="sm-inner-editor sm-style-editor frame">' +
        '<div class="flex-container row">' +
            '<span class="control-label">Selector: </span>' +
            '<input class="flex light-border" data-bind="value: selector"/></div>' +

        '<div class="flex-container row">' +
            '<span class="control-label">Style:</span>' +
            '<textarea class="flex light-border" data-bind="value: style, css: { invalid: !styleValid }"></textarea></div>' +
    '</div>'
});


//=== Bootstrap
var appView = new AppView();
ko.applyBindings(appView, document.documentElement);


//=== appView 中字段修改

// 修改 appView 中的 字符串/数组 值
appView.ruleOfThumbs.push('It is a sin to steal a pin.');
setTimeout(function () {
    appView.welcome('Welcome !');
    appView.ruleOfThumbs.push('Every dog has its day.')
}, 1000);
setTimeout(function () { appView.welcome(''); appView.ruleOfThumbs.removeAll(); }, 2500);
//setTimeout(function () { appView.welcome(''); appView.ruleOfThumbs.removeAll(); }, 500);



//=== 监听相关

// 监听相关的属性
//appView.html.extend({ notify: 'always' }); // 总是触发 subscription，即使更新前后两次值相同
appView.html.extend({ rateLimit: 600 }); // Ensure it notifies about changes no more than once per 600-millisecond period
appView.css.extend({ rateLimit: 900 });

// 监听 appView 中 welcome 的变化
var subscription = appView.welcome.subscribe(function(newValue) {
    console.log('The welcome\'s new value is ' + newValue);

    // 取消监听
    subscription.dispose();
    console.log('appView welcome\'s subscription disposed');
});

appView.html.subscribe(function (newValue) { htmlViewElement.innerHTML = newValue; });
appView.css.subscribe(function (newValue) {
    styleElement.innerHTML = newValue;
    appView.updateRules();
});
