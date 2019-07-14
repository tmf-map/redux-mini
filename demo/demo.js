import { createStore } from '../index.js'

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

console.log('default value', store.getState()) // {name: 'Robbie', age: 16}

// event stream call
window.setName = function () {
  const action = {type: 'SET_NAME', payload: {name: 'Robbie'}}
  store.dispatch(action)
  console.log('after setName', store.getState())
}
window.setAge = function () {
  const action = {type: 'SET_AGE', payload: {age: 16}}
  store.dispatch(action)
  console.log('after setAge', store.getState())
}
