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
    // const signer = wallet.connect(provider);
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
    //------------------DELEGATION OPERATION----------------
    console.log("Delegation...")
    const delegateTx1 = await tokenContract
        .connect(accounts[0])
        .delegate(accounts[0].address);
    await delegateTx1.wait();
    const delegateTx2 = await tokenContract
        .connect(accounts[1])
        .delegate(accounts[1].address);
    await delegateTx2.wait();
    console.log("Results of delegation...")
    console.log({delegateTx1, delegateTx2})
    //------------------VOTING OPERATION-------------------
    const voteTx1 = await customBallotContract
    .connect(accounts[0])
    .vote(0, USED_VOTE_POWER);
    await voteTx1.wait();

    console.log("Result of vote...")
    console.log({voteTx1})

    const voteTx2 = await customBallotContract
    .connect(accounts[1])
    .vote(0, USED_VOTE_POWER);
    await voteTx2.wait();

    console.log("Result of vote...")
    console.log({voteTx2})
    //------------------POST VOTE OPERATION-------------------

    for(let i = 0; i < 3; i++){
        // await tokenContract.
        const proposal = await customBallotContract.proposals(i);
        const name = ethers.utils.parseBytes32String(proposal.name);
        const voteCount = ethers.utils.formatUnits(proposal.voteCount)
        console.log({proposal, name, voteCount });
    }

    //------------------GET PAST VOTES-----------------------
    const historicVotePower = await tokenContract.getPastVotes(
        accounts[0].address,
        0
    );
    
    console.log("Past votes...")
    console.log({historicVotePower})
    //------------------GET VOTES---------------------------
    const votes = await tokenContract.getVotes(
        accounts[0].address
    );

    console.log("Votes...")
    console.log({votes})
}


// {
//     mintTx1: {
//       type: 2,
//       chainId: 3,
//       nonce: 75,
//       maxPriorityFeePerGas: BigNumber { value: "1500000000" },
//       maxFeePerGas: BigNumber { value: "4629340412" },
//       gasPrice: null,
//       gasLimit: BigNumber { value: "75993" },
//       to: '0x4b6FE7b0336bCedF801DEe496F76a836C8D4e283',
//       value: BigNumber { value: "0" },
//       data: '0x40c10f19000000000000000000000000e39e554e4ce364ec49a742a5f39133f53c0593810000000000000000000000000000000000000000000000008ac7230489e80000',
//       accessList: [],
//       hash: '0x1ec4db774744b51bcd3591b8c3c1bce6b5d37cc907fd205434718dceb1b8cc0a',
//       v: 0,
//       r: '0x32bb375ae9d980cf5e7368d0c856e5fad5b379fbe6baeb9d3ab9a99d667f7037',
//       s: '0x6eb84a8c246e0857447911e0210da40e8a3ea90f34b0e5164b8bda34a8413e8a',
//       from: '0xE39e554E4ce364Ec49A742A5f39133F53C059381',
//       confirmations: 0,
//       wait: [Function (anonymous)]
//     },
//     mintTx2: {
//       type: 2,
//       chainId: 3,
//       nonce: 76,
//       maxPriorityFeePerGas: BigNumber { value: "1500000000" },
//       maxFeePerGas: BigNumber { value: "4657143094" },
//       gasPrice: null,
//       gasLimit: BigNumber { value: "93093" },
//       to: '0x4b6FE7b0336bCedF801DEe496F76a836C8D4e283',
//       value: BigNumber { value: "0" },
//       data: '0x40c10f19000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000008ac7230489e80000',
//       accessList: [],
//       hash: '0xdd9b6c773107b8702a2673427097d2ca49e08748411f7b35df978facebc6f644',
//       v: 0,
//       r: '0x5b183765691ba8b36bcbcf8594e23c0b91b029606f55b3f1260e8d5ce539fd6c',
//       s: '0x507450d476c88ec470b5aad4ceab09798b59f016c8fea2cbd996b235d5899532',
//       from: '0xE39e554E4ce364Ec49A742A5f39133F53C059381',
//       confirmations: 0,
//       wait: [Function (anonymous)]
//     }
//   }
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  