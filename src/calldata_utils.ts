import { Address, nativeToScVal, xdr } from "@stellar/stellar-sdk";
import { Calldata, Val } from ".";

/**
 * Convert Calldata "Vals" to ScVals. This is required for the calldata to be used in the smart contract.
 * When using the Governor Client, this is done automatically.
 *
 * @param calldata
 * @returns - The calldata with Vals converted to ScVals
 */
export function convertValsToScVals(calldata: Calldata): any {
  return {
    args: calldata.args.map((arg) => valToScVal(arg)),
    auths: calldata.auths.map((auth) => convertValsToScVals(auth)),
    contract_id: new Address(calldata.contract_id),
    function: calldata.function,
  };
}

/**
 * Convert a Val to an ScVal using nativeToScVal.
 *
 * If you have a complicated object that does not work with nativeToScVal, you
 * can either supply a `xdr.ScVal` object directly and the type will be ignored, or,
 * you can supply the ScVal as a Base64 XDR string and include `type: { type: "xdr" }` as
 * Val's type, and it will be converted to an ScVal directly.
 *
 * @param val - The Val to convert to an ScVal
 * @returns - The xdr ScVal object
 */
export function valToScVal(val: Val): xdr.ScVal {
  if (val.type.type === "xdr") {
    return xdr.ScVal.fromXDR(val.value, "base64");
  }
  return nativeToScVal(val.value, val.type);
}

/**
 * Convert a Calldata object to a SorobanAuthorizedInvocation object.
 * @param calldata - The calldata to convert
 * @returns - The xdr SorobanAuthorizedInvocation object
 */
export function calldataToAuthInvocation(
  calldata: Calldata
): xdr.SorobanAuthorizedInvocation {
  let auth_function =
    xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(
      new xdr.InvokeContractArgs({
        contractAddress: new Address(calldata.contract_id).toScAddress(),
        functionName: calldata.function,
        args: calldata.args.map((arg) => valToScVal(arg)),
      })
    );
  let subInvocations = calldata.auths.map((auth) =>
    calldataToAuthInvocation(auth)
  );
  return new xdr.SorobanAuthorizedInvocation({
    function: auth_function,
    subInvocations: subInvocations,
  });
}
