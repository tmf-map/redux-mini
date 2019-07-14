// createStoreWithoutEnhancers :: (a -> b -> a) -> a -> c
function createStoreWithoutEnhancers (reducer, initialState) {
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

// enhanceDispatchByMiddleware :: [d] -> c
function enhanceDispatchByMiddleware (middlewares) {
  return function (store) {
    middlewares.forEach(middleware => {
      let next = store.dispatch
      store.dispatch = middleware(store)(next) // store cuz some middleware need getState
    })
    return store
  }
}

// createStore :: (a -> b -> a) -> a -> ([d] -> c) -> c
function createStore (reducer, initialState, enhancers) {
  const store = createStoreWithoutEnhancers(reducer, initialState)
  return enhancers(store)
}

export {
  createStore,
  enhanceDispatchByMiddleware
}
