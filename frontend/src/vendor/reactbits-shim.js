// CJS shim that satisfies any named import with a null component
const makeNull = () => () => null;

module.exports = new Proxy({}, {
  get(_t, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return {};
    return makeNull();
  }
});
