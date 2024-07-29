import {METHODS } from 'http'
export function getMethod ():Array<string> {
    return METHODS && METHODS.map((m:string) =>{
      return m.toLowerCase()
    })
}