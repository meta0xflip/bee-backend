import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import bodyParser from "body-parser";
import helmet from "helmet";
import Web3 from "web3";
import {ethers} from "ethers";
import { nftABI } from "./assets/abi.js";
import { userData, nftData } from "./assets/sample.js";
import nodeCron from "node-cron";

// Load environment variables from .env file
try {
    dotenv.config();
} catch (error) {
    console.error("Error loading environment variables:", error);
    process.exit(1);
}

const BN = Web3.utils.BN;
const url = "https://matic-mumbai.chainstacklabs.com/v1/80001";
const web3 = new Web3("https://matic-mumbai.chainstacklabs.com");
const privateKey =
    "562fe359510311a13a65de99e89b311d21f38f569585b3e4a13f70db88dab8cb";
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
const contractAddress = "0xDa255B4C7dDCA32d6A181321d62d99e84B6402a9";
const honeyAddress = "0x60AE9954EbBB9DFC3Ed80f91877169F419A689c8";
const contract = new web3.eth.Contract(nftABI, contractAddress);

const allowedOrigins = ["http://localhost:3000", "http://66.94.122.153:3000",];

console.log(account);
const app = express();

app.use(helmet());

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors({ origin: "*" }));

app.get("/", async (req, res) => {
    res.send("server is running...")
})
app.post("/mint", async (req, res) => {
    // if (Date.now() < nftData.premintTime || Date.now() >= nftData.postmintTime) return res.json("Premint for whitelisted is not valid!");
    console.log("you are here!", req.body.to);
    try {
        let tokenIds = req.body.tokenIds;
        const txMintObject = {
            from: account.address,
            to: contractAddress,
            // gas: web3.utils.toHex(1000000000),
            gasPrice: web3.utils.toHex(10e9),
            gasLimit: 2000000,
            // gasPrice: web3.utils.toWei('1.1', 'gwei'),
            data: contract.methods
                .mint(
                    req.body.to,
                    tokenIds
                )
                .encodeABI(),
        };

        const signedTx = await account.signTransaction(txMintObject);
        const txReceipt = await web3.eth.sendSignedTransaction(
            signedTx.rawTransaction,
        );
        console.log("2222222222222222222222222")
        let options = {
            fromBlock: 0,                  //Number || "earliest" || "pending" || "latest"
            toBlock: 'latest'
        };
        
        const eventName = 'Mint';

        const result = await contract.getPastEvents('Mint');
        const nftId = result[0].returnValues.nftIds;
        console.log(nftId);
        res.send(JSON.stringify( nftId ? nftId : -100 ));
    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Something went wrong!"
        });
    }
    // res.send("you are a fool!")
})

app.post("/getEvent", async (req, res)=> {

})
app.post("/getNectar", (req, res)=>{
    console.log(req.body.address);
    let nectar = {nectar: 500}; // it has to be updated from database
    res.json(nectar);
})

// cron-job

const convertNectarToHoney = async () => {
    let to; // this is from database
    let nectarAmount; // this is from database
    try {
        const txMintObject = {
            from: account.address,
            to: honeyAddress,
            gas: web3.utils.toHex(50000),
            gasPrice: web3.utils.toHex(10e9),
            data: contract.methods
                .convertNectarToHoney(
                    to,
                    nectarAmount
                )
                .encodeABI(),
        };

        const signedTx = await account.signTransaction(txMintObject);
        const txReceipt = await web3.eth.sendSignedTransaction(
            signedTx.rawTransaction,
        );
        console.log("transaction:", txReceipt);

    } catch (e) {
        console.log(e);
        res.status(500).send({
            error: "Something went wrong!"
        });
    }
}

// const job = nodeCron.schedule("0 0 0 * * *", convertNectarToHoney());

// update expiration date or kill bee


const port = 5000;
console.log("port", port);
app.listen(port, () => console.log(`Server is listening on port ${port}`))