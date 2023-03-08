export default class Controller {
  #view
  #camera
  #worker
  #blinkCounter

  constructor({ view, worker, camera }) {
    this.#view = view;
    this.#camera = camera;
    this.#worker = this.#configureWorker(worker);

    this.#view.configureOnBtnClick(this.onBtnStart.bind(this));
  }

  static async initialize(deps) {
    const controller = new Controller(deps);

    controller.log('not yet detecting eye blink! click in the button to start');
    return controller.init();
  }

  #configureWorker(worker) {
    let ready = false;

    worker.onmessage = ({ data }) => {
      if ('READY' === data) {
        console.log('worker is ready')
        this.#view.enableButton();
        ready = true;
        return;
      }

      const { leftBlinked, rightBlinked } = data;
      if (leftBlinked && rightBlinked) return;

      this.#blinkCounter += leftBlinked || rightBlinked;

      if (leftBlinked) this.#view.togglePlayVideo();
      if (rightBlinked) this.#view.togglePauseVideo();
      
      console.log('blinked left eye', leftBlinked);
      console.log('blinked right eye', rightBlinked);
    }

    return {
      send (msg) {
        if (!ready) return;
        worker.postMessage(msg);
      }
    }
  }

  async init() {
    console.log("init");
  }

  loop() {
    const video = this.#camera.video;
    const img = this.#view.getVideoFrame(video);

    this.#worker.send(img);
    this.log('detecting eye blink...');

    setTimeout(() => this.loop(), 100);
  }

  log(text) {
    const times = `   - blinked times: ${this.#blinkCounter}`
    this.#view.log(`status: ${text}`.concat(this.#blinkCounter ? times : ""));
  }

  onBtnStart() {
    this.log('initialing detection...');
    this.#blinkCounter = 0;
    this.loop();
  }
}