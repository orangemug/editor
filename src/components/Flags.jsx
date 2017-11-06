import React from 'react'


const availableFlags = [
  {
    id: "workspace", 
    name: "Workspaces",
    default: false,
    description: "Workspaces allow multiple styles to be worked on at the same time"
  },
  {
    id: "github_sync", 
    name: "Github sync",
    default: false,
    description: "Load and save to a github repo"
  }
]


export default class Flags extends React.Component {
  constructor(props) {
    super(props);

    const storeFlags = JSON.parse(
      localStorage.getItem("flags") || "{}"
    );

    this.state = {
      flags: this._getDefaults(storeFlags)
    };
  }

  _getDefaults(flags, force) {
    flags = Object.assign({}, flags);

    availableFlags.forEach(function(flag) {
      if(force || !flags.hasOwnProperty(flag.id)) {
        flags[flag.id] = flag.default
      }
    })

    return flags;
  }

  // A bit broken still.... :(
  setDefaults(force) {
    const flags = Object.assign({}, this.state.flags);

    this.setState({
      flags: this._getDefaults(flags, force)
    });

    localStorage.setItem("flags", JSON.stringify(flags));
  }

  updateFlag(flag) {
    const flags = Object.assign({}, this.state.flags);
    flags[flag.id] = !flags[flag.id];
    this.setState({
      flags: flags
    })
    localStorage.setItem("flags", JSON.stringify(flags));
  }

  render() {
    const flags = this.state.flags;

    return <div className="maputnik-flags">
      <div className="maputnik-flags__header">
        <h1>Careful, here be dragons!</h1>
        <p>
          These experimental features may change, break or disappear at any time, so be warned. Some experiments have issues attached to please take a look before using the feature.
        </p>
      </div>
      <div className="maputnik-flags__flags-title">
        <h2>Experiments</h2>
        <button onClick={() => this.setDefaults(true)}>Reset all to default</button>
      </div>
      <div className="maputnik-flags__flags">
        {availableFlags.map((flag) => {
          const currentState = this.state.flags[flag.id]
          const defaultState = flag.default
          const isSet = (defaultState !== currentState);

          const classNames = ["flag"]
          if(isSet) {
            classNames.push("flag--is-set");
          }

          return <div key={flag.id} className={classNames.join(" ")}>
            <input name={flag.id} type="checkbox" onChange={(e) => this.updateFlag(flag)} checked={currentState}/>
            <div className="flag__name">
              {flag.name}
            </div>
            <div className="flag__description">
              {flag.description}
            </div>
          </div>
        })}
      </div>
    </div>
  }
}
