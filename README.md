# style-manager
[![NPM version](https://badge.fury.io/js/style-manager.svg)](https://npmjs.org/package/style-manager)
[![GitHub version][git-tag-image]][project-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][daviddm-url]][daviddm-image]
[![Coverage Status][coveralls-image]][coveralls-url]


Manage style, add/replace/delete rules, support media.


## Install


```bash
npm install --save style-manager
```


## Usage

[https://qiu8310.github.io/style-manager](https://qiu8310.github.io/style-manager)

```
var sm = new StyleManager(document.querySelector('style'));
```


## API


### Class.StyleManager

#### create(ruleType, ruleOpts, insertIndex)

创建 rule

* ruleType 是 CSSRule.type 中的一个值
* ruleOpts 不同的 rule， opts 不一样
* insertIndex 要插入 sheet 的位置，默认是最后

#### move(rule, newIndex)

移动原来的 rule 来一个新的位置，其它的 rules 会自动更新位置

**注意：返回一个新的 rule，原来的 rule 已经没有用了**

#### remove(rule)

删除指定的 rule

#### empty()

清空 rules

#### update()

当外部程序修改了 sheet 后，可以用此函数来重新更新下 sheet 下的 rules


#### getAll()

#### get(index)

### index(rule)


### Class.Rule

#### remove()

#### is(ruleType)

#### setOpts(opts, cb)

#### replaceOpts(opts, cb)

#### forceUpdateSheet(cb)

#### getCssText()




## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [gulp](http://gulpjs.com/).



## History

[CHANGELOG](CHANGELOG.md)


## License

Copyright (c) 2015 Zhonglei Qiu. Licensed under the MIT license.



[project-url]: https://github.com/qiu8310/style-manager
[git-tag-image]: http://img.shields.io/github/tag/qiu8310/style-manager.svg
[climate-url]: https://codeclimate.com/github/qiu8310/style-manager
[climate-image]: https://codeclimate.com/github/qiu8310/style-manager/badges/gpa.svg
[travis-url]: https://travis-ci.org/qiu8310/style-manager
[travis-image]: https://travis-ci.org/qiu8310/style-manager.svg?branch=master
[daviddm-url]: https://david-dm.org/qiu8310/style-manager.svg?theme=shields.io
[daviddm-image]: https://david-dm.org/qiu8310/style-manager
[coveralls-url]: https://coveralls.io/r/qiu8310/style-manager
[coveralls-image]: https://coveralls.io/repos/qiu8310/style-manager/badge.png

