import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPublicationQuery } from '../server/utils/publicationQuery.ts'

test('export and list share filtering and sorting, but not pagination or aggregations', () => {
  const filter = {gupPersonIds:[1,2],publicationTypeIds:[5],startYear:2020,endYear:2025,peerReviewed:true,artisticWorkOnly:true,isOa:true,searchTerm:'climate',sortBy:'title',page:500,pageSize:999999}
  const list = buildPublicationQuery(filter, {from:20,size:20})
  const download = buildPublicationQuery(filter, {size:10000,aggregations:false})
  assert.deepEqual(download.query, list.query)
  assert.deepEqual(download.sort, list.sort)
  assert.equal(download.from, 0)
  assert.equal(download.size, 10000)
  assert.equal(download.aggs, undefined)
  assert.ok(list.aggs)
  assert.ok(download.query.bool.filter.some(f => f.term?.artistic_basis))
  assert.deepEqual(download.query.bool.filter.find(f => f.range), {range:{pubyear:{gte:2020,lte:2025}}})
})

test('combines faculty, institution, series and project filters in list and export', () => {
  const filters = {facultyId:'81',institutionIds:['1126','1621'],seriesIds:[4,7],projectIds:[9,11]}
  const list = buildPublicationQuery(filters)
  const download = buildPublicationQuery(filters, {size:10000,aggregations:false})
  assert.deepEqual(list.query, download.query)
  assert.deepEqual(list.query.bool.filter, [
    {term:{source:'gup'}},
    {terms:{'authors.affiliations.faculty_id':[81]}},
    {terms:{'authors.affiliations.department_id':[1126,1621]}},
    {terms:{'series.series_id':[4,7]}},
    {terms:{'projects.project_id':[9,11]}}
  ])
})

test('normalizes relationship IDs and removes filters when selections are cleared', () => {
  const body = buildPublicationQuery({institutionIds:['','1621','1621','bad',null],seriesIds:'4,7',projectIds:[-1,0,1.2],facultyId:null})
  assert.deepEqual(body.query.bool.filter, [
    {term:{source:'gup'}},
    {terms:{'authors.affiliations.department_id':[1621]}},
    {terms:{'series.series_id':[4,7]}}
  ])
  assert.deepEqual(buildPublicationQuery({institutionIds:[],seriesIds:[],projectIds:[],facultyId:null}).query.bool.filter,[{term:{source:'gup'}}])
})
