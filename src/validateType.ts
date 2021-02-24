export type ExpectedType = string | ExpectedTypeList | ExpectedTypeMap

export type ExpectedTypeList = ExpectedType[]

export type ExpectedTypeMap = {
  [key: string]: ExpectedType
}

/**
 * @function getType
 * @param {*} value
 * @returns {string} type Possible values:
 *   - string
 *   - regexp
 *   - number
 *   - bigint
 *   - nan
 *   - null
 *   - undefined
 *   - boolean
 *   - function
 *   - object
 *   - array
 *   - date
 *   - symbol
 *   - map
 *   - set
 *   - weakmap
 *   - weakset
 */
export const getType = (
  value: any // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
): string => {
  const type = typeof value

  switch (type) {
    case 'object':
      return Array.isArray(value)
        ? 'array' // result is the same but for style, prefer explicitly checking for array
        : Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
    case 'number':
      return isNaN(value) ? 'nan' : 'number'
    default:
      return type
  }
}

export const TYPE_ANY = 'any'

/**
 * @function typeValidator
 * @param {Function} getType Callback function that receives a value and
 *                           is expected to return its type.
 * @returns {{ isType, validateType }}
 */
export const typeValidator = (
  getType: (value: any) => string,
  anyType: string = TYPE_ANY
): {
  isType: (expectedType: ExpectedType, value: any) => boolean
  validateType: (expectedType: ExpectedType, value: any) => void
} => {
  const isType = (expectedType: ExpectedType, value: any): boolean => {
    const valueType = getType(value)

    if (expectedType === anyType) {
      return true
    } else {
      switch (getType(expectedType)) {
        case 'array':
          return (expectedType as ExpectedType[]).some((_nestedExpectedType) =>
            isType(_nestedExpectedType, value)
          )
        case 'object':
          return (
            valueType === 'object' &&
            Object.keys(value).every(
              (key) =>
                expectedType[key] !== undefined &&
                isType(expectedType[key], value[key])
            )
          )
        case 'string':
          return valueType === expectedType
        default:
          throw new Error(`Invalid expectedType ${expectedType}`)
      }
    }
  }

  const validateType = (expectedType: ExpectedType, value: any): void => {
    if (!isType(expectedType, value)) {
      throw new TypeError(
        `Expected \`${
          Array.isArray(expectedType) ? expectedType.join(' | ') : expectedType
        }\` but got \`${getType(value)}\`: ${JSON.stringify(value)}`
      )
    }
  }

  return {
    isType,
    validateType,
  }
}

const {
  /**
   * @function isType
   * @param {string[] | string} expectedType Type or array of types that are allowed for the
   *                                         given value. Use `null` and `undefined` to allow
   *                                         these values
   * @param {*} value The value whose type is being tested
   * @returns {boolean}
   */
  isType,

  /**
   * If typing is invalid, throws TypeError.
   * Returns nothing (undefined) otherwise.
   *
   * @function validateType
   * @param {string[] | string} expectedType Type or array of types that are allowed for the
   *                                         given value. Use `null` and `undefined` to allow
   *                                         these values
   * @param {*} value The value whose type is being tested
   * @returns {undefined}
   * @throws {TypeError}
   */
  validateType,
} = typeValidator(getType)

export { isType, validateType }
