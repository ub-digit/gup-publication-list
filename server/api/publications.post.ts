// server/api/publications.post.ts
export default defineEventHandler(async (event) => {
  console.log('Fetching publications from Elasticsearch...')

  // Read the entire filter object from the POST body
  const filter = await readBody(event) || {}


// Build the base ES query
const body: any = {
  size: 50,
  track_total_hits: true,
  query: {
    bool: {
      filter: [
        {
          term: {
            source: 'gup'
          }
        }
      ]
    }
  },
  aggs: {
    min_year: {
      min: {
        script: {
          source: `
            if (doc['pubyear.keyword'].size() == 0) {
              return null;
            }
            int year = Integer.parseInt(doc['pubyear.keyword'].value);
            if (year < 1000 || year > 2100) {
              return null;
            }
            return year;
          `
        }
      }
    },
    max_year: {
      max: {
        script: {
          source: `
            if (doc['pubyear.keyword'].size() == 0) {
              return null;
            }
            int year = Integer.parseInt(doc['pubyear.keyword'].value);
            if (year < 1000 || year > 2100) {
              return null;
            }
            return year;
          `
        }
      }
    }
  }
}

  // --- Example: handle gupPersonIds if it exists in the filter ---
  const userIds = filter.gupPersonIds
    ? (Array.isArray(filter.gupPersonIds)
        ? filter.gupPersonIds
        : String(filter.gupPersonIds).split(','))
        .map((id: string | number) => Number(id))
        .filter(Number.isFinite)
    : []

  if (userIds.length > 0) {
    body.query.bool.filter.push({
      terms: {
        'authors.person.id': userIds.flat()
      }
    })
  }

  // --- Publication type filter ---
  const publicationTypeIds = filter.publicationTypeIds
    ? (Array.isArray(filter.publicationTypeIds)
        ? filter.publicationTypeIds
        : String(filter.publicationTypeIds).split(','))
        .map((id: string | number) => Number(id))
        .filter(Number.isFinite)
    : []

  if (publicationTypeIds.length > 0) {
    body.query.bool.filter.push({
      terms: {
        publication_type_id: publicationTypeIds
      }
    })
  }

  // --- Sorting ---
  const sortFields: Record<string, string> = {
    year: 'pubyear.keyword',
    title: 'title.sort',
    publication_type_id: 'publication_type_id'
  }

  const sortBy = filter.sortBy ?? 'year'

  if (sortFields[sortBy]) {
    body.sort = [{
      [sortFields[sortBy]]: {
        order: sortBy === 'year' ? 'desc' : 'asc'
      }
    }]
  }

  // --- Example: handle free-text search ---
  if (filter.searchTerm?.trim()) {
    body.query.bool.must = [
      {
        multi_match: {
          query: filter.searchTerm,
          fields: ['title^3', 'abstract', 'authors.name', 'keywords'] // adjust to your fields
        }
      }
    ]
  }

  // check filter for artisticWork and peerReviewed flags
  // --- Artistic work filter ---
  if (filter.isOa === true) {
    body.query.bool.filter.push({
      term: {
        'publication_links.is_oa': true
      }
    })
  }

  // --- Peer-reviewed filter ---
  // --- Peer-reviewed filter ---
  if (filter.peerReviewed === true || filter.peerReviewed === 'true') {
    body.query.bool.filter.push({
      term: {
        'ref_value.keyword': 'ISREF'   // prefer .keyword if it exists
      }
    })
  }

  if (filter.artisticWorkOnly === true || filter.artisticWorkOnly === 'true') {
    body.query.bool.filter.push({
      term: {
        'artistic_basis': true   // prefer .keyword if it exists
      }
    })
  }

  // --- Year range filter ---
  if (filter.startYear && filter.endYear) {
    body.query.bool.filter.push({
      range: {
        pubyear: {
          gte: filter.startYear,
          lte: filter.endYear
        }
      }
    })
  } else if (filter.startYear) {
    body.query.bool.filter.push({
      range: {
        pubyear: {
          gte: filter.startYear
        }
      }
    })
  } else if (filter.endYear) {
    body.query.bool.filter.push({
      range: {
        pubyear: {
          lte: filter.endYear
        }
      }
    })
  }

  // Add more filter fields here as you grow the filter object

  console.log('ES query body:', JSON.stringify(body, null, 2))

  const response = await fetch('http://localhost:9200/publications/_search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Elasticsearch error: ${response.statusText}`
    })
  }

  const data = await response.json()
  const publications = data.hits.hits.map((hit: any) => hit._source)

  // Extract min / max
  const minYear = data.aggregations?.min_year?.value ?? null
  const maxYear = data.aggregations?.max_year?.value ?? null
  const range = (minYear !== null && maxYear !== null) ? { minYear, maxYear } : null
  const total = typeof data.hits.total === 'number' ? data.hits.total : data.hits.total?.value ?? 0

  console.log(`Found ${total} publications. Min year: ${minYear}, Max year: ${maxYear}`)
  return { publications, range, total}
})
