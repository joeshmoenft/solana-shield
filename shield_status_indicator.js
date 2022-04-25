'use strict';

const e = React.createElement;

class ShieldStatus extends React.Component {
  constructor(props) {
    super(props);
    this.state = { status: "uninitialized" };
  }

  componentDidMount() {

    const getShieldStatus = async () => {

        const response = await fetch('status/', {method: 'GET'});
        const shield_status = await response.text();

        if (shield_status !== this.state.status){
            this.setState({
                status: shield_status
            });
        }
        //console.log(shield_status);
    };

    //isn't very  efficient. perhaps try pubsub again for this
    this.interval = setInterval(() => getShieldStatus(), 1000);
  }

  componentWillUnmount() {
      clearInterval(this.interval);
  }

  render() {
      if (this.state.status == "uninitialized") {
          return 'Loading...'; 
      } else if (this.state.status == "activated") {
          return e('button',
          { onClick: () => disableShield() },
          'Deactivate'
          );
      } else if (this.state.status == "deactivated") {
          return e('button',
          { onClick: () => enableShield() },
          'Activate'
          );
      } else {
          return this.state.status.toString();
      }
  }
}


async function enableShield() {
    console.log('Clicked Enable Shield');
    let res = await fetch('activate/', {method: 'POST'});
}

async function disableShield() {
    console.log('Clicked Disable Shield');
    let res = await fetch('deactivate/', {method: 'POST'});
}


const domContainer = document.querySelector('#shield_status_container');
const root = ReactDOM.createRoot(domContainer);
root.render(e(ShieldStatus));