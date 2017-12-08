import concat from 'lazy-concat'

export {default as Time} from 'time-spans'

export const compose = concat.factory({
  equal: ({time}, {time: time2}) => + time === + time2
})
