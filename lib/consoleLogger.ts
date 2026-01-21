/* eslint-disable */
export const consoleLogger = (...args: any[]) => {
  console.log(`xxx ${args.map((arg) => JSON.stringify(arg, null, 2)).join(' ')}`);
};
