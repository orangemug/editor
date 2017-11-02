import React from 'react'
import Modal from './Modal'
import GitHub from 'github-api'
import Button from '../Button'


class GitHubModal extends React.Component {
  static propTypes = {
    mapStyle: React.PropTypes.object.isRequired,
    onStyleChanged: React.PropTypes.func.isRequired,
    isOpen: React.PropTypes.bool.isRequired,
    onOpenToggle: React.PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
  }

  save() {
    alert("save");
  }

  render() {
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
          <li>background: background</li>
          <li>water: background</li>
        </ul>
        <textarea placeholder="Commit message...">
        </textarea>
        <Button onClick={this.save.bind(this)}>
          Commit
        </Button>
      </div>
    </Modal>
  }
}

export default GitHubModal
