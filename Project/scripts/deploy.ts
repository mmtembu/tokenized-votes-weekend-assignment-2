import { ethers } from "ethers";
import "dotenv/config";
import * as customBallotJson from "../artifacts/contracts/CustomBallot.sol/CustomBallot.json";
import * as tokenJson from "../artifacts/contracts/Token.sol/MyToken.json";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "a8b513369437e05aee54948867a86923858a71d5ac380e7db91fd9717e453909";

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

async function main() {
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
  console.log(`Using address ${wallet.address}`);
  const provider = ethers.providers.getDefaultProvider("ropsten");
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  const lastBlock = await provider.getBlock('latest');
  console.log(`Connected to ropsten network at height ${lastBlock}`)
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }
  
  console.log("Deploying Ballot contract");
  console.log("Proposals: ");
  const proposals = ["Proposal 1", "Proposal 2", "Proposal 3"];
  if (proposals.length < 2) throw new Error("Not enough proposals provided");
  proposals.forEach((element, index) => {
    console.log(`Proposal N. ${index + 1}: ${element}`);
  });

  const[customBallotFactory, tokenFactory] = await Promise.all([
    new ethers.ContractFactory(
        customBallotJson.abi,
        customBallotJson.bytecode,
        signer
      ),
    new ethers.ContractFactory(
        tokenJson.abi,
        tokenJson.bytecode,
        signer
      ),
  ])


console.log("Awaiting confirmation for Token Contract Deployment...")
const tokenContract = await tokenFactory.deploy();
await tokenContract.deployed();
console.log("Completed");
console.log(`Token Contract deployed at ${tokenContract}`);

  const customBallotContract = await customBallotFactory.deploy(
    convertStringArrayToBytes32(proposals),
    tokenContract.address,
  );

  console.log("Awaiting confirmation for Ballot Contract Deployment...");
  await customBallotContract.deployed();
  console.log("Completed");
  console.log(`Ballot Contract deployed at ${customBallotContract}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
