module.exports.chunkArray = function (originalArray, chunkSize, balanced) {
  const arr = originalArray.slice();

  if (chunkSize < 2) {
    return arr;
  }

  const len = arr.length;
  const result = [];
  let index = 0;
  let size = 0;

  if (len % chunkSize === 0) {
    size = Math.floor(len / chunkSize);
    while (index < len) {
      result.push(arr.slice(index, index += size));
    }
  } else if (balanced) {
    while (index < len) {
      size = Math.ceil((len - index) / chunkSize--);
      result.push(arr.slice(index, index += size));
    }
  } else {
    chunkSize--;
    size = Math.floor(len / chunkSize);
    if (len % size === 0) {
      size--;
    }
    while (index < size * chunkSize) {
      result.push(arr.slice(index, index += size));
    }
    result.push(arr.slice(size * chunkSize));
  }
  return result;
}
