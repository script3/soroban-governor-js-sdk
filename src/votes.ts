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
  104: { message: "InvalidEmissionConfigError" },
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

export interface EmissionConfig {
  eps: u64;
  expiration: u64;
}

export interface EmissionData {
  index: i128;
  last_time: u64;
}

export interface UserEmissionData {
  accrued: i128;
  index: i128;
}

export type EmisKey = readonly [string];

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

/**
 * The client for the Bonding Votes Contract. This is intended for contracts that intake Stellar Assets
 * in exchange for a non-transferable voting token that implements the Votes trait.
 */
export class BondingVotesContract extends Contract {
  static readonly spec = new ContractSpec([
    "AAAAAAAAAAAAAAAMdG90YWxfc3VwcGx5AAAAAAAAAAEAAAAL",
    "AAAAAAAAAAAAAAARc2V0X3ZvdGVfc2VxdWVuY2UAAAAAAAABAAAAAAAAAAhzZXF1ZW5jZQAAAAQAAAAA",
    "AAAAAAAAAAAAAAAVZ2V0X3Bhc3RfdG90YWxfc3VwcGx5AAAAAAAAAQAAAAAAAAAIc2VxdWVuY2UAAAAEAAAAAQAAAAs=",
    "AAAAAAAAAAAAAAAJZ2V0X3ZvdGVzAAAAAAAAAQAAAAAAAAAHYWNjb3VudAAAAAATAAAAAQAAAAs=",
    "AAAAAAAAAAAAAAAOZ2V0X3Bhc3Rfdm90ZXMAAAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAhzZXF1ZW5jZQAAAAQAAAABAAAACw==",
    "AAAAAAAAAAAAAAAMZ2V0X2RlbGVnYXRlAAAAAQAAAAAAAAAHYWNjb3VudAAAAAATAAAAAQAAABM=",
    "AAAAAAAAAAAAAAAIZGVsZWdhdGUAAAACAAAAAAAAAAdhY2NvdW50AAAAABMAAAAAAAAACWRlbGVnYXRlZQAAAAAAABMAAAAA",
    "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABAAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAhnb3Zlcm5vcgAAABMAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAZzeW1ib2wAAAAAABAAAAAA",
    "AAAAAAAAAAAAAAAHZGVwb3NpdAAAAAACAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
    "AAAAAAAAAAAAAAAId2l0aGRyYXcAAAACAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
    "AAAAAAAAAAAAAAAFY2xhaW0AAAAAAAABAAAAAAAAAAdhZGRyZXNzAAAAABMAAAABAAAACw==",
    "AAAAAAAAAAAAAAAIc2V0X2VtaXMAAAACAAAAAAAAAAZ0b2tlbnMAAAAAAAsAAAAAAAAACmV4cGlyYXRpb24AAAAAAAYAAAAA",
    "AAAAAAAAAAAAAAAHYmFsYW5jZQAAAAABAAAAAAAAAAJpZAAAAAAAEwAAAAEAAAAL",
    "AAAAAAAAAAAAAAAIZGVjaW1hbHMAAAAAAAAAAQAAAAQ=",
    "AAAAAAAAAAAAAAAEbmFtZQAAAAAAAAABAAAAEA==",
    "AAAAAAAAAAAAAAAGc3ltYm9sAAAAAAAAAAAAAQAAABA=",
    "AAAABAAAACFUaGUgZXJyb3IgY29kZXMgZm9yIHRoZSBjb250cmFjdC4AAAAAAAAAAAAAD1Rva2VuVm90ZXNFcnJvcgAAAAAMAAAAAAAAAA1JbnRlcm5hbEVycm9yAAAAAAAAAQAAAAAAAAAXQWxyZWFkeUluaXRpYWxpemVkRXJyb3IAAAAAAwAAAAAAAAARVW5hdXRob3JpemVkRXJyb3IAAAAAAAAEAAAAAAAAABNOZWdhdGl2ZUFtb3VudEVycm9yAAAAAAgAAAAAAAAADkFsbG93YW5jZUVycm9yAAAAAAAJAAAAAAAAAAxCYWxhbmNlRXJyb3IAAAAKAAAAAAAAAA1PdmVyZmxvd0Vycm9yAAAAAAAADAAAAAAAAAAWSW5zdWZmaWNpZW50Vm90ZXNFcnJvcgAAAAAAZAAAAAAAAAAVSW52YWxpZERlbGVnYXRlZUVycm9yAAAAAAAAZQAAAAAAAAAWSW52YWxpZENoZWNrcG9pbnRFcnJvcgAAAAAAZgAAAAAAAAAWU2VxdWVuY2VOb3RDbG9zZWRFcnJvcgAAAAAAZwAAAAAAAAAaSW52YWxpZEVtaXNzaW9uQ29uZmlnRXJyb3IAAAAAAGg=",
    "AAAAAQAAAAAAAAAAAAAAEEFsbG93YW5jZURhdGFLZXkAAAACAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAHc3BlbmRlcgAAAAAT",
    "AAAAAQAAAAAAAAAAAAAADkFsbG93YW5jZVZhbHVlAAAAAAACAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEWV4cGlyYXRpb25fbGVkZ2VyAAAAAAAABA==",
    "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAEAAAAAAAAACUFsbG93YW5jZQAAAAAAAAEAAAfQAAAAEEFsbG93YW5jZURhdGFLZXkAAAABAAAAAAAAAAdCYWxhbmNlAAAAAAEAAAATAAAAAQAAAAAAAAAFVm90ZXMAAAAAAAABAAAAEwAAAAEAAAAAAAAAClZvdGVzQ2hlY2sAAAAAAAEAAAATAAAAAQAAAAAAAAAIRGVsZWdhdGUAAAABAAAAEw==",
    "AAAAAQAAAAAAAAAAAAAAB0VtaXNLZXkAAAAAAQAAAAAAAAABMAAAAAAAABM=",
    "AAAAAQAAAAAAAAAAAAAADVRva2VuTWV0YWRhdGEAAAAAAAADAAAAAAAAAAdkZWNpbWFsAAAAAAQAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAZzeW1ib2wAAAAAABA=",
    "AAAAAQAAAAAAAAAAAAAADkVtaXNzaW9uQ29uZmlnAAAAAAACAAAAAAAAAANlcHMAAAAABgAAAAAAAAAKZXhwaXJhdGlvbgAAAAAABg==",
    "AAAAAQAAAAAAAAAAAAAADEVtaXNzaW9uRGF0YQAAAAIAAAAAAAAABWluZGV4AAAAAAAACwAAAAAAAAAJbGFzdF90aW1lAAAAAAAABg==",
    "AAAAAQAAAAAAAAAAAAAAEFVzZXJFbWlzc2lvbkRhdGEAAAACAAAAAAAAAAdhY2NydWVkAAAAAAsAAAAAAAAABWluZGV4AAAAAAAACw==",
  ]);

  static readonly parsers = {
    totalSupply: (result: string): i128 =>
      BondingVotesContract.spec.funcResToNative("total_supply", result),
    setVoteSequence: () => {},
    getPastTotalSupply: (result: string): i128 =>
      BondingVotesContract.spec.funcResToNative(
        "get_past_total_supply",
        result
      ),
    getVotes: (result: string): i128 =>
      BondingVotesContract.spec.funcResToNative("get_votes", result),
    getPastVotes: (result: string): i128 =>
      BondingVotesContract.spec.funcResToNative("get_past_votes", result),
    getDelegate: (result: string): string =>
      BondingVotesContract.spec.funcResToNative("get_delegate", result),
    delegate: () => {},
    initialize: () => {},
    deposit: () => {},
    withdraw: () => {},
    claim: (result: string): i128 =>
      BondingVotesContract.spec.funcResToNative("claim", result),
    setEmis: () => {},
    balance: (result: string): i128 =>
      BondingVotesContract.spec.funcResToNative("balance", result),
    decimals: (result: string): u32 =>
      BondingVotesContract.spec.funcResToNative("decimals", result),
    name: (result: string): string =>
      BondingVotesContract.spec.funcResToNative("name", result),
    symbol: (result: string): string =>
      BondingVotesContract.spec.funcResToNative("symbol", result),
  };

  /**
   * Constructs a balance operation
   * @param id The address of the account
   * @returns A base64 XDR string of the operation
   */
  balance({ id }: { id: string }): string {
    return this.call(
      "balance",
      ...BondingVotesContract.spec.funcArgsToScVals("balance", {
        id: new Address(id),
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a decimals operation (READ ONLY: Operation should only be simulated)
   * @returns A base64 XDR string of the operation
   */
  decimals(): string {
    return this.call(
      "decimals",
      ...BondingVotesContract.spec.funcArgsToScVals("decimals", {})
    ).toXDR("base64");
  }

  /**
   * Constructs a name operation (READ ONLY: Operation should only be simulated)
   * @returns A base64 XDR string of the operation
   */
  name(): string {
    return this.call(
      "name",
      ...BondingVotesContract.spec.funcArgsToScVals("name", {})
    ).toXDR("base64");
  }

  /**
   * Constructs a symbol operation (READ ONLY: Operation should only be simulated)
   * @returns A base64 XDR string of the operation
   */
  symbol(): string {
    return this.call(
      "symbol",
      ...BondingVotesContract.spec.funcArgsToScVals("symbol", {})
    ).toXDR("base64");
  }

  /**
   * Constructs an initialize operation
   * @param token The address of the voting token
   * @param governor The address of the governor
   * @param name The name of the token
   * @param symbol The symbol of the token
   * @returns A base64 XDR string of the operation
   */
  initialize({
    token,
    governor,
    name,
    symbol,
  }: {
    token: string;
    governor: string;
    name: string;
    symbol: string;
  }): string {
    return this.call(
      "initialize",
      ...BondingVotesContract.spec.funcArgsToScVals("initialize", {
        token: new Address(token),
        governor: new Address(governor),
        name,
        symbol,
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a total_supply operation (READ ONLY: Operation should only be simulated)
   * @returns A base64 XDR string of the operation
   */
  totalSupply(): string {
    return this.call(
      "total_supply",
      ...BondingVotesContract.spec.funcArgsToScVals("total_supply", {})
    ).toXDR("base64");
  }

  /**
   * Constructs a get_past_total_supply operation (READ ONLY: Operation should only be simulated)
   * @param sequence The sequence number
   * @returns A base64 XDR string of the operation
   */
  getPastTotalSupply({ sequence }: { sequence: u32 }): string {
    return this.call(
      "get_past_total_supply",
      ...BondingVotesContract.spec.funcArgsToScVals("get_past_total_supply", {
        sequence,
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a get_votes operation (READ ONLY: Operation should only be simulated)
   * @param account The address of the account
   * @returns A base64 XDR string of the operation
   */
  getVotes({ account }: { account: string }): string {
    return this.call(
      "get_votes",
      ...BondingVotesContract.spec.funcArgsToScVals("get_votes", {
        account: new Address(account),
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a get_past_votes operation (READ ONLY: Operation should only be simulated)
   * @param user The address of the user
   * @param sequence The sequence number
   * @returns A base64 XDR string of the operation
   */
  getPastVotes({ user, sequence }: { user: string; sequence: u32 }): string {
    return this.call(
      "get_past_votes",
      ...BondingVotesContract.spec.funcArgsToScVals("get_past_votes", {
        user: new Address(user),
        sequence,
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a get_delegate operation (READ ONLY: Operation should only be simulated)
   * @param account The address of the account
   * @returns A base64 XDR string of the operation
   */
  getDelegate({ account }: { account: string }): string {
    return this.call(
      "get_delegate",
      ...BondingVotesContract.spec.funcArgsToScVals("get_delegate", {
        account: new Address(account),
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a delegate operation
   * @param account The address of the account delgating the votes
   * @param delegatee The address of the delegatee
   * @returns A base64 XDR string of the operation
   */
  delegate({
    account,
    delegatee,
  }: {
    account: string;
    delegatee: string;
  }): string {
    return this.call(
      "delegate",
      ...BondingVotesContract.spec.funcArgsToScVals("delegate", {
        account: new Address(account),
        delegatee: new Address(delegatee),
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a deposit operation
   * @param from The address of the account
   * @param amount The amount of tokens to deposit
   * @returns A base64 XDR string of the operation
   */
  deposit({ from, amount }: { from: string; amount: i128 }): string {
    return this.call(
      "deposit",
      ...BondingVotesContract.spec.funcArgsToScVals("deposit", {
        from: new Address(from),
        amount,
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a withdraw operation
   * @param from The address of the account
   * @param amount The amount of tokens to withdraw
   * @returns A base64 XDR string of the operation
   */
  withdraw({ from, amount }: { from: string; amount: i128 }): string {
    return this.call(
      "withdraw",
      ...BondingVotesContract.spec.funcArgsToScVals("withdraw", {
        from: new Address(from),
        amount,
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a claim operation
   * @param address The address to claim for
   * @returns A base64 XDR string of the operation
   */
  claim({ address }: { address: string }): string {
    return this.call(
      "claim",
      ...BondingVotesContract.spec.funcArgsToScVals("claim", {
        address: new Address(address),
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a set_emis operation
   * @param from The address of the account
   * @param amount The amount of tokens to withdraw
   * @returns A base64 XDR string of the operation
   */
  setEmis({ tokens, expiration }: { tokens: i128; expiration: u64 }): string {
    return this.call(
      "set_emis",
      ...BondingVotesContract.spec.funcArgsToScVals("set_emis", {
        tokens,
        expiration,
      })
    ).toXDR("base64");
  }
}

/**
 * The client for the Token Votes Contract. This is intended for Soroban tokens
 * that implement the Votes trait.
 */
export class TokenVotesContract extends Contract {
  static readonly spec = new ContractSpec([
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
    "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAhnb3Zlcm5vcgAAABMAAAAAAAAAB2RlY2ltYWwAAAAABAAAAAAAAAAEbmFtZQAAABAAAAAAAAAABnN5bWJvbAAAAAAAEAAAAAA=",
    "AAAAAAAAAAAAAAAEbWludAAAAAIAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
    "AAAAAAAAAAAAAAAJc2V0X2FkbWluAAAAAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAA=",
    "AAAAAAAAAAAAAAAFYWRtaW4AAAAAAAAAAAAAAQAAABM=",
    "AAAABAAAACFUaGUgZXJyb3IgY29kZXMgZm9yIHRoZSBjb250cmFjdC4AAAAAAAAAAAAAD1Rva2VuVm90ZXNFcnJvcgAAAAAMAAAAAAAAAA1JbnRlcm5hbEVycm9yAAAAAAAAAQAAAAAAAAAXQWxyZWFkeUluaXRpYWxpemVkRXJyb3IAAAAAAwAAAAAAAAARVW5hdXRob3JpemVkRXJyb3IAAAAAAAAEAAAAAAAAABNOZWdhdGl2ZUFtb3VudEVycm9yAAAAAAgAAAAAAAAADkFsbG93YW5jZUVycm9yAAAAAAAJAAAAAAAAAAxCYWxhbmNlRXJyb3IAAAAKAAAAAAAAAA1PdmVyZmxvd0Vycm9yAAAAAAAADAAAAAAAAAAWSW5zdWZmaWNpZW50Vm90ZXNFcnJvcgAAAAAAZAAAAAAAAAAVSW52YWxpZERlbGVnYXRlZUVycm9yAAAAAAAAZQAAAAAAAAAWSW52YWxpZENoZWNrcG9pbnRFcnJvcgAAAAAAZgAAAAAAAAAWU2VxdWVuY2VOb3RDbG9zZWRFcnJvcgAAAAAAZwAAAAAAAAAaSW52YWxpZEVtaXNzaW9uQ29uZmlnRXJyb3IAAAAAAGg=",
    "AAAAAQAAAAAAAAAAAAAAEEFsbG93YW5jZURhdGFLZXkAAAACAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAHc3BlbmRlcgAAAAAT",
    "AAAAAQAAAAAAAAAAAAAADkFsbG93YW5jZVZhbHVlAAAAAAACAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEWV4cGlyYXRpb25fbGVkZ2VyAAAAAAAABA==",
    "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAEAAAAAAAAACUFsbG93YW5jZQAAAAAAAAEAAAfQAAAAEEFsbG93YW5jZURhdGFLZXkAAAABAAAAAAAAAAdCYWxhbmNlAAAAAAEAAAATAAAAAQAAAAAAAAAFVm90ZXMAAAAAAAABAAAAEwAAAAEAAAAAAAAAClZvdGVzQ2hlY2sAAAAAAAEAAAATAAAAAQAAAAAAAAAIRGVsZWdhdGUAAAABAAAAEw==",
    "AAAAAQAAAAAAAAAAAAAADVRva2VuTWV0YWRhdGEAAAAAAAADAAAAAAAAAAdkZWNpbWFsAAAAAAQAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAZzeW1ib2wAAAAAABA=",
  ]);

  static readonly parsers = {
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
    totalSupply: (result: string): i128 =>
      this.spec.funcResToNative("total_supply", result),
    setVoteSequence: () => {},
    getPastTotalSupply: (result: string): i128 =>
      this.spec.funcResToNative("get_past_total_supply", result),
    getVotes: (result: string): i128 =>
      this.spec.funcResToNative("get_votes", result),
    getPastVotes: (result: string): i128 =>
      this.spec.funcResToNative("get_past_votes", result),
    getDelegate: (result: string): string =>
      this.spec.funcResToNative("get_delegate", result),
    delegate: () => {},
    initialize: () => {},
    mint: () => {},
    setAdmin: () => {},
    admin: (result: string): string =>
      this.spec.funcResToNative("admin", result),
  };

  /**
   * Constructs an allowance operation
   * @param from The address of the owner of the tokens
   * @param spender The address of the spender
   * @returns A base64 XDR string of the operation
   */
  allowance({ from, spender }: { from: string; spender: string }): string {
    return this.call(
      "allowance",
      ...TokenVotesContract.spec.funcArgsToScVals("allowance", {
        from: new Address(from),
        spender: new Address(spender),
      })
    ).toXDR("base64");
  }

  /**
   * Constructs an approve operation
   * @param from The address of the owner of the tokens
   * @param spender The address of the spender
   * @param amount The amount of tokens to approve
   * @param expiration_ledger The expiration ledger
   * @returns A base64 XDR string of the operation
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
    return this.call(
      "approve",
      ...TokenVotesContract.spec.funcArgsToScVals("approve", {
        from: new Address(from),
        spender: new Address(spender),
        amount,
        expiration_ledger,
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a balance operation
   * @param id The address of the account
   * @returns A base64 XDR string of the operation
   */
  balance({ id }: { id: string }): string {
    return this.call(
      "balance",
      ...TokenVotesContract.spec.funcArgsToScVals("balance", {
        id: new Address(id),
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a transfer operation
   * @param from The address of the sender
   * @param to The address of the recipient
   * @param amount The amount of tokens to transfer
   * @returns A base64 XDR string of the operation
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
    return this.call(
      "transfer",
      ...TokenVotesContract.spec.funcArgsToScVals("transfer", {
        from: new Address(from),
        to: new Address(to),
        amount,
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a transfer_from operation
   * @param spender The address of the spender
   * @param from The address of the sender
   * @param to The address of the recipient
   * @param amount The amount of tokens to transfer
   * @returns A base64 XDR string of the operation
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
    return this.call(
      "transfer_from",
      ...TokenVotesContract.spec.funcArgsToScVals("transfer_from", {
        spender: new Address(spender),
        from: new Address(from),
        to: new Address(to),
        amount,
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a burn operation
   * @param from The address of the account
   * @param amount The amount of tokens to burn
   * @returns A base64 XDR string of the operation
   */
  burn({ from, amount }: { from: string; amount: i128 }): string {
    return this.call(
      "burn",
      ...TokenVotesContract.spec.funcArgsToScVals("burn", {
        from: new Address(from),
        amount,
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a burn_from operation
   * @param spender The address of the spender
   * @param from The address of the account
   * @param amount The amount of tokens to burn
   * @returns A base64 XDR string of the operation
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
    return this.call(
      "burn_from",
      ...TokenVotesContract.spec.funcArgsToScVals("burn_from", {
        from: new Address(from),
        spender: new Address(spender),
        amount,
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a decimals operation (READ ONLY: Operation should only be simulated)
   * @returns A base64 XDR string of the operation
   */
  decimals(): string {
    return this.call(
      "decimals",
      ...TokenVotesContract.spec.funcArgsToScVals("decimals", {})
    ).toXDR("base64");
  }

  /**
   * Constructs a name operation (READ ONLY: Operation should only be simulated)
   * @returns A base64 XDR string of the operation
   */
  name(): string {
    return this.call(
      "name",
      ...TokenVotesContract.spec.funcArgsToScVals("name", {})
    ).toXDR("base64");
  }

  /**
   * Constructs a symbol operation (READ ONLY: Operation should only be simulated)
   * @returns A base64 XDR string of the operation
   */
  symbol(): string {
    return this.call(
      "symbol",
      ...TokenVotesContract.spec.funcArgsToScVals("symbol", {})
    ).toXDR("base64");
  }

  /**
   * Constructs an initialize operation
   * @param admin The address of the admin
   * @param governor The address of the governor
   * @param decimal The number of decimal places used for the token
   * @param name The name of the token
   * @param symbol The symbol of the token
   * @returns A base64 XDR string of the operation
   */
  initialize({
    admin,
    governor,
    decimal,
    name,
    symbol,
  }: {
    admin: string;
    governor: string;
    decimal: u32;
    name: string;
    symbol: string;
  }): string {
    return this.call(
      "initialize",
      ...TokenVotesContract.spec.funcArgsToScVals("initialize", {
        admin: new Address(admin),
        governor: new Address(governor),
        decimal,
        name,
        symbol,
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a total_supply operation (READ ONLY: Operation should only be simulated)
   * @returns A base64 XDR string of the operation
   */
  totalSupply(): string {
    return this.call(
      "total_supply",
      ...TokenVotesContract.spec.funcArgsToScVals("total_supply", {})
    ).toXDR("base64");
  }

  /**
   * Constructs a get_past_total_supply operation (READ ONLY: Operation should only be simulated)
   * @param sequence The sequence number
   * @returns A base64 XDR string of the operation
   */
  getPastTotalSupply({ sequence }: { sequence: u32 }): string {
    return this.call(
      "get_past_total_supply",
      ...TokenVotesContract.spec.funcArgsToScVals("get_past_total_supply", {
        sequence,
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a get_votes operation (READ ONLY: Operation should only be simulated)
   * @param account The address of the account
   * @returns A base64 XDR string of the operation
   */
  getVotes({ account }: { account: string }): string {
    return this.call(
      "get_votes",
      ...TokenVotesContract.spec.funcArgsToScVals("get_votes", {
        account: new Address(account),
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a get_past_votes operation (READ ONLY: Operation should only be simulated)
   * @param user The address of the user
   * @param sequence The sequence number
   * @returns A base64 XDR string of the operation
   */
  getPastVotes({ user, sequence }: { user: string; sequence: u32 }): string {
    return this.call(
      "get_past_votes",
      ...TokenVotesContract.spec.funcArgsToScVals("get_past_votes", {
        user: new Address(user),
        sequence,
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a get_delegate operation (READ ONLY: Operation should only be simulated)
   * @param account The address of the account
   * @returns A base64 XDR string of the operation
   */
  getDelegate({ account }: { account: string }): string {
    return this.call(
      "get_delegate",
      ...TokenVotesContract.spec.funcArgsToScVals("get_delegate", {
        account: new Address(account),
      })
    ).toXDR("base64");
  }

  /**
   * Constructs a delegate operation
   * @param account The address of the account delgating the votes
   * @param delegatee The address of the delegatee
   * @returns A base64 XDR string of the operation
   */
  delegate({
    account,
    delegatee,
  }: {
    account: string;
    delegatee: string;
  }): string {
    return this.call(
      "delegate",
      ...TokenVotesContract.spec.funcArgsToScVals("delegate", {
        account: new Address(account),
        delegatee: new Address(delegatee),
      })
    ).toXDR("base64");
  }

  /**
   * Construct a mint operation
   * @param to The address of the account to mint to
   * @param amount The amount of tokens to mint
   * @returns A base64 XDR string of the operation
   */
  mint({ to, amount }: { to: string; amount: i128 }): string {
    return this.call(
      "mint",
      ...TokenVotesContract.spec.funcArgsToScVals("mint", {
        to: new Address(to),
        amount,
      })
    ).toXDR("base64");
  }

  /**
   * Construct a set_admin operation
   * @param new_admin The address of the account to set the admin as
   * @returns A base64 XDR string of the operation
   */
  setAdmin({ new_admin }: { new_admin: string }): string {
    return this.call(
      "set_admin",
      ...TokenVotesContract.spec.funcArgsToScVals("set_admin", {
        new_admin: new Address(new_admin),
      })
    ).toXDR("base64");
  }

  /**
   * Construct a get admin operation (READ ONLY: Operation should only be simulated)
   * @returns A base64 XDR string of the operation
   */
  admin(): string {
    return this.call(
      "admin",
      ...TokenVotesContract.spec.funcArgsToScVals("admin", {})
    ).toXDR("base64");
  }
}
