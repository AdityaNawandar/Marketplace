const Marketplace = artifacts.require('./Marketplace.sol')

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Marketplace', ([deployer, seller, buyer]) => {

    let marketplace

    before(async () => {
        marketplace = await Marketplace.deployed()
    })

    describe('deployment', async () => {
        it('deploys successfully', async () => {
            const address = await marketplace.address
            assert.notEqual(address, 0x0)
            assert.notEqual(address, null)
            assert.notEqual(address, "")
            assert.notEqual(address, undefined)
        })

        it('has a name', async () => {
            const name = await marketplace.name()
            assert.equal(name, 'Blockchain Marketplace')
        })

    })

    describe('products', async () => {
        let result, productCount
        before(async () => {
            result = await marketplace.createProduct('Asus Zenfone', web3.utils.toWei('1', 'Ether'), { from: seller })
            productCount = await marketplace.productCount()
        })

        it('creates products', async () => {
            //Success
            assert.equal(productCount, 1)
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct');
            assert.equal(event.name, 'Asus Zenfone', 'name is correct');
            assert.equal(event.price, '1000000000000000000', 'price is correct');
            assert.equal(event.owner, seller, 'name is correct');
            assert.equal(event.isPurchased, false, 'purchased status is correct');

            //Failure
            //Product must have a name
            await marketplace.createProduct('', web3.utils.toWei('1', 'Ether'), { from: seller }).should.be.rejected;
            //Product must have a price
            await marketplace.createProduct('Asus Zenfone', 0, { from: seller }).should.be.rejected;
        })

        it('lists products', async () => {
            const product = await marketplace.products(productCount);
            assert.equal(product.id.toNumber(), productCount.toNumber(), 'id is correct');
            assert.equal(product.name, 'Asus Zenfone', 'name is correct');
            assert.equal(product.price, '1000000000000000000', 'price is correct');
            assert.equal(product.owner, seller, 'name is correct');
            assert.equal(product.isPurchased, false, 'purchased status is correct');
        })

        it('sells product', async () => {

            //Track the seller balance before purchase
            let sellerInitialBalance

            sellerInitialBalance = await web3.eth.getBalance(seller)
            sellerInitialBalance = new web3.utils.BN(sellerInitialBalance)

            //SUCCESS: Buyer makes purchase
            result = await marketplace.purchaseProduct(productCount,
                { from: buyer, value: web3.utils.toWei('1', 'Ether') })

            //Check logs
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct');
            assert.equal(event.name, 'Asus Zenfone', 'name is correct');
            assert.equal(event.price, '1000000000000000000', 'price is correct');
            assert.equal(event.owner, buyer, 'name is correct');
            assert.equal(event.isPurchased, true, 'purchased status is correct');

            //Check that the seller received funds
            let sellerNewBalance
            sellerNewBalance = await web3.eth.getBalance(seller)
            sellerNewBalance = new web3.utils.BN(sellerNewBalance)

            let price
            price = web3.utils.toWei('1', 'Ether')
            price = new web3.utils.BN(price)

            //console.log(sellerInitialBalance, sellerNewBalance, price);

            const expectedBalance = sellerInitialBalance.add(price);
            assert.equal(sellerNewBalance.toString(), expectedBalance.toString())

            //FAILURE: Tries to buy product that does not exist
            await marketplace.purchaseProduct(99,
                { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
            //FAILURE: Tries to buy without enough ether
            await marketplace.purchaseProduct(productCount,
                { from: buyer, value: web3.utils.toWei('0.6', 'Ether') }).should.be.rejected;
            //FAILURE: Tries to buy an already purchased product
            await marketplace.purchaseProduct(productCount,
                { from: deployer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
            //FAILURE: Buyer tries to buy it again (from himself); Buyer can't be the seller
            await marketplace.purchaseProduct(productCount,
                { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
        })

    })

}) 