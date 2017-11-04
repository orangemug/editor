import React from 'react'
import Modal from './Modal'
import GitHub from 'github-api'
import Button from '../Button'

import styleSpec from '@mapbox/mapbox-gl-style-spec'


class GitHubModal extends React.Component {
  static propTypes = {
    mapStyle: React.PropTypes.object.isRequired,
    isOpen: React.PropTypes.bool.isRequired,
    onOpenToggle: React.PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      github: new GitHub({
        token: window.localStorage.getItem("github_access_token")
      })
    };
  }

  save() {
    const content = JSON.stringify(this.props.mapStyle, null, 2);
    const commitMessage = this.refs.commitMessage.value;

    this.state.github
      .getRepo(window.githubUser, window.githubRepo)
      .writeFile("master", "style.json", content, commitMessage, {})
      .then(() => {
        console.debug("saved!");
        this.props.onOpenToggle();
      })
  }

  render() {

    const changes = styleSpec.diff(window.githubOrig, this.props.mapStyle)

    return <Modal
      isOpen={this.props.isOpen}
      onOpenToggle={this.props.onOpenToggle}
      title={'Save to GitHub'}
    >

      <div className="maputnik-modal-section">
        <h4>Save changes to GitHub</h4>
        <p>
          Save the following changes to GitHub repo @@REPO@@
        </p>
        <ul>
          {changes.map((change, idx) => {
            return (
              <li key={"change:"+idx}>{change.command} {change.args.slice(0, 2).join(" ")}</li>
            );
          })}
        </ul>
        <textarea ref="commitMessage" placeholder="Commit message...">
        </textarea>
        <Button onClick={this.save.bind(this)}>
          Commit
        </Button>
      </div>
    </Modal>
  }
}

export default GitHubModal
