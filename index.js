// redux :: (a -> b -> a) -> a -> [b] -> a
function redux(reducer, initialState, stream) {
  let state = initialState;
  let action;
  for(let i = 0; i < stream.length; i++) {
    let action = stream[i];
    state = reducer(state, action);
  }
  return state;
}

export default redux
