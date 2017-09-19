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

data-source for stock data

## Install

```sh
$ npm install data-source --save
```

## Usage

```js
const DataSource = require('data-source')

new DataSource({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: ''
  },
  code: 'sz300131',
  loader: Loader,

  // Always trading, ideally
  isTrading: () => true
})
.get({
  span: 'MONTH',
  time: + new Date(2017, 4, 1)
})
.then(({
  // `Number` open price
  open,
  // `Number` the highest price
  high,
  // `Number` the lowest price
  low,
  // `Number` the close price
  close,
  // `Number` the volume of transactions
  volume,
  // `Date` time
  time
}) => {
  console.log(`sz300131 opened with ${open} at 2017-05-01`)
})
```

## get({span, time})

Gets a single datum.

- **time** `Date`

## get({span, between})

Gets data between a period.

- **between** `[start: Date, end?: Date]`

## get({span, limit})

Gets the latest data limit by `limit`

- **limit** `Number=`

## License

MIT
