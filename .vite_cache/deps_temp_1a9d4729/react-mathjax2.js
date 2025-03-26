import {
  require_prop_types
} from "./chunk-JL2MEAST.js";
import {
  require_react
} from "./chunk-W4EHDCLL.js";
import {
  __commonJS
} from "./chunk-EWTE5DHJ.js";

// node_modules/react-mathjax2/lib/Node.js
var require_Node = __commonJS({
  "node_modules/react-mathjax2/lib/Node.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _createClass = /* @__PURE__ */ function() {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ("value" in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }
      return function(Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
      };
    }();
    var _react = require_react();
    var _react2 = _interopRequireDefault(_react);
    var _propTypes = require_prop_types();
    var _propTypes2 = _interopRequireDefault(_propTypes);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function _possibleConstructorReturn(self, call) {
      if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }
      return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }
    function _inherits(subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      }
      subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
      if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }
    var types = {
      ascii: "asciimath",
      tex: "tex"
    };
    var Node = function(_React$Component) {
      _inherits(Node2, _React$Component);
      function Node2() {
        _classCallCheck(this, Node2);
        return _possibleConstructorReturn(this, (Node2.__proto__ || Object.getPrototypeOf(Node2)).apply(this, arguments));
      }
      _createClass(Node2, [{
        key: "componentDidMount",
        /**
         * Render the math once the node is mounted
         */
        value: function componentDidMount() {
          this.typeset();
        }
        /**
         * Update the jax, force update if the display mode changed
         */
      }, {
        key: "componentDidUpdate",
        value: function componentDidUpdate(prevProps) {
          var forceUpdate = prevProps.inline !== this.props.inline || prevProps.children !== this.props.children;
          this.typeset(forceUpdate);
        }
        /**
         * Prevent update when the source has not changed
         */
      }, {
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate(nextProps, nextState, nextContext) {
          return nextProps.children !== this.props.children || nextProps.inline !== this.props.inline;
        }
        /**
         * Clear the math when unmounting the node
         */
      }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
          this.clear();
        }
        /**
         * Clear the jax
         */
      }, {
        key: "clear",
        value: function clear() {
          var MathJax2 = this.context.MathJax;
          if (!this.script) {
            return;
          }
          var jax = MathJax2.Hub.getJaxFor(this.script);
          if (jax) {
            jax.Remove();
          }
        }
        /**
         * Update math in the node
         * @param { Boolean } forceUpdate
         */
      }, {
        key: "typeset",
        value: function typeset(forceUpdate) {
          var MathJax2 = this.context.MathJax;
          if (!MathJax2) {
            throw Error("Could not find MathJax while attempting typeset! Probably MathJax script hasn't been loaded or MathJax.Context is not in the hierarchy");
          }
          var text = this.props.children;
          if (forceUpdate) {
            this.clear();
          }
          if (forceUpdate || !this.script) {
            this.setScriptText(text);
          }
          MathJax2.Hub.Queue(MathJax2.Hub.Reprocess(this.script, this.props.onRender));
        }
        /**
         * Create a script
         * @param { String } text
         */
      }, {
        key: "setScriptText",
        value: function setScriptText(text) {
          var inline = this.props.inline;
          var type = types[this.context.input];
          if (!this.script) {
            this.script = document.createElement("script");
            this.script.type = "math/" + type + "; " + (inline ? "" : "mode=display");
            this.refs.node.appendChild(this.script);
          }
          if ("text" in this.script) {
            this.script.text = text;
          } else {
            this.script.textContent = text;
          }
        }
      }, {
        key: "render",
        value: function render() {
          return _react2.default.createElement("span", { ref: "node" });
        }
      }]);
      return Node2;
    }(_react2.default.Component);
    Node.propTypes = {
      inline: _propTypes2.default.bool,
      children: _propTypes2.default.node.isRequired,
      onRender: _propTypes2.default.func
    };
    Node.contextTypes = {
      MathJax: _propTypes2.default.object,
      input: _propTypes2.default.string
    };
    Node.defaultProps = {
      inline: false,
      onRender: function onRender() {
      }
    };
    exports.default = Node;
  }
});

// node_modules/load-script/index.js
var require_load_script = __commonJS({
  "node_modules/load-script/index.js"(exports, module) {
    module.exports = function load(src, opts, cb) {
      var head = document.head || document.getElementsByTagName("head")[0];
      var script = document.createElement("script");
      if (typeof opts === "function") {
        cb = opts;
        opts = {};
      }
      opts = opts || {};
      cb = cb || function() {
      };
      script.type = opts.type || "text/javascript";
      script.charset = opts.charset || "utf8";
      script.async = "async" in opts ? !!opts.async : true;
      script.src = src;
      if (opts.attrs) {
        setAttributes(script, opts.attrs);
      }
      if (opts.text) {
        script.text = "" + opts.text;
      }
      var onend = "onload" in script ? stdOnEnd : ieOnEnd;
      onend(script, cb);
      if (!script.onload) {
        stdOnEnd(script, cb);
      }
      head.appendChild(script);
    };
    function setAttributes(script, attrs) {
      for (var attr in attrs) {
        script.setAttribute(attr, attrs[attr]);
      }
    }
    function stdOnEnd(script, cb) {
      script.onload = function() {
        this.onerror = this.onload = null;
        cb(null, script);
      };
      script.onerror = function() {
        this.onerror = this.onload = null;
        cb(new Error("Failed to load " + this.src), script);
      };
    }
    function ieOnEnd(script, cb) {
      script.onreadystatechange = function() {
        if (this.readyState != "complete" && this.readyState != "loaded") return;
        this.onreadystatechange = null;
        cb(null, script);
      };
    }
  }
});

// node_modules/react-mathjax2/lib/Context.js
var require_Context = __commonJS({
  "node_modules/react-mathjax2/lib/Context.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _createClass = /* @__PURE__ */ function() {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ("value" in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }
      return function(Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
      };
    }();
    var _react = require_react();
    var _react2 = _interopRequireDefault(_react);
    var _propTypes = require_prop_types();
    var _propTypes2 = _interopRequireDefault(_propTypes);
    var _loadScript = require_load_script();
    var _loadScript2 = _interopRequireDefault(_loadScript);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function _possibleConstructorReturn(self, call) {
      if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }
      return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }
    function _inherits(subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      }
      subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
      if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }
    var Context = function(_React$Component) {
      _inherits(Context2, _React$Component);
      function Context2(props) {
        _classCallCheck(this, Context2);
        var _this = _possibleConstructorReturn(this, (Context2.__proto__ || Object.getPrototypeOf(Context2)).call(this, props));
        _this.state = { loaded: false };
        _this.onLoad = _this.onLoad.bind(_this);
        return _this;
      }
      _createClass(Context2, [{
        key: "getChildContext",
        value: function getChildContext() {
          return {
            MathJax: typeof MathJax === "undefined" ? void 0 : MathJax,
            input: this.props.input
          };
        }
      }, {
        key: "componentDidMount",
        value: function componentDidMount() {
          var script = this.props.script;
          if (!script) {
            return this.onLoad();
          }
          (0, _loadScript2.default)(script, this.onLoad);
        }
      }, {
        key: "onLoad",
        value: function onLoad() {
          var _this2 = this;
          var options = this.props.options;
          MathJax.Hub.Config(options);
          MathJax.Hub.Register.StartupHook("End", function() {
            MathJax.Hub.processSectionDelay = _this2.props.delay;
            if (_this2.props.didFinishTypeset) {
              _this2.props.didFinishTypeset();
            }
            if (_this2.props.onLoad) {
              _this2.props.onLoad();
            }
            _this2.setState({
              loaded: true
            });
          });
          MathJax.Hub.Register.MessageHook("Math Processing Error", function(message) {
            if (_this2.props.onError) {
              _this2.props.onError(MathJax, message);
            }
          });
        }
      }, {
        key: "render",
        value: function render() {
          if (!this.state.loaded && !this.props.noGate) {
            return this.props.loading;
          }
          var children = this.props.children;
          return _react2.default.Children.only(children);
        }
      }]);
      return Context2;
    }(_react2.default.Component);
    Context.propTypes = {
      children: _propTypes2.default.node.isRequired,
      didFinishTypeset: _propTypes2.default.func,
      script: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.oneOf([false])]),
      input: _propTypes2.default.oneOf(["ascii", "tex"]),
      delay: _propTypes2.default.number,
      options: _propTypes2.default.object,
      loading: _propTypes2.default.node,
      noGate: _propTypes2.default.bool
    };
    Context.childContextTypes = {
      MathJax: _propTypes2.default.object,
      input: _propTypes2.default.string
    };
    Context.defaultProps = {
      script: "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-MML-AM_CHTML",
      input: "ascii",
      delay: 0,
      options: {},
      loading: null,
      noGate: false
    };
    exports.default = Context;
  }
});

// node_modules/react-mathjax2/lib/Text.js
var require_Text = __commonJS({
  "node_modules/react-mathjax2/lib/Text.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    var _createClass = /* @__PURE__ */ function() {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ("value" in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }
      return function(Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
      };
    }();
    var _react = require_react();
    var _react2 = _interopRequireDefault(_react);
    var _propTypes = require_prop_types();
    var _propTypes2 = _interopRequireDefault(_propTypes);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function _possibleConstructorReturn(self, call) {
      if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }
      return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }
    function _inherits(subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      }
      subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
      if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }
    var Text = function(_React$Component) {
      _inherits(Text2, _React$Component);
      function Text2() {
        _classCallCheck(this, Text2);
        return _possibleConstructorReturn(this, (Text2.__proto__ || Object.getPrototypeOf(Text2)).apply(this, arguments));
      }
      _createClass(Text2, [{
        key: "componentDidMount",
        value: function componentDidMount() {
          this.refreshMathJax();
        }
      }, {
        key: "componentDidUpdate",
        value: function componentDidUpdate() {
          this.refreshMathJax();
        }
      }, {
        key: "refreshMathJax",
        value: function refreshMathJax() {
          var MathJax2 = this.context.MathJax;
          if (!MathJax2) {
            throw Error("Could not find MathJax while attempting typeset! Probably MathJax script hasn't been loaded or MathJax.Context is not in the hierarchy");
          }
          MathJax2.Hub.Queue(MathJax2.Hub.Typeset(this.div, this.props.onRender));
        }
      }, {
        key: "render",
        value: function render() {
          var _this2 = this;
          var _props = this.props, classes = _props.classes, options = _props.options;
          return _react2.default.createElement(
            "div",
            { key: this.props.text, ref: function ref(div) {
              return _this2.div = div;
            } },
            this.props.text
          );
        }
      }]);
      return Text2;
    }(_react2.default.Component);
    Text.contextTypes = {
      MathJax: _propTypes2.default.object
    };
    exports.default = Text;
  }
});

// node_modules/react-mathjax2/lib/index.js
var require_lib = __commonJS({
  "node_modules/react-mathjax2/lib/index.js"(exports) {
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Text = exports.Context = exports.Node = void 0;
    var _Node = require_Node();
    var _Node2 = _interopRequireDefault(_Node);
    var _Context = require_Context();
    var _Context2 = _interopRequireDefault(_Context);
    var _Text = require_Text();
    var _Text2 = _interopRequireDefault(_Text);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    exports.Node = _Node2.default;
    exports.Context = _Context2.default;
    exports.Text = _Text2.default;
    exports.default = { Node: _Node2.default, Context: _Context2.default, Text: _Text2.default };
  }
});
export default require_lib();
//# sourceMappingURL=react-mathjax2.js.map
