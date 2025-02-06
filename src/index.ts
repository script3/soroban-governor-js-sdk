export * from "./calldata_utils.js";
export * from "./governor.js";
export * from "./response_parser.js";
export * from "./votes.js";
export type u32 = number;
export type i32 = number;
export type u64 = bigint;
export type i64 = bigint;
export type u128 = bigint;
export type i128 = bigint;
export type u256 = bigint;
export type i256 = bigint;
export type Option<T> = T | undefined;
export type Typepoint = bigint;
export type Duration = bigint;

export enum ScValType {
  "bool" = 0,
  "void" = 1,
  "error" = 2,
  "u32" = 3,
  "i32" = 4,
  "u64" = 5,
  "i64" = 6,
  "timepoint" = 7,
  "duration" = 8,
  "u128" = 9,
  "i128" = 10,
  "u256" = 11,
  "i256" = 12,
  "bytes" = 13,
  "string" = 14,
  "symbol" = 15,
  "vec" = 16,
  "map" = 17,
  "address" = 18,
}

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}
