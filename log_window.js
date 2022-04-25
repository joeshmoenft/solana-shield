'use strict';

let e = React.createElement;

class LogWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = JSON.parse(window.localStorage.getItem('state')) || { logitems: ['hello'] }
  }

  render() {
      return e(
          'p',
          this.state
      );
  }
}

let domContainer = document.querySelector('#shield-logs');
let root = ReactDOM.createRoot(domContainer);
root.render(e(LogWindow));