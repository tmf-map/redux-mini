// reduce :: ((a, b) -> a) -> a -> [b] -> a
function reduce(reducer, initialData, allData) {
  let accumulator = initialData;
  for(let i = 0; i < allData.length; i++) {
    accumulator = reducer(accumulator, allData[i])
  }
  return accumulator;
}

console.log(reduce((a, b) => a + b, 0, [1, 2, 3, 4, 5]) === 15)
console.log(reduce((a, b) => a + b, 10, [1, 2, 3, 4, 5]) === 25)
