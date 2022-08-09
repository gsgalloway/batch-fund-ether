import { ethers } from "ethers";
import { MetaTransactionData } from "@gnosis.pm/safe-core-sdk-types";
import Safe from "@gnosis.pm/safe-core-sdk";
import EthersAdapter from "@gnosis.pm/safe-ethers-lib";
import SafeServiceClient from "@gnosis.pm/safe-service-client";
import * as dotenv from "dotenv";
import addresses from "../addresses.json";

dotenv.config();

// Set this
const amountToTransferPerAddress = ethers.utils.parseEther("0.005");

async function proposeBatchFundingTransaction() {
  const safeAddress = process.env.SAFE_ADDRESS ?? "";
  const safeSignerPrivKey = process.env.SAFE_SIGNER_PRIV_KEY ?? "";
  const web3Provider = new ethers.providers.InfuraProvider();

  const signer = new ethers.Wallet(safeSignerPrivKey, web3Provider);

  const ethAdapter = new EthersAdapter({
    ethers,
    signer,
  });
  const safeSdk = await Safe.create({ ethAdapter, safeAddress });
  const safeService = new SafeServiceClient({
    txServiceUrl: "https://safe-transaction.gnosis.io",
    ethAdapter,
  });

  const transactions: MetaTransactionData[] = addresses.map((addr) => ({
    data: "0x",
    to: addr,
    value: amountToTransferPerAddress.toString(),
  }));
  const safeTransaction = await safeSdk.createTransaction(transactions);

  console.log("Signing transaction...");
  const signedSafeTransaction = await safeSdk.signTransaction(safeTransaction);

  console.log("Proposing (but not executing) transaction...");
  await safeService.proposeTransaction({
    safeAddress,
    safeTransactionData: signedSafeTransaction.data,
    safeTxHash: await safeSdk.getTransactionHash(signedSafeTransaction),
    senderAddress: signer.address,
    senderSignature: signedSafeTransaction.encodedSignatures(),
  });

  console.log("Done.");
}

function printAddressesFromSeedPhrase() {
  const hdNode = ethers.utils.HDNode.fromMnemonic(
    process.env.METAMASK_SEED_PHRASE ?? ""
  );
  const addrs: string[] = [];
  for (let i = 0; i < 100; i++) {
    addrs.push(hdNode.derivePath(`m/44'/60'/0'/0/${i}`).address);
  }
  console.log(addrs);
}

// proposeBatchFundingTransaction();
printAddressesFromSeedPhrase();
