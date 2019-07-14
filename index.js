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

// common function for enhance dispatch
function enhanceDispatchByMiddleware (store, middlewares) {
  middlewares.forEach(middleware => {
    let next = store.dispatch
    store.dispatch = middleware(store)(next) // store cuz some middleware need getState
  })
}

export {
  createStore,
  enhanceDispatchByMiddleware
}
