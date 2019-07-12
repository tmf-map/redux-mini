// redux :: (a -> b -> a) -> a -> [b] -> a
function redux(reducer, initialState, stream) {
  let state = initialState;
  let action;
  const dispatch = function (action) {
    state = reducer(state, action)
    return state
  }
  const getState = function () {
    return state
  }
  for(let i = 0; i < stream.length; i++) {
    let action = stream[i];
    dispatch(action)
  }
  return getState();
}

export default redux
