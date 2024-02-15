import {
  ContractSpec,
  Address,
  Contract,
  xdr,
  Operation,
} from "@stellar/stellar-sdk";
import { Buffer } from "buffer";
import type { u32, u64, i128 } from "./index.js";

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
  contract: Contract;
  constructor(contract_id: string) {
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
    this.contract = new Contract(contract_id);
  }
  private readonly parsers = {
    allowance: (result: string): i128 =>
      this.spec.funcResToNative("allowance", result),
    approve: () => {},
    balance: (result: string): i128 =>
      this.spec.funcResToNative("balance", result),
    transfer: () => {},
    transferFrom: () => {},
    burn: () => {},
    burnFrom: () => {},
    decimals: (result: string): u32 =>
      this.spec.funcResToNative("decimals", result),
    name: (result: string): string => this.spec.funcResToNative("name", result),
    symbol: (result: string): string =>
      this.spec.funcResToNative("symbol", result),
    initialize: () => {},
    totalSupply: (result: string): i128 =>
      this.spec.funcResToNative("total_supply", result),
    getPastTotalSupply: (result: string): i128 =>
      this.spec.funcResToNative("get_past_total_supply", result),
    getVotes: (result: string): i128 =>
      this.spec.funcResToNative("get_votes", result),
    getPastVotes: (result: string): i128 =>
      this.spec.funcResToNative("get_past_votes", result),
    getDelegate: (result: string): string =>
      this.spec.funcResToNative("get_delegate", result),
    delegate: () => {},
    depositFor: () => {},
    withdrawTo: () => {},
  };

  /**
   * Construct and simulate a allowance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  allowance({ from, spender }: { from: string; spender: string }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "allowance",
        ...this.spec.funcArgsToScVals("allowance", {
          from: new Address(from),
          spender: new Address(spender),
        })
      ),
      parser: this.parsers["allowance"],
    };
  }

  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  approve({
    from,
    spender,
    amount,
    expiration_ledger,
  }: {
    from: string;
    spender: string;
    amount: i128;
    expiration_ledger: u32;
  }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "approve",
        ...this.spec.funcArgsToScVals("approve", {
          from: new Address(from),
          spender: new Address(spender),
          amount,
          expiration_ledger,
        })
      ),
      parser: this.parsers["approve"],
    };
  }

  /**
   * Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  balance({ id }: { id: string }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "approve",
        ...this.spec.funcArgsToScVals("approve", {
          id: new Address(id),
        })
      ),
      parser: this.parsers["approve"],
    };
  }

  /**
   * Construct and simulate a transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer({ from, to, amount }: { from: string; to: string; amount: i128 }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "transfer",
        ...this.spec.funcArgsToScVals("transfer", {
          from: new Address(from),
          to: new Address(to),
          amount,
        })
      ),
      parser: this.parsers["transfer"],
    };
  }

  /**
   * Construct and simulate a transfer_from transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transferFrom({
    spender,
    from,
    to,
    amount,
  }: {
    spender: string;
    from: string;
    to: string;
    amount: i128;
  }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "transfer_from",
        ...this.spec.funcArgsToScVals("transfer_from", {
          spender: new Address(spender),
          from: new Address(from),
          to: new Address(to),
          amount,
        })
      ),
      parser: this.parsers["transferFrom"],
    };
  }

  /**
   * Construct and simulate a burn transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  burn({ from, amount }: { from: string; amount: i128 }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "burn",
        ...this.spec.funcArgsToScVals("burn", {
          from: new Address(from),
          amount,
        })
      ),
      parser: this.parsers["burn"],
    };
  }

  /**
   * Construct and simulate a burn_from transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  burnFrom({
    spender,
    from,
    amount,
  }: {
    spender: string;
    from: string;
    amount: i128;
  }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "burn_from",
        ...this.spec.funcArgsToScVals("burn_from", {
          from: new Address(from),
          spender: new Address(spender),
          amount,
        })
      ),
      parser: this.parsers["burnFrom"],
    };
  }

  /**
   * Construct and simulate a decimals transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  decimals(): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "decimals",
        ...this.spec.funcArgsToScVals("decimals", {})
      ),
      parser: this.parsers["decimals"],
    };
  }

  /**
   * Construct and simulate a name transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  name(): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call("name", ...this.spec.funcArgsToScVals("name", {})),
      parser: this.parsers["name"],
    };
  }

  /**
   * Construct and simulate a symbol transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  symbol(): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "symbol",
        ...this.spec.funcArgsToScVals("symbol", {})
      ),
      parser: this.parsers["symbol"],
    };
  }

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize({ token }: { token: string }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "initialize",
        ...this.spec.funcArgsToScVals("initialize", {
          token: new Address(token),
        })
      ),
      parser: this.parsers["initialize"],
    };
  }

  /**
   * Construct and simulate a total_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  totalSupply(): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "total_supply",
        ...this.spec.funcArgsToScVals("total_supply", {})
      ),
      parser: this.parsers["totalSupply"],
    };
  }

  /**
   * Construct and simulate a get_past_total_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  getPastTotalSupply({ timestamp }: { timestamp: u64 }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "get_past_total_supply",
        ...this.spec.funcArgsToScVals("get_past_total_supply", {
          timestamp,
        })
      ),
      parser: this.parsers["getPastTotalSupply"],
    };
  }

  /**
   * Construct and simulate a get_votes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  getVotes({ account }: { account: string }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "get_votes",
        ...this.spec.funcArgsToScVals("get_votes", {
          account: new Address(account),
        })
      ),
      parser: this.parsers["getVotes"],
    };
  }

  /**
   * Construct and simulate a get_past_votes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  getPastVotes({ user, timestamp }: { user: string; timestamp: u64 }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "get_past_votes",
        ...this.spec.funcArgsToScVals("get_past_votes", {
          user: new Address(user),
          timestamp,
        })
      ),
      parser: this.parsers["getPastVotes"],
    };
  }

  /**
   * Construct and simulate a get_delegate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  getDelegate({ account }: { account: string }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "get_delegate",
        ...this.spec.funcArgsToScVals("get_delegate", {
          account: new Address(account),
        })
      ),
      parser: this.parsers["getDelegate"],
    };
  }

  /**
   * Construct and simulate a delegate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  delegate({ account, delegatee }: { account: string; delegatee: string }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "delegate",
        ...this.spec.funcArgsToScVals("delegate", {
          account: new Address(account),
          delegatee: new Address(delegatee),
        })
      ),
      parser: this.parsers["delegate"],
    };
  }

  /**
   * Construct and simulate a deposit_for transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  depositFor({ from, amount }: { from: string; amount: i128 }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "deposit_for",
        ...this.spec.funcArgsToScVals("deposit_for", {
          from: new Address(from),
          amount,
        })
      ),
      parser: this.parsers["depositFor"],
    };
  }

  /**
   * Construct and simulate a withdraw_to transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  withdrawTo({ from, amount }: { from: string; amount: i128 }): {
    op: xdr.Operation<Operation.InvokeHostFunction>;
    parser: (result: string | xdr.ScVal) => void;
  } {
    return {
      op: this.contract.call(
        "withdraw_to",
        ...this.spec.funcArgsToScVals("withdraw_to", {
          from: new Address(from),
          amount,
        })
      ),
      parser: this.parsers["withdrawTo"],
    };
  }
}
