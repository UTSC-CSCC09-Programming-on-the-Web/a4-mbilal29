const meact = (function () {
  "use strict";
  const module = {};
  const state = {};
  const useEffectListeners = {};

  module.useState = function (initialValue) {
    const key = Symbol();
    state[key] = initialValue;
    return [
      key,
      function () {
        return structuredClone(state[key]);
      },
      function (newValue) {
        state[key] = newValue;
        if (useEffectListeners[key]) {
          useEffectListeners[key].forEach((callback) => callback(newValue));
        }
      },
    ];
  };

  module.useEffect = function (callback, dependencies) {
    if (dependencies.length === 0) {
      callback();
      return;
    }
    dependencies.forEach((dep) => {
      if (!useEffectListeners[dep]) {
        useEffectListeners[dep] = [];
      }
      useEffectListeners[dep].push(callback);
    });
    callback(state[dependencies[0]]);
  };

  return module;
})();
