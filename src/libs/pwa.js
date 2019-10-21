import EventEmitter from 'events';

class Pwa extends EventEmitter {
  constructor () {
    super();
    this.installPrompt = null;
  }
}

const instance = new Pwa();

window.addEventListener('appinstalled', (e) => {
  instance.pwa = null;
  instance.emit("change");
});

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();

  // Stash the event so it can be triggered later.
  instance.installPrompt = e;

  instance.emit("change");
});

export default instance;


