// createStoreWithoutEnhancers :: (a -> b -> a) -> a -> c
function createStoreWithoutEnhancers (reducer) {
  let state = {name:{name: 'Kimi'}, age:{age: 18}} ;
  return {
    dispatch: function(action) {
      state = reducer(state, action)
    },
    getState: function() {
      return state;
    }
  };
}

// applyMiddleware :: [a] -> (b -> b)
function applyMiddleware (middlewares) {
  return function (store) {
    middlewares.reverse().forEach(middleware => {
      let next = store.dispatch
      store.dispatch = middleware(store)(next) // store cuz some middleware need getState
    })
    return store
  }
}

// createStore :: (a -> b -> a) -> a -> ([d] -> c) -> c
function createStore (reducer, enhancers) {
  const store = createStoreWithoutEnhancers(reducer)
  return enhancers(store)
}

function combineReducer(reducers) {
  const finalReducers = {};

  for (let key in reducers) {
    // 遍历传入的reducer，如果是函数类型放入finalReducers
    if(reducers[key] instanceof Function) {
      finalReducers[key] = reducers[key];
    }
  }

  return function (state = {}, action) {
    let stateChange = false;
    let nextState = {};

    for (let key in finalReducers) {
      // 取reducer和对应的state
      const reducer = finalReducers[key];
      const preStateItem = state[key];

      // 拿到action后更新子state，将子state保存在新的nextState中
      const nextStateItem = reducer(preStateItem, action);
      nextState[key] = nextStateItem;

      stateChange = stateChange || nextStateItem !== preStateItem
    }
    return stateChange ? nextState : state;
  }
}

export {
  createStore,
  applyMiddleware,
  combineReducer
}
