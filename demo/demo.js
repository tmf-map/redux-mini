import { createStore, enhanceDispatchByMiddleware } from '../index.js'

//====================================
// How to use
//====================================

// reducer :: a -> b -> a
function reducer(state, action) {
  switch (action.type) {
    case 'SET_NAME':
      return {
        ...state,
        name: action.payload.name
      }
    case 'SET_AGE':
      return {
        ...state,
        age: action.payload.age
      }
  }
}

const initialState = {name: 'Kimi', age: 18};
const store = createStore(reducer, initialState)

// Middleware1
const dispatchAndLog = store => next => action => {
  console.log('current state', store.getState())
  console.log('dispatching', action)
  next(action)
}
enhanceDispatchByMiddleware(store, dispatchAndLog)

const dataElem = document.getElementById('data')
function render(state) {
  console.log('state', state)
  dataElem.innerHTML = `State: ${JSON.stringify(state)}`
}

render(store.getState()) // {name: 'Kimi', age: 18}

// event stream call
window.setName = function () {
  const action = {type: 'SET_NAME', payload: {name: 'Robbie'}}
  store.dispatch(action)
  render(store.getState())
}
window.setAge = function () {
  const action = {type: 'SET_AGE', payload: {age: 16}}
  store.dispatch(action)
  render(store.getState())
}
