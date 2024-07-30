import {METHODS } from 'http'
import { Gland } from '../types/gland';
import { logger } from './logger';
export function getMethod ():Array<string> {
    return METHODS && METHODS.map((m:string) =>{
      return m.toLowerCase()
    })
}
export class ServerTools{
    private static logMsg(opts: Gland.ListenOptions): string {
      return opts.path 
          ? `Server is running at ${opts.path}` 
          : `Server is running at http://${opts.host}:${opts.port}`;
    }
    static listener(opts:Gland.ListenOptions,listeningListener?: (info: Gland.ListenOptions) => void){
      return () => {
        if (listeningListener) {
            listeningListener(opts);
        }
      };
    }
    static log(opts: Gland.ListenOptions) {
      logger.info(ServerTools.logMsg(opts));
    }
}