const Token = artifacts.require('./Token.sol');
const EthSwap = artifacts.require('./EthSwap.sol');	

require('chai')
  .use(require('chai-as-promised'))
  .should();

function tokens(n) {
    return web3.utils.toWei(n, 'ether');
}

contract('EthSwap', ([deployer, investor]) => {
    let token, ethSwap

    before(async () => {
        token = await Token.new();
        ethSwap = await EthSwap.new(token.address);
        // Transfiere todos los tokens al EthSwap (1 millón).
        await token.transfer(ethSwap.address, tokens('1000000'));
    });

    describe('Token Deployment', async () => {
        it('Deploys Successfully', async () => {
            const address = await token.address;
            assert.notEqual(address, 0x0);
            assert.notEqual(address, '');
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);
        });
    });

    describe('EthSwap Deployment', async () => {
        it('Deploys Successfully', async () => {
            const address = await ethSwap.address;
            assert.notEqual(address, 0x0);
            assert.notEqual(address, '');
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);
        });

        it('Contract has tokens', async () => {
            let balance = await token.balanceOf(ethSwap.address);
            assert.equal(balance.toString(), tokens('1000000'));
        });
    });

    describe('Buy Tokens', async () => {
        it('Permite al usuario comprar tokens a cambio de ETH.', async () => {
            let result = await ethSwap.buyTokens({ from: investor, value: tokens('1') });

            // El balance del inversor incrementa.
            let balance = await token.balanceOf(investor);
            assert.equal(balance.toString(), tokens('100'));

            // Comprueba el balance del contrato.
            let ethSwapBalance;
            ethSwapBalance = await token.balanceOf(ethSwap.address);
            assert.equal(ethSwapBalance.toString(), tokens('999900'));
            ethSwapBalance = await web3.eth.getBalance(ethSwap.address);
            assert.equal(ethSwapBalance.toString(), tokens('1'));

            const event = result.logs[0].args;
            assert.equal(event.account, investor);
            assert.equal(event.token, token.address);
            assert.equal(event.amount.toString(), tokens('100'));
            assert.equal(event.rate.toString(), '100');
        });
    });

    describe('Sell Tokens', async () => {
        it('Permite al usuario vender tokens y recibir ETH.', async () => {
            await token.approve(ethSwap.address, tokens('100'), { from: investor });
            let result = await ethSwap.sellTokens(tokens('100'), { from: investor });

            // El balance del inversor disminuye.
            let balance = await token.balanceOf(investor);
            assert.equal(balance.toString(), tokens('0'));

            // Comprueba el balance del contrato.
            let ethSwapBalance;
            ethSwapBalance = await token.balanceOf(ethSwap.address);
            assert.equal(ethSwapBalance.toString(), tokens('1000000'));
            ethSwapBalance = await web3.eth.getBalance(ethSwap.address);
            assert.equal(ethSwapBalance.toString(), tokens('0'));

            const event = result.logs[0].args;
            assert.equal(event.account, investor);
            assert.equal(event.token, token.address);
            assert.equal(event.amount.toString(), tokens('100'));
            assert.equal(event.rate.toString(), '100');

            // FAILURE: El inversor no puede vender más tokens de los que tiene.
            await ethSwap.sellTokens(tokens('500'), { from: investor }).should.be.rejected;
        });
    });
});