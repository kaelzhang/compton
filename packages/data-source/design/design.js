dataSource
  .get({
    // 1 min
    span: 1000 * 60

    // might be changed according to span
    between: [],

    // will changed according to span
    time: + new Date
  })
  .then(({
    open,
    high,
    low,
    close,
    volume
  }) => {

  })



