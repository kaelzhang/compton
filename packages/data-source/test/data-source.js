const CODE = 'sz002239'
const DATE = new Date(2017, 4, 5)

const DataSource = require('..')
const Loader = require('data-source-loader-qq')

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
  console.log('single result', result)
})
.catch(err => {
  console.error(err)
})


source.get({
  span: 'DAY',
  between: [ + new Date(2017, 6, 2), + new Date(2017, 6, 5) ]
})
.then(result => {
  console.log('between result', result)
})
.catch(err => {
  console.error(err)
})
