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
export interface VoterStatusKey {
  /**
    
    */
  proposal_id: u32;
  /**
    
    */
  voter: string;
}

/**
    
    */
export type GovernorDataKey =
  | { tag: "Proposal"; values: readonly [u32] }
  | { tag: "ProposalStatus"; values: readonly [u32] }
  | { tag: "VoterStatus"; values: readonly [VoterStatusKey] }
  | { tag: "ProposalVotes"; values: readonly [u32] };

/**
    The governor settings for managing proposals
    */
export interface GovernorSettings {
  /**
    Determine which votes to count against the quorum out of for, against, and abstain. The value is encoded
    * such that only the last 3 bits are considered, and follows the structure `MSB...{for}{against}{abstain}`,
    * such that any value != 0 means that type of vote is counted in the quorum. For example, consider
    * 5 == `0x0...0101`, this means that votes "for" and "abstain" are included in the quorum, but votes
    * "against" are not.
    */
  counting_type: u32;
  /**
    The votes required to create a proposal.
    */
  proposal_threshold: i128;
  /**
    The percentage of votes (expressed in BPS) needed of the total available votes to consider a vote successful.
    */
  quorum: u32;
  /**
    The time (in seconds) the proposal will have to wait between vote period closing and execution.
    */
  timelock: u64;
  /**
    The delay (in seconds) from the proposal creation to when the voting period begins. The voting
    * period start time will be the checkpoint used to account for all votes for the proposal.
    */
  vote_delay: u64;
  /**
    The time (in seconds) the proposal will be open to vote against.
    */
  vote_period: u64;
  /**
    The percentage of votes "yes" (expressed in BPS) needed to consider a vote successful.
    */
  vote_threshold: u32;
}

/**
    Object for storing call data
    */
export interface Calldata {
  /**
    
    */
  args: Array<any>;
  /**
    
    */
  contract_id: string;
  /**
    
    */
  function: string;
}

/**
    Object for storing Pre-auth call data
    */
export interface SubCalldata {
  /**
    
    */
  args: Array<any>;
  /**
    
    */
  contract_id: string;
  /**
    
    */
  function: string;
  /**
    
    */
  sub_auth: Array<SubCalldata>;
}

/**
    The proposal object
    */
export interface Proposal {
  /**
    
    */
  config: ProposalConfig;
  /**
    
    */
  data: ProposalData;
  /**
    
    */
  id: u32;
}

/**
    The configuration for a proposal. Set by the proposal creator.
    */
export interface ProposalConfig {
  /**
    
    */
  calldata: Calldata;
  /**
    
    */
  description: string;
  /**
    
    */
  proposer: string;
  /**
    
    */
  sub_calldata: Array<SubCalldata>;
  /**
    
    */
  title: string;
}

/**
    The data for a proposal
    */
export interface ProposalData {
  /**
    
    */
  status: ProposalStatus;
  /**
    
    */
  vote_end: u64;
  /**
    
    */
  vote_start: u64;
}

/**
    
    */
export interface VoteCount {
  /**
    
    */
  votes_abstained: i128;
  /**
    
    */
  votes_against: i128;
  /**
    
    */
  votes_for: i128;
}

/**
    
    */
export enum ProposalStatus {
  Pending = 0,
  Active = 1,
  Defeated = 2,
  Queued = 3,
  Expired = 4,
  Executed = 5,
  Canceled = 6,
}

export class GovernorClient {
  spec: ContractSpec;
  constructor(public readonly options: ClassOptions) {
    this.spec = new ContractSpec([
      "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAgAAAAAAAAAFdm90ZXMAAAAAAAATAAAAAAAAAAhzZXR0aW5ncwAAB9AAAAAQR292ZXJub3JTZXR0aW5ncwAAAAA=",
      "AAAAAAAAAAAAAAAIc2V0dGluZ3MAAAAAAAAAAQAAB9AAAAAQR292ZXJub3JTZXR0aW5ncw==",
      "AAAAAAAAAAAAAAAHcHJvcG9zZQAAAAAFAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAACGNhbGxkYXRhAAAH0AAAAAhDYWxsZGF0YQAAAAAAAAAMc3ViX2NhbGxkYXRhAAAD6gAAB9AAAAALU3ViQ2FsbGRhdGEAAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAABAAAABA==",
      "AAAAAAAAAAAAAAAMZ2V0X3Byb3Bvc2FsAAAAAQAAAAAAAAALcHJvcG9zYWxfaWQAAAAABAAAAAEAAAPoAAAH0AAAAAhQcm9wb3NhbA==",
      "AAAAAAAAAAAAAAAFY2xvc2UAAAAAAAABAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAA==",
      "AAAAAAAAAAAAAAAHZXhlY3V0ZQAAAAABAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAA==",
      "AAAAAAAAAAAAAAAGY2FuY2VsAAAAAAACAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAAC3Byb3Bvc2FsX2lkAAAAAAQAAAAA",
      "AAAAAAAAAAAAAAAEdm90ZQAAAAMAAAAAAAAABXZvdGVyAAAAAAAAEwAAAAAAAAALcHJvcG9zYWxfaWQAAAAABAAAAAAAAAAHc3VwcG9ydAAAAAAEAAAAAA==",
      "AAAAAAAAAAAAAAAIZ2V0X3ZvdGUAAAACAAAAAAAAAAV2b3RlcgAAAAAAABMAAAAAAAAAC3Byb3Bvc2FsX2lkAAAAAAQAAAABAAAD6AAAAAQ=",
      "AAAAAAAAAAAAAAASZ2V0X3Byb3Bvc2FsX3ZvdGVzAAAAAAABAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAQAAB9AAAAAJVm90ZUNvdW50AAAA",
      "AAAABAAAACFUaGUgZXJyb3IgY29kZXMgZm9yIHRoZSBjb250cmFjdC4AAAAAAAAAAAAADUdvdmVybm9yRXJyb3IAAAAAAAAQAAAAAAAAAA1JbnRlcm5hbEVycm9yAAAAAAAAAQAAAAAAAAAXQWxyZWFkeUluaXRpYWxpemVkRXJyb3IAAAAAAwAAAAAAAAARVW5hdXRob3JpemVkRXJyb3IAAAAAAAAEAAAAAAAAABNOZWdhdGl2ZUFtb3VudEVycm9yAAAAAAgAAAAAAAAADkFsbG93YW5jZUVycm9yAAAAAAAJAAAAAAAAAAxCYWxhbmNlRXJyb3IAAAAKAAAAAAAAAA1PdmVyZmxvd0Vycm9yAAAAAAAADAAAAAAAAAAUSW52YWxpZFNldHRpbmdzRXJyb3IAAADIAAAAAAAAABhOb25FeGlzdGVudFByb3Bvc2FsRXJyb3IAAADJAAAAAAAAABZQcm9wb3NhbE5vdEFjdGl2ZUVycm9yAAAAAADKAAAAAAAAABtJbnZhbGlkUHJvcG9zYWxTdXBwb3J0RXJyb3IAAAAAywAAAAAAAAAaVm90ZVBlcmlvZE5vdEZpbmlzaGVkRXJyb3IAAAAAAMwAAAAAAAAAFlByb3Bvc2FsTm90UXVldWVkRXJyb3IAAAAAAM0AAAAAAAAAE1RpbWVsb2NrTm90TWV0RXJyb3IAAAAAzgAAAAAAAAAZQ2FuY2VsQWN0aXZlUHJvcG9zYWxFcnJvcgAAAAAAAM8AAAAAAAAAHEluc3VmZmljaWVudFZvdGluZ1VuaXRzRXJyb3IAAADQ",
      "AAAAAQAAAAAAAAAAAAAADlZvdGVyU3RhdHVzS2V5AAAAAAACAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAAAAAAV2b3RlcgAAAAAAABM=",
      "AAAAAgAAAAAAAAAAAAAAD0dvdmVybm9yRGF0YUtleQAAAAAEAAAAAQAAAAAAAAAIUHJvcG9zYWwAAAABAAAABAAAAAEAAAAAAAAADlByb3Bvc2FsU3RhdHVzAAAAAAABAAAABAAAAAEAAAAAAAAAC1ZvdGVyU3RhdHVzAAAAAAEAAAfQAAAADlZvdGVyU3RhdHVzS2V5AAAAAAABAAAAAAAAAA1Qcm9wb3NhbFZvdGVzAAAAAAAAAQAAAAQ=",
      "AAAAAQAAACxUaGUgZ292ZXJub3Igc2V0dGluZ3MgZm9yIG1hbmFnaW5nIHByb3Bvc2FscwAAAAAAAAAQR292ZXJub3JTZXR0aW5ncwAAAAcAAAGpRGV0ZXJtaW5lIHdoaWNoIHZvdGVzIHRvIGNvdW50IGFnYWluc3QgdGhlIHF1b3J1bSBvdXQgb2YgZm9yLCBhZ2FpbnN0LCBhbmQgYWJzdGFpbi4gVGhlIHZhbHVlIGlzIGVuY29kZWQKc3VjaCB0aGF0IG9ubHkgdGhlIGxhc3QgMyBiaXRzIGFyZSBjb25zaWRlcmVkLCBhbmQgZm9sbG93cyB0aGUgc3RydWN0dXJlIGBNU0IuLi57Zm9yfXthZ2FpbnN0fXthYnN0YWlufWAsCnN1Y2ggdGhhdCBhbnkgdmFsdWUgIT0gMCBtZWFucyB0aGF0IHR5cGUgb2Ygdm90ZSBpcyBjb3VudGVkIGluIHRoZSBxdW9ydW0uIEZvciBleGFtcGxlLCBjb25zaWRlcgo1ID09IGAweDAuLi4wMTAxYCwgdGhpcyBtZWFucyB0aGF0IHZvdGVzICJmb3IiIGFuZCAiYWJzdGFpbiIgYXJlIGluY2x1ZGVkIGluIHRoZSBxdW9ydW0sIGJ1dCB2b3RlcwoiYWdhaW5zdCIgYXJlIG5vdC4AAAAAAAANY291bnRpbmdfdHlwZQAAAAAAAAQAAAAoVGhlIHZvdGVzIHJlcXVpcmVkIHRvIGNyZWF0ZSBhIHByb3Bvc2FsLgAAABJwcm9wb3NhbF90aHJlc2hvbGQAAAAAAAsAAABtVGhlIHBlcmNlbnRhZ2Ugb2Ygdm90ZXMgKGV4cHJlc3NlZCBpbiBCUFMpIG5lZWRlZCBvZiB0aGUgdG90YWwgYXZhaWxhYmxlIHZvdGVzIHRvIGNvbnNpZGVyIGEgdm90ZSBzdWNjZXNzZnVsLgAAAAAAAAZxdW9ydW0AAAAAAAQAAABfVGhlIHRpbWUgKGluIHNlY29uZHMpIHRoZSBwcm9wb3NhbCB3aWxsIGhhdmUgdG8gd2FpdCBiZXR3ZWVuIHZvdGUgcGVyaW9kIGNsb3NpbmcgYW5kIGV4ZWN1dGlvbi4AAAAACHRpbWVsb2NrAAAABgAAALdUaGUgZGVsYXkgKGluIHNlY29uZHMpIGZyb20gdGhlIHByb3Bvc2FsIGNyZWF0aW9uIHRvIHdoZW4gdGhlIHZvdGluZyBwZXJpb2QgYmVnaW5zLiBUaGUgdm90aW5nCnBlcmlvZCBzdGFydCB0aW1lIHdpbGwgYmUgdGhlIGNoZWNrcG9pbnQgdXNlZCB0byBhY2NvdW50IGZvciBhbGwgdm90ZXMgZm9yIHRoZSBwcm9wb3NhbC4AAAAACnZvdGVfZGVsYXkAAAAAAAYAAABAVGhlIHRpbWUgKGluIHNlY29uZHMpIHRoZSBwcm9wb3NhbCB3aWxsIGJlIG9wZW4gdG8gdm90ZSBhZ2FpbnN0LgAAAAt2b3RlX3BlcmlvZAAAAAAGAAAAVlRoZSBwZXJjZW50YWdlIG9mIHZvdGVzICJ5ZXMiIChleHByZXNzZWQgaW4gQlBTKSBuZWVkZWQgdG8gY29uc2lkZXIgYSB2b3RlIHN1Y2Nlc3NmdWwuAAAAAAAOdm90ZV90aHJlc2hvbGQAAAAAAAQ=",
      "AAAAAQAAABxPYmplY3QgZm9yIHN0b3JpbmcgY2FsbCBkYXRhAAAAAAAAAAhDYWxsZGF0YQAAAAMAAAAAAAAABGFyZ3MAAAPqAAAAAAAAAAAAAAALY29udHJhY3RfaWQAAAAAEwAAAAAAAAAIZnVuY3Rpb24AAAAR",
      "AAAAAQAAACVPYmplY3QgZm9yIHN0b3JpbmcgUHJlLWF1dGggY2FsbCBkYXRhAAAAAAAAAAAAAAtTdWJDYWxsZGF0YQAAAAAEAAAAAAAAAARhcmdzAAAD6gAAAAAAAAAAAAAAC2NvbnRyYWN0X2lkAAAAABMAAAAAAAAACGZ1bmN0aW9uAAAAEQAAAAAAAAAIc3ViX2F1dGgAAAPqAAAH0AAAAAtTdWJDYWxsZGF0YQA=",
      "AAAAAQAAABNUaGUgcHJvcG9zYWwgb2JqZWN0AAAAAAAAAAAIUHJvcG9zYWwAAAADAAAAAAAAAAZjb25maWcAAAAAB9AAAAAOUHJvcG9zYWxDb25maWcAAAAAAAAAAAAEZGF0YQAAB9AAAAAMUHJvcG9zYWxEYXRhAAAAAAAAAAJpZAAAAAAABA==",
      "AAAAAQAAAD5UaGUgY29uZmlndXJhdGlvbiBmb3IgYSBwcm9wb3NhbC4gU2V0IGJ5IHRoZSBwcm9wb3NhbCBjcmVhdG9yLgAAAAAAAAAAAA5Qcm9wb3NhbENvbmZpZwAAAAAABQAAAAAAAAAIY2FsbGRhdGEAAAfQAAAACENhbGxkYXRhAAAAAAAAAAtkZXNjcmlwdGlvbgAAAAAQAAAAAAAAAAhwcm9wb3NlcgAAABMAAAAAAAAADHN1Yl9jYWxsZGF0YQAAA+oAAAfQAAAAC1N1YkNhbGxkYXRhAAAAAAAAAAAFdGl0bGUAAAAAAAAQ",
      "AAAAAQAAABdUaGUgZGF0YSBmb3IgYSBwcm9wb3NhbAAAAAAAAAAADFByb3Bvc2FsRGF0YQAAAAMAAAAAAAAABnN0YXR1cwAAAAAH0AAAAA5Qcm9wb3NhbFN0YXR1cwAAAAAAAAAAAAh2b3RlX2VuZAAAAAYAAAAAAAAACnZvdGVfc3RhcnQAAAAAAAY=",
      "AAAAAQAAAAAAAAAAAAAACVZvdGVDb3VudAAAAAAAAAMAAAAAAAAAD3ZvdGVzX2Fic3RhaW5lZAAAAAALAAAAAAAAAA12b3Rlc19hZ2FpbnN0AAAAAAAACwAAAAAAAAAJdm90ZXNfZm9yAAAAAAAACw==",
      "AAAAAwAAAAAAAAAAAAAADlByb3Bvc2FsU3RhdHVzAAAAAAAHAAAAAAAAAAdQZW5kaW5nAAAAAAAAAAAAAAAABkFjdGl2ZQAAAAAAAQAAAAAAAAAIRGVmZWF0ZWQAAAACAAAAAAAAAAZRdWV1ZWQAAAAAAAMAAAAAAAAAB0V4cGlyZWQAAAAABAAAAAAAAAAIRXhlY3V0ZWQAAAAFAAAAAAAAAAhDYW5jZWxlZAAAAAY=",
    ]);
  }
  private readonly parsers = {
    initialize: () => {},
    settings: (result: XDR_BASE64): GovernorSettings =>
      this.spec.funcResToNative("settings", result),
    propose: (result: XDR_BASE64): u32 =>
      this.spec.funcResToNative("propose", result),
    getProposal: (result: XDR_BASE64): Option<Proposal> =>
      this.spec.funcResToNative("get_proposal", result),
    close: () => {},
    execute: () => {},
    cancel: () => {},
    vote: () => {},
    getVote: (result: XDR_BASE64): Option<u32> =>
      this.spec.funcResToNative("get_vote", result),
    getProposalVotes: (result: XDR_BASE64): VoteCount =>
      this.spec.funcResToNative("get_proposal_votes", result),
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
    initialize: this.txFromJSON<
      ReturnType<(typeof this.parsers)["initialize"]>
    >,
    settings: this.txFromJSON<ReturnType<(typeof this.parsers)["settings"]>>,
    propose: this.txFromJSON<ReturnType<(typeof this.parsers)["propose"]>>,
    getProposal: this.txFromJSON<
      ReturnType<(typeof this.parsers)["getProposal"]>
    >,
    close: this.txFromJSON<ReturnType<(typeof this.parsers)["close"]>>,
    execute: this.txFromJSON<ReturnType<(typeof this.parsers)["execute"]>>,
    cancel: this.txFromJSON<ReturnType<(typeof this.parsers)["cancel"]>>,
    vote: this.txFromJSON<ReturnType<(typeof this.parsers)["vote"]>>,
    getVote: this.txFromJSON<ReturnType<(typeof this.parsers)["getVote"]>>,
    getProposalVotes: this.txFromJSON<
      ReturnType<(typeof this.parsers)["getProposalVotes"]>
    >,
  };
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize = async (
    { votes, settings }: { votes: string; settings: GovernorSettings },
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
        votes: new Address(votes),
        settings,
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["initialize"],
    });
  };

  /**
   * Construct and simulate a settings transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  settings = async (
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "settings",
      args: this.spec.funcArgsToScVals("settings", {}),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["settings"],
    });
  };

  /**
   * Construct and simulate a propose transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  propose = async (
    {
      creator,
      calldata,
      sub_calldata,
      title,
      description,
    }: {
      creator: string;
      calldata: Calldata;
      sub_calldata: Array<SubCalldata>;
      title: string;
      description: string;
    },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "propose",
      args: this.spec.funcArgsToScVals("propose", {
        creator: new Address(creator),
        calldata,
        sub_calldata,
        title,
        description,
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["propose"],
    });
  };

  /**
   * Construct and simulate a get_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  getProposal = async (
    { proposal_id }: { proposal_id: u32 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "get_proposal",
      args: this.spec.funcArgsToScVals("get_proposal", { proposal_id }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["getProposal"],
    });
  };

  /**
   * Construct and simulate a close transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  close = async (
    { proposal_id }: { proposal_id: u32 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "close",
      args: this.spec.funcArgsToScVals("close", { proposal_id }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["close"],
    });
  };

  /**
   * Construct and simulate a execute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  execute = async (
    { proposal_id }: { proposal_id: u32 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "execute",
      args: this.spec.funcArgsToScVals("execute", { proposal_id }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["execute"],
    });
  };

  /**
   * Construct and simulate a cancel transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  cancel = async (
    { creator, proposal_id }: { creator: string; proposal_id: u32 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "cancel",
      args: this.spec.funcArgsToScVals("cancel", {
        creator: new Address(creator),
        proposal_id,
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["cancel"],
    });
  };

  /**
   * Construct and simulate a vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  vote = async (
    {
      voter,
      proposal_id,
      support,
    }: { voter: string; proposal_id: u32; support: u32 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "vote",
      args: this.spec.funcArgsToScVals("vote", {
        voter: new Address(voter),
        proposal_id,
        support,
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["vote"],
    });
  };

  /**
   * Construct and simulate a get_vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  getVote = async (
    { voter, proposal_id }: { voter: string; proposal_id: u32 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "get_vote",
      args: this.spec.funcArgsToScVals("get_vote", {
        voter: new Address(voter),
        proposal_id,
      }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["getVote"],
    });
  };

  /**
   * Construct and simulate a get_proposal_votes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  getProposalVotes = async (
    { proposal_id }: { proposal_id: u32 },
    options: {
      /**
       * The fee to pay for the transaction. Default: 100.
       */
      fee?: number;
    } = {}
  ) => {
    return await AssembledTransaction.fromSimulation({
      method: "get_proposal_votes",
      args: this.spec.funcArgsToScVals("get_proposal_votes", { proposal_id }),
      ...options,
      ...this.options,
      errorTypes: Errors,
      parseResultXdr: this.parsers["getProposalVotes"],
    });
  };
}
