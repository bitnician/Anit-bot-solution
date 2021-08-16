require('@nomiclabs/hardhat-waffle');
const LPS = require('./test/LiquidityProtectionService.json');

const RPC_URL = 'http://localhost:8545';
const PRIVATE_KEY = '0xcafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe';

const assert = (condition, message) => {
  if (condition) return;
  throw new Error(message);
};

task('deploy', 'Deploy Liquidity Protection Service')
  .addParam(
    'unifactory',
    'UniswapV2Factory address (use 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f for Ethereum Mainnet)'
  )
  .setAction(async ({ unifactory }) => {
    assert(ethers.utils.isAddress(unifactory), `UniswapV2Factory address '${unifactory}' is invalid.`);
    const [deployer] = await ethers.getSigners();

    console.log(`Deploying LiquidityProtectionService with the account: ${deployer.address}`);

    console.log(`Deployer balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

    const LiquidityProtectionService = new ethers.ContractFactory(LPS.abi, LPS.bytecode, deployer);
    lps = await LiquidityProtectionService.deploy(unifactory);

    console.log('LiquidityProtectionService address:', lps.address);

    console.log('Mining...');
    await lps.deployed();
    console.log(`Deployer balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
  });

task('deploy-token', 'Deploy Exmaple Token')
  .addParam('name', 'Token contract name to deploy')
  .setAction(async ({ name }) => {
    const [deployer] = await ethers.getSigners();

    console.log(`Deploying Exmaple Token with the account: ${deployer.address}`);

    console.log(`Deployer balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

    const Token = await ethers.getContractFactory(name);
    const token = await Token.deploy(unifactory);

    console.log('Token address:', token.address);

    console.log('Mining...');
    await token.deployed();
    console.log(`Deployer balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
  });

task('revoke-blocked', 'Revoke tokens from blocked accounts')
  .addParam('token', 'Address of the protected token contract')
  .addParam('to', 'Address to transfer revoked tokens to')
  .addParam('json', 'Path to the blocked accounts json. Example: ["0x1234", "0x5678", ...]')
  .setAction(async ({ token: tokenAddress, json, to }) => {
    assert(ethers.utils.isAddress(tokenAddress), `Token address '${tokenAddress}' is invalid.`);
    assert(ethers.utils.isAddress(to), `Revoke to address '${to}' is invalid.`);
    const blocked = require(json);
    for (let account of blocked) {
      assert(ethers.utils.isAddress(account), `Blocked address '${account}' is invalid.`);
    }
    const [sender] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('ExampleToken');
    const token = await Token.attach(tokenAddress, Token.interface);

    console.log(`Revoking tokens from blocked accounts to ${to}. Transaction sender: ${sender.address}`);

    console.log(`To balance: ${ethers.utils.formatEther(await token.balanceOf(to))}`);
    console.log(`Sender balance: ${ethers.utils.formatEther(await sender.getBalance())} ETH`);

    let tx;
    const batchSize = 50n;
    for (let i = 0n; i <= BigInt(blocked.length) / batchSize; i++) {
      let entries = blocked.slice(parseInt(i * batchSize), parseInt((i + 1n) * batchSize));
      tx = await token.connect(sender).revokeBlocked(entries, to);
      console.log(`Batch ${i + 1n}: ${tx.hash}`);
    }
    console.log('Mining...');
    await (tx && tx.wait());

    console.log(`To balance: ${ethers.utils.formatEther(await token.balanceOf(to))}`);
    console.log(`Sender balance: ${ethers.utils.formatEther(await sender.getBalance())} ETH`);
  });

task('disableProtection', 'Manually disable liquidity protection')
  .addParam('token', 'Address of the protected token contract')
  .setAction(async ({ token: tokenAddress }) => {
    assert(ethers.utils.isAddress(tokenAddress), `Token address '${tokenAddress}' is invalid.`);
    const [sender] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('ExampleToken');
    const token = await Token.attach(tokenAddress, Token.interface);

    console.log(`Disabling liquidity protection with account: ${sender.address}`);

    console.log(`Sender balance: ${ethers.utils.formatEther(await sender.getBalance())} ETH`);

    const tx = await token.connect(sender).disableProtection();
    console.log(`${tx.hash}`);
    console.log('Mining...');
    await tx.wait();

    console.log(`Sender balance: ${ethers.utils.formatEther(await sender.getBalance())} ETH`);
  });

module.exports = {
  networks: {
    target: {
      url: RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999,
      },
    },
  },
};
