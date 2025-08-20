declare module "md-attr-parser" {
  type PropertyValue = string | string[] | undefined;

  export type Config = {
    defaultValue: PropertyValue | ((key: string) => PropertyValue);
  };

  export type Result = {
    prop: {
      id?: string;
      class?: string[];
      [key: string]: PropertyValue;
    };
    eaten: string;
  };

  function parse(
    value: string,
    indexNext?: number,
    userConfig?: Partial<Config>,
  ): Result;

  export = parse;
}
