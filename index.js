// createStore :: (a -> b -> a) -> a -> [b] -> c
function createStore(reducer, initialState, stream) {
  let state = initialState;
  let action;
  const dispatch = action => {
    state = reducer(state, action)
  }
  for(let i = 0; i < stream.length; i++) {
    let action = stream[i];
    dispatch(action)
  }
  return {
    getState: function() {
      return state;
    }
  };
}

export {
  createStore
}
