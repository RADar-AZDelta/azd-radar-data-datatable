export const objectComparison = (object1: object | null, object2: object | null) => {
  if (isObject(object1) && isObject(object2)) {
    const keys1 = Object.keys(object1!)
    const keys2 = Object.keys(object2!)

    if (keys1.length !== keys2.length) {
      return false
    }

    for (const key of keys1) {
      const val1 = object1![key as keyof object]
      const val2 = object2![key as keyof object]
      if (!objectComparison(val1, val2) || val1 !== val2) {
        return false
      }
    }

    return true
  } else {
  }
}

const isObject = (object: object | null) => {
  return object != null && typeof object === 'object'
}
