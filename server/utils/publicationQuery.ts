// Shared by the result list and RIS export so both use the same selection and sorting.
export function buildPublicationQuery(filter: Record<string, any>, options: { from?: number; size?: number; aggregations?: boolean } = {}) {
  const body: any = {
    from: options.from ?? 0,
    size: options.size ?? 20,
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

  // Author identities selected in the person search.
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

  // Publication types.
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

  // OR within a multi-select, AND between different filter groups.
  const ids = (value: unknown): number[] => {
    const values = Array.isArray(value) ? value : value == null ? [] : String(value).split(',')
    return [...new Set(values.filter(value => String(value).trim() !== '')
      .map(Number).filter(value => Number.isSafeInteger(value) && value > 0))]
  }
  const relationships = [
    ['authors.affiliations.faculty_id', ids(filter.facultyId)],
    ['authors.affiliations.department_id', ids(filter.institutionIds)],
    ['series.series_id', ids(filter.seriesIds)],
    ['projects.project_id', ids(filter.projectIds)]
  ] as const
  for (const [field, selectedIds] of relationships) {
    if (selectedIds.length) body.query.bool.filter.push({ terms: { [field]: selectedIds } })
  }

  // Sorting.
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

  // Free text.
  if (filter.searchTerm?.trim()) {
    body.query.bool.must = [
      {
        multi_match: {
          query: filter.searchTerm,
          fields: ['title^3', 'abstract', 'authors.name', 'keywords']
        }
      }
    ]
  }

  // Access and review flags.
  if (filter.isOa === true) {
    body.query.bool.filter.push({
      term: {
        'publication_links.is_oa': true
      }
    })
  }

  if (filter.peerReviewed === true || filter.peerReviewed === 'true') {
    body.query.bool.filter.push({
      term: {
        'ref_value.keyword': 'ISREF'
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

  // Publication years.
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

  if (options.aggregations === false) delete body.aggs
  return body
}
