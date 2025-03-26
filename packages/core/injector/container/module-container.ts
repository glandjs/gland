import { Module } from '../module';

export class ModulesContainer extends Map<string, Module> {
  public getByToken(token: string): Module | undefined {
    return [...this.values()].find((moduleRef) => moduleRef.token === token);
  }
}
