import 'jest-extended'
import { hasProps, doesNotHaveProps } from '../utils/fnUtils'

const runUtilTests = () => {
  testFnUtils()
}


const testFnUtils = () => {

  test('detect property extance correctly', async () => {
    const o = { a: 'a', b: 'b', c: 'c' }
    expect(hasProps(['a'], o)).toBe(true)
    expect(hasProps(['a', 'b'], o)).toBe(true)
    expect(hasProps(['a', 'b', 'c'], o)).toBe(true)
    expect(hasProps(['f', 'g', 'h', 'i'], o)).toBe(false)
    expect(hasProps(['a', 'z'], o)).toBe(false)
    expect(hasProps(['a', 'b', 'c', 'd'], o)).toBe(false)

    expect(doesNotHaveProps(['a'], o)).toBe(false)
    expect(doesNotHaveProps(['a', 'b'], o)).toBe(false)
    expect(doesNotHaveProps(['a', 'b', 'c'], o)).toBe(false)
    expect(doesNotHaveProps(['f', 'g', 'h', 'i'], o)).toBe(true)
    expect(doesNotHaveProps(['a', 'z'], o)).toBe(true)
    expect(doesNotHaveProps(['a', 'b', 'c', 'd'], o)).toBe(true)
  })
}
runUtilTests()