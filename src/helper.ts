import { SubCalldata, InternalSubCalldata } from ".";
import { nativeToScVal } from "@stellar/stellar-sdk";

export function argsToScVals(sub_calldata: SubCalldata): InternalSubCalldata {
  let internal_sub_calldata: InternalSubCalldata = {
    args: sub_calldata.args.map((arg) => {
      return nativeToScVal(arg.value, { type: arg.type });
    }),
    contract_id: sub_calldata.contract_id,
    function: sub_calldata.function,
    sub_auth: sub_calldata.sub_auth.map((auth) => {
      return argsToScVals(auth);
    }),
  };
  return internal_sub_calldata;
}
