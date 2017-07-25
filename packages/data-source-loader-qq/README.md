[![Build Status](https://travis-ci.org/kaelzhang/data-source-loader-qq.svg?branch=master)](https://travis-ci.org/kaelzhang/data-source-loader-qq)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/kaelzhang/data-source-loader-qq?branch=master&svg=true)](https://ci.appveyor.com/project/kaelzhang/data-source-loader-qq)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/data-source-loader-qq.svg)](http://badge.fury.io/js/data-source-loader-qq)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/data-source-loader-qq.svg)](https://www.npmjs.org/package/data-source-loader-qq)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/data-source-loader-qq.svg)](https://david-dm.org/kaelzhang/data-source-loader-qq)
-->

# data-source-loader-qq

data-source loader for gu.qq with lru-cache

## Install

```sh
$ npm install data-source-loader-qq --save
```

## Usage

```js
const Loader = require('data-source-loader-qq')

new Loader('sz000002').get({
  time: + new Date,
  span: 'DAY'
})
.then(({
  open,
  close,
  high,
  low,
  volume
}) => {

  // do something ...
})
```

## License

MIT
