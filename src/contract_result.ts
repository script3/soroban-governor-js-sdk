import { SorobanRpc, xdr } from "@stellar/stellar-sdk";
import {
  ContractError,
  ContractErrorType,
  parseError,
} from "./contract_error.js";

export interface Result<T, E extends ContractError> {
  unwrap(): T;
  unwrapErr(): E;
  isOk(): boolean;
  isErr(): boolean;
}

export class Ok<T, E extends ContractError = ContractError>
  implements Result<T, E>
{
  constructor(readonly value: T) {}
  unwrapErr(): E {
    throw new Error("No error");
  }
  unwrap(): T {
    return this.value;
  }

  isOk(): boolean {
    return true;
  }

  isErr(): boolean {
    return !this.isOk();
  }
}

export class Err<E extends ContractError = ContractError>
  implements Result<any, E>
{
  constructor(readonly error: E) {}
  unwrapErr(): E {
    return this.error;
  }
  unwrap(): never {
    throw new Error(this.error.message);
  }

  isOk(): boolean {
    return false;
  }

  isErr(): boolean {
    return !this.isOk();
  }
}
export class Resources {
  fee: number;
  refundableFee: number;
  cpuInst: number;
  readBytes: number;
  writeBytes: number;
  readOnlyEntries: number;
  readWriteEntries: number;

  constructor(
    fee: number,
    refundableFee: number,
    cpuInst: number,
    readBytes: number,
    writeBytes: number,
    readOnlyEntries: number,
    readWriteEntries: number
  ) {
    this.fee = fee;
    this.refundableFee = refundableFee;
    this.cpuInst = cpuInst;
    this.readBytes = readBytes;
    this.writeBytes = writeBytes;
    this.readOnlyEntries = readOnlyEntries;
    this.readWriteEntries = readWriteEntries;
  }

  /**
   * Builds a Resources object from TransactionEnvelope
   * @returns - Resources
   */
  static fromTransaction(tx: xdr.TransactionEnvelope | string): Resources {
    if (typeof tx === "string") {
      tx = xdr.TransactionEnvelope.fromXDR(tx, "base64");
    }
    const transaction = tx.v1().tx();
    const data = transaction.ext().sorobanData();
    const sorobanResources = data.resources();
    const footprint = sorobanResources.footprint();

    const fee = transaction.fee();
    const refundableFee = Number(data.resourceFee().toString());
    const cpuInst = sorobanResources.instructions();
    const readBytes = sorobanResources.readBytes();
    const writeBytes = sorobanResources.writeBytes();
    const readOnlyEntries = footprint.readOnly().length;
    const readWriteEntries = footprint.readWrite().length;

    return new Resources(
      fee,
      refundableFee,
      cpuInst,
      readBytes,
      writeBytes,
      readOnlyEntries,
      readWriteEntries
    );
  }
}

export class ContractResult<T> {
  result: Result<T, ContractError>;
  hash: string;
  resources: Resources;

  constructor(result?: Result<T, ContractError>) {
    if (result) {
      this.result = result;
    }
  }
  static fromSimulationResponse<T>(
    simulation: SorobanRpc.Api.SimulateTransactionResponse,
    hash: string,
    resources: Resources,
    parser: (xdr: string | xdr.ScVal) => T
  ): ContractResult<T> {
    let result = new ContractResult<T>();
    result.hash = hash;
    result.resources = resources;
    if (SorobanRpc.Api.isSimulationError(simulation)) {
      result.result = new Err(parseError(simulation));
    } else if (SorobanRpc.Api.isSimulationRestore(simulation)) {
      result.result = new Err(
        new ContractError(
          ContractErrorType.InvokeHostFunctionEntryArchived,
          JSON.stringify(simulation.restorePreamble)
        )
      );
    } else {
      if (!simulation.result) {
        result.result = new Err(
          new ContractError(
            ContractErrorType.UnknownError,
            "Expected an invocation simulation, but got no 'result' field."
          )
        );
      } else {
        result.result = new Ok(parser(simulation.result.retval));
      }
    }
    return result;
  }

  static fromTransactionResponse<T>(
    response: SorobanRpc.Api.GetTransactionResponse,
    hash: string,
    resources: Resources,
    parser: (xdr: string | xdr.ScVal) => T
  ): ContractResult<T> {
    let result = new ContractResult<T>();
    result.hash = hash;
    result.resources = resources;
    if (response.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      // getTransactionResponse has a `returnValue` field unless it failed
      if ("returnValue" in response) {
        result.result = new Ok(parser(response.returnValue!));
      }
      // if "returnValue" not present, the transaction failed; return without parsing the result
      result.result = new Ok(undefined as T);
    } else if (
      response.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND
    ) {
      result.result = new Err(
        new ContractError(
          ContractErrorType.UnknownError,
          "Transaction failed! Unable to find tx."
        )
      );
    } else {
      result.result = new Err(parseError(response.resultXdr));
    }
    return result;
  }
}
