import { createStore } from './index.js'

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
const stream = [
  {type: 'SET_NAME', payload: {name: 'Robbie'}},
  {type: 'SET_AGE', payload: {age: 16}}
  //...
];

const store = createStore(reducer, initialState, stream)

console.log(store.getState()) // {name: 'Robbie', age: 16}