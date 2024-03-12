import { Address, Contract, ContractSpec } from "@stellar/stellar-sdk";
import type { i128, u32, u64 } from "./index.js";

/**
 * The error codes for the Votes contract.
 */
export const VotesErrors = {
  1: { message: "InternalError" },
  3: { message: "AlreadyInitializedError" },
  4: { message: "UnauthorizedError" },
  8: { message: "NegativeAmountError" },
  9: { message: "AllowanceError" },
  10: { message: "BalanceError" },
  12: { message: "OverflowError" },
  100: { message: "InsufficientVotesError" },
  101: { message: "InvalidDelegateeError" },
  102: { message: "InvalidCheckpointError" },
  103: { message: "SequenceNotClosedError" },
};

/**
 * The data key for the allowance
 */
export interface AllowanceDataKey {
  from: string;
  spender: string;
}

/**
 * The value of the allowance
 */
export interface AllowanceValue {
  amount: i128;
  expiration_ledger: u32;
}

/**
 * The data key for the Votes contract
 */
export type DataKey =
  | { tag: "Allowance"; values: readonly [AllowanceDataKey] }
  | { tag: "Balance"; values: readonly [string] }
  | { tag: "Votes"; values: readonly [string] }
  | { tag: "VotesCheck"; values: readonly [string] }
  | { tag: "Delegate"; values: readonly [string] };

export interface TokenMetadata {
  decimal: u32;
  name: string;
  symbol: string;
}

export interface VotingUnits {
  /**
   * The number of votes available
   */
  amount: i128;
  /**
   * The timestamp when the voting units valid
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
      "AAAAAAAAAAAAAAAMdG90YWxfc3VwcGx5AAAAAAAAAAEAAAAL",
      "AAAAAAAAAAAAAAARc2V0X3ZvdGVfc2VxdWVuY2UAAAAAAAABAAAAAAAAAAhzZXF1ZW5jZQAAAAQAAAAA",
      "AAAAAAAAAAAAAAAVZ2V0X3Bhc3RfdG90YWxfc3VwcGx5AAAAAAAAAQAAAAAAAAAIc2VxdWVuY2UAAAAEAAAAAQAAAAs=",
      "AAAAAAAAAAAAAAAJZ2V0X3ZvdGVzAAAAAAAAAQAAAAAAAAAHYWNjb3VudAAAAAATAAAAAQAAAAs=",
      "AAAAAAAAAAAAAAAOZ2V0X3Bhc3Rfdm90ZXMAAAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAhzZXF1ZW5jZQAAAAQAAAABAAAACw==",
      "AAAAAAAAAAAAAAAMZ2V0X2RlbGVnYXRlAAAAAQAAAAAAAAAHYWNjb3VudAAAAAATAAAAAQAAABM=",
      "AAAAAAAAAAAAAAAIZGVsZWdhdGUAAAACAAAAAAAAAAdhY2NvdW50AAAAABMAAAAAAAAACWRlbGVnYXRlZQAAAAAAABMAAAAA",
      "AAAAAAAAAAAAAAAEbWludAAAAAIAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
      "AAAAAAAAAAAAAAAJc2V0X2FkbWluAAAAAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAA=",
      "AAAAAAAAAAAAAAAFYWRtaW4AAAAAAAAAAAAAAQAAABM=",
      "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAgAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAhnb3Zlcm5vcgAAABMAAAAA",
      "AAAAAAAAAAAAAAALZGVwb3NpdF9mb3IAAAAAAgAAAAAAAAAEZnJvbQAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
      "AAAAAAAAAAAAAAALd2l0aGRyYXdfdG8AAAAAAgAAAAAAAAAEZnJvbQAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
      "AAAABAAAACFUaGUgZXJyb3IgY29kZXMgZm9yIHRoZSBjb250cmFjdC4AAAAAAAAAAAAAD1Rva2VuVm90ZXNFcnJvcgAAAAALAAAAAAAAAA1JbnRlcm5hbEVycm9yAAAAAAAAAQAAAAAAAAAXQWxyZWFkeUluaXRpYWxpemVkRXJyb3IAAAAAAwAAAAAAAAARVW5hdXRob3JpemVkRXJyb3IAAAAAAAAEAAAAAAAAABNOZWdhdGl2ZUFtb3VudEVycm9yAAAAAAgAAAAAAAAADkFsbG93YW5jZUVycm9yAAAAAAAJAAAAAAAAAAxCYWxhbmNlRXJyb3IAAAAKAAAAAAAAAA1PdmVyZmxvd0Vycm9yAAAAAAAADAAAAAAAAAAWSW5zdWZmaWNpZW50Vm90ZXNFcnJvcgAAAAAAZAAAAAAAAAAVSW52YWxpZERlbGVnYXRlZUVycm9yAAAAAAAAZQAAAAAAAAAWSW52YWxpZENoZWNrcG9pbnRFcnJvcgAAAAAAZgAAAAAAAAAWU2VxdWVuY2VOb3RDbG9zZWRFcnJvcgAAAAAAZw==",
      "AAAAAQAAAAAAAAAAAAAAEEFsbG93YW5jZURhdGFLZXkAAAACAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAHc3BlbmRlcgAAAAAT",
      "AAAAAQAAAAAAAAAAAAAADkFsbG93YW5jZVZhbHVlAAAAAAACAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEWV4cGlyYXRpb25fbGVkZ2VyAAAAAAAABA==",
      "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAEAAAAAAAAACUFsbG93YW5jZQAAAAAAAAEAAAfQAAAAEEFsbG93YW5jZURhdGFLZXkAAAABAAAAAAAAAAdCYWxhbmNlAAAAAAEAAAATAAAAAQAAAAAAAAAFVm90ZXMAAAAAAAABAAAAEwAAAAEAAAAAAAAAClZvdGVzQ2hlY2sAAAAAAAEAAAATAAAAAQAAAAAAAAAIRGVsZWdhdGUAAAABAAAAEw==",
      "AAAAAQAAAAAAAAAAAAAADVRva2VuTWV0YWRhdGEAAAAAAAADAAAAAAAAAAdkZWNpbWFsAAAAAAQAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAZzeW1ib2wAAAAAABA=",
    ]);
    this.contract = new Contract(contract_id);
  }
  readonly parsers = {
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
   * Constructs an allowance operation
   * @param from The address of the owner of the tokens
   * @param spender The address of the spender
   * @returns An object containing the operation and a parser for the result
   */
  allowance({ from, spender }: { from: string; spender: string }): string {
    return this.contract
      .call(
        "allowance",
        ...this.spec.funcArgsToScVals("allowance", {
          from: new Address(from),
          spender: new Address(spender),
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs an approve operation
   * @param from The address of the owner of the tokens
   * @param spender The address of the spender
   * @param amount The amount of tokens to approve
   * @param expiration_ledger The expiration ledger
   * @returns An object containing the operation and a parser for the result
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
  }): string {
    return this.contract
      .call(
        "approve",
        ...this.spec.funcArgsToScVals("approve", {
          from: new Address(from),
          spender: new Address(spender),
          amount,
          expiration_ledger,
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs a balance operation
   * @param id The address of the account
   * @returns An object containing the operation and a parser for the result
   */
  balance({ id }: { id: string }): string {
    return this.contract
      .call(
        "balance",
        ...this.spec.funcArgsToScVals("balance", {
          id: new Address(id),
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs a transfer operation
   * @param from The address of the sender
   * @param to The address of the recipient
   * @param amount The amount of tokens to transfer
   * @returns An object containing the operation and a parser for the result
   */
  transfer({
    from,
    to,
    amount,
  }: {
    from: string;
    to: string;
    amount: i128;
  }): string {
    return this.contract
      .call(
        "transfer",
        ...this.spec.funcArgsToScVals("transfer", {
          from: new Address(from),
          to: new Address(to),
          amount,
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs a transfer_from operation
   * @param spender The address of the spender
   * @param from The address of the sender
   * @param to The address of the recipient
   * @param amount The amount of tokens to transfer
   * @returns An object containing the operation and a parser for the result
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
  }): string {
    return this.contract
      .call(
        "transfer_from",
        ...this.spec.funcArgsToScVals("transfer_from", {
          spender: new Address(spender),
          from: new Address(from),
          to: new Address(to),
          amount,
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs a burn operation
   * @param from The address of the account
   * @param amount The amount of tokens to burn
   * @returns An object containing the operation and a parser for the result
   */
  burn({ from, amount }: { from: string; amount: i128 }): string {
    return this.contract
      .call(
        "burn",
        ...this.spec.funcArgsToScVals("burn", {
          from: new Address(from),
          amount,
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs a burn_from operation
   * @param spender The address of the spender
   * @param from The address of the account
   * @param amount The amount of tokens to burn
   * @returns An object containing the operation and a parser for the result
   */
  burnFrom({
    spender,
    from,
    amount,
  }: {
    spender: string;
    from: string;
    amount: i128;
  }): string {
    return this.contract
      .call(
        "burn_from",
        ...this.spec.funcArgsToScVals("burn_from", {
          from: new Address(from),
          spender: new Address(spender),
          amount,
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs a decimals operation (READ ONLY: Operation should only be simulated)
   * @returns An object containing the operation and a parser for the result
   */
  decimals(): string {
    return this.contract
      .call("decimals", ...this.spec.funcArgsToScVals("decimals", {}))
      .toXDR("base64");
  }

  /**
   * Constructs a name operation (READ ONLY: Operation should only be simulated)
   * @returns An object containing the operation and a parser for the result
   */
  name(): string {
    return this.contract
      .call("name", ...this.spec.funcArgsToScVals("name", {}))
      .toXDR("base64");
  }

  /**
   * Constructs a symbol operation (READ ONLY: Operation should only be simulated)
   * @returns An object containing the operation and a parser for the result
   */
  symbol(): string {
    return this.contract
      .call("symbol", ...this.spec.funcArgsToScVals("symbol", {}))
      .toXDR("base64");
  }

  /**
   * Constructs an initialize operation
   * @param token The address of the voting token
   * @param governor The address of the governor
   * @returns An object containing the operation and a parser for the result
   */
  initialize({ token, governor }: { token: string; governor: string }): string {
    return this.contract
      .call(
        "initialize",
        ...this.spec.funcArgsToScVals("initialize", {
          token: new Address(token),
          governor: new Address(governor),
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs a total_supply operation (READ ONLY: Operation should only be simulated)
   * @returns An object containing the operation and a parser for the result
   */
  totalSupply(): string {
    return this.contract
      .call("total_supply", ...this.spec.funcArgsToScVals("total_supply", {}))
      .toXDR("base64");
  }

  /**
   * Constructs a get_past_total_supply operation (READ ONLY: Operation should only be simulated)
   * @param sequence The sequence number
   * @returns An object containing the operation and a parser for the result
   */
  getPastTotalSupply({ sequence }: { sequence: u32 }): string {
    return this.contract
      .call(
        "get_past_total_supply",
        ...this.spec.funcArgsToScVals("get_past_total_supply", {
          sequence,
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs a get_votes operation (READ ONLY: Operation should only be simulated)
   * @param account The address of the account
   * @returns An object containing the operation and a parser for the result
   */
  getVotes({ account }: { account: string }): string {
    return this.contract
      .call(
        "get_votes",
        ...this.spec.funcArgsToScVals("get_votes", {
          account: new Address(account),
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs a get_past_votes operation (READ ONLY: Operation should only be simulated)
   * @param user The address of the user
   * @param sequence The sequence number
   * @returns An object containing the operation and a parser for the result
   */
  getPastVotes({ user, sequence }: { user: string; sequence: u32 }): string {
    return this.contract
      .call(
        "get_past_votes",
        ...this.spec.funcArgsToScVals("get_past_votes", {
          user: new Address(user),
          sequence,
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs a get_delegate operation (READ ONLY: Operation should only be simulated)
   * @param account The address of the account
   * @returns An object containing the operation and a parser for the result
   */
  getDelegate({ account }: { account: string }): string {
    return this.contract
      .call(
        "get_delegate",
        ...this.spec.funcArgsToScVals("get_delegate", {
          account: new Address(account),
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs a delegate operation
   * @param account The address of the account delgating the votes
   * @param delegatee The address of the delegatee
   * @returns An object containing the operation and a parser for the result
   */
  delegate({
    account,
    delegatee,
  }: {
    account: string;
    delegatee: string;
  }): string {
    return this.contract
      .call(
        "delegate",
        ...this.spec.funcArgsToScVals("delegate", {
          account: new Address(account),
          delegatee: new Address(delegatee),
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs a deposit_for operation
   * @param from The address of the account
   * @param amount The amount of tokens to deposit
   * @returns An object containing the operation and a parser for the result
   */
  depositFor({ from, amount }: { from: string; amount: i128 }): string {
    return this.contract
      .call(
        "deposit_for",
        ...this.spec.funcArgsToScVals("deposit_for", {
          from: new Address(from),
          amount,
        })
      )
      .toXDR("base64");
  }

  /**
   * Constructs a withdraw_to operation
   * @param from The address of the account
   * @param amount The amount of tokens to withdraw
   * @returns An object containing the operation and a parser for the result
   */
  withdrawTo({ from, amount }: { from: string; amount: i128 }): string {
    return this.contract
      .call(
        "withdraw_to",
        ...this.spec.funcArgsToScVals("withdraw_to", {
          from: new Address(from),
          amount,
        })
      )
      .toXDR("base64");
  }
}
