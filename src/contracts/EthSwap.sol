pragma solidity ^0.5.0;

// Imports
import "./Token.sol";

contract EthSwap {
    // Variables
    Token public token;
    uint public rate = 100;

    // Eventos
    event TokensPurchased(address account, address token, uint amount, uint rate);
    event TokensSold(address account, address token, uint amount, uint rate);

    // Constructor
    constructor(Token _token) public {
        token = _token;
    }

    // Funciones
    /**
     * @notice Función que permite comprar tokens.
     */
    function buyTokens() public payable {
        uint _tokenAmount = msg.value * rate; // Calcula la cantidad de tokens que se van a comprar. 
        require(token.balanceOf(address(this)) >= _tokenAmount, 'No hay suficiente liquidez.');

        token.transfer(msg.sender, _tokenAmount);

        emit TokensPurchased(msg.sender, address(token), _tokenAmount, rate);    
    }

    /**
     * @notice Función que nos permite vender tokens.
     * @param _amount Cantidad de tokens que va a vender.
     */
    function sellTokens(uint _amount) public {
        require(token.balanceOf(msg.sender) >= _amount, 'No tienes suficientes tokens.'); // Comprueba que el inversor no intente vender más tokens de los que tiene
        uint _etherAmount = _amount / rate; // Calcula la cantidad de tokens que se van a vender.
        require(address(this).balance >= _etherAmount, 'No hay suficientes ETH.'); // Comprueba que el contrato tiene ETHs suficientes para la venta.

        token.transferFrom(msg.sender, address(this), _amount); // Transfiere los tokens desde la cuenta del inversor a la del contrato.
        msg.sender.transfer(_etherAmount); // Transfiere los ETH a la cuenta del inversor.

        emit TokensSold(msg.sender, address(token), _amount, rate);
    }
}