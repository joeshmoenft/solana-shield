'use strict';

const x = React.createElement;

class TotalShielded extends React.Component {
  constructor(props) {
    super(props);
    this.state = { total: "uninitalized" };
  }

  componentDidMount() {

    const getTotalShielded = async () => {
        const response = await fetch('total/', {method: 'GET'});

        const res = await response.text();

        //console.log(shield_status);
        
        this.setState({
            status: res
        });
    };

    //getShieldStatus();
    this.interval = setInterval(() => getTotalShielded(), 1000);
  }

  componentWillUnmount() {
      clearInterval(this.interval);
  }

  render() {
      if (this.state.status == "uninitialized") {
          return 'Loading...'; 
      } else {
          return this.state.totalShielded;
      }
  }
}

domContainer = document.querySelector('#total-shielded');
root = ReactDOM.createRoot(domContainer);
root.render(x(TotalShielded));