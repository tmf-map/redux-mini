# redux-mini

`npm i -g serve`

Run `serve`, open the url and get into `demo` directory and open `demo.html` file.

All values will be shown in console.

___
# redux-mini

`npm i -g serve`

Run `serve`, open the url and get into `demo` directory and open `demo.html` file.

All values will be shown in console.

___
## reduce
具体语法释可以看[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce)

我们是在讲与redux相关的东西，为啥我们要扯到这个reduce上呢？因为redux的本质其实就是一个reduce,只是在reduce函数上叠加了许多强大的功能，
让我们感知不到它是一个reduce函数。可能我们对reduce的印象依旧保留在es5中数组的归并方法上。但事实上，它的功能可能更强大。

reduce的中文是'折叠'的含义，我们可以把reduce比喻成一把折扇，把reduce函数的执行理解为把折扇从左到右折叠起来或者是压缩起来，数据慢慢累加
到一起左边是扇子折叠的效果，右边那一个扇翅就是即将要折叠的数据，也就是压缩到一起。

![20190804172421.png](https://raw.githubusercontent.com/USTC-Han/picMap/master/img/20190804172421.png)

项目中的draft中有一个reduce方法的案例,如下所示：
```js
function reduce(reducer, initialData, allData) {
    let accumulator = initialData; // initialState
     for(let i = 0; i < allData.length; i++) {
       accumulator = reducer(accumulator, allData[i])
     }
     return accumulator; // newState
 }
function sum(a,b) {return a+b}
console.log(reduce(sum, 1, [2, 3, 4]) === 10);
```

代码执行示意图：

![20190804173045.png](https://raw.githubusercontent.com/USTC-Han/picMap/master/img/20190804173045.png)

思考完reduce函数的功能，我们可以思考一下，redux的功能。项目中redux的使用是为了方便状态数据管理，通过dispatch(action)调用reducer函数来更新状态数据。那么上面示例代码中的reduce函数的参数reducer对应redux中
的reducer函数，initialData对应初始state,allData则是需要reducer处理的待处理数据，最终会返回一个新的state。

## reducer
reducer是redux状态管理机制的重要组成部分。一份reducer.js的文件一般会保存初始的状态树数据initialState和与其对应的reducer函数。reducer函数是一个纯函数，接受两个参数(state, action)，这意味着相同的参数输入，会返回相同的状态state。一个reducer.js文件会将reducer函数导出。并作为createStore函数的第一参数，最后生成整个文档的store。如下面的代码所示：

```js
store = createStore(reducer,initialState,enhancer);
```
createStore函数中的reducer是必须的，initialState可以省略，如果没有中间件enhancer也可以省略。具体的createStore的功能和源码将放在middleware那节一起讲。

## dispatch
上一部分提到store对象里面有两个重要的属性。store.dispatch和store.getState。前者用来分派一个action, reducer函数通过action.type匹配switch case，实现state的更新。原生的dispatch功能很单一，并且只能处理同步的action和实现state的更新。

那么如何来增强我们的dispatch呢？要增强dispatch就要增强store,而增强store则就是增强createStrore函数，此处便是通过enhancer整合middlewares实现了dispatch的增强。

## middleware

###  1.为什么要用中间件
上文提到，原生的redux中的Store.dispatch，它是不支持异步的，且功能是单一的，很难满足业务需求，所以需要使用中间件来增强dispatch。

举个例子，当我们调用了后端的API，然后取得返回值，此时我想拿disapatch来执行action。保存dispatch的上下文没有了。怎么办，没法dispatch了? 可以用闭包啊，闭包可以保存dispatch的引用，存在内存不被释放，这样回来不就调用dispatch了吗。那么此处便需要使用redux-thunk中间件。
### 2.中间件的庐山真面目
中间件使用了函数式编程中函数柯理化的功能，每个中间件中的每步返回都是一个接受单参的函数。
如以下的中间件：
redux-thunk :
```js
const thunk = store => next => action => 
typeof action === 'function' ? action(store.dispatch, store.getState) : next(action);
```
logger :
```js
const logger = store => next => action => {
  console.log('Middleware1: logger', store.getState())
  console.log('Middleware1: logger action:', action)
  console.log('m1-next', next)
  next(action)
}
```
参数详解：
- store: 传给每个中间件的{getState,dispatch},中间件是个闭包，每层中间件内部都保存者对store的引用，所以当所有中间件嵌套生成新的store后，每层中间件都保存着相同的store。

- next: next是内层已经封装好的dispatch,如果是洋葱图里最里面的一层，那么next就是原生的dipatch
![20190801154435.png](https://raw.githubusercontent.com/USTC-Han/picMap/master/img/20190801154435.png)

- action: action是我们dispatch的action

上面的洋葱图大致说明了，中间件层层嵌套，最外层调用store.dispatch(action)，通过调用next()一层层的往里剥洋葱，直到原生的dipatch，然后调用action，此时再从里到外回溯。

### 3、理解applyMiddleware的功能：

applyMiddleware方法是中间件的核心，它的参数是系统中用到的所有中间件，通过中间件将dispatch封装生成新的加强版dispatch,上面的洋葱图也提示到了，applyMiddleware方法就是实现中间件的层级嵌套，让内部嵌套好的部分作为外部一层中间件的next部分；那么思路有了，我们可以尝试封装一下applyMiddleware,让他可以通过嵌套生成新的store.dispatch;返回新的store。
redux-mini/index.js
```js
function applyMiddleware (middlewares) {
  return function (store) {
    middlewares.reverse().forEach(middleware => {
      let next = store.dispatch
      store.dispatch = middleware(store)(next) // store cuz some middleware need getState
    })
    return store
  }
}
store = applyMiddleware(middlewares)(store);
```

在applyMiddleware函数中先传入中间件，然后返回一个匿名函数接收参数store，此处的store为初始的store。首先我们把初始store要和最后一个中间件整合，所以此处反转了middlewares，这样拿到的顺序就符合中间件从优向左迭代的要求了。此时我们先把store传给中间件，那么中间件的结构如下：
```
next => action => {}
```
此时对于每次迭代，我们都把上次迭代生成的dispatch传给`store.dispatch = middleware(store)(next)`,那么此时就做到了内部嵌套好的部分作为外部一层中间件的next部分。next就是内部封装好的部分 ‘store.dispatch’。

其实说到此处中间件applyMiddleware的功能就更明了了，就是接受一个中间件数组，然后从后向前遍历中间件，最内层保存着对初始store.dispatch的引用。然后外层的中间件的next为内层封装好的部分 ‘store.dispatch’。我们把这个整懂了，源码其实很简单了。


### 4.理解applyMiddleware源码

#### 4.1 理解源码的预备知识
Redux源码提供了一个叫 applyMiddleware() 的方法，可以应用多个中间件，要想理解applyMiddleware，首要理解compose()的用法，而要想看懂compose()函数，首先要理解arr.reduceRight()方法。

##### arr.reduceRight()：
上面我们讲述了reduce的功能，reduceRight对数组的迭代方向是从右向左的迭代。我们在上一节模仿源码中通过reverse数组和forEach实现数组的迭代，从功能上类似于reduceRight。

- reduceRight：
```js
let funcs = [f,g,h]
funcs.reduceRight((a, b) => b(a), args);
```
对于数组中的每个元素，多对一迭代。最后返回 f(g(h(args))

##### compose源码
看了上面的reduceRight代码,此处的代码其实很好理解了，compose就是一个函数返回了一个reduceRight函数。 compose([f, g, h])(store.dispatch) 结果f(g(h(store.dispatch)))，f,g,h代表了三个中间件。
```js
function compose(chain) {
	return args => chain.reduceRight((next,f) => f(next), args)
}
```
由上面的代码结合洋葱图可以知道，next就是里层已经封装好的部分dispatch。

#### 4.2 applyMiddleware源码
```js
import compose from './compose'

export default function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    var store = createStore(reducer, preloadedState, enhancer)
    var dispatch = store.dispatch
    var chain = []

    var middlewareAPI = {
      getState: store.getState,
      dispatch: (action) => dispatch(action)
    }
    
    chain = middlewares.map(middleware => middleware(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}
```
看一眼，一脸懵逼，有没有……

![image]( https://gss0.baidu.com/-vo3dSag_xI4khGko9WTAnF6hhy/zhidao/pic/item/d52a2834349b033ba6049a7710ce36d3d439bd8b.jpg)

要想看懂这一堆箭头函数，还需要看一下createStore()的源码，createStore在项目中的用法：

`store = createStore(reducer,initialState,enhancer)`

> createStore源码：

```js
export default function createStore(reducer, preloadedState, enhancer) {
  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.')
    }

    return enhancer(createStore)(reducer, preloadedState)
  }
 .......
}
```
其中enhanser是applyMiddleware(middlewares)函数，`store = createStore(reducer,initialState,enhancer)`执行完等价于`return enhancer(createStore)(reducer, preloadedState)`等价于
`applyMiddleware(middlewares)(createStore)(reducer, preloadedState)`

带着这条结果回头再看applyMiddleware源码：
`store = createStore(reducer,initialState,enhancer)`相当于为applyMiddleware传递了所有它执行所需要的所有参数
applyMiddleware(middlewares)执行后，传人(createStore)(reducer, preloadedState)；
```js
（(createStore) => (reducer, preloadedState, enhancer) => {
    var store = createStore(reducer, preloadedState, enhancer)
    var dispatch = store.dispatch
    var chain = []

    var middlewareAPI = {
      getState: store.getState,
      dispatch: (action) => dispatch(action)
    }
    
    chain = middlewares.map(middleware => middleware(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }）(createStore)(reducer, preloadedState)

```
项目中定义执行完store = createStore(reducer, preloadedState, enhancer)，然后将store绑定在Provider组件上。

> 上面的代码执行到第二行 var store = createStore(reducer, preloadedState, enhancer)
此时enhance为undefined，此时返回的是一个没有绑定任何中间件的store，也就是最开始原生的store。

- 需要注意的地方

```js
    var middlewareAPI = {
      getState: store.getState,
      dispatch: (action) => dispatch(action)
    }
    
    chain = middlewares.map(middleware => middleware(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)
```
这块代码看了很多遍才理解，这块还是有点意思的。为啥单独封装了一个middlewareAPI，dispatch定义是一个function，而不是直接传store给middleware？

主要是为了保证各个中间件共享dispatch。如果写成dispatch: store.dispatch那么各层拿到的dispatch都将和内层原生dispatch相同，无法动态的更新。

结合上面的预备知识和中间件结构这里其实很好理解了，applyMiddleware中的middlewareAPI就中间件第一个参数store,`chain = middlewares.map(middleware => middleware(middlewareAPI))`,就是剥离最外层的函数。然后通过compose将中间件嵌套，`dispatch = compose(...chain)(store.dispatch)`此处的store依旧是原生store，拿到的store.dispatch也是原生的dispatch;最终生成加强版dispatch再更新store。因为每层中间件都是对store的引用，最后其实每层中间件有相同的store。

**中间件机制的本质就是一个闭包，通过闭包将原生dispatch保存在内存,并通过每层中间件封装新的dispatch。applyMiddleware方法的主要任务就是通过一系列的中间件改造原生dispatch为满足特定需求的dispatch。**

### 4.3 中间件的执行过程
通过上面的 applyMiddleware 和 中间件的结构，假设应用了如下的中间件: [A, B, C]，一个 action 的完整执行流程

#### 初始化阶段

一个中间件(ES5)的结构为:

```js
function ({getState，dispatch}) {
    return function (next) {
        return function (action) {...}
    }
}
```
初始化阶段一：middlewares map 为新的 middlewares

> chain = middlewares.map(middleware => middleware(middlewareAPI))

执行过后，middleware 变为了

```js
function (next) {
    return function (action) {...}
}
```
> 初始化阶段二：compose 新的 dispatch


```js
const newDispatch = compose(newMiddlewares)(store.dispatch)
```

#### compose 流程
假设中间件[A,B,C]

第一次执行

composedC = C(store.dispatch) = function C(action) {}

> next 闭包： store.dispatch

第二次执行：

 composedBC = B(composedC) = function B(action){}
> 
> next 闭包 composedC

第三次执行：

composedABC = A(composedBC) = function A(action){}
> next 闭包 composedBC
> 
> 最后的返回结果为 composedABC

执行到此生成新的dispatch函数，封装好的dispatch(action)就等价与composeABC(action)
#### 执行阶段
compose后的函数结构大约是A(B(C(dispatch.store))
> dispatch(action) 等于 composedABC(action) =>  等于执行 function A(action) {...}
> 
> 在函数 A 中执行 next(action), 此时 A 中 next 为 composedBC，那么等于执行 composedBC(action) 等于执行function B(action){...}
> 
> 在函数 B 中执行 next(action), 此时 B 中 next 为 composedC，那么等于执行 composedC(action) 等于执行function C(action){...}
> 
> 在函数 C 中执行 next(action), 此时 C 中 next 为 store.dispatch 即 store 原生的 dispatch, 等于执行store.dispatch(action)
> 
> store.dispatch 会执行 reducer 生成最新的 store 数据
> 
> 所有的 next 执行完过后开始回溯
> 
> 将C中的执行结果返还给B
> 
>  将B中的执行结果返还给A
> 
> 将A中的执行结果返还给最外层
> 
> 整个执行 action 的过程为 A -> B -> C -> dispatch -> C -> B -> A

### 5 异步中间件redux-thunk
redux-thunk中间件是项目中处理异步dispatch的方法，那它是怎么做到通过封装原生dispatch，在异步回调完成后，依旧可以使用原生dipatch来处理action对象的呢？带着问题可以看下面的源码

redux-thunk :
```js
const thunk = store => next => action => 
typeof action === 'function' ? action(store.dispatch, store.getState) : next(action);
```
此处假设代码只用了一个中间件redux-thunk，那么将redux-thunk传入applyMiddleware()封装好的
```js
dispatch =  (next => action => 
typeof action === 'function' ? action(store.dispatch, store.getState) : next(action))(store.dispatch);
```
如果我们要调用异步接口更新状态树，dispatch一个分装了action的函数，`disapatch(action.getList())`,此时action就是getList()的返回值，action是个匿名函数，会执行`action(store.dispatch, store.getState)`，此时就是执行action本身。当执行action是个对象的时候调用next(action)，此时next即原生的store.dispatch。
eg:
```js
function getList() {
  return (dispatch,getState) => {
    fetch(...)
    .then(
      (data) => dispatch({type: 'TEST',data })
    )
    .catch()
    }
  };
```
thunk中间件总结：

redux-thunk在action为function的时候可以执行 当不是函数的时候调用next(action)。假如系统只用了Thunk中间件。那么next(action)就是dispatch同步action，action是对象。



