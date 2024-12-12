import { rpc } from "@stellar/stellar-sdk";

export class ContractError extends Error {
  /**
   * The type of the error
   */
  public type: ContractErrorType;

  constructor(type: ContractErrorType) {
    super();
    this.type = type;
  }
}

export enum ContractErrorType {
  UnknownError = -1000,
  txNotFound = -100,

  // Transaction Submission Errors
  txSorobanInvalid = -24,
  txMalformed = -23,
  txBadMinSeqAgeOrGap = -22,
  txBadSponsorship = -21,
  txFeeBumpInnerFailed = -20,
  txNotSupported = -19,
  txInternalError = -18,
  txBadAuthExtra = -17,
  txInsufficientFee = -16,
  txNoAccount = -15,
  txInsufficientBalance = -14,
  txBadAuth = -13,
  txBadSeq = -12,
  txMissingOperation = -11,
  txTooLate = -10,
  txTooEarly = -9,

  // Host Function Errors
  InvokeHostFunctionInsufficientRefundableFee = -5,
  InvokeHostFunctionEntryArchived = -4,
  InvokeHostFunctionResourceLimitExceeded = -3,
  InvokeHostFunctionTrapped = -2,
  InvokeHostFunctionMalformed = -1,

  // Common Errors
  InternalError = 1,
  AlreadyInitializedError = 3,

  UnauthorizedError = 4,

  NegativeAmountError = 8,
  BalanceError = 10,
  OverflowError = 12,

  // Voter Token Errors
  InsufficientVotesError = 100,
  InvalidDelegateeError = 101,
  InvalidCheckpointError = 102,
  SequenceNotClosedError = 103,
  InvalidEmissionConfigError = 104,

  // Governor Errors
  InvalidSettingsError = 200,
  NonExistentProposalError = 201,
  ProposalClosedError = 202,
  InvalidProposalSupportError = 203,
  VotePeriodNotFinishedError = 204,
  ProposalNotExecutableError = 205,
  TimelockNotMetError = 206,
  ProposalVotePeriodStartedError = 207,
  InsufficientVotingUnitsError = 208,
  AlreadyVotedError = 209,
  InvalidProposalType = 210,
  ProposalAlreadyOpenError = 211,
  OutsideOfVotePeriodError = 212,
  InvalidProposalActionError = 213,
}

export function parseError(
  errorResponse:
    | rpc.Api.GetFailedTransactionResponse
    | rpc.Api.SendTransactionResponse
    | rpc.Api.SimulateTransactionErrorResponse
    | rpc.Api.GetMissingTransactionResponse
): ContractError {
  // Simulation Error
  if ("id" in errorResponse) {
    const match = errorResponse.error.match(/Error\(Contract, #(\d+)\)/);
    if (match) {
      const errorValue = parseInt(match[1], 10);
      if (errorValue in ContractErrorType)
        return new ContractError(errorValue as ContractErrorType);
    }
    return new ContractError(ContractErrorType.UnknownError);
  }

  // Missing Transaction Error
  if (errorResponse.status === "NOT_FOUND") {
    return new ContractError(ContractErrorType.txNotFound);
  }

  // Send Transaction Error
  if (
    "errorResult" in errorResponse &&
    errorResponse.errorResult !== undefined
  ) {
    const txErrorName = errorResponse.errorResult.result().switch().name;
    if (txErrorName == "txFailed") {
      // Transaction should only contain one operation
      if (errorResponse.errorResult.result().results().length == 1) {
        const hostFunctionError = errorResponse.errorResult
          .result()
          .results()[0]
          .tr()
          .invokeHostFunctionResult()
          .switch().value;
        if (hostFunctionError in ContractErrorType)
          return new ContractError(hostFunctionError as ContractErrorType);
      }
    } else {
      const txErrorValue =
        errorResponse.errorResult.result().switch().value - 7;
      if (txErrorValue in ContractErrorType) {
        return new ContractError(txErrorValue as ContractErrorType);
      }
    }
  }

  // Get Transaction Error
  if ("resultXdr" in errorResponse) {
    // Transaction submission failed
    const txResult = errorResponse.resultXdr.result();
    const txErrorName = txResult.switch().name;

    // Use invokeHostFunctionErrors in case of generic `txFailed` error
    if (txErrorName == "txFailed") {
      // Transaction should only contain one operation
      if (errorResponse.resultXdr.result().results().length == 1) {
        const hostFunctionError = txResult
          .results()[0]
          .tr()
          .invokeHostFunctionResult()
          .switch().value;
        if (hostFunctionError in ContractErrorType)
          return new ContractError(hostFunctionError as ContractErrorType);
      }
    }

    // Shift the error value to avoid collision with invokeHostFunctionErrors
    const txErrorValue = txResult.switch().value - 7;
    // Use TransactionResultCode with more specific errors
    if (txErrorValue in ContractErrorType) {
      return new ContractError(txErrorValue as ContractErrorType);
    }
  }

  // If the error is not recognized, return an unknown error
  return new ContractError(ContractErrorType.UnknownError);
}

export function parseResult<T>(
  response:
    | rpc.Api.SimulateTransactionSuccessResponse
    | rpc.Api.GetSuccessfulTransactionResponse,
  parser: (xdr: string) => T
): T | undefined {
  if ("result" in response && response.result !== undefined) {
    return parser(response.result.retval.toXDR("base64"));
  } else if ("returnValue" in response && response.returnValue) {
    return parser(response.returnValue.toXDR("base64"));
  } else {
    return undefined;
  }
}
