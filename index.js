// createStore :: (a -> b -> a) -> a -> c
function createStore(reducer, initialState) {
  let state = initialState;
  return {
    dispatch: function(action) {
      state = reducer(state, action)
    },
    getState: function() {
      return state;
    }
  };
}

export {
  createStore
}
