import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolvePublicationFilter } from '../server/utils/publicationFilter.ts'

test('resolves institution descendants without changing the requested filters', async () => {
  const original = globalThis.fetch
  let request
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'http://elasticsearch/departments/_search')
    request = JSON.parse(options.body)
    return Response.json({hits:{total:{value:2},hits:[{_source:{id:1133}},{_source:{id:1621}}]}})
  }
  try {
    const filter = {institutionIds:['1126'],facultyId:81,seriesIds:[7],projectIds:[9]}
    const resolved = await resolvePublicationFilter(filter, 'http://elasticsearch')
    assert.deepEqual(request.query, {terms:{hierarchy:[1126]}})
    assert.deepEqual(resolved, {...filter,institutionIds:[1126,1133,1621]})
    assert.deepEqual(filter.institutionIds, ['1126'])
  } finally {globalThis.fetch=original}
})

test('does not make a department request when no institution is selected', async () => {
  const original=globalThis.fetch
  globalThis.fetch=()=>{throw new Error('Unexpected request')}
  try {assert.deepEqual(await resolvePublicationFilter({facultyId:81,institutionIds:[]},'http://elasticsearch'),{facultyId:81,institutionIds:[]})}
  finally {globalThis.fetch=original}
})

test('fails rather than returning unfiltered or partially resolved results', async () => {
  const original=globalThis.fetch
  try {
    for(const response of [
      new Response('{}',{status:503}),
      Response.json({timed_out:true,hits:{hits:[]}}),
      Response.json({_shards:{failed:1},hits:{hits:[]}}),
      Response.json({hits:{total:{value:10001},hits:[]}})
    ]) {
      globalThis.fetch=async()=>response
      await assert.rejects(resolvePublicationFilter({institutionIds:[1126]},'http://elasticsearch'),{statusCode:502})
    }
  } finally {globalThis.fetch=original}
})
