export function chunk(array: unknown[], chunkSize: number) {
  const chunks = [];
  let index = 0;
  const length = array.length;

  while (index < length) {
    chunks.push(array.slice(index, (index += chunkSize)));
  }

  return chunks;
}
