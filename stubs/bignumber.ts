/**
 * Compatibilidade para libs que fazem:
 *   import { BigNumber } from "bignumber.js"
 *
 * O pacote original exporta apenas default; aqui reexportamos
 * o default como `BigNumber` (named) e também como default.
 */
import BigNumberDefault from "bignumber.js"
export const BigNumber = BigNumberDefault
export default BigNumberDefault
