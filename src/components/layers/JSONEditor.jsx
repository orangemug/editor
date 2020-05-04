import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import classnames from 'classnames';

import InputBlock from '../inputs/InputBlock'
import StringInput from '../inputs/StringInput'
import ColorField from '../fields/ColorField'
import ChromePicker from 'react-color/lib/components/chrome/Chrome'
import CodeMirror from 'codemirror';

import 'codemirror/mode/javascript/javascript'
import 'codemirror/addon/lint/lint'
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/lint/lint.css'
import jsonlint from 'jsonlint'
import stringifyPretty from 'json-stringify-pretty-compact'
import '../util/codemirror-mgl';
import jsonToAst from 'json-to-ast';
import {parseCSSColor} from 'csscolorparser';



class CodeColorPicker extends React.Component {
  constructor () {
    super()
    this.state = {
      pickerOpen: false,
    };
  }

  onToggle = () => {
    this.setState({
      pickerOpen: !this.state.pickerOpen,
    });
  }

  calcPickerOffset () {
    const elem = this._el
    if(elem) {
      const pos = elem.getBoundingClientRect()
      return {
        top: pos.top,
        left: pos.left + 20,
      }
    } else {
      return {
        top: 160,
        left: 555,
      }
    }
  }

  onChange (color) {
    function formatColor(color) {
      const rgb = color.rgb
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`
    }

    this.props.onChange(
      formatColor(color)
    );
  }

  render () {
    const offset = this.calcPickerOffset();
    const {color} = this.props;
    const {pickerOpen} = this.state;

      const style = {
        display: "inline-block",
        width: "1em",
        height: "1em",
        background: color,
        verticalAlign: "text-bottom",
        borderRadius: "1px",
        cursor: "pointer",
        marginRight: "2px",
        marginLeft: "2px",
        border: "solid 1px hsla(223, 12%, 30%, 1)",
      };

    return <div
      ref={(el) => this._el = el}
      style={{display: "inline-block"}}
    >
      <div
        style={style}
        onClick={this.onToggle}
      />
      {pickerOpen &&
        <div
          className="maputnik-color-picker-offset"
          style={{
            position: 'fixed',
            zIndex: 1,
            left: offset.left,
            top: offset.top,
        }}>
          <ChromePicker
            style={{zIndex: 999999999}}
            color={color}
            onChange={c => this.onChange(c)}
          />
          <div
            className="maputnik-color-picker-offset"
            onClick={this.onToggle}
            style={{
              zIndex: -1,
              position: 'fixed',
              top: '0px',
              right: '0px',
              bottom: '0px',
              left: '0px',
            }}
          />
        </div>
      }
    </div>
  }
}


class JSONEditor extends React.Component {
  static propTypes = {
    layer: PropTypes.any.isRequired,
    maxHeight: PropTypes.number,
    onChange: PropTypes.func,
    lineNumbers: PropTypes.bool,
    lineWrapping: PropTypes.bool,
    getValue: PropTypes.func,
    gutters: PropTypes.array,
    className: PropTypes.string,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onJSONValid: PropTypes.func,
    onJSONInvalid: PropTypes.func,
    mode: PropTypes.object,
    lint: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object,
    ]),
  }

  static defaultProps = {
    lineNumbers: true,
    lineWrapping: false,
    gutters: ["CodeMirror-lint-markers"],
    getValue: (data) => {
      return stringifyPretty(data, {indent: 2, maxLength: 40});
    },
    onFocus: () => {},
    onBlur: () => {},
    onJSONInvalid: () => {},
    onJSONValid: () => {},
  }

  constructor(props) {
    super(props)

    this._bookmarks = [];
    this.state = {
      isEditing: false,
      prevValue: this.props.getValue(this.props.layer),
    };
  }

  componentDidMount () {
    const value = this.props.getValue(this.props.layer);
    this._doc = CodeMirror(this._el, {
      value: value,
      mode: this.props.mode || {
        name: "mgl",
      },
      lineWrapping: this.props.lineWrapping,
      tabSize: 2,
      theme: 'maputnik',
      viewportMargin: Infinity,
      lineNumbers: this.props.lineNumbers,
      lint: this.props.lint || {
        context: "layer"
      },
      matchBrackets: true,
      gutters: this.props.gutters,
      scrollbarStyle: "null",
    });

    this.addInMarkers(value);
    this._doc.on('change', this.onChange);
    this._doc.on('focus', this.onFocus);
    this._doc.on('blur', this.onBlur);
  }

  onFocus = () => {
    this.props.onFocus();
    this.setState({
      isEditing: true
    });
  }

  onBlur = () => {
    this.props.onBlur();
    this.setState({
      isEditing: false
    });
  }

  componentWillUnMount () {
    this._doc.off('change', this.onChange);
    this._doc.off('focus', this.onFocus);
    this._doc.off('blur', this.onBlur);
  }

  addInMarkers (value) {
    const ast = jsonToAst(value);
    function walkTree (node, fn) {
      fn(node);
      if (node.children) {
        node.children.forEach(childNode => {
          walkTree(childNode, fn);
        })
      }
      else if (node.value && node.value.children) {
        node.value.children.forEach(childNode => {
          walkTree(childNode, fn);
        })
      }
    }

    let idx = 0;
    const createElement = (color, posStart, posEnd, onChange) => {
      const elIdx = idx++;
      const el = document.createElement("span");
      ReactDOM.render(<CodeColorPicker key={elIdx} color={color} onChange={(color) => {
        onChange(posStart, posEnd, color)
      }}/>, el);
      return el;
    }

    const onChange = (posStart, posEnd, newValue) => {
      const replaceWith = ""+
        value.slice(0, posStart)+
        newValue+
        value.slice(posEnd);

      console.log("replaceWith", {value, newValue, replaceWith, posStart, posEnd});
      this.props.onChange(JSON.parse(replaceWith));
    }

    this._bookmarks.map(bm => bm.clear());
    this._bookmarks = [];

    walkTree(ast, (node) => {
      const {type, value} = node;
      if (
        type === "Literal" &&
        typeof(value) === "string" &&
        parseCSSColor(value) !== null
      ) {
        const {start, end} = node.loc;
        const parsedColor = parseCSSColor(value);
        console.log(">>> parsedColor", {parsedColor, value, node});

        const posStart = CodeMirror.Pos(start.line-1, start.column);
        const posEnd = CodeMirror.Pos(start.line-1, start.column+1);
        console.log("posStart", posStart);

        const widgetElement = createElement(
          value,
          posStart.ch,
          CodeMirror.Pos(end.line-1, end.column).ch-2, onChange
        );

        const bm = this._doc.setBookmark(posStart, {widget: widgetElement});
        this._bookmarks.push(bm);
      }
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.layer !== this.props.layer) {
      const value = this.props.getValue(this.props.layer);
      if (!this.state.isEditing) {
        this._cancelNextChange = true;
        this._doc.setValue(value);
      }
      // HACK
      this.addInMarkers(this._doc.getValue());
    }
  }

  onChange = (e) => {
    if (this._cancelNextChange) {
      this._cancelNextChange = false;
      this.setState({
        prevValue: this._doc.getValue(),
      })
      return;
    }
    const newCode = this._doc.getValue();

    if (this.state.prevValue !== newCode) {
      let parsedLayer, err;
      try {
        parsedLayer = JSON.parse(newCode);
      } catch(_err) {
        err = _err;
        console.warn(_err)
      }

      if (err) {
        this.props.onJSONInvalid();
      }
      else {
        this.props.onChange(parsedLayer)
        this.props.onJSONValid();
      }
    }

    this.setState({
      prevValue: newCode,
    });
  }

  render() {
    const style = {};
    if (this.props.maxHeight) {
      style.maxHeight = this.props.maxHeight;
    }

    return <div
      className={classnames("codemirror-container", this.props.className)}
      ref={(el) => this._el = el}
      style={style}
    />
  }
}

export default JSONEditor
