# Liquidity Protection Service Client

## Installation

    npm install
    npm run compile

## Testing

    npm run test

## Deployment

    Set target network node url and deployer private key in the hardhat.config.js.

    npm run hardhat -- --network target deploy --unifactory 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f

## Integration

See ExampleToken.sol

## Usage

Deploy your token (will work out of the box if your token doesn't have constructor args):

    npm run hardhat -- --network target deploy-token --name ExampleToken

Revoke tokens from blocked accounts (must be done while protection is still on):

    npm run hardhat -- --network target revoke-blocked --token 0xTokenAddress --to 0xRevokeToAddress --json ./blocked.example.json

Disable protection to make transfers cheaper:

    npm run hardhat -- --network target disableProtection --token 0xTokenAddress
