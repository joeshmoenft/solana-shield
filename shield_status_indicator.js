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
    //but keep it refreeshing every 30 minutes in case they leave their comp
    this.interval = setInterval(() => this.getShieldStatus(), 18000);
  }

  componentWillUnmount() {
      clearInterval(this.interval);
  }


  getShieldStatus = async () => {
    
        await sleep(3000);

        try {
            const response = await fetch('status/', {method: 'GET'});
            const shield_status = await response.text();

            if (shield_status !== this.state.status){
                this.setState({
                    status: shield_status
                });
            }
            
        } catch (error) {
            attempt++;
            console.log('Cannot Get Shield Status');
            console.log(error);

            this.setState({
                status: 'error'
            });

            console.log(attempt);

        }
        //console.log(shield_status);
    }

    enableShield = async () => {
        console.log('Clicked Enable Shield');
        this.setState({
            status: 'loading'
        });
        try {
            let res = await fetch('activate/', {method: 'POST'}).then((result) => {
                this.getShieldStatus();
            });
    
        } catch (err) {
            console.log('Could not fetch enable shield.');
            console.log(err);
        }
    }

    disableShield = async () => {
        console.log('Clicked Disable Shield');
        this.setState({
            status: 'loading'
        });

        try {
            let res = fetch('deactivate/', {method: 'POST'}).then(() => {
                this.getShieldStatus();
            });
        } catch (err) {
            console.log('Could not fetch disable shield.');
            console.log(err);
        }
        
    }
  

  render() {
      if (this.state.status == "uninitialized") {
        return e('button',
        {className: "glow-on-hover disabled"},
        'Loading...'
      ); 
      } else if (this.state.status == "activated") {
          return e('button',
          { onClick: () => this.disableShield(),
            className: "glow-on-hover" },
          'Deactivate'
          );
      } else if (this.state.status == "deactivated") {
          return e('button',
          { onClick: () => this.enableShield(),
            className: "glow-on-hover"},
          'Activate'
          );
      } else if (this.state.status == "loading") {
            return e('button',
            {className: "glow-on-hover disabled"},
            'Loading...'
          );
      } else if (this.state.status == "error") {
            return e('button',
            {className: "glow-on-hover disabled"},
            'Error. Retrying...'
          );
        } else if (this.state.status == "disconnected") {
            return e('button',
            {className: "glow-on-hover disabled"},
            'Disconnected. Please restart the server and refresh.'
          );
        } else {
            return e('button',
          { onClick: () => this.enableShield(),
            className: "glow-on-hover"},
          'Activate'
          );
        }
  }

}

function sleep(ms) {
    console.log('Waiting ' + ms + ' ms...');
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

let attempt = 0;
let retry;
  
let domContainer = document.querySelector('#shield_status_container');
let root = ReactDOM.createRoot(domContainer);
root.render(e(ShieldStatus));