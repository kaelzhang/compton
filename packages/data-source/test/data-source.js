const CODE = 'sz002239'
const DATE = new Date(2017, 4, 5)

const DataSource = require('..')
const Loader = require('../../compton/loader/stock.qq.com')

const source = new DataSource({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'kael',
    password: '123456',
    database: 'compton'
  },
  code: CODE,
  loader: Loader
})


source.get({
  span: 'DAY',
  time: + DATE
})
.then(result => {
  console.log('result', result)
})
.catch(err => {
  console.error(err)
})


source.get({
  span: 'DAY',
  between: [ + new Date(2017, 4, 2), + new Date(2017, 4, 5) ]
})
.then(result => {
  console.log('result', result)
})
.catch(err => {
  console.error(err)
})
