import { ethers } from "ethers";
import * as hardHat from "hardhat";
import "dotenv/config";
import * as customBallotJson from "../artifacts/contracts/CustomBallot.sol/CustomBallot.json";
import * as tokenJson from "../artifacts/contracts/Token.sol/MyToken.json";
import { CustomBallot } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "a8b513369437e05aee54948867a86923858a71d5ac380e7db91fd9717e453909";
const BASE_VOTE_POWER = 10;
const USED_VOTE_POWER = 5;
const MAIN_ADDRESS = "0xE39e554E4ce364Ec49A742A5f39133F53C059381";

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

async function main() {
    const accounts: SignerWithAddress[] = await hardHat.ethers.getSigners();
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

    const customBallotContract
    = customBallotFactory
    .attach("0x0dAd88c6d36c5056216d7cc4f5e3B94465Ea5015");
    
    const tokenContract = tokenFactory
    .attach("0x4b6FE7b0336bCedF801DEe496F76a836C8D4e283");

    //------------------MINTING OPERATION------------------

    const preMintVotePower = await tokenContract.getVotes(
        accounts[0].address
    );
    console.log("Votes before voting...")
    console.log({preMintVotePower})

    console.log("Minting...")
    const mintTx1 = await tokenContract.mint(
        accounts[0].address,
        ethers.utils.parseEther(BASE_VOTE_POWER.toFixed(18))
    );
    await mintTx1.wait();
    
    const mintTx2 = await tokenContract.mint(
        accounts[1].address,
        ethers.utils.parseEther(BASE_VOTE_POWER.toFixed(18))
    );
    await mintTx2.wait();

    console.log("Results of minting...")
    console.log({mintTx1, mintTx2})
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  