import * as uuidLib from 'uuid'


export function isMissing<T>(value: T | null): value is null {
  return value === undefined || value === null
}


export function isPresent<T>(value: T | null): value is NonNullable<T> {
  return !isMissing(value)
}


export function uuid() {
  return uuidLib.v4()
}


export type PrimitiveObject = { [key: string]: string | number | boolean | null }


export type Nullable<T> = T | null
