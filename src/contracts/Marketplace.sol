pragma solidity >=0.4.21 <0.6.0;

contract Marketplace {

    string public name;
    uint public productCount = 0 ;
    mapping(uint => Product) public products;
    
    constructor() public {
        name = "Blockchain Marketplace";
    }

    struct Product {
        uint id;
        string name;
        uint price;
        address payable owner;
        bool isPurchased;
    }

    event ProductCreated (
        uint id,
        string name,
        uint price,
        address payable owner,
        bool isPurchased
    );

    event ProductPurchased (
        uint id,
        string name,
        uint price,
        address payable owner,
        bool isPurchased
    );

    function createProduct(string memory _name, uint _price) public{

        require(bytes(_name).length>0, 'Name required');

        require(_price > 0, 'Price required');
        //Increment product count
        productCount++;

        //Create product
        products[productCount] = Product(productCount, _name, _price, msg.sender, false);

        //Trigger Event
        emit ProductCreated(productCount, _name, _price, msg.sender, false);
    }

    function purchaseProduct(uint _id) public payable {
        //Fetch the product
        Product memory _product = products[_id];
        //Fetch the owner
        address payable _seller = _product.owner;
        //Make sure the product has a valid id
        require(_product.id > 0 && _product.id <= productCount, "");
        //Require that there is enough ether in the transaction
        require(msg.value>=_product.price, "Insufficient amount");
        //Make sure the product is valid
        require(!_product.isPurchased,"Already purchased product");
        //Ensure that the seller and the buyer are not the same
        require(_seller != msg.sender, "Buyer cannot be the seller");
        //Transfer ownership to the buyer
        _product.owner = msg.sender;
        //Mark as purchased
        _product.isPurchased = true;
        //Update the product in the products array
        products[_id] = _product;
        //Pay the seller by sending them ether
        address(_seller).transfer(msg.value);
        //Trigger an event
        emit ProductPurchased(productCount, _product.name, _product.price, msg.sender, true);

    }

}