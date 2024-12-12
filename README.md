# soroban-governor-js-sdk JS

JS library for interacting with [Soroban](https://soroban.stellar.org/) smart contracts `soroban-governor` and `soroban-votes` via Soroban RPC.

# Use it

Now that you have your library up-to-date and added to your project, you can import it in a file and see inline documentation for all of its exported methods:

```js
import { VotesClient } from "soroban-governor-js-sdk";

let stellarRpc = new rpc.Server("rpcUrl");
let account = await stellarRpc.getAccount("public key");
let votes = new VotesClient("Contract Address");

let { op, parser } = votes.depositFor({
  from: config.admin.publicKey(),
  amount: 100000n,
});

// Create transaction from operation
let tx = new TransactionBuilder(account, {
  fee: "10000",
  networkPassphrase: "passphrase",
})
  .setTimeout(TimeoutInfinite)
  .addOperation(xdr.Operation.fromXDR(op.toXDR("base64"), "base64"))
  .build();

// Simulate
let sim_resp = await stellarRpc.simulateTransaction(tx);

// Parse Response
let result = ContractResult.fromSimulationResponse(sim_resp, parser);

// Error handling
if (result.result.isErr()) {
  let error = result.result.unwrapErr();
  if (error.type == ContractErrorType.InvokeHostFunctionEntryArchived) {
    // create a restore ledger entry tx_builder
  } else {
    throw result.result.unwrapErr();
  }
}

// ...Handle transaction signing and submitting
```
