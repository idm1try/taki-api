export const createMockFromClass = <T>(origin: T & { prototype: any }) => {
  const methods = Object.getOwnPropertyNames(origin.prototype).filter(
    (name) => name !== 'constructor',
  );

  const value: {
    [K in keyof T]?: jest.Mock<T[K]>;
  } = {};
  for (const method of methods) {
    value[method] = jest.fn();
  }
  return value;
};
