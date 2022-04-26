'use strict';

let e = React.createElement;

class ShieldStatus extends React.Component {
  constructor(props) {
    super(props);
    this.state = { status: "uninitialized" };
  }

  componentDidMount() {

    //Get the status of the Shield on page open

    this.getShieldStatus();
    //isn't very  efficient. perhaps try pubsub again for this
    //this.interval = setInterval(() => getShieldStatus(), 1000);
  }

  componentWillUnmount() {
      clearInterval(this.interval);
  }

  getShieldStatus = async () => {

        const response = await fetch('status/', {method: 'GET'});
        const shield_status = await response.text();

        if (shield_status !== this.state.status){
            this.setState({
                status: shield_status
            });
        }
        //console.log(shield_status);
    }

    enableShield = async () => {
        console.log('Clicked Enable Shield');
        try {
            let res = fetch('activate/', {method: 'POST'});
            await sleep(2000); //jankity solution, should call after promise returns from fetch -- howto?
            this.getShieldStatus();
        } catch (err) {
            console.log('Could not fetch enable shield.');
            console.log(err);
        }
    }

    disableShield = async () => {
        console.log('Clicked Disable Shield');
    
        try {
            let res = fetch('deactivate/', {method: 'POST'});
            await sleep(2000);
            this.getShieldStatus();
        } catch (err) {
            console.log('Could not fetch disable shield.');
            console.log(err);
        }
        
    }
  

  render() {
      if (this.state.status == "uninitialized") {
          return 'Loading...'; 
      } else if (this.state.status == "activated") {
          return e('button',
          { onClick: () => this.disableShield() },
          'Deactivate'
          );
      } else if (this.state.status == "deactivated") {
          return e('button',
          { onClick: () => this.enableShield() },
          'Activate'
          );
      } else {
          return this.state.status.toString();
      }
  }

}






function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  

let domContainer = document.querySelector('#shield_status_container');
let root = ReactDOM.createRoot(domContainer);
root.render(e(ShieldStatus));