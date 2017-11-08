import React from 'react'
import PropTypes from 'prop-types'
import Modal from './Modal'
import Button from '../Button'
import FileReaderInput from 'react-file-reader-input'
import request from 'request'

import GitHub from 'github-api'

import FileUploadIcon from 'react-icons/lib/md/file-upload'
import AddIcon from 'react-icons/lib/md/add-circle-outline'

import style from '../../libs/style.js'
import publicStyles from '../../config/styles.json'


class GitHubSection extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      github: new GitHub({
        token: window.localStorage.getItem("github_access_token")
      })
    };
    this.checkGitHubAuth();
  }

  openFromRepo(fullname) {
    const [user, repo] = fullname.split("/");

    // HACK
    window.githubUser = user;
    window.githubRepo = repo;
    console.log("user/repo", fullname, user, repo);
    this.state.github.getRepo(user, repo)
      .getContents("master", "style.json")
      .then((res) => {
        console.log(res);
        const data = JSON.parse(window.atob(res.data.content));
        console.log("data", data);

        // HACK
        window.githubOrig = data;
        this.props.onStyleOpen(data);
        this.props.onOpenToggle()
      })
  }

  getRepoList() {
    this.state.github.getUser().listRepos({})
      .then((repos) => {
        this.setState({
          githubRepos: repos.data.map((repo) => {
            return {
              full_name: repo.full_name,
              permissions: repo.permissions
            };
          })
        })
      })
  }

  githubLogin() {
    // Go and login.
    window.location.pathname = "/auth/github/login";
  }


  checkGitHubAuth() {
    console.log("CHECK AUTH")
    this.state.github.getUser().getProfile()
      .then(() => {
        this.getRepoList();
        console.log(">> AUTH");
        this.setState({
          githubAuthState: "authenticated"
        })
      })
      .catch((err) => {
        console.log(">> NO AUTH", err);
        this.setState({
          githubAuthState: "unauthenticated"
        })
      })
  }


  render() {
    let contents = [];

    console.log("DEBUG", this.state)

    if(this.state.githubAuthState === "authenticated") {
      const repos = this.state.githubRepos || [];

      contents.push(
        <div className="maputnik-modal__repos">
          {repos.map((repo) => {
            return (
              <div>
                <a href="#" onClick={() => this.openFromRepo(repo.full_name)}>
                  {repo.full_name}
                </a>
              </div>
            )
          })}
        </div>
      )
    }
    else if(this.state.githubAuthState === "unauthenticated") {
      contents.push(
        <div>
          <Button className="maputnik-upload-button" onClick={() => this.githubLogin()}>Login with GitHub</Button>
        </div>
      )
    }
    else {
      contents.push(
        <div>LOADING...</div>
      )
    }

    return (
      <section className="maputnik-modal-section">
        <h2>Github</h2>
        <p>Load from GitHub</p>
        {contents}
      </section>
    )
  }
}

class PublicStyle extends React.Component {
  static propTypes = {
    url: PropTypes.string.isRequired,
    thumbnailUrl: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired,
  }

  render() {
    return <div className="maputnik-public-style">
      <Button
        className="maputnik-public-style-button"
        onClick={() => this.props.onSelect(this.props.url)}
      >
        <header className="maputnik-public-style-header">
          <h4>{this.props.title}</h4>
          <span className="maputnik-space" />
          <AddIcon />
        </header>
        <img
          className="maputnik-public-style-thumbnail"
          src={this.props.thumbnailUrl}
          alt={this.props.title}
        />
      </Button>
    </div>
  }
}

class OpenModal extends React.Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onOpenToggle: PropTypes.func.isRequired,
    onStyleOpen: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {};
  }

  clearError() {
    this.setState({
      error: null
    })
  }

  onStyleSelect(styleUrl) {
    this.clearError();

    request({
      url: styleUrl,
      withCredentials: false,
    }, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const mapStyle = style.ensureStyleValidity(JSON.parse(body))
          console.log('Loaded style ', mapStyle.id)
          this.props.onStyleOpen(mapStyle)
          this.onOpenToggle()
        } else {
          console.warn('Could not open the style URL', styleUrl)
        }
    })
  }

  onOpenUrl() {
    const url = this.styleUrlElement.value;
    this.onStyleSelect(url);
  }

  onUpload(_, files) {
    const [e, file] = files[0];
    const reader = new FileReader();

    this.clearError();

    reader.readAsText(file, "UTF-8");
    reader.onload = e => {
      let mapStyle;
      try {
        mapStyle = JSON.parse(e.target.result)
      }
      catch(err) {
        this.setState({
          error: err.toString()
        });
        return;
      }
      mapStyle = style.ensureStyleValidity(mapStyle)
      this.props.onStyleOpen(mapStyle);
      this.onOpenToggle();
    }
    reader.onerror = e => console.log(e.target);
  }

  onOpenToggle() {
    this.clearError();
    this.props.onOpenToggle();
  }

  render() {
    const styleOptions = publicStyles.map(style => {
      return <PublicStyle
        key={style.id}
        url={style.url}
        title={style.title}
        thumbnailUrl={style.thumbnail}
        onSelect={this.onStyleSelect.bind(this)}
      />
    })

    let errorElement;
    if(this.state.error) {
      errorElement = (
        <div className="maputnik-modal-error">
          {this.state.error}
          <a href="#" onClick={() => this.clearError()} className="maputnik-modal-error-close">×</a>
        </div>
      );
    }

    return <Modal
      isOpen={this.props.isOpen}
      onOpenToggle={() => this.onOpenToggle()}
      title={'Open Style'}
    >
      {errorElement}
      <section className="maputnik-modal-section">
        <h2>Upload Style</h2>
        <p>Upload a JSON style from your computer.</p>
        <FileReaderInput onChange={this.onUpload.bind(this)}>
          <Button className="maputnik-upload-button"><FileUploadIcon /> Upload</Button>
        </FileReaderInput>
      </section>

      <GitHubSection onStyleOpen={this.props.onStyleOpen} onOpenToggle={this.props.onOpenToggle} />

      <section className="maputnik-modal-section">
        <h2>Load from URL</h2>
        <p>
          Load from a URL. Note that the URL must have <a href="https://enable-cors.org" target="_blank" rel="noopener noreferrer">CORS enabled</a>.
        </p>
        <input type="text" ref={(input) => this.styleUrlElement = input} className="maputnik-input" placeholder="Enter URL..."/>
        <div>
          <Button className="maputnik-big-button" onClick={this.onOpenUrl.bind(this)}>Open URL</Button>
        </div>
      </section>

      <section className="maputnik-modal-section maputnik-modal-section--shrink">
        <h2>Gallery Styles</h2>
        <p>
          Open one of the publicly available styles to start from.
        </p>
        <div className="maputnik-style-gallery-container">
        {styleOptions}
        </div>
      </section>
    </Modal>
  }
}

export default OpenModal
