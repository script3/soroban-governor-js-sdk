import {
  Address,
  Contract,
  ContractSpec,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";
import { Buffer } from "buffer";
import type { Option, i128, u32 } from "./index.js";

/**
 * The error codes for the contract.
 */
export const GovernorErrors = {
  1: { message: "InternalError" },
  3: { message: "AlreadyInitializedError" },
  4: { message: "UnauthorizedError" },
  8: { message: "NegativeAmountError" },
  9: { message: "AllowanceError" },
  10: { message: "BalanceError" },
  12: { message: "OverflowError" },
  200: { message: "InvalidSettingsError" },
  201: { message: "NonExistentProposalError" },
  202: { message: "ProposalNotActiveError" },
  203: { message: "InvalidProposalSupportError" },
  204: { message: "VotePeriodNotFinishedError" },
  205: { message: "ProposalNotSuccessfulError" },
  206: { message: "TimelockNotMetError" },
  207: { message: "CancelActiveProposalError" },
  208: { message: "InsufficientVotingUnitsError" },
  209: { message: "AlreadyVotedError" },
  210: { message: "InvalidProposalType" },
  211: { message: "ProposalAlreadyActiveError" },
};

export interface VoterStatusKey {
  proposal_id: u32;
  voter: string;
}

/**
 * Ledger storage keys for the Governor contract
 */
export type GovernorDataKey =
  | { tag: "Proposal"; values: readonly [u32] }
  | { tag: "ProposalStatus"; values: readonly [u32] }
  | { tag: "VoterStatus"; values: readonly [VoterStatusKey] }
  | { tag: "ProposalVotes"; values: readonly [u32] }
  | { tag: "Active"; values: readonly [string] };

/**
 * The governor settings for managing proposals
 */
export interface GovernorSettings {
  /**
   * The address of the security council that can cancel proposals during the vote delay period. If the DAO does not
   * have a council, this should be set to the zero address.
   */
  council: string;
  /**
   * Determine which votes to count against the quorum out of for, against, and abstain. The value is encoded
   * such that only the last 3 bits are considered, and follows the structure `MSB...{against}{for}{abstain}`,
   * such that any value != 0 means that type of vote is counted in the quorum. For example, consider
   * 5 == `0x0...0101`, this means that votes "against" and "abstain" are included in the quorum, but votes
   * "for" are not.
   */
  counting_type: u32;
  /**
   * The time (in ledgers) the proposal has to be executed before it expires. This starts after the timelock.
   */
  grace_period: u32;
  /**
   *  The votes required to create a proposal.
   */
  proposal_threshold: i128;
  /**
   * The percentage of votes (expressed in BPS) needed of the total available votes to consider a vote successful.
   */
  quorum: u32;
  /**
   * The time (in ledgers) the proposal will have to wait between vote period closing and execution.
   */
  timelock: u32;
  /**
   * The delay (in ledgers) from the proposal creation to when the voting period begins. The voting
   * period start time will be the checkpoint used to account for all votes for the proposal.
   */
  vote_delay: u32;
  /**
   * The time (in ledgers) the proposal will be open to vote against.
   */
  vote_period: u32;
  /**
   * The percentage of votes "yes" (expressed in BPS) needed to consider a vote successful.
   */
  vote_threshold: u32;
}

/**
 * This is a wrapper for the XDR type ScVal. It is used to convert between
 * a string based representation of the value and the internal XDR type.
 *
 * See the Stellar SDK's [nativeToScVal](https://stellar.github.io/js-stellar-sdk/ContractSpec.html#nativeToScVal) implementation
 * for more information.
 */
export class Val {
  value: string;
  type: any;

  constructor(value: string, type: any) {
    this.value = value;
    this.type = type;
  }

  toScVal(): xdr.ScVal {
    return nativeToScVal(this.value, this.type);
  }
}

/**
 * Object for storing call data
 */
export class Calldata {
  args: Array<Val>;
  auths: Array<Calldata>;
  contract_id: string;
  function: string;

  constructor(
    contract_id: string,
    function_: string,
    args: Array<Val>,
    auths: Array<Calldata>
  ) {
    this.args = args;
    this.auths = auths;
    this.contract_id = contract_id;
    this.function = function_;
  }

  convertValsToScVals(): any {
    return {
      args: this.args.map((arg) => arg.toScVal()),
      auths: this.auths.map((auth) => auth.convertValsToScVals()),
      contract_id: new Address(this.contract_id),
      function: this.function,
    };
  }
}

/**
 * The configuration for a proposal. Set by the proposal creator.
 */
export interface ProposalConfig {
  action: ProposalAction;
  description: string;
  title: string;
}

/**
 * The action to be taken by a proposal.
 *
 * ### Calldata
 * The proposal will execute the calldata from the governor contract on execute.
 *
 * ### Upgrade
 * The proposal will upgrade the governor contract to the new WASM hash on execute.
 *
 * ### Settings
 * The proposal will update the governor settings on execute.
 *
 * ### Snapshot
 * There is no action to be taken by the proposal.
 */
export type ProposalAction =
  | { tag: "Calldata"; values: readonly [Calldata] }
  | { tag: "Upgrade"; values: readonly [Buffer] }
  | { tag: "Settings"; values: readonly [GovernorSettings] }
  | { tag: "Snapshot"; values: void };

/**
 * The data for a proposal
 */
export interface ProposalData {
  creator: string;
  executable: boolean;
  status: ProposalStatus;
  vote_end: u32;
  vote_start: u32;
}

/**
 * The proposal object
 */
export interface Proposal {
  config: ProposalConfig;
  data: ProposalData;
  id: u32;
}

/**
 * The vote count for a proposal
 */
export interface VoteCount {
  _for: i128;
  abstain: i128;
  against: i128;
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
  contract: Contract;
  constructor(contract_id: string) {
    this.spec = new ContractSpec([
      "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAgAAAAAAAAAFdm90ZXMAAAAAAAATAAAAAAAAAAhzZXR0aW5ncwAAB9AAAAAQR292ZXJub3JTZXR0aW5ncwAAAAA=",
      "AAAAAAAAAAAAAAAIc2V0dGluZ3MAAAAAAAAAAQAAB9AAAAAQR292ZXJub3JTZXR0aW5ncw==",
      "AAAAAAAAAAAAAAAHcHJvcG9zZQAAAAAEAAAAAAAAAAdjcmVhdG9yAAAAABMAAAAAAAAABXRpdGxlAAAAAAAAEAAAAAAAAAALZGVzY3JpcHRpb24AAAAAEAAAAAAAAAAGYWN0aW9uAAAAAAfQAAAADlByb3Bvc2FsQWN0aW9uAAAAAAABAAAABA==",
      "AAAAAAAAAAAAAAAMZ2V0X3Byb3Bvc2FsAAAAAQAAAAAAAAALcHJvcG9zYWxfaWQAAAAABAAAAAEAAAPoAAAH0AAAAAhQcm9wb3NhbA==",
      "AAAAAAAAAAAAAAAFY2xvc2UAAAAAAAABAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAA==",
      "AAAAAAAAAAAAAAAHZXhlY3V0ZQAAAAABAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAA==",
      "AAAAAAAAAAAAAAAGY2FuY2VsAAAAAAACAAAAAAAAAARmcm9tAAAAEwAAAAAAAAALcHJvcG9zYWxfaWQAAAAABAAAAAA=",
      "AAAAAAAAAAAAAAAEdm90ZQAAAAMAAAAAAAAABXZvdGVyAAAAAAAAEwAAAAAAAAALcHJvcG9zYWxfaWQAAAAABAAAAAAAAAAHc3VwcG9ydAAAAAAEAAAAAA==",
      "AAAAAAAAAAAAAAAIZ2V0X3ZvdGUAAAACAAAAAAAAAAV2b3RlcgAAAAAAABMAAAAAAAAAC3Byb3Bvc2FsX2lkAAAAAAQAAAABAAAD6AAAAAQ=",
      "AAAAAAAAAAAAAAASZ2V0X3Byb3Bvc2FsX3ZvdGVzAAAAAAABAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAQAAB9AAAAAJVm90ZUNvdW50AAAA",
      "AAAABAAAACFUaGUgZXJyb3IgY29kZXMgZm9yIHRoZSBjb250cmFjdC4AAAAAAAAAAAAADUdvdmVybm9yRXJyb3IAAAAAAAATAAAAAAAAAA1JbnRlcm5hbEVycm9yAAAAAAAAAQAAAAAAAAAXQWxyZWFkeUluaXRpYWxpemVkRXJyb3IAAAAAAwAAAAAAAAARVW5hdXRob3JpemVkRXJyb3IAAAAAAAAEAAAAAAAAABNOZWdhdGl2ZUFtb3VudEVycm9yAAAAAAgAAAAAAAAADkFsbG93YW5jZUVycm9yAAAAAAAJAAAAAAAAAAxCYWxhbmNlRXJyb3IAAAAKAAAAAAAAAA1PdmVyZmxvd0Vycm9yAAAAAAAADAAAAAAAAAAUSW52YWxpZFNldHRpbmdzRXJyb3IAAADIAAAAAAAAABhOb25FeGlzdGVudFByb3Bvc2FsRXJyb3IAAADJAAAAAAAAABZQcm9wb3NhbE5vdEFjdGl2ZUVycm9yAAAAAADKAAAAAAAAABtJbnZhbGlkUHJvcG9zYWxTdXBwb3J0RXJyb3IAAAAAywAAAAAAAAAaVm90ZVBlcmlvZE5vdEZpbmlzaGVkRXJyb3IAAAAAAMwAAAAAAAAAGlByb3Bvc2FsTm90U3VjY2Vzc2Z1bEVycm9yAAAAAADNAAAAAAAAABNUaW1lbG9ja05vdE1ldEVycm9yAAAAAM4AAAAAAAAAGUNhbmNlbEFjdGl2ZVByb3Bvc2FsRXJyb3IAAAAAAADPAAAAAAAAABxJbnN1ZmZpY2llbnRWb3RpbmdVbml0c0Vycm9yAAAA0AAAAAAAAAARQWxyZWFkeVZvdGVkRXJyb3IAAAAAAADRAAAAAAAAABNJbnZhbGlkUHJvcG9zYWxUeXBlAAAAANIAAAAAAAAAGlByb3Bvc2FsQWxyZWFkeUFjdGl2ZUVycm9yAAAAAADT",
      "AAAAAQAAAAAAAAAAAAAADlZvdGVyU3RhdHVzS2V5AAAAAAACAAAAAAAAAAtwcm9wb3NhbF9pZAAAAAAEAAAAAAAAAAV2b3RlcgAAAAAAABM=",
      "AAAAAgAAAAAAAAAAAAAAD0dvdmVybm9yRGF0YUtleQAAAAAFAAAAAQAAAAAAAAAIUHJvcG9zYWwAAAABAAAABAAAAAEAAAAAAAAADlByb3Bvc2FsU3RhdHVzAAAAAAABAAAABAAAAAEAAAAAAAAAC1ZvdGVyU3RhdHVzAAAAAAEAAAfQAAAADlZvdGVyU3RhdHVzS2V5AAAAAAABAAAAAAAAAA1Qcm9wb3NhbFZvdGVzAAAAAAAAAQAAAAQAAAABAAAAAAAAAAZBY3RpdmUAAAAAAAEAAAAT",
      "AAAAAQAAACxUaGUgZ292ZXJub3Igc2V0dGluZ3MgZm9yIG1hbmFnaW5nIHByb3Bvc2FscwAAAAAAAAAQR292ZXJub3JTZXR0aW5ncwAAAAkAAACnVGhlIGFkZHJlc3Mgb2YgdGhlIHNlY3VyaXR5IGNvdW5jaWwgdGhhdCBjYW4gY2FuY2VsIHByb3Bvc2FscyBkdXJpbmcgdGhlIHZvdGUgZGVsYXkgcGVyaW9kLiBJZiB0aGUgREFPIGRvZXMgbm90CmhhdmUgYSBjb3VuY2lsLCB0aGlzIHNob3VsZCBiZSBzZXQgdG8gdGhlIHplcm8gYWRkcmVzcy4AAAAAB2NvdW5jaWwAAAAAEwAAAalEZXRlcm1pbmUgd2hpY2ggdm90ZXMgdG8gY291bnQgYWdhaW5zdCB0aGUgcXVvcnVtIG91dCBvZiBmb3IsIGFnYWluc3QsIGFuZCBhYnN0YWluLiBUaGUgdmFsdWUgaXMgZW5jb2RlZApzdWNoIHRoYXQgb25seSB0aGUgbGFzdCAzIGJpdHMgYXJlIGNvbnNpZGVyZWQsIGFuZCBmb2xsb3dzIHRoZSBzdHJ1Y3R1cmUgYE1TQi4uLnthZ2FpbnN0fXtmb3J9e2Fic3RhaW59YCwKc3VjaCB0aGF0IGFueSB2YWx1ZSAhPSAwIG1lYW5zIHRoYXQgdHlwZSBvZiB2b3RlIGlzIGNvdW50ZWQgaW4gdGhlIHF1b3J1bS4gRm9yIGV4YW1wbGUsIGNvbnNpZGVyCjUgPT0gYDB4MC4uLjAxMDFgLCB0aGlzIG1lYW5zIHRoYXQgdm90ZXMgImFnYWluc3QiIGFuZCAiYWJzdGFpbiIgYXJlIGluY2x1ZGVkIGluIHRoZSBxdW9ydW0sIGJ1dCB2b3RlcwoiZm9yIiBhcmUgbm90LgAAAAAAAA1jb3VudGluZ190eXBlAAAAAAAABAAAAGhUaGUgdGltZSAoaW4gbGVkZ2VycykgdGhlIHByb3Bvc2FsIGhhcyB0byBiZSBleGVjdXRlZCBiZWZvcmUgaXQgZXhwaXJlcy4gVGhpcyBzdGFydHMgYWZ0ZXIgdGhlIHRpbWVsb2NrLgAAAAxncmFjZV9wZXJpb2QAAAAEAAAAKFRoZSB2b3RlcyByZXF1aXJlZCB0byBjcmVhdGUgYSBwcm9wb3NhbC4AAAAScHJvcG9zYWxfdGhyZXNob2xkAAAAAAALAAAAbVRoZSBwZXJjZW50YWdlIG9mIHZvdGVzIChleHByZXNzZWQgaW4gQlBTKSBuZWVkZWQgb2YgdGhlIHRvdGFsIGF2YWlsYWJsZSB2b3RlcyB0byBjb25zaWRlciBhIHZvdGUgc3VjY2Vzc2Z1bC4AAAAAAAAGcXVvcnVtAAAAAAAEAAAAX1RoZSB0aW1lIChpbiBsZWRnZXJzKSB0aGUgcHJvcG9zYWwgd2lsbCBoYXZlIHRvIHdhaXQgYmV0d2VlbiB2b3RlIHBlcmlvZCBjbG9zaW5nIGFuZCBleGVjdXRpb24uAAAAAAh0aW1lbG9jawAAAAQAAAC3VGhlIGRlbGF5IChpbiBsZWRnZXJzKSBmcm9tIHRoZSBwcm9wb3NhbCBjcmVhdGlvbiB0byB3aGVuIHRoZSB2b3RpbmcgcGVyaW9kIGJlZ2lucy4gVGhlIHZvdGluZwpwZXJpb2Qgc3RhcnQgdGltZSB3aWxsIGJlIHRoZSBjaGVja3BvaW50IHVzZWQgdG8gYWNjb3VudCBmb3IgYWxsIHZvdGVzIGZvciB0aGUgcHJvcG9zYWwuAAAAAAp2b3RlX2RlbGF5AAAAAAAEAAAAQFRoZSB0aW1lIChpbiBsZWRnZXJzKSB0aGUgcHJvcG9zYWwgd2lsbCBiZSBvcGVuIHRvIHZvdGUgYWdhaW5zdC4AAAALdm90ZV9wZXJpb2QAAAAABAAAAFZUaGUgcGVyY2VudGFnZSBvZiB2b3RlcyAieWVzIiAoZXhwcmVzc2VkIGluIEJQUykgbmVlZGVkIHRvIGNvbnNpZGVyIGEgdm90ZSBzdWNjZXNzZnVsLgAAAAAADnZvdGVfdGhyZXNob2xkAAAAAAAE",
      "AAAAAQAAABxPYmplY3QgZm9yIHN0b3JpbmcgY2FsbCBkYXRhAAAAAAAAAAhDYWxsZGF0YQAAAAQAAAAAAAAABGFyZ3MAAAPqAAAAAAAAAAAAAAAFYXV0aHMAAAAAAAPqAAAH0AAAAAhDYWxsZGF0YQAAAAAAAAALY29udHJhY3RfaWQAAAAAEwAAAAAAAAAIZnVuY3Rpb24AAAAR",
      "AAAAAQAAABNUaGUgcHJvcG9zYWwgb2JqZWN0AAAAAAAAAAAIUHJvcG9zYWwAAAADAAAAAAAAAAZjb25maWcAAAAAB9AAAAAOUHJvcG9zYWxDb25maWcAAAAAAAAAAAAEZGF0YQAAB9AAAAAMUHJvcG9zYWxEYXRhAAAAAAAAAAJpZAAAAAAABA==",
      "AAAAAQAAAD5UaGUgY29uZmlndXJhdGlvbiBmb3IgYSBwcm9wb3NhbC4gU2V0IGJ5IHRoZSBwcm9wb3NhbCBjcmVhdG9yLgAAAAAAAAAAAA5Qcm9wb3NhbENvbmZpZwAAAAAAAwAAAAAAAAAGYWN0aW9uAAAAAAfQAAAADlByb3Bvc2FsQWN0aW9uAAAAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAABAAAAAAAAAABXRpdGxlAAAAAAAAEA==",
      "AAAAAgAAAWZUaGUgYWN0aW9uIHRvIGJlIHRha2VuIGJ5IGEgcHJvcG9zYWwuCgojIyMgQ2FsbGRhdGEKVGhlIHByb3Bvc2FsIHdpbGwgZXhlY3V0ZSB0aGUgY2FsbGRhdGEgZnJvbSB0aGUgZ292ZXJub3IgY29udHJhY3Qgb24gZXhlY3V0ZS4KCiMjIyBVcGdyYWRlClRoZSBwcm9wb3NhbCB3aWxsIHVwZ3JhZGUgdGhlIGdvdmVybm9yIGNvbnRyYWN0IHRvIHRoZSBuZXcgV0FTTSBoYXNoIG9uIGV4ZWN1dGUuCgojIyMgU2V0dGluZ3MKVGhlIHByb3Bvc2FsIHdpbGwgdXBkYXRlIHRoZSBnb3Zlcm5vciBzZXR0aW5ncyBvbiBleGVjdXRlLgoKIyMjIFNuYXBzaG90ClRoZXJlIGlzIG5vIGFjdGlvbiB0byBiZSB0YWtlbiBieSB0aGUgcHJvcG9zYWwuAAAAAAAAAAAADlByb3Bvc2FsQWN0aW9uAAAAAAAEAAAAAQAAAAAAAAAIQ2FsbGRhdGEAAAABAAAH0AAAAAhDYWxsZGF0YQAAAAEAAAAAAAAAB1VwZ3JhZGUAAAAAAQAAA+4AAAAgAAAAAQAAAAAAAAAIU2V0dGluZ3MAAAABAAAH0AAAABBHb3Zlcm5vclNldHRpbmdzAAAAAAAAAAAAAAAIU25hcHNob3Q=",
      "AAAAAQAAABdUaGUgZGF0YSBmb3IgYSBwcm9wb3NhbAAAAAAAAAAADFByb3Bvc2FsRGF0YQAAAAUAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAKZXhlY3V0YWJsZQAAAAAAAQAAAAAAAAAGc3RhdHVzAAAAAAfQAAAADlByb3Bvc2FsU3RhdHVzAAAAAAAAAAAACHZvdGVfZW5kAAAABAAAAAAAAAAKdm90ZV9zdGFydAAAAAAABA==",
      "AAAAAQAAAAAAAAAAAAAACVZvdGVDb3VudAAAAAAAAAMAAAAAAAAABF9mb3IAAAALAAAAAAAAAAdhYnN0YWluAAAAAAsAAAAAAAAAB2FnYWluc3QAAAAACw==",
      "AAAAAwAAAAAAAAAAAAAADlByb3Bvc2FsU3RhdHVzAAAAAAAHAAAAMlRoZSBwcm9wb3NhbCBpcyBwZW5kaW5nIGFuZCBpcyBub3Qgb3BlbiBmb3Igdm90aW5nAAAAAAAHUGVuZGluZwAAAAAAAAAAKlRoZSBwcm9wb3NhbCBpcyBhY3RpdmUgYW5kIGNhbiBiZSB2b3RlZCBvbgAAAAAABkFjdGl2ZQAAAAAAAQAAAGpUaGUgcHJvcG9zYWwgd2FzIHZvdGVkIGZvci4gSWYgdGhlIHByb3Bvc2FsIGlzIGV4ZWN1dGFibGUsIHRoZSB0aW1lbG9jayBiZWdpbnMgb25jZSB0aGlzIHN0YXRlIGlzIHJlYWNoZWQuAAAAAAAKU3VjY2Vzc2Z1bAAAAAAAAgAAAB5UaGUgcHJvcG9zYWwgd2FzIHZvdGVkIGFnYWluc3QAAAAAAAhEZWZlYXRlZAAAAAMAAABAVGhlIHByb3Bvc2FsIGRpZCBub3QgcmVhY2ggcXVvcnVtIGJlZm9yZSB0aGUgdm90aW5nIHBlcmlvZCBlbmRlZAAAAAdFeHBpcmVkAAAAAAQAAAAeVGhlIHByb3Bvc2FsIGhhcyBiZWVuIGV4ZWN1dGVkAAAAAAAIRXhlY3V0ZWQAAAAFAAAAHlRoZSBwcm9wb3NhbCBoYXMgYmVlbiBjYW5jZWxlZAAAAAAACENhbmNlbGVkAAAABg==",
    ]);
    this.contract = new Contract(contract_id);
  }
  readonly parsers = {
    initialize: () => {},
    settings: (result: string): GovernorSettings =>
      this.spec.funcResToNative("settings", result),
    propose: (result: string): u32 =>
      this.spec.funcResToNative("propose", result),
    getProposal: (result: string): Option<Proposal> =>
      this.spec.funcResToNative("get_proposal", result),
    close: () => {},
    execute: () => {},
    cancel: () => {},
    vote: () => {},
    getVote: (result: string): Option<u32> =>
      this.spec.funcResToNative("get_vote", result),
    getProposalVotes: (result: string): VoteCount =>
      this.spec.funcResToNative("get_proposal_votes", result),
  };

  /**
   * Constructs an initialize operation
   * @param votes - The address of the votes contract
   * @param settings - The governor settings for managing proposals
   * @returns An object containing the operation and a parser for the result
   */
  initialize({
    votes,
    settings,
  }: {
    votes: string;
    settings: GovernorSettings;
  }): string {
    return this.contract
      .call(
        "initialize",
        ...this.spec.funcArgsToScVals("initialize", {
          votes: new Address(votes),
          settings,
        })
      )
      .toXDR("base64");
  }

  /**
   * Construct a settings operation. (READ ONLY: Operation should only be simulated)
   * @returns An object containing the operation and a parser for the result
   */
  settings(): string {
    return this.contract
      .call("settings", ...this.spec.funcArgsToScVals("settings", {}))
      .toXDR("base64");
  }

  /**
   * Contructs a propose operation
   * @param creator - The address of the creator
   * @param title - The title of the proposal
   * @param description - The description of the proposal
   * @param action - The action to be taken by the proposal
   * @returns An object containing the operation and a parser for the result
   */
  propose({
    creator,
    title,
    description,
    action,
  }: {
    creator: string;
    title: string;
    description: string;
    action: ProposalAction;
  }): string {
    if (action.tag === "Calldata") {
      let new_value = action.values[0].convertValsToScVals();
      action = { tag: "Calldata", values: [new_value] };
    }
    return this.contract
      .call(
        "propose",
        ...this.spec.funcArgsToScVals("propose", {
          creator: new Address(creator),
          title,
          description,
          action,
        })
      )
      .toXDR("base64");
  }

  /**
   * Contructs a getProposal operation (READ ONLY: Operation should only be simulated)
   * @param proposal_id - The id of the proposal
   * @returns An object containing the operation and a parser for the result
   */
  getProposal({ proposal_id }: { proposal_id: u32 }): string {
    return this.contract
      .call(
        "get_proposal",
        ...this.spec.funcArgsToScVals("get_proposal", {
          proposal_id,
        })
      )
      .toXDR("base64");
  }

  /**
   * Construct a close operation
   * @param proposal_id - The id of the proposal
   * @returns An object containing the operation and a parser for the result
   */
  close({ proposal_id }: { proposal_id: u32 }): string {
    return this.contract
      .call(
        "close",
        ...this.spec.funcArgsToScVals("close", {
          proposal_id,
        })
      )
      .toXDR("base64");
  }

  /**
   * Construct a execute operation
   * @param proposal_id - The id of the proposal
   * @returns An object containing the operation and a parser for the result
   */
  execute({ proposal_id }: { proposal_id: u32 }): string {
    return this.contract
      .call(
        "execute",
        ...this.spec.funcArgsToScVals("execute", {
          proposal_id,
        })
      )
      .toXDR("base64");
  }

  /**
   * Construct a cancel operation
   * @param creator - The address of the creator
   * @param proposal_id - The id of the proposal
   * @returns An object containing the operation and a parser for the result
   */
  cancel({
    creator,
    proposal_id,
  }: {
    creator: string;
    proposal_id: u32;
  }): string {
    return this.contract
      .call(
        "cancel",
        ...this.spec.funcArgsToScVals("cancel", {
          creator: new Address(creator),
          proposal_id,
        })
      )
      .toXDR("base64");
  }

  /**
   * Construct a vote operation
   * @param voter - The address of the voter
   * @param proposal_id - The id of the proposal
   * @param support - The vote
   * @returns An object containing the operation and a parser for the result
   */
  vote({
    voter,
    proposal_id,
    support,
  }: {
    voter: string;
    proposal_id: u32;
    support: u32;
  }): string {
    return this.contract
      .call(
        "vote",
        ...this.spec.funcArgsToScVals("vote", {
          voter: new Address(voter),
          proposal_id,
          support,
        })
      )
      .toXDR("base64");
  }

  /**
   * Construct a getVote operation (READ ONLY: Operation should only be simulated)
   * @param voter - The address of the voter
   * @param proposal_id - The id of the proposal
   * @returns An object containing the operation and a parser for the result
   */
  getVote({ voter, proposal_id }: { voter: string; proposal_id: u32 }): string {
    return this.contract
      .call(
        "get_vote",
        ...this.spec.funcArgsToScVals("get_vote", {
          voter: new Address(voter),
          proposal_id,
        })
      )
      .toXDR("base64");
  }

  /**
   * Construct a getProposalVotes operation (READ ONLY: Operation should only be simulated)
   * @param proposal_id - The id of the proposal
   * @returns An object containing the operation and a parser for the result
   */
  getProposalVotes({ proposal_id }: { proposal_id: u32 }): string {
    return this.contract
      .call(
        "get_proposal_votes",
        ...this.spec.funcArgsToScVals("get_proposal_votes", {
          proposal_id,
        })
      )
      .toXDR("base64");
  }
}
