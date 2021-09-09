import React, { Component } from 'react';
import './App.css';
import Navbar from './Navbar';
import Main from './Main';
import Web3 from 'web3';
import EthSwap from '../abis/EthSwap.json';
import Token from '../abis/Token.json';

class App extends Component {
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadWeb3() {
    if(window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } else if(window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert('No ethereum browser is installed. Try it installing MetaMask.');
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3;
	
    // Cargar cuenta
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });

    // Recoger ETH balance de la cuenta
    const ethBalance = await web3.eth.getBalance(this.state.account);
    this.setState({ ethBalance });
    
    const networkId = await web3.eth.net.getId();
    // Recoger contrato Token
    const tokenNetWorkData = Token.networks[networkId];
    if(tokenNetWorkData) {
      // Asignar contracto
      const token = new web3.eth.Contract(Token.abi, tokenNetWorkData.address);
      this.setState({ token });

      // Recoger balance del usuario
      let tokenBalance = await token.methods.balanceOf(this.state.account).call();
      this.setState({ tokenBalance: tokenBalance.toString() });
    } else {
      window.alert('Token contract not deployed to detected network.');
    }

    // Recoger contrato EthSwap
    const ethSwapNetWorkData = EthSwap.networks[networkId];
    if(ethSwapNetWorkData) {
      // Asignar contracto
      const ethSwap = new web3.eth.Contract(EthSwap.abi, ethSwapNetWorkData.address);
      this.setState({ ethSwap });
    } else {
      window.alert('EthSwap contract not deployed to detected network.');
    }

    this.setState({ loading: false });
  }

  buyTokens = (etherAmount) => {
    this.setState({ loading: true });

    this.state.ethSwap.methods.buyTokens().send({ value:etherAmount, from: this.state.account })
    .on('confirmation', (confirmationNumber) => {
      this.setState({ loading: false });
      window.location.reload();
    });
  }

  sellTokens = (tokenAmount) => {
    this.setState({ loading: true });

    this.state.token.methods.approve(this.state.ethSwap.address, tokenAmount).send({ from: this.state.account })
    .once('confirmation', (confirmationNumber) => {
      this.state.ethSwap.methods.sellTokens(tokenAmount).send({ from: this.state.account })
      .on('confirmation', (confirmationNumber) => {
				this.setState({ loading: false });
				window.location.reload();
      })
    });
  }

  constructor(props) {
    super(props);

    this.state = {
      account: '',
      ethBalance: '',
      token: {},
      ethSwap: {},
      tokenBalance: '0',
      loading: true
    }
  }

  render() {
    let content;
    if(this.state.loading) {
      content = <p id="loader" className="text-center">Loading...</p>
    } else {
      content = <Main 
        ethBalance={this.state.ethBalance}
        tokenBalance={this.state.tokenBalance}
        buyTokens={this.buyTokens}
        sellTokens={this.sellTokens}
      />
    }

    return (
      <div>
        <Navbar account={ this.state.account } />
        <div className="container-fluid mt-5">
          <div className="row">
              <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
                  <div className="content mr-auto ml-auto">
                      <a
                      href="http://www.dappuniversity.com/bootcamp"
                      target="_blank"
                      rel="noopener noreferrer"
                      >
                      </a>
                      { content }
                  </div>
              </main>
            </div>
          </div>
      </div>
    );
  }
}

export default App;
