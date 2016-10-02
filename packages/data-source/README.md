[![Build Status](https://travis-ci.org/kaelzhang/data-source.svg?branch=master)](https://travis-ci.org/kaelzhang/data-source)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/kaelzhang/data-source?branch=master&svg=true)](https://ci.appveyor.com/project/kaelzhang/data-source)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/data-source.svg)](http://badge.fury.io/js/data-source)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/data-source.svg)](https://www.npmjs.org/package/data-source)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/data-source.svg)](https://david-dm.org/kaelzhang/data-source)
-->

# data-source


## Install

```sh
$ npm install data-source --save
```

## Usage

```js
const DataSource = require('data-source')

new DataSource({
  connection,
  load

}).ready(dataSource => {
  // dataSource, see design/design.js
})
```

## License

MIT
