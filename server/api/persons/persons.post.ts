export default defineEventHandler(async (event) => {

    const body = await readBody(event)
    const searchTerm = body.name
    console.log('Received search term:', searchTerm)

  const response = await fetch('http://localhost:9200/persons/_search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
  size: 10,
  query: {
    bool: {
      must: [
        {
          multi_match: {
            query: searchTerm,
            fields: [
              'names.full_name^3',
              'names.first_name^2',
              'names.last_name^2'
            ],
            fuzziness: 'AUTO'
          }
        }
      ],
      should: [
        {
          constant_score: {
            filter: {
              term: {
                'identifiers.code': 'X_ACCOUNT'
              }
            },
            boost: 1000
          }
        }
      ]
    }
  },
  sort: [
    { _score: 'desc' }
  ]
  })
})

  const data = await response.json()

  // Optional: return the full documents instead of just _source
  const persons = data.hits.hits.map((hit: any) => hit._source)

  return persons
})



