"use client";
import {
  Presence
} from "./chunk-WOGOSG3H.js";
import {
  createCollection,
  useDirection
} from "./chunk-W5NOEMCG.js";
import {
  Anchor,
  Arrow,
  Content,
  Root2,
  createPopperScope
} from "./chunk-YVESEOZW.js";
import {
  Combination_default,
  DismissableLayer,
  FocusScope,
  Portal,
  hideOthers,
  useFocusGuards,
  useId
} from "./chunk-R3GP2JNE.js";
import {
  require_react_dom
} from "./chunk-BLBKUI5W.js";
import {
  require_jsx_runtime
} from "./chunk-5HDAWWHN.js";
import {
  require_react
} from "./chunk-W4EHDCLL.js";
import {
  __toESM
} from "./chunk-EWTE5DHJ.js";

// node_modules/@radix-ui/react-dropdown-menu/dist/index.mjs
var React21 = __toESM(require_react(), 1);

// node_modules/@radix-ui/react-dropdown-menu/node_modules/@radix-ui/primitive/dist/index.mjs
function composeEventHandlers(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
  return function handleEvent(event) {
    originalEventHandler == null ? void 0 : originalEventHandler(event);
    if (checkForDefaultPrevented === false || !event.defaultPrevented) {
      return ourEventHandler == null ? void 0 : ourEventHandler(event);
    }
  };
}

// node_modules/@radix-ui/react-dropdown-menu/node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var React = __toESM(require_react(), 1);
function setRef(ref, value) {
  if (typeof ref === "function") {
    return ref(value);
  } else if (ref !== null && ref !== void 0) {
    ref.current = value;
  }
}
function composeRefs(...refs) {
  return (node) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node);
      if (!hasCleanup && typeof cleanup == "function") {
        hasCleanup = true;
      }
      return cleanup;
    });
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup == "function") {
            cleanup();
          } else {
            setRef(refs[i], null);
          }
        }
      };
    }
  };
}

// node_modules/@radix-ui/react-dropdown-menu/node_modules/@radix-ui/react-context/dist/index.mjs
var React2 = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function createContextScope(scopeName, createContextScopeDeps = []) {
  let defaultContexts = [];
  function createContext32(rootComponentName, defaultContext) {
    const BaseContext = React2.createContext(defaultContext);
    const index = defaultContexts.length;
    defaultContexts = [...defaultContexts, defaultContext];
    const Provider = (props) => {
      var _a;
      const { scope, children, ...context } = props;
      const Context = ((_a = scope == null ? void 0 : scope[scopeName]) == null ? void 0 : _a[index]) || BaseContext;
      const value = React2.useMemo(() => context, Object.values(context));
      return (0, import_jsx_runtime.jsx)(Context.Provider, { value, children });
    };
    Provider.displayName = rootComponentName + "Provider";
    function useContext22(consumerName, scope) {
      var _a;
      const Context = ((_a = scope == null ? void 0 : scope[scopeName]) == null ? void 0 : _a[index]) || BaseContext;
      const context = React2.useContext(Context);
      if (context) return context;
      if (defaultContext !== void 0) return defaultContext;
      throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
    }
    return [Provider, useContext22];
  }
  const createScope = () => {
    const scopeContexts = defaultContexts.map((defaultContext) => {
      return React2.createContext(defaultContext);
    });
    return function useScope(scope) {
      const contexts = (scope == null ? void 0 : scope[scopeName]) || scopeContexts;
      return React2.useMemo(
        () => ({ [`__scope${scopeName}`]: { ...scope, [scopeName]: contexts } }),
        [scope, contexts]
      );
    };
  };
  createScope.scopeName = scopeName;
  return [createContext32, composeContextScopes(createScope, ...createContextScopeDeps)];
}
function composeContextScopes(...scopes) {
  const baseScope = scopes[0];
  if (scopes.length === 1) return baseScope;
  const createScope = () => {
    const scopeHooks = scopes.map((createScope2) => ({
      useScope: createScope2(),
      scopeName: createScope2.scopeName
    }));
    return function useComposedScopes(overrideScopes) {
      const nextScopes = scopeHooks.reduce((nextScopes2, { useScope, scopeName }) => {
        const scopeProps = useScope(overrideScopes);
        const currentScope = scopeProps[`__scope${scopeName}`];
        return { ...nextScopes2, ...currentScope };
      }, {});
      return React2.useMemo(() => ({ [`__scope${baseScope.scopeName}`]: nextScopes }), [nextScopes]);
    };
  };
  createScope.scopeName = baseScope.scopeName;
  return createScope;
}

// node_modules/@radix-ui/react-dropdown-menu/node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
var React4 = __toESM(require_react(), 1);

// node_modules/@radix-ui/react-dropdown-menu/node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs
var React3 = __toESM(require_react(), 1);
var useLayoutEffect2 = (globalThis == null ? void 0 : globalThis.document) ? React3.useLayoutEffect : () => {
};

// node_modules/@radix-ui/react-dropdown-menu/node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
var React22 = __toESM(require_react(), 1);
var useInsertionEffect = React4[" useInsertionEffect ".trim().toString()] || useLayoutEffect2;
function useControllableState({
  prop,
  defaultProp,
  onChange = () => {
  },
  caller
}) {
  const [uncontrolledProp, setUncontrolledProp, onChangeRef] = useUncontrolledState({
    defaultProp,
    onChange
  });
  const isControlled = prop !== void 0;
  const value = isControlled ? prop : uncontrolledProp;
  if (true) {
    const isControlledRef = React4.useRef(prop !== void 0);
    React4.useEffect(() => {
      const wasControlled = isControlledRef.current;
      if (wasControlled !== isControlled) {
        const from = wasControlled ? "controlled" : "uncontrolled";
        const to = isControlled ? "controlled" : "uncontrolled";
        console.warn(
          `${caller} is changing from ${from} to ${to}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
        );
      }
      isControlledRef.current = isControlled;
    }, [isControlled, caller]);
  }
  const setValue = React4.useCallback(
    (nextValue) => {
      var _a;
      if (isControlled) {
        const value2 = isFunction(nextValue) ? nextValue(prop) : nextValue;
        if (value2 !== prop) {
          (_a = onChangeRef.current) == null ? void 0 : _a.call(onChangeRef, value2);
        }
      } else {
        setUncontrolledProp(nextValue);
      }
    },
    [isControlled, prop, setUncontrolledProp, onChangeRef]
  );
  return [value, setValue];
}
function useUncontrolledState({
  defaultProp,
  onChange
}) {
  const [value, setValue] = React4.useState(defaultProp);
  const prevValueRef = React4.useRef(value);
  const onChangeRef = React4.useRef(onChange);
  useInsertionEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  React4.useEffect(() => {
    var _a;
    if (prevValueRef.current !== value) {
      (_a = onChangeRef.current) == null ? void 0 : _a.call(onChangeRef, value);
      prevValueRef.current = value;
    }
  }, [value, prevValueRef]);
  return [value, setValue, onChangeRef];
}
function isFunction(value) {
  return typeof value === "function";
}
var SYNC_STATE = Symbol("RADIX:SYNC_STATE");

// node_modules/@radix-ui/react-dropdown-menu/node_modules/@radix-ui/react-primitive/dist/index.mjs
var React6 = __toESM(require_react(), 1);
var ReactDOM = __toESM(require_react_dom(), 1);

// node_modules/@radix-ui/react-dropdown-menu/node_modules/@radix-ui/react-slot/dist/index.mjs
var React5 = __toESM(require_react(), 1);
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
function createSlot(ownerName) {
  const SlotClone = createSlotClone(ownerName);
  const Slot22 = React5.forwardRef((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    const childrenArray = React5.Children.toArray(children);
    const slottable = childrenArray.find(isSlottable);
    if (slottable) {
      const newElement = slottable.props.children;
      const newChildren = childrenArray.map((child) => {
        if (child === slottable) {
          if (React5.Children.count(newElement) > 1) return React5.Children.only(null);
          return React5.isValidElement(newElement) ? newElement.props.children : null;
        } else {
          return child;
        }
      });
      return (0, import_jsx_runtime2.jsx)(SlotClone, { ...slotProps, ref: forwardedRef, children: React5.isValidElement(newElement) ? React5.cloneElement(newElement, void 0, newChildren) : null });
    }
    return (0, import_jsx_runtime2.jsx)(SlotClone, { ...slotProps, ref: forwardedRef, children });
  });
  Slot22.displayName = `${ownerName}.Slot`;
  return Slot22;
}
var Slot = createSlot("Slot");
function createSlotClone(ownerName) {
  const SlotClone = React5.forwardRef((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    if (React5.isValidElement(children)) {
      const childrenRef = getElementRef(children);
      const props2 = mergeProps(slotProps, children.props);
      if (children.type !== React5.Fragment) {
        props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
      }
      return React5.cloneElement(children, props2);
    }
    return React5.Children.count(children) > 1 ? React5.Children.only(null) : null;
  });
  SlotClone.displayName = `${ownerName}.SlotClone`;
  return SlotClone;
}
var SLOTTABLE_IDENTIFIER = Symbol("radix.slottable");
function createSlottable(ownerName) {
  const Slottable22 = ({ children }) => {
    return (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children });
  };
  Slottable22.displayName = `${ownerName}.Slottable`;
  Slottable22.__radixId = SLOTTABLE_IDENTIFIER;
  return Slottable22;
}
var Slottable = createSlottable("Slottable");
function isSlottable(child) {
  return React5.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER;
}
function mergeProps(slotProps, childProps) {
  const overrideProps = { ...childProps };
  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);
    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args) => {
          childPropValue(...args);
          slotPropValue(...args);
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === "style") {
      overrideProps[propName] = { ...slotPropValue, ...childPropValue };
    } else if (propName === "className") {
      overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
    }
  }
  return { ...slotProps, ...overrideProps };
}
function getElementRef(element) {
  var _a, _b;
  let getter = (_a = Object.getOwnPropertyDescriptor(element.props, "ref")) == null ? void 0 : _a.get;
  let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.ref;
  }
  getter = (_b = Object.getOwnPropertyDescriptor(element, "ref")) == null ? void 0 : _b.get;
  mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.props.ref;
  }
  return element.props.ref || element.ref;
}

// node_modules/@radix-ui/react-dropdown-menu/node_modules/@radix-ui/react-primitive/dist/index.mjs
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
var NODES = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
];
var Primitive = NODES.reduce((primitive, node) => {
  const Slot5 = createSlot(`Primitive.${node}`);
  const Node = React6.forwardRef((props, forwardedRef) => {
    const { asChild, ...primitiveProps } = props;
    const Comp = asChild ? Slot5 : node;
    if (typeof window !== "undefined") {
      window[Symbol.for("radix-ui")] = true;
    }
    return (0, import_jsx_runtime3.jsx)(Comp, { ...primitiveProps, ref: forwardedRef });
  });
  Node.displayName = `Primitive.${node}`;
  return { ...primitive, [node]: Node };
}, {});

// node_modules/@radix-ui/react-menu/dist/index.mjs
var React20 = __toESM(require_react(), 1);

// node_modules/@radix-ui/react-menu/node_modules/@radix-ui/primitive/dist/index.mjs
function composeEventHandlers2(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
  return function handleEvent(event) {
    originalEventHandler == null ? void 0 : originalEventHandler(event);
    if (checkForDefaultPrevented === false || !event.defaultPrevented) {
      return ourEventHandler == null ? void 0 : ourEventHandler(event);
    }
  };
}

// node_modules/@radix-ui/react-menu/node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var React7 = __toESM(require_react(), 1);
function setRef2(ref, value) {
  if (typeof ref === "function") {
    return ref(value);
  } else if (ref !== null && ref !== void 0) {
    ref.current = value;
  }
}
function composeRefs2(...refs) {
  return (node) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef2(ref, node);
      if (!hasCleanup && typeof cleanup == "function") {
        hasCleanup = true;
      }
      return cleanup;
    });
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup == "function") {
            cleanup();
          } else {
            setRef2(refs[i], null);
          }
        }
      };
    }
  };
}
function useComposedRefs(...refs) {
  return React7.useCallback(composeRefs2(...refs), refs);
}

// node_modules/@radix-ui/react-menu/node_modules/@radix-ui/react-context/dist/index.mjs
var React8 = __toESM(require_react(), 1);
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
function createContextScope2(scopeName, createContextScopeDeps = []) {
  let defaultContexts = [];
  function createContext32(rootComponentName, defaultContext) {
    const BaseContext = React8.createContext(defaultContext);
    const index = defaultContexts.length;
    defaultContexts = [...defaultContexts, defaultContext];
    const Provider = (props) => {
      var _a;
      const { scope, children, ...context } = props;
      const Context = ((_a = scope == null ? void 0 : scope[scopeName]) == null ? void 0 : _a[index]) || BaseContext;
      const value = React8.useMemo(() => context, Object.values(context));
      return (0, import_jsx_runtime4.jsx)(Context.Provider, { value, children });
    };
    Provider.displayName = rootComponentName + "Provider";
    function useContext22(consumerName, scope) {
      var _a;
      const Context = ((_a = scope == null ? void 0 : scope[scopeName]) == null ? void 0 : _a[index]) || BaseContext;
      const context = React8.useContext(Context);
      if (context) return context;
      if (defaultContext !== void 0) return defaultContext;
      throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
    }
    return [Provider, useContext22];
  }
  const createScope = () => {
    const scopeContexts = defaultContexts.map((defaultContext) => {
      return React8.createContext(defaultContext);
    });
    return function useScope(scope) {
      const contexts = (scope == null ? void 0 : scope[scopeName]) || scopeContexts;
      return React8.useMemo(
        () => ({ [`__scope${scopeName}`]: { ...scope, [scopeName]: contexts } }),
        [scope, contexts]
      );
    };
  };
  createScope.scopeName = scopeName;
  return [createContext32, composeContextScopes2(createScope, ...createContextScopeDeps)];
}
function composeContextScopes2(...scopes) {
  const baseScope = scopes[0];
  if (scopes.length === 1) return baseScope;
  const createScope = () => {
    const scopeHooks = scopes.map((createScope2) => ({
      useScope: createScope2(),
      scopeName: createScope2.scopeName
    }));
    return function useComposedScopes(overrideScopes) {
      const nextScopes = scopeHooks.reduce((nextScopes2, { useScope, scopeName }) => {
        const scopeProps = useScope(overrideScopes);
        const currentScope = scopeProps[`__scope${scopeName}`];
        return { ...nextScopes2, ...currentScope };
      }, {});
      return React8.useMemo(() => ({ [`__scope${baseScope.scopeName}`]: nextScopes }), [nextScopes]);
    };
  };
  createScope.scopeName = baseScope.scopeName;
  return createScope;
}

// node_modules/@radix-ui/react-menu/node_modules/@radix-ui/react-primitive/dist/index.mjs
var React10 = __toESM(require_react(), 1);
var ReactDOM2 = __toESM(require_react_dom(), 1);

// node_modules/@radix-ui/react-menu/node_modules/@radix-ui/react-slot/dist/index.mjs
var React9 = __toESM(require_react(), 1);
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
function createSlot2(ownerName) {
  const SlotClone = createSlotClone2(ownerName);
  const Slot22 = React9.forwardRef((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    const childrenArray = React9.Children.toArray(children);
    const slottable = childrenArray.find(isSlottable2);
    if (slottable) {
      const newElement = slottable.props.children;
      const newChildren = childrenArray.map((child) => {
        if (child === slottable) {
          if (React9.Children.count(newElement) > 1) return React9.Children.only(null);
          return React9.isValidElement(newElement) ? newElement.props.children : null;
        } else {
          return child;
        }
      });
      return (0, import_jsx_runtime5.jsx)(SlotClone, { ...slotProps, ref: forwardedRef, children: React9.isValidElement(newElement) ? React9.cloneElement(newElement, void 0, newChildren) : null });
    }
    return (0, import_jsx_runtime5.jsx)(SlotClone, { ...slotProps, ref: forwardedRef, children });
  });
  Slot22.displayName = `${ownerName}.Slot`;
  return Slot22;
}
var Slot2 = createSlot2("Slot");
function createSlotClone2(ownerName) {
  const SlotClone = React9.forwardRef((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    if (React9.isValidElement(children)) {
      const childrenRef = getElementRef2(children);
      const props2 = mergeProps2(slotProps, children.props);
      if (children.type !== React9.Fragment) {
        props2.ref = forwardedRef ? composeRefs2(forwardedRef, childrenRef) : childrenRef;
      }
      return React9.cloneElement(children, props2);
    }
    return React9.Children.count(children) > 1 ? React9.Children.only(null) : null;
  });
  SlotClone.displayName = `${ownerName}.SlotClone`;
  return SlotClone;
}
var SLOTTABLE_IDENTIFIER2 = Symbol("radix.slottable");
function createSlottable2(ownerName) {
  const Slottable22 = ({ children }) => {
    return (0, import_jsx_runtime5.jsx)(import_jsx_runtime5.Fragment, { children });
  };
  Slottable22.displayName = `${ownerName}.Slottable`;
  Slottable22.__radixId = SLOTTABLE_IDENTIFIER2;
  return Slottable22;
}
var Slottable2 = createSlottable2("Slottable");
function isSlottable2(child) {
  return React9.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER2;
}
function mergeProps2(slotProps, childProps) {
  const overrideProps = { ...childProps };
  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);
    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args) => {
          childPropValue(...args);
          slotPropValue(...args);
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === "style") {
      overrideProps[propName] = { ...slotPropValue, ...childPropValue };
    } else if (propName === "className") {
      overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
    }
  }
  return { ...slotProps, ...overrideProps };
}
function getElementRef2(element) {
  var _a, _b;
  let getter = (_a = Object.getOwnPropertyDescriptor(element.props, "ref")) == null ? void 0 : _a.get;
  let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.ref;
  }
  getter = (_b = Object.getOwnPropertyDescriptor(element, "ref")) == null ? void 0 : _b.get;
  mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.props.ref;
  }
  return element.props.ref || element.ref;
}

// node_modules/@radix-ui/react-menu/node_modules/@radix-ui/react-primitive/dist/index.mjs
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
var NODES2 = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
];
var Primitive2 = NODES2.reduce((primitive, node) => {
  const Slot5 = createSlot2(`Primitive.${node}`);
  const Node = React10.forwardRef((props, forwardedRef) => {
    const { asChild, ...primitiveProps } = props;
    const Comp = asChild ? Slot5 : node;
    if (typeof window !== "undefined") {
      window[Symbol.for("radix-ui")] = true;
    }
    return (0, import_jsx_runtime6.jsx)(Comp, { ...primitiveProps, ref: forwardedRef });
  });
  Node.displayName = `Primitive.${node}`;
  return { ...primitive, [node]: Node };
}, {});
function dispatchDiscreteCustomEvent(target, event) {
  if (target) ReactDOM2.flushSync(() => target.dispatchEvent(event));
}

// node_modules/@radix-ui/react-roving-focus/dist/index.mjs
var React18 = __toESM(require_react(), 1);

// node_modules/@radix-ui/react-roving-focus/node_modules/@radix-ui/primitive/dist/index.mjs
function composeEventHandlers3(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
  return function handleEvent(event) {
    originalEventHandler == null ? void 0 : originalEventHandler(event);
    if (checkForDefaultPrevented === false || !event.defaultPrevented) {
      return ourEventHandler == null ? void 0 : ourEventHandler(event);
    }
  };
}

// node_modules/@radix-ui/react-roving-focus/node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var React11 = __toESM(require_react(), 1);
function setRef3(ref, value) {
  if (typeof ref === "function") {
    return ref(value);
  } else if (ref !== null && ref !== void 0) {
    ref.current = value;
  }
}
function composeRefs3(...refs) {
  return (node) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef3(ref, node);
      if (!hasCleanup && typeof cleanup == "function") {
        hasCleanup = true;
      }
      return cleanup;
    });
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup == "function") {
            cleanup();
          } else {
            setRef3(refs[i], null);
          }
        }
      };
    }
  };
}
function useComposedRefs2(...refs) {
  return React11.useCallback(composeRefs3(...refs), refs);
}

// node_modules/@radix-ui/react-roving-focus/node_modules/@radix-ui/react-context/dist/index.mjs
var React12 = __toESM(require_react(), 1);
var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
function createContextScope3(scopeName, createContextScopeDeps = []) {
  let defaultContexts = [];
  function createContext32(rootComponentName, defaultContext) {
    const BaseContext = React12.createContext(defaultContext);
    const index = defaultContexts.length;
    defaultContexts = [...defaultContexts, defaultContext];
    const Provider = (props) => {
      var _a;
      const { scope, children, ...context } = props;
      const Context = ((_a = scope == null ? void 0 : scope[scopeName]) == null ? void 0 : _a[index]) || BaseContext;
      const value = React12.useMemo(() => context, Object.values(context));
      return (0, import_jsx_runtime7.jsx)(Context.Provider, { value, children });
    };
    Provider.displayName = rootComponentName + "Provider";
    function useContext22(consumerName, scope) {
      var _a;
      const Context = ((_a = scope == null ? void 0 : scope[scopeName]) == null ? void 0 : _a[index]) || BaseContext;
      const context = React12.useContext(Context);
      if (context) return context;
      if (defaultContext !== void 0) return defaultContext;
      throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
    }
    return [Provider, useContext22];
  }
  const createScope = () => {
    const scopeContexts = defaultContexts.map((defaultContext) => {
      return React12.createContext(defaultContext);
    });
    return function useScope(scope) {
      const contexts = (scope == null ? void 0 : scope[scopeName]) || scopeContexts;
      return React12.useMemo(
        () => ({ [`__scope${scopeName}`]: { ...scope, [scopeName]: contexts } }),
        [scope, contexts]
      );
    };
  };
  createScope.scopeName = scopeName;
  return [createContext32, composeContextScopes3(createScope, ...createContextScopeDeps)];
}
function composeContextScopes3(...scopes) {
  const baseScope = scopes[0];
  if (scopes.length === 1) return baseScope;
  const createScope = () => {
    const scopeHooks = scopes.map((createScope2) => ({
      useScope: createScope2(),
      scopeName: createScope2.scopeName
    }));
    return function useComposedScopes(overrideScopes) {
      const nextScopes = scopeHooks.reduce((nextScopes2, { useScope, scopeName }) => {
        const scopeProps = useScope(overrideScopes);
        const currentScope = scopeProps[`__scope${scopeName}`];
        return { ...nextScopes2, ...currentScope };
      }, {});
      return React12.useMemo(() => ({ [`__scope${baseScope.scopeName}`]: nextScopes }), [nextScopes]);
    };
  };
  createScope.scopeName = baseScope.scopeName;
  return createScope;
}

// node_modules/@radix-ui/react-roving-focus/node_modules/@radix-ui/react-primitive/dist/index.mjs
var React14 = __toESM(require_react(), 1);
var ReactDOM3 = __toESM(require_react_dom(), 1);

// node_modules/@radix-ui/react-roving-focus/node_modules/@radix-ui/react-slot/dist/index.mjs
var React13 = __toESM(require_react(), 1);
var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
function createSlot3(ownerName) {
  const SlotClone = createSlotClone3(ownerName);
  const Slot22 = React13.forwardRef((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    const childrenArray = React13.Children.toArray(children);
    const slottable = childrenArray.find(isSlottable3);
    if (slottable) {
      const newElement = slottable.props.children;
      const newChildren = childrenArray.map((child) => {
        if (child === slottable) {
          if (React13.Children.count(newElement) > 1) return React13.Children.only(null);
          return React13.isValidElement(newElement) ? newElement.props.children : null;
        } else {
          return child;
        }
      });
      return (0, import_jsx_runtime8.jsx)(SlotClone, { ...slotProps, ref: forwardedRef, children: React13.isValidElement(newElement) ? React13.cloneElement(newElement, void 0, newChildren) : null });
    }
    return (0, import_jsx_runtime8.jsx)(SlotClone, { ...slotProps, ref: forwardedRef, children });
  });
  Slot22.displayName = `${ownerName}.Slot`;
  return Slot22;
}
var Slot3 = createSlot3("Slot");
function createSlotClone3(ownerName) {
  const SlotClone = React13.forwardRef((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    if (React13.isValidElement(children)) {
      const childrenRef = getElementRef3(children);
      const props2 = mergeProps3(slotProps, children.props);
      if (children.type !== React13.Fragment) {
        props2.ref = forwardedRef ? composeRefs3(forwardedRef, childrenRef) : childrenRef;
      }
      return React13.cloneElement(children, props2);
    }
    return React13.Children.count(children) > 1 ? React13.Children.only(null) : null;
  });
  SlotClone.displayName = `${ownerName}.SlotClone`;
  return SlotClone;
}
var SLOTTABLE_IDENTIFIER3 = Symbol("radix.slottable");
function createSlottable3(ownerName) {
  const Slottable22 = ({ children }) => {
    return (0, import_jsx_runtime8.jsx)(import_jsx_runtime8.Fragment, { children });
  };
  Slottable22.displayName = `${ownerName}.Slottable`;
  Slottable22.__radixId = SLOTTABLE_IDENTIFIER3;
  return Slottable22;
}
var Slottable3 = createSlottable3("Slottable");
function isSlottable3(child) {
  return React13.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER3;
}
function mergeProps3(slotProps, childProps) {
  const overrideProps = { ...childProps };
  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);
    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args) => {
          childPropValue(...args);
          slotPropValue(...args);
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === "style") {
      overrideProps[propName] = { ...slotPropValue, ...childPropValue };
    } else if (propName === "className") {
      overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
    }
  }
  return { ...slotProps, ...overrideProps };
}
function getElementRef3(element) {
  var _a, _b;
  let getter = (_a = Object.getOwnPropertyDescriptor(element.props, "ref")) == null ? void 0 : _a.get;
  let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.ref;
  }
  getter = (_b = Object.getOwnPropertyDescriptor(element, "ref")) == null ? void 0 : _b.get;
  mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.props.ref;
  }
  return element.props.ref || element.ref;
}

// node_modules/@radix-ui/react-roving-focus/node_modules/@radix-ui/react-primitive/dist/index.mjs
var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
var NODES3 = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
];
var Primitive3 = NODES3.reduce((primitive, node) => {
  const Slot5 = createSlot3(`Primitive.${node}`);
  const Node = React14.forwardRef((props, forwardedRef) => {
    const { asChild, ...primitiveProps } = props;
    const Comp = asChild ? Slot5 : node;
    if (typeof window !== "undefined") {
      window[Symbol.for("radix-ui")] = true;
    }
    return (0, import_jsx_runtime9.jsx)(Comp, { ...primitiveProps, ref: forwardedRef });
  });
  Node.displayName = `Primitive.${node}`;
  return { ...primitive, [node]: Node };
}, {});

// node_modules/@radix-ui/react-roving-focus/node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs
var React15 = __toESM(require_react(), 1);
function useCallbackRef(callback) {
  const callbackRef = React15.useRef(callback);
  React15.useEffect(() => {
    callbackRef.current = callback;
  });
  return React15.useMemo(() => (...args) => {
    var _a;
    return (_a = callbackRef.current) == null ? void 0 : _a.call(callbackRef, ...args);
  }, []);
}

// node_modules/@radix-ui/react-roving-focus/node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
var React17 = __toESM(require_react(), 1);

// node_modules/@radix-ui/react-roving-focus/node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs
var React16 = __toESM(require_react(), 1);
var useLayoutEffect22 = (globalThis == null ? void 0 : globalThis.document) ? React16.useLayoutEffect : () => {
};

// node_modules/@radix-ui/react-roving-focus/node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs
var React23 = __toESM(require_react(), 1);
var useInsertionEffect2 = React17[" useInsertionEffect ".trim().toString()] || useLayoutEffect22;
function useControllableState2({
  prop,
  defaultProp,
  onChange = () => {
  },
  caller
}) {
  const [uncontrolledProp, setUncontrolledProp, onChangeRef] = useUncontrolledState2({
    defaultProp,
    onChange
  });
  const isControlled = prop !== void 0;
  const value = isControlled ? prop : uncontrolledProp;
  if (true) {
    const isControlledRef = React17.useRef(prop !== void 0);
    React17.useEffect(() => {
      const wasControlled = isControlledRef.current;
      if (wasControlled !== isControlled) {
        const from = wasControlled ? "controlled" : "uncontrolled";
        const to = isControlled ? "controlled" : "uncontrolled";
        console.warn(
          `${caller} is changing from ${from} to ${to}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
        );
      }
      isControlledRef.current = isControlled;
    }, [isControlled, caller]);
  }
  const setValue = React17.useCallback(
    (nextValue) => {
      var _a;
      if (isControlled) {
        const value2 = isFunction2(nextValue) ? nextValue(prop) : nextValue;
        if (value2 !== prop) {
          (_a = onChangeRef.current) == null ? void 0 : _a.call(onChangeRef, value2);
        }
      } else {
        setUncontrolledProp(nextValue);
      }
    },
    [isControlled, prop, setUncontrolledProp, onChangeRef]
  );
  return [value, setValue];
}
function useUncontrolledState2({
  defaultProp,
  onChange
}) {
  const [value, setValue] = React17.useState(defaultProp);
  const prevValueRef = React17.useRef(value);
  const onChangeRef = React17.useRef(onChange);
  useInsertionEffect2(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  React17.useEffect(() => {
    var _a;
    if (prevValueRef.current !== value) {
      (_a = onChangeRef.current) == null ? void 0 : _a.call(onChangeRef, value);
      prevValueRef.current = value;
    }
  }, [value, prevValueRef]);
  return [value, setValue, onChangeRef];
}
function isFunction2(value) {
  return typeof value === "function";
}
var SYNC_STATE2 = Symbol("RADIX:SYNC_STATE");

// node_modules/@radix-ui/react-roving-focus/dist/index.mjs
var import_jsx_runtime10 = __toESM(require_jsx_runtime(), 1);
var ENTRY_FOCUS = "rovingFocusGroup.onEntryFocus";
var EVENT_OPTIONS = { bubbles: false, cancelable: true };
var GROUP_NAME = "RovingFocusGroup";
var [Collection, useCollection, createCollectionScope] = createCollection(GROUP_NAME);
var [createRovingFocusGroupContext, createRovingFocusGroupScope] = createContextScope3(
  GROUP_NAME,
  [createCollectionScope]
);
var [RovingFocusProvider, useRovingFocusContext] = createRovingFocusGroupContext(GROUP_NAME);
var RovingFocusGroup = React18.forwardRef(
  (props, forwardedRef) => {
    return (0, import_jsx_runtime10.jsx)(Collection.Provider, { scope: props.__scopeRovingFocusGroup, children: (0, import_jsx_runtime10.jsx)(Collection.Slot, { scope: props.__scopeRovingFocusGroup, children: (0, import_jsx_runtime10.jsx)(RovingFocusGroupImpl, { ...props, ref: forwardedRef }) }) });
  }
);
RovingFocusGroup.displayName = GROUP_NAME;
var RovingFocusGroupImpl = React18.forwardRef((props, forwardedRef) => {
  const {
    __scopeRovingFocusGroup,
    orientation,
    loop = false,
    dir,
    currentTabStopId: currentTabStopIdProp,
    defaultCurrentTabStopId,
    onCurrentTabStopIdChange,
    onEntryFocus,
    preventScrollOnEntryFocus = false,
    ...groupProps
  } = props;
  const ref = React18.useRef(null);
  const composedRefs = useComposedRefs2(forwardedRef, ref);
  const direction = useDirection(dir);
  const [currentTabStopId, setCurrentTabStopId] = useControllableState2({
    prop: currentTabStopIdProp,
    defaultProp: defaultCurrentTabStopId ?? null,
    onChange: onCurrentTabStopIdChange,
    caller: GROUP_NAME
  });
  const [isTabbingBackOut, setIsTabbingBackOut] = React18.useState(false);
  const handleEntryFocus = useCallbackRef(onEntryFocus);
  const getItems = useCollection(__scopeRovingFocusGroup);
  const isClickFocusRef = React18.useRef(false);
  const [focusableItemsCount, setFocusableItemsCount] = React18.useState(0);
  React18.useEffect(() => {
    const node = ref.current;
    if (node) {
      node.addEventListener(ENTRY_FOCUS, handleEntryFocus);
      return () => node.removeEventListener(ENTRY_FOCUS, handleEntryFocus);
    }
  }, [handleEntryFocus]);
  return (0, import_jsx_runtime10.jsx)(
    RovingFocusProvider,
    {
      scope: __scopeRovingFocusGroup,
      orientation,
      dir: direction,
      loop,
      currentTabStopId,
      onItemFocus: React18.useCallback(
        (tabStopId) => setCurrentTabStopId(tabStopId),
        [setCurrentTabStopId]
      ),
      onItemShiftTab: React18.useCallback(() => setIsTabbingBackOut(true), []),
      onFocusableItemAdd: React18.useCallback(
        () => setFocusableItemsCount((prevCount) => prevCount + 1),
        []
      ),
      onFocusableItemRemove: React18.useCallback(
        () => setFocusableItemsCount((prevCount) => prevCount - 1),
        []
      ),
      children: (0, import_jsx_runtime10.jsx)(
        Primitive3.div,
        {
          tabIndex: isTabbingBackOut || focusableItemsCount === 0 ? -1 : 0,
          "data-orientation": orientation,
          ...groupProps,
          ref: composedRefs,
          style: { outline: "none", ...props.style },
          onMouseDown: composeEventHandlers3(props.onMouseDown, () => {
            isClickFocusRef.current = true;
          }),
          onFocus: composeEventHandlers3(props.onFocus, (event) => {
            const isKeyboardFocus = !isClickFocusRef.current;
            if (event.target === event.currentTarget && isKeyboardFocus && !isTabbingBackOut) {
              const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS);
              event.currentTarget.dispatchEvent(entryFocusEvent);
              if (!entryFocusEvent.defaultPrevented) {
                const items = getItems().filter((item) => item.focusable);
                const activeItem = items.find((item) => item.active);
                const currentItem = items.find((item) => item.id === currentTabStopId);
                const candidateItems = [activeItem, currentItem, ...items].filter(
                  Boolean
                );
                const candidateNodes = candidateItems.map((item) => item.ref.current);
                focusFirst(candidateNodes, preventScrollOnEntryFocus);
              }
            }
            isClickFocusRef.current = false;
          }),
          onBlur: composeEventHandlers3(props.onBlur, () => setIsTabbingBackOut(false))
        }
      )
    }
  );
});
var ITEM_NAME = "RovingFocusGroupItem";
var RovingFocusGroupItem = React18.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeRovingFocusGroup,
      focusable = true,
      active = false,
      tabStopId,
      children,
      ...itemProps
    } = props;
    const autoId = useId();
    const id = tabStopId || autoId;
    const context = useRovingFocusContext(ITEM_NAME, __scopeRovingFocusGroup);
    const isCurrentTabStop = context.currentTabStopId === id;
    const getItems = useCollection(__scopeRovingFocusGroup);
    const { onFocusableItemAdd, onFocusableItemRemove, currentTabStopId } = context;
    React18.useEffect(() => {
      if (focusable) {
        onFocusableItemAdd();
        return () => onFocusableItemRemove();
      }
    }, [focusable, onFocusableItemAdd, onFocusableItemRemove]);
    return (0, import_jsx_runtime10.jsx)(
      Collection.ItemSlot,
      {
        scope: __scopeRovingFocusGroup,
        id,
        focusable,
        active,
        children: (0, import_jsx_runtime10.jsx)(
          Primitive3.span,
          {
            tabIndex: isCurrentTabStop ? 0 : -1,
            "data-orientation": context.orientation,
            ...itemProps,
            ref: forwardedRef,
            onMouseDown: composeEventHandlers3(props.onMouseDown, (event) => {
              if (!focusable) event.preventDefault();
              else context.onItemFocus(id);
            }),
            onFocus: composeEventHandlers3(props.onFocus, () => context.onItemFocus(id)),
            onKeyDown: composeEventHandlers3(props.onKeyDown, (event) => {
              if (event.key === "Tab" && event.shiftKey) {
                context.onItemShiftTab();
                return;
              }
              if (event.target !== event.currentTarget) return;
              const focusIntent = getFocusIntent(event, context.orientation, context.dir);
              if (focusIntent !== void 0) {
                if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                event.preventDefault();
                const items = getItems().filter((item) => item.focusable);
                let candidateNodes = items.map((item) => item.ref.current);
                if (focusIntent === "last") candidateNodes.reverse();
                else if (focusIntent === "prev" || focusIntent === "next") {
                  if (focusIntent === "prev") candidateNodes.reverse();
                  const currentIndex = candidateNodes.indexOf(event.currentTarget);
                  candidateNodes = context.loop ? wrapArray(candidateNodes, currentIndex + 1) : candidateNodes.slice(currentIndex + 1);
                }
                setTimeout(() => focusFirst(candidateNodes));
              }
            }),
            children: typeof children === "function" ? children({ isCurrentTabStop, hasTabStop: currentTabStopId != null }) : children
          }
        )
      }
    );
  }
);
RovingFocusGroupItem.displayName = ITEM_NAME;
var MAP_KEY_TO_FOCUS_INTENT = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last"
};
function getDirectionAwareKey(key, dir) {
  if (dir !== "rtl") return key;
  return key === "ArrowLeft" ? "ArrowRight" : key === "ArrowRight" ? "ArrowLeft" : key;
}
function getFocusIntent(event, orientation, dir) {
  const key = getDirectionAwareKey(event.key, dir);
  if (orientation === "vertical" && ["ArrowLeft", "ArrowRight"].includes(key)) return void 0;
  if (orientation === "horizontal" && ["ArrowUp", "ArrowDown"].includes(key)) return void 0;
  return MAP_KEY_TO_FOCUS_INTENT[key];
}
function focusFirst(candidates, preventScroll = false) {
  const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
  for (const candidate of candidates) {
    if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
    candidate.focus({ preventScroll });
    if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
  }
}
function wrapArray(array, startIndex) {
  return array.map((_, index) => array[(startIndex + index) % array.length]);
}
var Root = RovingFocusGroup;
var Item = RovingFocusGroupItem;

// node_modules/@radix-ui/react-menu/node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs
var React19 = __toESM(require_react(), 1);
function useCallbackRef2(callback) {
  const callbackRef = React19.useRef(callback);
  React19.useEffect(() => {
    callbackRef.current = callback;
  });
  return React19.useMemo(() => (...args) => {
    var _a;
    return (_a = callbackRef.current) == null ? void 0 : _a.call(callbackRef, ...args);
  }, []);
}

// node_modules/@radix-ui/react-menu/dist/index.mjs
var import_jsx_runtime11 = __toESM(require_jsx_runtime(), 1);
var SELECTION_KEYS = ["Enter", " "];
var FIRST_KEYS = ["ArrowDown", "PageUp", "Home"];
var LAST_KEYS = ["ArrowUp", "PageDown", "End"];
var FIRST_LAST_KEYS = [...FIRST_KEYS, ...LAST_KEYS];
var SUB_OPEN_KEYS = {
  ltr: [...SELECTION_KEYS, "ArrowRight"],
  rtl: [...SELECTION_KEYS, "ArrowLeft"]
};
var SUB_CLOSE_KEYS = {
  ltr: ["ArrowLeft"],
  rtl: ["ArrowRight"]
};
var MENU_NAME = "Menu";
var [Collection2, useCollection2, createCollectionScope2] = createCollection(MENU_NAME);
var [createMenuContext, createMenuScope] = createContextScope2(MENU_NAME, [
  createCollectionScope2,
  createPopperScope,
  createRovingFocusGroupScope
]);
var usePopperScope = createPopperScope();
var useRovingFocusGroupScope = createRovingFocusGroupScope();
var [MenuProvider, useMenuContext] = createMenuContext(MENU_NAME);
var [MenuRootProvider, useMenuRootContext] = createMenuContext(MENU_NAME);
var Menu = (props) => {
  const { __scopeMenu, open = false, children, dir, onOpenChange, modal = true } = props;
  const popperScope = usePopperScope(__scopeMenu);
  const [content, setContent] = React20.useState(null);
  const isUsingKeyboardRef = React20.useRef(false);
  const handleOpenChange = useCallbackRef2(onOpenChange);
  const direction = useDirection(dir);
  React20.useEffect(() => {
    const handleKeyDown = () => {
      isUsingKeyboardRef.current = true;
      document.addEventListener("pointerdown", handlePointer, { capture: true, once: true });
      document.addEventListener("pointermove", handlePointer, { capture: true, once: true });
    };
    const handlePointer = () => isUsingKeyboardRef.current = false;
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("pointerdown", handlePointer, { capture: true });
      document.removeEventListener("pointermove", handlePointer, { capture: true });
    };
  }, []);
  return (0, import_jsx_runtime11.jsx)(Root2, { ...popperScope, children: (0, import_jsx_runtime11.jsx)(
    MenuProvider,
    {
      scope: __scopeMenu,
      open,
      onOpenChange: handleOpenChange,
      content,
      onContentChange: setContent,
      children: (0, import_jsx_runtime11.jsx)(
        MenuRootProvider,
        {
          scope: __scopeMenu,
          onClose: React20.useCallback(() => handleOpenChange(false), [handleOpenChange]),
          isUsingKeyboardRef,
          dir: direction,
          modal,
          children
        }
      )
    }
  ) });
};
Menu.displayName = MENU_NAME;
var ANCHOR_NAME = "MenuAnchor";
var MenuAnchor = React20.forwardRef(
  (props, forwardedRef) => {
    const { __scopeMenu, ...anchorProps } = props;
    const popperScope = usePopperScope(__scopeMenu);
    return (0, import_jsx_runtime11.jsx)(Anchor, { ...popperScope, ...anchorProps, ref: forwardedRef });
  }
);
MenuAnchor.displayName = ANCHOR_NAME;
var PORTAL_NAME = "MenuPortal";
var [PortalProvider, usePortalContext] = createMenuContext(PORTAL_NAME, {
  forceMount: void 0
});
var MenuPortal = (props) => {
  const { __scopeMenu, forceMount, children, container } = props;
  const context = useMenuContext(PORTAL_NAME, __scopeMenu);
  return (0, import_jsx_runtime11.jsx)(PortalProvider, { scope: __scopeMenu, forceMount, children: (0, import_jsx_runtime11.jsx)(Presence, { present: forceMount || context.open, children: (0, import_jsx_runtime11.jsx)(Portal, { asChild: true, container, children }) }) });
};
MenuPortal.displayName = PORTAL_NAME;
var CONTENT_NAME = "MenuContent";
var [MenuContentProvider, useMenuContentContext] = createMenuContext(CONTENT_NAME);
var MenuContent = React20.forwardRef(
  (props, forwardedRef) => {
    const portalContext = usePortalContext(CONTENT_NAME, props.__scopeMenu);
    const { forceMount = portalContext.forceMount, ...contentProps } = props;
    const context = useMenuContext(CONTENT_NAME, props.__scopeMenu);
    const rootContext = useMenuRootContext(CONTENT_NAME, props.__scopeMenu);
    return (0, import_jsx_runtime11.jsx)(Collection2.Provider, { scope: props.__scopeMenu, children: (0, import_jsx_runtime11.jsx)(Presence, { present: forceMount || context.open, children: (0, import_jsx_runtime11.jsx)(Collection2.Slot, { scope: props.__scopeMenu, children: rootContext.modal ? (0, import_jsx_runtime11.jsx)(MenuRootContentModal, { ...contentProps, ref: forwardedRef }) : (0, import_jsx_runtime11.jsx)(MenuRootContentNonModal, { ...contentProps, ref: forwardedRef }) }) }) });
  }
);
var MenuRootContentModal = React20.forwardRef(
  (props, forwardedRef) => {
    const context = useMenuContext(CONTENT_NAME, props.__scopeMenu);
    const ref = React20.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, ref);
    React20.useEffect(() => {
      const content = ref.current;
      if (content) return hideOthers(content);
    }, []);
    return (0, import_jsx_runtime11.jsx)(
      MenuContentImpl,
      {
        ...props,
        ref: composedRefs,
        trapFocus: context.open,
        disableOutsidePointerEvents: context.open,
        disableOutsideScroll: true,
        onFocusOutside: composeEventHandlers2(
          props.onFocusOutside,
          (event) => event.preventDefault(),
          { checkForDefaultPrevented: false }
        ),
        onDismiss: () => context.onOpenChange(false)
      }
    );
  }
);
var MenuRootContentNonModal = React20.forwardRef((props, forwardedRef) => {
  const context = useMenuContext(CONTENT_NAME, props.__scopeMenu);
  return (0, import_jsx_runtime11.jsx)(
    MenuContentImpl,
    {
      ...props,
      ref: forwardedRef,
      trapFocus: false,
      disableOutsidePointerEvents: false,
      disableOutsideScroll: false,
      onDismiss: () => context.onOpenChange(false)
    }
  );
});
var Slot4 = createSlot2("MenuContent.ScrollLock");
var MenuContentImpl = React20.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeMenu,
      loop = false,
      trapFocus,
      onOpenAutoFocus,
      onCloseAutoFocus,
      disableOutsidePointerEvents,
      onEntryFocus,
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      onInteractOutside,
      onDismiss,
      disableOutsideScroll,
      ...contentProps
    } = props;
    const context = useMenuContext(CONTENT_NAME, __scopeMenu);
    const rootContext = useMenuRootContext(CONTENT_NAME, __scopeMenu);
    const popperScope = usePopperScope(__scopeMenu);
    const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeMenu);
    const getItems = useCollection2(__scopeMenu);
    const [currentItemId, setCurrentItemId] = React20.useState(null);
    const contentRef = React20.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, contentRef, context.onContentChange);
    const timerRef = React20.useRef(0);
    const searchRef = React20.useRef("");
    const pointerGraceTimerRef = React20.useRef(0);
    const pointerGraceIntentRef = React20.useRef(null);
    const pointerDirRef = React20.useRef("right");
    const lastPointerXRef = React20.useRef(0);
    const ScrollLockWrapper = disableOutsideScroll ? Combination_default : React20.Fragment;
    const scrollLockWrapperProps = disableOutsideScroll ? { as: Slot4, allowPinchZoom: true } : void 0;
    const handleTypeaheadSearch = (key) => {
      var _a, _b;
      const search = searchRef.current + key;
      const items = getItems().filter((item) => !item.disabled);
      const currentItem = document.activeElement;
      const currentMatch = (_a = items.find((item) => item.ref.current === currentItem)) == null ? void 0 : _a.textValue;
      const values = items.map((item) => item.textValue);
      const nextMatch = getNextMatch(values, search, currentMatch);
      const newItem = (_b = items.find((item) => item.textValue === nextMatch)) == null ? void 0 : _b.ref.current;
      (function updateSearch(value) {
        searchRef.current = value;
        window.clearTimeout(timerRef.current);
        if (value !== "") timerRef.current = window.setTimeout(() => updateSearch(""), 1e3);
      })(search);
      if (newItem) {
        setTimeout(() => newItem.focus());
      }
    };
    React20.useEffect(() => {
      return () => window.clearTimeout(timerRef.current);
    }, []);
    useFocusGuards();
    const isPointerMovingToSubmenu = React20.useCallback((event) => {
      var _a, _b;
      const isMovingTowards = pointerDirRef.current === ((_a = pointerGraceIntentRef.current) == null ? void 0 : _a.side);
      return isMovingTowards && isPointerInGraceArea(event, (_b = pointerGraceIntentRef.current) == null ? void 0 : _b.area);
    }, []);
    return (0, import_jsx_runtime11.jsx)(
      MenuContentProvider,
      {
        scope: __scopeMenu,
        searchRef,
        onItemEnter: React20.useCallback(
          (event) => {
            if (isPointerMovingToSubmenu(event)) event.preventDefault();
          },
          [isPointerMovingToSubmenu]
        ),
        onItemLeave: React20.useCallback(
          (event) => {
            var _a;
            if (isPointerMovingToSubmenu(event)) return;
            (_a = contentRef.current) == null ? void 0 : _a.focus();
            setCurrentItemId(null);
          },
          [isPointerMovingToSubmenu]
        ),
        onTriggerLeave: React20.useCallback(
          (event) => {
            if (isPointerMovingToSubmenu(event)) event.preventDefault();
          },
          [isPointerMovingToSubmenu]
        ),
        pointerGraceTimerRef,
        onPointerGraceIntentChange: React20.useCallback((intent) => {
          pointerGraceIntentRef.current = intent;
        }, []),
        children: (0, import_jsx_runtime11.jsx)(ScrollLockWrapper, { ...scrollLockWrapperProps, children: (0, import_jsx_runtime11.jsx)(
          FocusScope,
          {
            asChild: true,
            trapped: trapFocus,
            onMountAutoFocus: composeEventHandlers2(onOpenAutoFocus, (event) => {
              var _a;
              event.preventDefault();
              (_a = contentRef.current) == null ? void 0 : _a.focus({ preventScroll: true });
            }),
            onUnmountAutoFocus: onCloseAutoFocus,
            children: (0, import_jsx_runtime11.jsx)(
              DismissableLayer,
              {
                asChild: true,
                disableOutsidePointerEvents,
                onEscapeKeyDown,
                onPointerDownOutside,
                onFocusOutside,
                onInteractOutside,
                onDismiss,
                children: (0, import_jsx_runtime11.jsx)(
                  Root,
                  {
                    asChild: true,
                    ...rovingFocusGroupScope,
                    dir: rootContext.dir,
                    orientation: "vertical",
                    loop,
                    currentTabStopId: currentItemId,
                    onCurrentTabStopIdChange: setCurrentItemId,
                    onEntryFocus: composeEventHandlers2(onEntryFocus, (event) => {
                      if (!rootContext.isUsingKeyboardRef.current) event.preventDefault();
                    }),
                    preventScrollOnEntryFocus: true,
                    children: (0, import_jsx_runtime11.jsx)(
                      Content,
                      {
                        role: "menu",
                        "aria-orientation": "vertical",
                        "data-state": getOpenState(context.open),
                        "data-radix-menu-content": "",
                        dir: rootContext.dir,
                        ...popperScope,
                        ...contentProps,
                        ref: composedRefs,
                        style: { outline: "none", ...contentProps.style },
                        onKeyDown: composeEventHandlers2(contentProps.onKeyDown, (event) => {
                          const target = event.target;
                          const isKeyDownInside = target.closest("[data-radix-menu-content]") === event.currentTarget;
                          const isModifierKey = event.ctrlKey || event.altKey || event.metaKey;
                          const isCharacterKey = event.key.length === 1;
                          if (isKeyDownInside) {
                            if (event.key === "Tab") event.preventDefault();
                            if (!isModifierKey && isCharacterKey) handleTypeaheadSearch(event.key);
                          }
                          const content = contentRef.current;
                          if (event.target !== content) return;
                          if (!FIRST_LAST_KEYS.includes(event.key)) return;
                          event.preventDefault();
                          const items = getItems().filter((item) => !item.disabled);
                          const candidateNodes = items.map((item) => item.ref.current);
                          if (LAST_KEYS.includes(event.key)) candidateNodes.reverse();
                          focusFirst2(candidateNodes);
                        }),
                        onBlur: composeEventHandlers2(props.onBlur, (event) => {
                          if (!event.currentTarget.contains(event.target)) {
                            window.clearTimeout(timerRef.current);
                            searchRef.current = "";
                          }
                        }),
                        onPointerMove: composeEventHandlers2(
                          props.onPointerMove,
                          whenMouse((event) => {
                            const target = event.target;
                            const pointerXHasChanged = lastPointerXRef.current !== event.clientX;
                            if (event.currentTarget.contains(target) && pointerXHasChanged) {
                              const newDir = event.clientX > lastPointerXRef.current ? "right" : "left";
                              pointerDirRef.current = newDir;
                              lastPointerXRef.current = event.clientX;
                            }
                          })
                        )
                      }
                    )
                  }
                )
              }
            )
          }
        ) })
      }
    );
  }
);
MenuContent.displayName = CONTENT_NAME;
var GROUP_NAME2 = "MenuGroup";
var MenuGroup = React20.forwardRef(
  (props, forwardedRef) => {
    const { __scopeMenu, ...groupProps } = props;
    return (0, import_jsx_runtime11.jsx)(Primitive2.div, { role: "group", ...groupProps, ref: forwardedRef });
  }
);
MenuGroup.displayName = GROUP_NAME2;
var LABEL_NAME = "MenuLabel";
var MenuLabel = React20.forwardRef(
  (props, forwardedRef) => {
    const { __scopeMenu, ...labelProps } = props;
    return (0, import_jsx_runtime11.jsx)(Primitive2.div, { ...labelProps, ref: forwardedRef });
  }
);
MenuLabel.displayName = LABEL_NAME;
var ITEM_NAME2 = "MenuItem";
var ITEM_SELECT = "menu.itemSelect";
var MenuItem = React20.forwardRef(
  (props, forwardedRef) => {
    const { disabled = false, onSelect, ...itemProps } = props;
    const ref = React20.useRef(null);
    const rootContext = useMenuRootContext(ITEM_NAME2, props.__scopeMenu);
    const contentContext = useMenuContentContext(ITEM_NAME2, props.__scopeMenu);
    const composedRefs = useComposedRefs(forwardedRef, ref);
    const isPointerDownRef = React20.useRef(false);
    const handleSelect = () => {
      const menuItem = ref.current;
      if (!disabled && menuItem) {
        const itemSelectEvent = new CustomEvent(ITEM_SELECT, { bubbles: true, cancelable: true });
        menuItem.addEventListener(ITEM_SELECT, (event) => onSelect == null ? void 0 : onSelect(event), { once: true });
        dispatchDiscreteCustomEvent(menuItem, itemSelectEvent);
        if (itemSelectEvent.defaultPrevented) {
          isPointerDownRef.current = false;
        } else {
          rootContext.onClose();
        }
      }
    };
    return (0, import_jsx_runtime11.jsx)(
      MenuItemImpl,
      {
        ...itemProps,
        ref: composedRefs,
        disabled,
        onClick: composeEventHandlers2(props.onClick, handleSelect),
        onPointerDown: (event) => {
          var _a;
          (_a = props.onPointerDown) == null ? void 0 : _a.call(props, event);
          isPointerDownRef.current = true;
        },
        onPointerUp: composeEventHandlers2(props.onPointerUp, (event) => {
          var _a;
          if (!isPointerDownRef.current) (_a = event.currentTarget) == null ? void 0 : _a.click();
        }),
        onKeyDown: composeEventHandlers2(props.onKeyDown, (event) => {
          const isTypingAhead = contentContext.searchRef.current !== "";
          if (disabled || isTypingAhead && event.key === " ") return;
          if (SELECTION_KEYS.includes(event.key)) {
            event.currentTarget.click();
            event.preventDefault();
          }
        })
      }
    );
  }
);
MenuItem.displayName = ITEM_NAME2;
var MenuItemImpl = React20.forwardRef(
  (props, forwardedRef) => {
    const { __scopeMenu, disabled = false, textValue, ...itemProps } = props;
    const contentContext = useMenuContentContext(ITEM_NAME2, __scopeMenu);
    const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeMenu);
    const ref = React20.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, ref);
    const [isFocused, setIsFocused] = React20.useState(false);
    const [textContent, setTextContent] = React20.useState("");
    React20.useEffect(() => {
      const menuItem = ref.current;
      if (menuItem) {
        setTextContent((menuItem.textContent ?? "").trim());
      }
    }, [itemProps.children]);
    return (0, import_jsx_runtime11.jsx)(
      Collection2.ItemSlot,
      {
        scope: __scopeMenu,
        disabled,
        textValue: textValue ?? textContent,
        children: (0, import_jsx_runtime11.jsx)(Item, { asChild: true, ...rovingFocusGroupScope, focusable: !disabled, children: (0, import_jsx_runtime11.jsx)(
          Primitive2.div,
          {
            role: "menuitem",
            "data-highlighted": isFocused ? "" : void 0,
            "aria-disabled": disabled || void 0,
            "data-disabled": disabled ? "" : void 0,
            ...itemProps,
            ref: composedRefs,
            onPointerMove: composeEventHandlers2(
              props.onPointerMove,
              whenMouse((event) => {
                if (disabled) {
                  contentContext.onItemLeave(event);
                } else {
                  contentContext.onItemEnter(event);
                  if (!event.defaultPrevented) {
                    const item = event.currentTarget;
                    item.focus({ preventScroll: true });
                  }
                }
              })
            ),
            onPointerLeave: composeEventHandlers2(
              props.onPointerLeave,
              whenMouse((event) => contentContext.onItemLeave(event))
            ),
            onFocus: composeEventHandlers2(props.onFocus, () => setIsFocused(true)),
            onBlur: composeEventHandlers2(props.onBlur, () => setIsFocused(false))
          }
        ) })
      }
    );
  }
);
var CHECKBOX_ITEM_NAME = "MenuCheckboxItem";
var MenuCheckboxItem = React20.forwardRef(
  (props, forwardedRef) => {
    const { checked = false, onCheckedChange, ...checkboxItemProps } = props;
    return (0, import_jsx_runtime11.jsx)(ItemIndicatorProvider, { scope: props.__scopeMenu, checked, children: (0, import_jsx_runtime11.jsx)(
      MenuItem,
      {
        role: "menuitemcheckbox",
        "aria-checked": isIndeterminate(checked) ? "mixed" : checked,
        ...checkboxItemProps,
        ref: forwardedRef,
        "data-state": getCheckedState(checked),
        onSelect: composeEventHandlers2(
          checkboxItemProps.onSelect,
          () => onCheckedChange == null ? void 0 : onCheckedChange(isIndeterminate(checked) ? true : !checked),
          { checkForDefaultPrevented: false }
        )
      }
    ) });
  }
);
MenuCheckboxItem.displayName = CHECKBOX_ITEM_NAME;
var RADIO_GROUP_NAME = "MenuRadioGroup";
var [RadioGroupProvider, useRadioGroupContext] = createMenuContext(
  RADIO_GROUP_NAME,
  { value: void 0, onValueChange: () => {
  } }
);
var MenuRadioGroup = React20.forwardRef(
  (props, forwardedRef) => {
    const { value, onValueChange, ...groupProps } = props;
    const handleValueChange = useCallbackRef2(onValueChange);
    return (0, import_jsx_runtime11.jsx)(RadioGroupProvider, { scope: props.__scopeMenu, value, onValueChange: handleValueChange, children: (0, import_jsx_runtime11.jsx)(MenuGroup, { ...groupProps, ref: forwardedRef }) });
  }
);
MenuRadioGroup.displayName = RADIO_GROUP_NAME;
var RADIO_ITEM_NAME = "MenuRadioItem";
var MenuRadioItem = React20.forwardRef(
  (props, forwardedRef) => {
    const { value, ...radioItemProps } = props;
    const context = useRadioGroupContext(RADIO_ITEM_NAME, props.__scopeMenu);
    const checked = value === context.value;
    return (0, import_jsx_runtime11.jsx)(ItemIndicatorProvider, { scope: props.__scopeMenu, checked, children: (0, import_jsx_runtime11.jsx)(
      MenuItem,
      {
        role: "menuitemradio",
        "aria-checked": checked,
        ...radioItemProps,
        ref: forwardedRef,
        "data-state": getCheckedState(checked),
        onSelect: composeEventHandlers2(
          radioItemProps.onSelect,
          () => {
            var _a;
            return (_a = context.onValueChange) == null ? void 0 : _a.call(context, value);
          },
          { checkForDefaultPrevented: false }
        )
      }
    ) });
  }
);
MenuRadioItem.displayName = RADIO_ITEM_NAME;
var ITEM_INDICATOR_NAME = "MenuItemIndicator";
var [ItemIndicatorProvider, useItemIndicatorContext] = createMenuContext(
  ITEM_INDICATOR_NAME,
  { checked: false }
);
var MenuItemIndicator = React20.forwardRef(
  (props, forwardedRef) => {
    const { __scopeMenu, forceMount, ...itemIndicatorProps } = props;
    const indicatorContext = useItemIndicatorContext(ITEM_INDICATOR_NAME, __scopeMenu);
    return (0, import_jsx_runtime11.jsx)(
      Presence,
      {
        present: forceMount || isIndeterminate(indicatorContext.checked) || indicatorContext.checked === true,
        children: (0, import_jsx_runtime11.jsx)(
          Primitive2.span,
          {
            ...itemIndicatorProps,
            ref: forwardedRef,
            "data-state": getCheckedState(indicatorContext.checked)
          }
        )
      }
    );
  }
);
MenuItemIndicator.displayName = ITEM_INDICATOR_NAME;
var SEPARATOR_NAME = "MenuSeparator";
var MenuSeparator = React20.forwardRef(
  (props, forwardedRef) => {
    const { __scopeMenu, ...separatorProps } = props;
    return (0, import_jsx_runtime11.jsx)(
      Primitive2.div,
      {
        role: "separator",
        "aria-orientation": "horizontal",
        ...separatorProps,
        ref: forwardedRef
      }
    );
  }
);
MenuSeparator.displayName = SEPARATOR_NAME;
var ARROW_NAME = "MenuArrow";
var MenuArrow = React20.forwardRef(
  (props, forwardedRef) => {
    const { __scopeMenu, ...arrowProps } = props;
    const popperScope = usePopperScope(__scopeMenu);
    return (0, import_jsx_runtime11.jsx)(Arrow, { ...popperScope, ...arrowProps, ref: forwardedRef });
  }
);
MenuArrow.displayName = ARROW_NAME;
var SUB_NAME = "MenuSub";
var [MenuSubProvider, useMenuSubContext] = createMenuContext(SUB_NAME);
var MenuSub = (props) => {
  const { __scopeMenu, children, open = false, onOpenChange } = props;
  const parentMenuContext = useMenuContext(SUB_NAME, __scopeMenu);
  const popperScope = usePopperScope(__scopeMenu);
  const [trigger, setTrigger] = React20.useState(null);
  const [content, setContent] = React20.useState(null);
  const handleOpenChange = useCallbackRef2(onOpenChange);
  React20.useEffect(() => {
    if (parentMenuContext.open === false) handleOpenChange(false);
    return () => handleOpenChange(false);
  }, [parentMenuContext.open, handleOpenChange]);
  return (0, import_jsx_runtime11.jsx)(Root2, { ...popperScope, children: (0, import_jsx_runtime11.jsx)(
    MenuProvider,
    {
      scope: __scopeMenu,
      open,
      onOpenChange: handleOpenChange,
      content,
      onContentChange: setContent,
      children: (0, import_jsx_runtime11.jsx)(
        MenuSubProvider,
        {
          scope: __scopeMenu,
          contentId: useId(),
          triggerId: useId(),
          trigger,
          onTriggerChange: setTrigger,
          children
        }
      )
    }
  ) });
};
MenuSub.displayName = SUB_NAME;
var SUB_TRIGGER_NAME = "MenuSubTrigger";
var MenuSubTrigger = React20.forwardRef(
  (props, forwardedRef) => {
    const context = useMenuContext(SUB_TRIGGER_NAME, props.__scopeMenu);
    const rootContext = useMenuRootContext(SUB_TRIGGER_NAME, props.__scopeMenu);
    const subContext = useMenuSubContext(SUB_TRIGGER_NAME, props.__scopeMenu);
    const contentContext = useMenuContentContext(SUB_TRIGGER_NAME, props.__scopeMenu);
    const openTimerRef = React20.useRef(null);
    const { pointerGraceTimerRef, onPointerGraceIntentChange } = contentContext;
    const scope = { __scopeMenu: props.__scopeMenu };
    const clearOpenTimer = React20.useCallback(() => {
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }, []);
    React20.useEffect(() => clearOpenTimer, [clearOpenTimer]);
    React20.useEffect(() => {
      const pointerGraceTimer = pointerGraceTimerRef.current;
      return () => {
        window.clearTimeout(pointerGraceTimer);
        onPointerGraceIntentChange(null);
      };
    }, [pointerGraceTimerRef, onPointerGraceIntentChange]);
    return (0, import_jsx_runtime11.jsx)(MenuAnchor, { asChild: true, ...scope, children: (0, import_jsx_runtime11.jsx)(
      MenuItemImpl,
      {
        id: subContext.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": context.open,
        "aria-controls": subContext.contentId,
        "data-state": getOpenState(context.open),
        ...props,
        ref: composeRefs2(forwardedRef, subContext.onTriggerChange),
        onClick: (event) => {
          var _a;
          (_a = props.onClick) == null ? void 0 : _a.call(props, event);
          if (props.disabled || event.defaultPrevented) return;
          event.currentTarget.focus();
          if (!context.open) context.onOpenChange(true);
        },
        onPointerMove: composeEventHandlers2(
          props.onPointerMove,
          whenMouse((event) => {
            contentContext.onItemEnter(event);
            if (event.defaultPrevented) return;
            if (!props.disabled && !context.open && !openTimerRef.current) {
              contentContext.onPointerGraceIntentChange(null);
              openTimerRef.current = window.setTimeout(() => {
                context.onOpenChange(true);
                clearOpenTimer();
              }, 100);
            }
          })
        ),
        onPointerLeave: composeEventHandlers2(
          props.onPointerLeave,
          whenMouse((event) => {
            var _a, _b;
            clearOpenTimer();
            const contentRect = (_a = context.content) == null ? void 0 : _a.getBoundingClientRect();
            if (contentRect) {
              const side = (_b = context.content) == null ? void 0 : _b.dataset.side;
              const rightSide = side === "right";
              const bleed = rightSide ? -5 : 5;
              const contentNearEdge = contentRect[rightSide ? "left" : "right"];
              const contentFarEdge = contentRect[rightSide ? "right" : "left"];
              contentContext.onPointerGraceIntentChange({
                area: [
                  // Apply a bleed on clientX to ensure that our exit point is
                  // consistently within polygon bounds
                  { x: event.clientX + bleed, y: event.clientY },
                  { x: contentNearEdge, y: contentRect.top },
                  { x: contentFarEdge, y: contentRect.top },
                  { x: contentFarEdge, y: contentRect.bottom },
                  { x: contentNearEdge, y: contentRect.bottom }
                ],
                side
              });
              window.clearTimeout(pointerGraceTimerRef.current);
              pointerGraceTimerRef.current = window.setTimeout(
                () => contentContext.onPointerGraceIntentChange(null),
                300
              );
            } else {
              contentContext.onTriggerLeave(event);
              if (event.defaultPrevented) return;
              contentContext.onPointerGraceIntentChange(null);
            }
          })
        ),
        onKeyDown: composeEventHandlers2(props.onKeyDown, (event) => {
          var _a;
          const isTypingAhead = contentContext.searchRef.current !== "";
          if (props.disabled || isTypingAhead && event.key === " ") return;
          if (SUB_OPEN_KEYS[rootContext.dir].includes(event.key)) {
            context.onOpenChange(true);
            (_a = context.content) == null ? void 0 : _a.focus();
            event.preventDefault();
          }
        })
      }
    ) });
  }
);
MenuSubTrigger.displayName = SUB_TRIGGER_NAME;
var SUB_CONTENT_NAME = "MenuSubContent";
var MenuSubContent = React20.forwardRef(
  (props, forwardedRef) => {
    const portalContext = usePortalContext(CONTENT_NAME, props.__scopeMenu);
    const { forceMount = portalContext.forceMount, ...subContentProps } = props;
    const context = useMenuContext(CONTENT_NAME, props.__scopeMenu);
    const rootContext = useMenuRootContext(CONTENT_NAME, props.__scopeMenu);
    const subContext = useMenuSubContext(SUB_CONTENT_NAME, props.__scopeMenu);
    const ref = React20.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, ref);
    return (0, import_jsx_runtime11.jsx)(Collection2.Provider, { scope: props.__scopeMenu, children: (0, import_jsx_runtime11.jsx)(Presence, { present: forceMount || context.open, children: (0, import_jsx_runtime11.jsx)(Collection2.Slot, { scope: props.__scopeMenu, children: (0, import_jsx_runtime11.jsx)(
      MenuContentImpl,
      {
        id: subContext.contentId,
        "aria-labelledby": subContext.triggerId,
        ...subContentProps,
        ref: composedRefs,
        align: "start",
        side: rootContext.dir === "rtl" ? "left" : "right",
        disableOutsidePointerEvents: false,
        disableOutsideScroll: false,
        trapFocus: false,
        onOpenAutoFocus: (event) => {
          var _a;
          if (rootContext.isUsingKeyboardRef.current) (_a = ref.current) == null ? void 0 : _a.focus();
          event.preventDefault();
        },
        onCloseAutoFocus: (event) => event.preventDefault(),
        onFocusOutside: composeEventHandlers2(props.onFocusOutside, (event) => {
          if (event.target !== subContext.trigger) context.onOpenChange(false);
        }),
        onEscapeKeyDown: composeEventHandlers2(props.onEscapeKeyDown, (event) => {
          rootContext.onClose();
          event.preventDefault();
        }),
        onKeyDown: composeEventHandlers2(props.onKeyDown, (event) => {
          var _a;
          const isKeyDownInside = event.currentTarget.contains(event.target);
          const isCloseKey = SUB_CLOSE_KEYS[rootContext.dir].includes(event.key);
          if (isKeyDownInside && isCloseKey) {
            context.onOpenChange(false);
            (_a = subContext.trigger) == null ? void 0 : _a.focus();
            event.preventDefault();
          }
        })
      }
    ) }) }) });
  }
);
MenuSubContent.displayName = SUB_CONTENT_NAME;
function getOpenState(open) {
  return open ? "open" : "closed";
}
function isIndeterminate(checked) {
  return checked === "indeterminate";
}
function getCheckedState(checked) {
  return isIndeterminate(checked) ? "indeterminate" : checked ? "checked" : "unchecked";
}
function focusFirst2(candidates) {
  const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
  for (const candidate of candidates) {
    if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
    candidate.focus();
    if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
  }
}
function wrapArray2(array, startIndex) {
  return array.map((_, index) => array[(startIndex + index) % array.length]);
}
function getNextMatch(values, search, currentMatch) {
  const isRepeated = search.length > 1 && Array.from(search).every((char) => char === search[0]);
  const normalizedSearch = isRepeated ? search[0] : search;
  const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
  let wrappedValues = wrapArray2(values, Math.max(currentMatchIndex, 0));
  const excludeCurrentMatch = normalizedSearch.length === 1;
  if (excludeCurrentMatch) wrappedValues = wrappedValues.filter((v) => v !== currentMatch);
  const nextMatch = wrappedValues.find(
    (value) => value.toLowerCase().startsWith(normalizedSearch.toLowerCase())
  );
  return nextMatch !== currentMatch ? nextMatch : void 0;
}
function isPointInPolygon(point, polygon) {
  const { x, y } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const ii = polygon[i];
    const jj = polygon[j];
    const xi = ii.x;
    const yi = ii.y;
    const xj = jj.x;
    const yj = jj.y;
    const intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function isPointerInGraceArea(event, area) {
  if (!area) return false;
  const cursorPos = { x: event.clientX, y: event.clientY };
  return isPointInPolygon(cursorPos, area);
}
function whenMouse(handler) {
  return (event) => event.pointerType === "mouse" ? handler(event) : void 0;
}
var Root3 = Menu;
var Anchor2 = MenuAnchor;
var Portal2 = MenuPortal;
var Content2 = MenuContent;
var Group = MenuGroup;
var Label = MenuLabel;
var Item2 = MenuItem;
var CheckboxItem = MenuCheckboxItem;
var RadioGroup = MenuRadioGroup;
var RadioItem = MenuRadioItem;
var ItemIndicator = MenuItemIndicator;
var Separator = MenuSeparator;
var Arrow2 = MenuArrow;
var Sub = MenuSub;
var SubTrigger = MenuSubTrigger;
var SubContent = MenuSubContent;

// node_modules/@radix-ui/react-dropdown-menu/dist/index.mjs
var import_jsx_runtime12 = __toESM(require_jsx_runtime(), 1);
var DROPDOWN_MENU_NAME = "DropdownMenu";
var [createDropdownMenuContext, createDropdownMenuScope] = createContextScope(
  DROPDOWN_MENU_NAME,
  [createMenuScope]
);
var useMenuScope = createMenuScope();
var [DropdownMenuProvider, useDropdownMenuContext] = createDropdownMenuContext(DROPDOWN_MENU_NAME);
var DropdownMenu = (props) => {
  const {
    __scopeDropdownMenu,
    children,
    dir,
    open: openProp,
    defaultOpen,
    onOpenChange,
    modal = true
  } = props;
  const menuScope = useMenuScope(__scopeDropdownMenu);
  const triggerRef = React21.useRef(null);
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
    caller: DROPDOWN_MENU_NAME
  });
  return (0, import_jsx_runtime12.jsx)(
    DropdownMenuProvider,
    {
      scope: __scopeDropdownMenu,
      triggerId: useId(),
      triggerRef,
      contentId: useId(),
      open,
      onOpenChange: setOpen,
      onOpenToggle: React21.useCallback(() => setOpen((prevOpen) => !prevOpen), [setOpen]),
      modal,
      children: (0, import_jsx_runtime12.jsx)(Root3, { ...menuScope, open, onOpenChange: setOpen, dir, modal, children })
    }
  );
};
DropdownMenu.displayName = DROPDOWN_MENU_NAME;
var TRIGGER_NAME = "DropdownMenuTrigger";
var DropdownMenuTrigger = React21.forwardRef(
  (props, forwardedRef) => {
    const { __scopeDropdownMenu, disabled = false, ...triggerProps } = props;
    const context = useDropdownMenuContext(TRIGGER_NAME, __scopeDropdownMenu);
    const menuScope = useMenuScope(__scopeDropdownMenu);
    return (0, import_jsx_runtime12.jsx)(Anchor2, { asChild: true, ...menuScope, children: (0, import_jsx_runtime12.jsx)(
      Primitive.button,
      {
        type: "button",
        id: context.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": context.open,
        "aria-controls": context.open ? context.contentId : void 0,
        "data-state": context.open ? "open" : "closed",
        "data-disabled": disabled ? "" : void 0,
        disabled,
        ...triggerProps,
        ref: composeRefs(forwardedRef, context.triggerRef),
        onPointerDown: composeEventHandlers(props.onPointerDown, (event) => {
          if (!disabled && event.button === 0 && event.ctrlKey === false) {
            context.onOpenToggle();
            if (!context.open) event.preventDefault();
          }
        }),
        onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
          if (disabled) return;
          if (["Enter", " "].includes(event.key)) context.onOpenToggle();
          if (event.key === "ArrowDown") context.onOpenChange(true);
          if (["Enter", " ", "ArrowDown"].includes(event.key)) event.preventDefault();
        })
      }
    ) });
  }
);
DropdownMenuTrigger.displayName = TRIGGER_NAME;
var PORTAL_NAME2 = "DropdownMenuPortal";
var DropdownMenuPortal = (props) => {
  const { __scopeDropdownMenu, ...portalProps } = props;
  const menuScope = useMenuScope(__scopeDropdownMenu);
  return (0, import_jsx_runtime12.jsx)(Portal2, { ...menuScope, ...portalProps });
};
DropdownMenuPortal.displayName = PORTAL_NAME2;
var CONTENT_NAME2 = "DropdownMenuContent";
var DropdownMenuContent = React21.forwardRef(
  (props, forwardedRef) => {
    const { __scopeDropdownMenu, ...contentProps } = props;
    const context = useDropdownMenuContext(CONTENT_NAME2, __scopeDropdownMenu);
    const menuScope = useMenuScope(__scopeDropdownMenu);
    const hasInteractedOutsideRef = React21.useRef(false);
    return (0, import_jsx_runtime12.jsx)(
      Content2,
      {
        id: context.contentId,
        "aria-labelledby": context.triggerId,
        ...menuScope,
        ...contentProps,
        ref: forwardedRef,
        onCloseAutoFocus: composeEventHandlers(props.onCloseAutoFocus, (event) => {
          var _a;
          if (!hasInteractedOutsideRef.current) (_a = context.triggerRef.current) == null ? void 0 : _a.focus();
          hasInteractedOutsideRef.current = false;
          event.preventDefault();
        }),
        onInteractOutside: composeEventHandlers(props.onInteractOutside, (event) => {
          const originalEvent = event.detail.originalEvent;
          const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
          const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
          if (!context.modal || isRightClick) hasInteractedOutsideRef.current = true;
        }),
        style: {
          ...props.style,
          // re-namespace exposed content custom properties
          ...{
            "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
            "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
            "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
            "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
            "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
          }
        }
      }
    );
  }
);
DropdownMenuContent.displayName = CONTENT_NAME2;
var GROUP_NAME3 = "DropdownMenuGroup";
var DropdownMenuGroup = React21.forwardRef(
  (props, forwardedRef) => {
    const { __scopeDropdownMenu, ...groupProps } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    return (0, import_jsx_runtime12.jsx)(Group, { ...menuScope, ...groupProps, ref: forwardedRef });
  }
);
DropdownMenuGroup.displayName = GROUP_NAME3;
var LABEL_NAME2 = "DropdownMenuLabel";
var DropdownMenuLabel = React21.forwardRef(
  (props, forwardedRef) => {
    const { __scopeDropdownMenu, ...labelProps } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    return (0, import_jsx_runtime12.jsx)(Label, { ...menuScope, ...labelProps, ref: forwardedRef });
  }
);
DropdownMenuLabel.displayName = LABEL_NAME2;
var ITEM_NAME3 = "DropdownMenuItem";
var DropdownMenuItem = React21.forwardRef(
  (props, forwardedRef) => {
    const { __scopeDropdownMenu, ...itemProps } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    return (0, import_jsx_runtime12.jsx)(Item2, { ...menuScope, ...itemProps, ref: forwardedRef });
  }
);
DropdownMenuItem.displayName = ITEM_NAME3;
var CHECKBOX_ITEM_NAME2 = "DropdownMenuCheckboxItem";
var DropdownMenuCheckboxItem = React21.forwardRef((props, forwardedRef) => {
  const { __scopeDropdownMenu, ...checkboxItemProps } = props;
  const menuScope = useMenuScope(__scopeDropdownMenu);
  return (0, import_jsx_runtime12.jsx)(CheckboxItem, { ...menuScope, ...checkboxItemProps, ref: forwardedRef });
});
DropdownMenuCheckboxItem.displayName = CHECKBOX_ITEM_NAME2;
var RADIO_GROUP_NAME2 = "DropdownMenuRadioGroup";
var DropdownMenuRadioGroup = React21.forwardRef((props, forwardedRef) => {
  const { __scopeDropdownMenu, ...radioGroupProps } = props;
  const menuScope = useMenuScope(__scopeDropdownMenu);
  return (0, import_jsx_runtime12.jsx)(RadioGroup, { ...menuScope, ...radioGroupProps, ref: forwardedRef });
});
DropdownMenuRadioGroup.displayName = RADIO_GROUP_NAME2;
var RADIO_ITEM_NAME2 = "DropdownMenuRadioItem";
var DropdownMenuRadioItem = React21.forwardRef((props, forwardedRef) => {
  const { __scopeDropdownMenu, ...radioItemProps } = props;
  const menuScope = useMenuScope(__scopeDropdownMenu);
  return (0, import_jsx_runtime12.jsx)(RadioItem, { ...menuScope, ...radioItemProps, ref: forwardedRef });
});
DropdownMenuRadioItem.displayName = RADIO_ITEM_NAME2;
var INDICATOR_NAME = "DropdownMenuItemIndicator";
var DropdownMenuItemIndicator = React21.forwardRef((props, forwardedRef) => {
  const { __scopeDropdownMenu, ...itemIndicatorProps } = props;
  const menuScope = useMenuScope(__scopeDropdownMenu);
  return (0, import_jsx_runtime12.jsx)(ItemIndicator, { ...menuScope, ...itemIndicatorProps, ref: forwardedRef });
});
DropdownMenuItemIndicator.displayName = INDICATOR_NAME;
var SEPARATOR_NAME2 = "DropdownMenuSeparator";
var DropdownMenuSeparator = React21.forwardRef((props, forwardedRef) => {
  const { __scopeDropdownMenu, ...separatorProps } = props;
  const menuScope = useMenuScope(__scopeDropdownMenu);
  return (0, import_jsx_runtime12.jsx)(Separator, { ...menuScope, ...separatorProps, ref: forwardedRef });
});
DropdownMenuSeparator.displayName = SEPARATOR_NAME2;
var ARROW_NAME2 = "DropdownMenuArrow";
var DropdownMenuArrow = React21.forwardRef(
  (props, forwardedRef) => {
    const { __scopeDropdownMenu, ...arrowProps } = props;
    const menuScope = useMenuScope(__scopeDropdownMenu);
    return (0, import_jsx_runtime12.jsx)(Arrow2, { ...menuScope, ...arrowProps, ref: forwardedRef });
  }
);
DropdownMenuArrow.displayName = ARROW_NAME2;
var DropdownMenuSub = (props) => {
  const { __scopeDropdownMenu, children, open: openProp, onOpenChange, defaultOpen } = props;
  const menuScope = useMenuScope(__scopeDropdownMenu);
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
    caller: "DropdownMenuSub"
  });
  return (0, import_jsx_runtime12.jsx)(Sub, { ...menuScope, open, onOpenChange: setOpen, children });
};
var SUB_TRIGGER_NAME2 = "DropdownMenuSubTrigger";
var DropdownMenuSubTrigger = React21.forwardRef((props, forwardedRef) => {
  const { __scopeDropdownMenu, ...subTriggerProps } = props;
  const menuScope = useMenuScope(__scopeDropdownMenu);
  return (0, import_jsx_runtime12.jsx)(SubTrigger, { ...menuScope, ...subTriggerProps, ref: forwardedRef });
});
DropdownMenuSubTrigger.displayName = SUB_TRIGGER_NAME2;
var SUB_CONTENT_NAME2 = "DropdownMenuSubContent";
var DropdownMenuSubContent = React21.forwardRef((props, forwardedRef) => {
  const { __scopeDropdownMenu, ...subContentProps } = props;
  const menuScope = useMenuScope(__scopeDropdownMenu);
  return (0, import_jsx_runtime12.jsx)(
    SubContent,
    {
      ...menuScope,
      ...subContentProps,
      ref: forwardedRef,
      style: {
        ...props.style,
        // re-namespace exposed content custom properties
        ...{
          "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
          "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
          "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
          "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
          "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
        }
      }
    }
  );
});
DropdownMenuSubContent.displayName = SUB_CONTENT_NAME2;
var Root22 = DropdownMenu;
var Trigger = DropdownMenuTrigger;
var Portal22 = DropdownMenuPortal;
var Content22 = DropdownMenuContent;
var Group2 = DropdownMenuGroup;
var Label2 = DropdownMenuLabel;
var Item22 = DropdownMenuItem;
var CheckboxItem2 = DropdownMenuCheckboxItem;
var RadioGroup2 = DropdownMenuRadioGroup;
var RadioItem2 = DropdownMenuRadioItem;
var ItemIndicator2 = DropdownMenuItemIndicator;
var Separator2 = DropdownMenuSeparator;
var Arrow22 = DropdownMenuArrow;
var Sub2 = DropdownMenuSub;
var SubTrigger2 = DropdownMenuSubTrigger;
var SubContent2 = DropdownMenuSubContent;
export {
  Arrow22 as Arrow,
  CheckboxItem2 as CheckboxItem,
  Content22 as Content,
  DropdownMenu,
  DropdownMenuArrow,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Group2 as Group,
  Item22 as Item,
  ItemIndicator2 as ItemIndicator,
  Label2 as Label,
  Portal22 as Portal,
  RadioGroup2 as RadioGroup,
  RadioItem2 as RadioItem,
  Root22 as Root,
  Separator2 as Separator,
  Sub2 as Sub,
  SubContent2 as SubContent,
  SubTrigger2 as SubTrigger,
  Trigger,
  createDropdownMenuScope
};
//# sourceMappingURL=@radix-ui_react-dropdown-menu.js.map
