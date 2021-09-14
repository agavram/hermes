export function removeArray(arr) {
  let what,
    a = arguments,
    L = a.length,
    ax
  while (L > 1 && arr.length) {
    what = a[--L]
    while ((ax = arr.indexOf(what)) !== -1) {
      arr.splice(ax, 1)
    }
  }
  return arr
}

export function getRandom(arr, n) {
  let result = new Array(n),
    len = arr.length,
    taken = new Array(len)
  if (n > len) throw new RangeError('getRandom: more elements taken than available')
  while (n--) {
    let x = Math.floor(Math.random() * len)
    result[n] = arr[x in taken ? taken[x] : x]
    taken[x] = --len in taken ? taken[len] : len
  }
  return result
}