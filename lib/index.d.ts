//#region src/index.d.ts
declare const name = "dsh-conversation-manager";
declare const inject: string[];
/** Empty configuration schema: this plugin owns no loader config. */
declare const Config: import("@deepseek-ai/schemastery").default<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
declare function apply(ctx: any): void;
//#endregion
export { Config, apply, inject, name };