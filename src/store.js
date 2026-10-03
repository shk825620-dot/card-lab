/**
 * 全局状态容器（可观察对象）。
 *
 * 约定：state 只能通过 dispatch 修改，任何视图都只能通过 subscribe 感知变化，
 * 视图自己不持有状态。这样"改一处、到处都是对的"这件事是结构保证的，不靠自觉。
 */

import { createState, validateState } from './model.js';

/**
 * @param {object} initial 初始状态（会经过 createState 补全）
 * @returns {{ getState: Function, dispatch: Function, subscribe: Function, patch: Function, errors: Function }}
 */
export function createStore(initial = {}) {
  let state = createState(initial);
  const listeners = new Set();

  function notify() {
    for (const listener of listeners) {
      listener(state);
    }
  }

  function set(next) {
    state = next;
    notify();
    return state;
  }

  return {
    getState() {
      return state;
    },

    /** 用部分字段更新状态；未知字段会被 createState 丢弃并回退。 */
    patch(partial) {
      return set(createState({ ...state, ...partial }));
    },

    /** 一次性替换整个状态。 */
    dispatch(nextState) {
      return set(createState(nextState));
    },

    /** 订阅变化，返回取消订阅函数。订阅后会立刻收到一次当前状态。 */
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },

    /** 当前状态的校验结果，供 #status 提示条使用。 */
    errors() {
      return validateState(state).errors;
    },
  };
}
