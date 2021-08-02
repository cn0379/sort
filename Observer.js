//观察者 观察者的作用时看一下新值和旧值有没有发生变化 有变化就进行更新
class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm;
    this.expr = expr;
    this.cb = cb;
    // 先把旧值保存起来 与新值作比较 有变化 就 callback
    this.oldVal = this.getOldvalue()
  }

  getOldvalue() {
    Dep.target = this;
    // 获得旧值 此时 初始化的值 已经有了watcher
    const oldVal = compileUtil.getVal(this.expr, this.vm);
    Dep.target = null;
    return oldVal;
  }

  //观察旧值和新值
  update() {
  // 在getVal中分割 拿到值
    const newVal = compileUtil.getVal(this.expr, this.vm);
    if (newVal !== this.oldVal) {
      // 新值和旧值不一样有变化就回调函数 callback 在指令解析 new Watcher  
      this.cb(newVal);
    }
  }
}

// 依赖
class Dep {
  constructor() {
    this.subs = []
  }
  //收集观察者
  addSub(watcher) {
    this.subs.push(watcher)
  }
  // 通知观察者去更新
  notify() {
    // 找到对应的观察者去更新
    this.subs.forEach(w => {
      w.update()
    })
  }
}

// 劫持监听所有数据
class Observer {
  constructor(data) {
    this.observe(data)
  }
  observe(data) {
    // 判断是否是对象
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        // 数据劫持的开始
        this.defineReactive(data, key, data[key])
      })
    }
  }
  defineReactive(obj, key, value) {
    // 让所有的data数据变得可观测 包括 对象的对象 递归遍历
    this.observe(value)
    const dep = new Dep();
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: false,
      get() {
        //订阅数据发生变化  往Dep中添加观察者 
        Dep.target && dep.addSub(Dep.target)
        return value
      },
      // 改为箭头函数改变this的指向
      set: (newVal) => {
        // 为修改对象时使其变为可观测
        this.observe(newVal)
        if (newVal !== value) {
          value = newVal
        }
        // 通知观察者 watcher 
        dep.notify();
      }
    })
  }
}