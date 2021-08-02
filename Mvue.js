
const compileUtil = {
  // 分割对象 . 的值 
  getVal(expr, vm) {
    // 让,vm.$data 为初始值 分割 所有指令为v-text 的值
    return expr.split('.').reduce((data, currentVal) => {
      return data[currentVal]
    }, vm.$data)
  },
  setVal(expr, vm, modelName) {
    return expr.split('.').reduce((data, currentVal) => {
      data[currentVal] = modelName
    }, vm.$data);
  },
  getContentVal(expr, vm) {
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(args[1].trim(), vm)
    })
  },
  text(node, expr, vm) { //expr: msg 
    let value
    if (expr.indexOf('{{') != -1) {
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        // 绑定观察者，将来的数据发生变化出发这里的回调 进行更新
        new Watcher(vm, args[1].trim(), (newVal) => { //trim 去掉 插值中的空格
          this.updater.textUpdater(node, this.getContentVal(expr, vm))
        })
        return this.getVal(args[1].trim(), vm)
      })
    } else {
      value = this.getVal(expr, vm);
    }
    this.updater.textUpdater(node, value)
  },
  html(node, expr, vm) {
    const value = this.getVal(expr, vm)
    // 解析指令添加wather
    new Watcher(vm, expr, (newVal) => {
      console.log(expr)
      this.updater.htmlUpdater(node, newVal)
    })
    this.updater.htmlUpdater(node, value)
  },
  model(node, expr, vm) {
    const value = this.getVal(expr, vm);
    // 数据更新视图
    new Watcher(vm, expr, (newVal) => {
      this.updater.modelUpdater(node, newVal);
    })
    // 视图更新数据
    node.addEventListener('input', (e) => {
      this.setVal(expr, vm, e.target.value)
    })
    this.updater.modelUpdater(node, value)
  },
  on(node, expr, vm, eventName) {
    let fn = vm.$options.methods && vm.$options.methods[expr];
    // 把这个this绑定到vm 上 要不然this 指向的是这个节点
    node.addEventListener(eventName, fn.bind(vm), false)
  },
  bind(node, expr, vm, attrName) {
    const value = this.getVal(expr, vm);
    this.updater.bindUpdater(node, value)
  },
  // 在视图层渲染
  updater: {
    bindUpdater(node, value) {
      node.className = value
    },
    modelUpdater(node, value) {
      node.value = value
    },
    htmlUpdater(node, value) {
      node.innerHTML = value
    },
    textUpdater(node, value) {
      // 为node 赋值
      node.textContent = value;
    }
  }

}
// 解析指令
class Compile {
  constructor(el, vm) {
    this.el = document.querySelector(el);
    this.vm = vm;
    // 获取挂载dom 元素将其插入 dom文档中 #app ...
    const fragment = this.nodeFragment(this.el);
    // 拿着dom 解构解析 非 html 结构 如 v- on ....
    this.compile(fragment)
    this.el.appendChild(fragment)
  }

  compile(fragment) {
    // 获取子节点
    const childNodes = fragment.childNodes;
    [...childNodes].forEach(child => {
      if (this.isElementNode(child)) {
        // 元素节点的话
        this.compileElement(child)
      } else {
        // 文本节点的话
        this.compileText(child)
      }
      // 递归遍历
      if (child.childNodes && child.childNodes.length) {
        this.compile(child)
      }
    })
  }
  compileElement(node) {
    const attributes = node.attributes;
    //  拿出属性 和 值
    [...attributes].forEach(attr => {
      const { name, value } = attr;
      if (this.isDirective(name)) { //是一个指令  v-text v-html ...
        const [, dirctive] = name.split('-'); // text html
        const [dirName, eventName] = dirctive.split(':');
        /** 
         * dirName动态的调用方法  node 是当前节点， value是值 v-on:click= "demo" 的demo
         * this 是 Mvue event是事件的名字
         * */
        // 更新数据 数据驱动视图
        compileUtil[dirName](node, value, this.vm, eventName)
        node.removeAttribute("v-" + dirctive)
      } else if (this.isEventName(name)) { //区分@ 注册事件
        let [, eventName] = name.split('@')
        compileUtil['on'](node, value, this.vm, eventName)
      } else if (this.isBindNmae(name)) {
        let [, eventName] = name.split(':')//区分 : 绑定事件
        compileUtil['bind'](node, value, this.vm, eventName)
      }
    })
  }
  // 匹配双 {{}}
  compileText(node) {
    const content = node.textContent;
    if (/\{\{(.+?)\}\}/.test(content)) {
      compileUtil['text'](node, content, this.vm)
    }
  }
  // 检测属性名是否以 v- 开头
  isDirective(attrname) {
    return attrname.startsWith('v-')
  }
  isEventName(attrname) {
    return attrname.startsWith('@')
  }
  isElementNode(node) {
    return node.nodeType === 1
  }
  isBindNmae(attrname) {
    return attrname.startsWith(':')
  }
  nodeFragment(el) {
    const f = document.createDocumentFragment()
    let firstChild;
    // 当el的节点为空停止循环,再把整个文档碎片插入dom 减少页面的回流和重绘
    while (firstChild = el.firstChild) {
      f.appendChild(firstChild)
    }
    return f;
  }
}
// 一切配置的入口
class MVue {
  constructor(options) {
    this.$el = options.el; //挂载的元素
    this.$data = options.data // 挂载的数据
    this.$options = options; //整个 实例
    if (this.$el) {
      // 实现一个数据观察者
      new Observer(this.$data)
      // 实现一个指令解析器
      new Compile(this.$el, this);
      // 代理this  this.$data.xxxx  变为 this.xxxx
      this.proxyData(this.$data);
    }
  }
  proxyData(data) {
    for (let key in data) {
      Object.defineProperty(this, key, {
        get() {
          return data[key]
        },
        set(newVal) {
          data[key] = newVal
        }
      })
    }
  }
}