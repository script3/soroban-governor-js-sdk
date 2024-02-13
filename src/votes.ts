import { ContractSpec, Address } from "@stellar/stellar-sdk";
import { Buffer } from "buffer";
import { AssembledTransaction, Ok, Err } from "./assembled-tx.js";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
  Error_,
  Result,
} from "./assembled-tx.js";
import type { ClassOptions, XDR_BASE64 } from "./method-options.js";
import { Errors } from "./index.js";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}

/**
    
    */
export interface AllowanceDataKey {
  /**
    
    */
  from: string;
  /**
    
    */
  spender: string;
}

/**
    
    */
export interface AllowanceValue {
  /**
    
    */
  amount: i128;
  /**
    
    */
  expiration_ledger: u32;
}

/**
    
    */
export type DataKey =
  | { tag: "Allowance"; values: readonly [AllowanceDataKey] }
  | { tag: "Balance"; values: readonly [string] }
  | { tag: "Votes"; values: readonly [string] }
  | { tag: "VotesCheck"; values: readonly [string] }
  | { tag: "Delegate"; values: readonly [string] };

/**
    
    */
export interface TokenMetadata {
  /**
    
    */
  decimal: u32;
  /**
    
    */
  name: string;
  /**
    
    */
  symbol: string;
}

/**
    
    */
export interface VotingUnits {
  /**
    The number of votes available
    */
  amount: i128;
  /**
    The timestamp when the voting units valid
    */
  timestamp: u64;
}

export class VotesClient {
  spec: ContractSpec;
  constructor(public readonly options: ClassOptions) {
    this.spec = new ContractSpec([
      "AAAAAAAAAAAAAAAJYWxsb3dhbmNlAAAAAAAAAgAAAAAAAAAEZnJvbQAAABMAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAEAAAAL",
      "AAAAAAAAAAAAAAAHYXBwcm92ZQAAAAAEAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAHc3BlbmRlcgAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEWV4cGlyYXRpb25fbGVkZ2VyAAAAAAAABAAAAAA=",
      "AAAAAAAAAAAAAAAHYmFsYW5jZQAAAAABAAAAAAAAAAJpZAAAAAAAEwAAAAEAAAAL",
      "AAAAAAAAAAAAAAAIdHJhbnNmZXIAAAADAAAAAAAAAARmcm9tAAAAEwAAAAAAAAACdG8AAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
      "AAAAAAAAAAAAAAANdHJhbnNmZXJfZnJvbQAAAAAAAAQAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAAAAAAEZnJvbQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
      "AAAAAAAAAAAAAAAEYnVybgAAAAIAAAAAAAAABGZyb20AAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
      "AAAAAAAAAAAAAAAJYnVybl9mcm9tAAAAAAAAAwAAAAAAAAAHc3BlbmRlcgAAAAATAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
      "AAAAAAAAAAAAAAAIZGVjaW1hbHMAAAAAAAAAAQAAAAQ=",
      "AAAAAAAAAAAAAAAEbmFtZQAAAAAAAAABAAAAEA==",
      "AAAAAAAAAAAAAAAGc3ltYm9sAAAAAAAAAAAAAQAAABA=",
      "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAA==",
      "AAAAAAAAAAAAAAAMdG90YWxfc3VwcGx5AAAAAAAAAAEAAAAL",
      "AAAAAAAAAAAAAAAVZ2V0X3Bhc3RfdG90YWxfc3VwcGx5AAAAAAAAAQAAAAAAAAAJdGltZXN0YW1wAAAAAAAABgAAAAEAAAAL",
      "AAAAAAAAAAAAAAAJZ2V0X3ZvdGVzAAAAAAAAAQAAAAAAAAAHYWNjb3VudAAAAAATAAAAAQAAAAs=",
      "AAAAAAAAAAAAAAAOZ2V0X3Bhc3Rfdm90ZXMAAAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAl0aW1lc3RhbXAAAAAAAAAGAAAAAQAAAAs=",
      "AAAAAAAAAAAAAAAMZ2V0X2RlbGVnYXRlAAAAAQAAAAAAAAAHYWNjb3VudAAAAAATAAAAAQAAABM=",
      "AAAAAAAAAAAAAAAIZGVsZWdhdGUAAAACAAAAAAAAAAdhY2NvdW50AAAAABMAAAAAAAAACWRlbGVnYXRlZQAAAAAAABMAAAAA",
      "AAAAAAAAAAAAAAALZGVwb3NpdF9mb3IAAAAAAgAAAAAAAAAEZnJvbQAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
      "AAAAAAAAAAAAAAALd2l0aGRyYXdfdG8AAAAAAgAAAAAAAAAEZnJvbQAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
      "AAAABAAAACFUaGUgZXJyb3IgY29kZXMgZm9yIHRoZSBjb250cmFjdC4AAAAAAAAAAAAAD1Rva2VuVm90ZXNFcnJvcgAAAAAJAAAAAAAAAA1JbnRlcm5hbEVycm9yAAAAAAAAAQAAAAAAAAAXQWxyZWFkeUluaXRpYWxpemVkRXJyb3IAAAAAAwAAAAAAAAARVW5hdXRob3JpemVkRXJyb3IAAAAAAAAEAAAAAAAAABNOZWdhdGl2ZUFtb3VudEVycm9yAAAAAAgAAAAAAAAADkFsbG93YW5jZUVycm9yAAAAAAAJAAAAAAAAAAxCYWxhbmNlRXJyb3IAAAAKAAAAAAAAAA1PdmVyZmxvd0Vycm9yAAAAAAAADAAAAAAAAAAWSW5zdWZmaWNpZW50Vm90ZXNFcnJvcgAAAAAAZAAAAAAAAAAVSW52YWxpZERlbGVnYXRlZUVycm9yAAAAAAAAZQ==",
      "AAAAAQAAAAAAAAAAAAAAEEFsbG93YW5jZURhdGFLZXkAAAACAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAHc3BlbmRlcgAAAAAT",
      "AAAAAQAAAAAAAAAAAAAADkFsbG93YW5jZVZhbHVlAAAAAAACAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEWV4cGlyYXRpb25fbGVkZ2VyAAAAAAAABA==",
      "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAEAAAAAAAAACUFsbG93YW5jZQAAAAAAAAEAAAfQAAAAEEFsbG93YW5jZURhdGFLZXkAAAABAAAAAAAAAAdCYWxhbmNlAAAAAAEAAAATAAAAAQAAAAAAAAAFVm90ZXMAAAAAAAABAAAAEwAAAAEAAAAAAAAAClZvdGVzQ2hlY2sAAAAAAAEAAAATAAAAAQAAAAAAAAAIRGVsZWdhdGUAAAABAAAAEw==",
      "AAAAAQAAAAAAAAAAAAAADVRva2VuTWV0YWRhdGEAAAAAAAADAAAAAAAAAAdkZWNpbWFsAAAAAAQAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAZzeW1ib2wAAAAAABA=",
      "AAAAAQAAAAAAAAAAAAAAC1ZvdGluZ1VuaXRzAAAAAAIAAAAdVGhlIG51bWJlciBvZiB2b3RlcyBhdmFpbGFibGUAAAAAAAAGYW1vdW50AAAAAAALAAAAKVRoZSB0aW1lc3RhbXAgd2hlbiB0aGUgdm90aW5nIHVuaXRzIHZhbGlkAAAAAAAACXRpbWVzdGFtcAAAAAAAAAY=",
    ]);
  }
  private readonly parsers = {
    allowance: (result: XDR_BASE64): i128 =>
      this.spec.funcResToNative("allowance", result),
    approve: () => {},
    balance: (result: XDR_BASE64): i128 =>
      this.spec.funcResToNative("balance", result),
    transfer: () => {},
    transferFrom: () => {},
    burn: () => {},
    burnFrom: () => {},
    decimals: (result: XDR_BASE64): u32 =>
      this.spec.funcResToNative("decimals", result),
    name: (result: XDR_BASE64): string =>
      this.spec.funcResToNative("name", result),
    symbol: (result: XDR_BASE64): string =>
      this.spec.funcResToNative("symbol", result),
    initialize: () => {},
    totalSupply: (result: XDR_BASE64): i128 =>
      this.spec.funcResToNative("total_supply", result),
    getPastTotalSupply: (result: XDR_BASE64): i128 =>
      this.spec.funcResToNative("get_past_total_supply", result),
    getVotes: (result: XDR_BASE64): i128 =>
      this.spec.funcResToNative("get_votes", result),
    getPastVotes: (result: XDR_BASE64): i128 =>
      this.spec.funcResToNative("get_past_votes", result),
    getDelegate: (result: XDR_BASE64): string =>
      this.spec.funcResToNative("get_delegate", result),
    delegate: () => {},
    depositFor: () => {},
    withdrawTo: () => {},
  };
  private txFromJSON = <T>(json: string): AssembledTransaction<T> => {
    const { method, ...tx } = JSON.parse(json);
    return AssembledTransaction.fromJSON(
      {
        ...this.options,
        method,
        parseResultXdr: this.parsers[method],
      },
      tx
    );
  };
  public readonly fromJSON = {
    allowance: this.txFromJSON<ReturnType<(typeof this.parsers)["allowance"]>>,
    approve: this.txFromJSON<ReturnType<(typeof this.parsers)["approve"]>>,
    balance: this.txFromJSON<ReturnType<(typeof this.parsers)["balance"]>>,
    transfer: this.txFromJSON<ReturnType<(typeof this.parsers)["transfer"]>>,
    transferFrom: this.txFromJSON<
      ReturnType<(typeof this.parsers)["transferFrom"]>
    >,
    burn: this.txFromJSON<ReturnType<(typeof this.parsers)["burn"]>>,
    burnFrom: this.txFromJSON<ReturnType<(typeof this.parsers)["burnFrom"]>>,
    decimals: this.txFromJSON<ReturnType<(typeof this.parsers)["decimals"]>>,
    name: this.txFromJSON<ReturnType<(typeof this.parsers)["name"]>>,
    symbol: this.txFromJSON<ReturnType<(typeof this.parsers)["symbol"]>>,
    initialize: this.txFromJSON<
      ReturnType<(typeof this.parsers)["initialize"]>
    >,
    totalSupply: this.txFromJSON<
      ReturnType<(typeof this.parsers)["totalSupply"]>
    >,
    getPastTotalSupply: this.txFromJSON<
      ReturnType<(typeof this.parsers)["getPastTotalSupply"]>
    >,
    getVotes: this.txFromJSON<ReturnType<(typeof this.parsers)["getVotes"]>>,
    getPastVotes: this.txFromJSON<
      ReturnType<(typeof this.parsers)["getPastVotes"]>
    >,
    getDelegate: this.txFromJSON<
      ReturnType<(typeof this.parsers)["getDelegate"]>
    >,
    delegate: this.txFromJSON<ReturnType<(typeof this.parsers)["delegate"]>>,
    depositFor: this.txFromJSON<
      ReturnType<(typeof this.parsers)["depositFor"]>
    >,
    withdrawTo: this.txFromJSON<
      ReturnType<(typeof this.parsers)["withdrawTo"]>
    >,
  };
  /**
   * Construct and simulate a allowance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  allowance = async (
    { from, spender }: { from: string; spender: string },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "allowance",
      args: this.spec.funcArgsToScVals("allowance", {
        from: new Address(from),
        spender: new Address(spender),
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["allowance"],
    });
  };

  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  approve = async (
    {
      from,
      spender,
      amount,
      expiration_ledger,
    }: { from: string; spender: string; amount: i128; expiration_ledger: u32 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "approve",
      args: this.spec.funcArgsToScVals("approve", {
        from: new Address(from),
        spender: new Address(spender),
        amount,
        expiration_ledger,
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["approve"],
    });
  };

  /**
   * Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  balance = async (
    { id }: { id: string },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "balance",
      args: this.spec.funcArgsToScVals("balance", { id: new Address(id) }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["balance"],
    });
  };

  /**
   * Construct and simulate a transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer = async (
    { from, to, amount }: { from: string; to: string; amount: i128 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "transfer",
      args: this.spec.funcArgsToScVals("transfer", {
        from: new Address(from),
        to: new Address(to),
        amount,
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["transfer"],
    });
  };

  /**
   * Construct and simulate a transfer_from transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transferFrom = async (
    {
      spender,
      from,
      to,
      amount,
    }: { spender: string; from: string; to: string; amount: i128 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "transfer_from",
      args: this.spec.funcArgsToScVals("transfer_from", {
        spender: new Address(spender),
        from: new Address(from),
        to: new Address(to),
        amount,
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["transferFrom"],
    });
  };

  /**
   * Construct and simulate a burn transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  burn = async (
    { from, amount }: { from: string; amount: i128 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "burn",
      args: this.spec.funcArgsToScVals("burn", {
        from: new Address(from),
        amount,
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["burn"],
    });
  };

  /**
   * Construct and simulate a burn_from transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  burnFrom = async (
    { spender, from, amount }: { spender: string; from: string; amount: i128 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "burn_from",
      args: this.spec.funcArgsToScVals("burn_from", {
        spender: new Address(spender),
        from: new Address(from),
        amount,
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["burnFrom"],
    });
  };

  /**
   * Construct and simulate a decimals transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  decimals = async (
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "decimals",
      args: this.spec.funcArgsToScVals("decimals", {}),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["decimals"],
    });
  };

  /**
   * Construct and simulate a name transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  name = async (
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "name",
      args: this.spec.funcArgsToScVals("name", {}),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["name"],
    });
  };

  /**
   * Construct and simulate a symbol transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  symbol = async (
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "symbol",
      args: this.spec.funcArgsToScVals("symbol", {}),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["symbol"],
    });
  };

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize = async (
    { token }: { token: string },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "initialize",
      args: this.spec.funcArgsToScVals("initialize", {
        token: new Address(token),
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["initialize"],
    });
  };

  /**
   * Construct and simulate a total_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  totalSupply = async (
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "total_supply",
      args: this.spec.funcArgsToScVals("total_supply", {}),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["totalSupply"],
    });
  };

  /**
   * Construct and simulate a get_past_total_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  getPastTotalSupply = async (
    { timestamp }: { timestamp: u64 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "get_past_total_supply",
      args: this.spec.funcArgsToScVals("get_past_total_supply", { timestamp }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["getPastTotalSupply"],
    });
  };

  /**
   * Construct and simulate a get_votes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  getVotes = async (
    { account }: { account: string },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "get_votes",
      args: this.spec.funcArgsToScVals("get_votes", {
        account: new Address(account),
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["getVotes"],
    });
  };

  /**
   * Construct and simulate a get_past_votes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  getPastVotes = async (
    { user, timestamp }: { user: string; timestamp: u64 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "get_past_votes",
      args: this.spec.funcArgsToScVals("get_past_votes", {
        user: new Address(user),
        timestamp,
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["getPastVotes"],
    });
  };

  /**
   * Construct and simulate a get_delegate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  getDelegate = async (
    { account }: { account: string },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "get_delegate",
      args: this.spec.funcArgsToScVals("get_delegate", {
        account: new Address(account),
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["getDelegate"],
    });
  };

  /**
   * Construct and simulate a delegate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  delegate = async (
    { account, delegatee }: { account: string; delegatee: string },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "delegate",
      args: this.spec.funcArgsToScVals("delegate", {
        account: new Address(account),
        delegatee: new Address(delegatee),
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["delegate"],
    });
  };

  /**
   * Construct and simulate a deposit_for transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  depositFor = async (
    { from, amount }: { from: string; amount: i128 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "deposit_for",
      args: this.spec.funcArgsToScVals("deposit_for", {
        from: new Address(from),
        amount,
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["depositFor"],
    });
  };

  /**
   * Construct and simulate a withdraw_to transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  withdrawTo = async (
    { from, amount }: { from: string; amount: i128 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "withdraw_to",
      args: this.spec.funcArgsToScVals("withdraw_to", {
        from: new Address(from),
        amount,
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["withdrawTo"],
    });
  };
}
