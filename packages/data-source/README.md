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
import DataSource from 'data-source'

const dataSource = new DataSource({
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

const span = dataSource.span('MONTH')

const {
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
} = await span.get(new Date(2017, 4, 1))

console.log(`sz300131 opened with ${open} at 2017-05-01`)
```

## span.get(time)
## span.get(...times)

Gets a single datum or an array of data

- **time** `Date|Array<Date>`

## span.between([from, to])

- **from** `Date` the closed left of the region
- **to** `Date` the closed right of the region

Returns `Array<Date>` data between a period.

## License

MIT
