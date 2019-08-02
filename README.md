# redux-mini

`npm i -g serve`

Run `serve`, open the url and get into `demo` directory and open `demo.html` file.

All values will be shown in console.

___
# redux 中间件
###  1.什么是中间件
普通使用同步功能时，action的改变会立即触发reducer处理状态，而中间件redux的本质的目的是提供第三方插件的模式，自定义拦截 action -> reducer 的过程。变为 action -> middlewares -> reducer 。这种机制可以让我们改变数据流，实现如异步 action ，action 过滤，日志输出，异常报告等功能。
#### 1.1 为什么要用中间件
原生的redux中的Store.dispatch，它是不支持异步的，且功能是单一的。举个例子，当我们调用了后端的API，然后取得返回值，此时我想拿disapatch来执行action。保存dispatch的上下文没有了。怎么办，没法dispatch了? 可以用闭包啊，闭包可以保存dispatch的引用，存在内存不被释放，这样回来不就调用dispatch了吗。-- 此处膜拜中间件设计者

**中间件机制的本质就是一个闭包，通过闭包将原生dispatch保存在内存,并通过每层中间件封装新的dispatch。applyMiddleware方法的主要任务就是通过一系列的中间件改造原生dispatch为满足特定需求的dispatch。**

### 2.理解中间件预备知识
Redux 提供了一个叫 applyMiddleware() 的方法，可以应用多个中间件，要想理解applyMiddleware，首要理解compose()的用法，而要想看懂compose()函数，首先要理解arr.reduceRight()方法

#### 2.1 arr.reduceRight()：
reduceRight对数组的迭代方向是从右向左的迭代

```
let funcs = [f,g,h]
funcs.reduceRight((a, b) => b(a), args);
```
对于数组中的每个元素，多对一迭代。最后返回 f(g(h(args))

#### 2.2 compose源码

```
function compose(funcs) {
	return args => funcs.reduceRight((composed,f) => f(compose), args)
}
```
 compose([f, g, h])(store.dispatch) 结果 f(g(h(store.dispatch)))
 f,g,h代表了三个中间件
 

---
### 3.applyMiddleware源码：

```
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

```
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
```
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

```
    var middlewareAPI = {
      getState: store.getState,
      dispatch: (action) => dispatch(action)
    }
    
    chain = middlewares.map(middleware => middleware(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)
```
这块代码看了很多遍才理解，这块还是有点意思的。为啥单独封装了一个middlewareAPI，dispatch定义是一个function，而不是直接传store给middleware？

主要是为了保证各个中间件共享dispatch。如果写成dispatch: store.dispatch那么各层拿到的dispatch都将和内层原生dispatch相同，无法动态的更新。

`dispatch = compose(...chain)(store.dispatch)`此处的store依旧是原生store，拿到的store.dispatch也是原生的dispatch;

#### 3.1 中间件的庐山真面目
中间件使用了函数式编程中函数柯理化的功能，每个中间件中的每步返回都是一个接受单参的函数。
redux-thunk :
``` 
const thunk = store => next => action => 
typeof action === 'function' ? action(store.dispatch, store.getState) : next(action);
```
> redux-thunk在action为function的时候可以执行 function async(dispatch,getState) => {fetch....};当不是函数的时候调用next(action)。假如系统只用了Thunk中间件。那么next(action)就是dispatch同步action，action是对象。


```
const logger = store => next => action => {
  console.log('Middleware1: logger', store.getState())
  console.log('Middleware1: logger action:', action)
  console.log('m1-next', next)
  next(action)
}
```

- store: applyMiddleware中的middlewareAPI就是等价这里的store,`chain = middlewares.map(middleware => middleware(middlewareAPI))`,就是剥离最外层的函数。

- next: next是内层已经封装好的dispatch,如果是洋葱图里最里面的一层，那么next就是原生的dipatch
![20190801154435.png](https://raw.githubusercontent.com/USTC-Han/picMap/master/img/20190801154435.png)

- action: action是我们dispatch的action

上面的洋葱图大致说明了，中间件层层嵌套，最外层调用store.dispatch(action)，通过调用next()一层层的往里剥洋葱，直到原生的dipatch，然后调用action，此时再从里到外回溯。

#### 3.2 让流程更易懂点
- 首先要明确creatStore的功能，然后再明确applyMiddleware的功能，再就是理解中间件函数结构，这就齐活了。
- creatStore的功能有两个，一个是生成原生的store，将middlewareAPI传给所有的中间件。二是执行enhancer()将中间件封装，生成封装后dispatch的store。
- applyMiddleware的功能利用闭包让所有中间件共享middlewareAPI。在中间件未执行完store会一直保存在内存，最终封装原生dispatch为新的dispatch 
- 中间件函数如 3.1所讲

#### 是不是还是有点蒙
![image](http://img.tukexw.com/img/c5ea0ded2055636f.jpg)

下面将再细化一下：
### 4.中间件的执行过程
通过上面的 applyMiddleware 和 中间件的结构，假设应用了如下的中间件: [A, B, C]，一个 action 的完整执行流程

#### 4.1 初始化阶段

一个中间件(ES5)的结构为:

```
function ({getState，dispatch}) {
    return function (next) {
        return function (action) {...}
    }
}
```
初始化阶段一：middlewares map 为新的 middlewares

> chain = middlewares.map(middleware => middleware(middlewareAPI))

执行过后，middleware 变为了

```
function (next) {
    return function (action) {...}
}
```
> 初始化阶段二：compose 新的 dispatch


```
const newDispatch = compose(newMiddlewares)(store.dispatch)
```

#### 4.2 compose 流程
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




