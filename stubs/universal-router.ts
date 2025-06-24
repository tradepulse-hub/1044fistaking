// -------------------------------------------------------------
//  Stub for @uniswap/universal-router
// -------------------------------------------------------------
//
// The Holdstation SDK only needs to resolve the module name while
// bundling; it never calls any runtime logic from the Universal
// Router itself inside the browser.  A minimal, empty module is
// therefore sufficient.
//
// Both `@uniswap/universal-router` and the deep import patterns
// that the SDK generates (e.g. `@uniswap/universal-router/dist/esm/*`)
// are aliased to this file in tsconfig.json:
//
//   "paths": {
//     "@uniswap/universal-router": ["stubs/universal-router.ts"],
//     "@uniswap/universal-router/*": ["stubs/universal-router.ts"]
//   }
//
// Keeping the file here (relative path “stubs/universal-router.ts”)
// satisfies the alias and removes the “file cannot be found” error.
//

// Common constant re-exported by the real library – included here in
// case any code tries to read it.
export const UNIVERSAL_ROUTER_ADDRESS = "0x0000000000000000000000000000000000000000"

// Default export (also expected to exist, even though nothing uses it).
export default {}
