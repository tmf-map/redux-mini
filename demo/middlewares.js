// Middleware1
export const logger = store => next => action => {
  console.log('Middleware1: logger', store.getState())
  console.log('Middleware1: logger action:', action)
  console.log('m1-next', next)
  next(action)
}
// Middleware2
export const collectError = store => next => action => {
  try {
    console.log('Middleware2: collectError', store.getState())
    console.log('m2-next', next)
    next(action)
  } catch (err) {
    console.error('Error!', err)
  }
}
