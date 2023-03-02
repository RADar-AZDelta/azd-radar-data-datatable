const transpileData = async (data: any) => {
  /*
        For Arquero column store
        Example:

        {
            a: ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10"],
            b: ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "b10"]
        }

        Here are "a" and "b" the columns and the values are the data
    */
  const columns = []
  const dataFound: any = {}
  for (let key in data[0]) {
    columns.push(key)
  }
  for (let col of columns) {
    const d = []
    for (let obj of data) {
      d.push(obj[col])
    }
    dataFound[col] = d
  }

  return dataFound
}

export const load = async (event: any) => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  const json = await response.json()
  const data = await transpileData(json)

  return { data }
}
