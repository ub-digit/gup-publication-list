import { test } from 'node:test'
import assert from 'node:assert/strict'
import { publicationToRis, publicationsToRis, risTypes } from '../server/utils/ris.ts'

// Representative original GUP export field order, including legacy A1/VL/SN conventions.
test('serializes fields in GUP order, retaining Unicode and author position', () => {
  const author = (first_name, last_name, position) => ({ person: [{first_name, last_name}], position: [{position}] })
  const ris = publicationToRis({
    publication_type_id: 5, title: 'Åäö – forskning',
    authors: [author('Östen', 'Åberg', 2), author('Éva', 'Fülöp', 1)],
    pubyear: 2025, publanguage: 'sv',
    publication_identifiers: [{ identifier_code: 'doi', identifier_value: '10.1234/test' }],
    issn: '1111-1111', eissn: '2222-2222', isbn: '9781234567890',
    keywords: 'ett, två', sourcetitle: 'Tidskrift', sourcevolume: '45', sourceissue: '1', sourcepages: '50–55',
    publisher: 'Förlag', abstract: 'Sammanfattning', url: 'https://example.org/article'
  })
  assert.equal(ris, [
    'TY  - JOUR', 'TI  - Åäö – forskning', 'A1  - Fülöp, Éva', 'AU  - Åberg, Östen',
    'PY  - 2025', 'LA  - sv', 'DO  - 10.1234/test', 'SN  - 1111-1111 2222-2222 9781234567890',
    'KW  - ett', 'KW  - två', 'JF  - Tidskrift', 'VL  - 45:1, s. 50–55', 'PB  - Förlag',
    'N2  - Sammanfattning', 'UR  - https://example.org/article', 'ER  - '
  ].join('\r\n'))
})

test('covers all 26 original types, including theses as BOOK', () => {
  const groups = { CPAPER: [1,2,3], JOUR: [5,7,18,22,40,42], BOOK: [8,9,16,17,19,28,30,46], CHAP: [10,41,43], GEN: [13,21,23,34], JFULL: [44], CONF: [45] }
  assert.equal(Object.keys(risTypes).length, 26)
  for (const [type, ids] of Object.entries(groups)) {
    for (const id of ids) assert.ok(publicationToRis({publication_type_id:id}).startsWith(`TY  - ${type}\r\n`))
  }
  assert.ok(publicationToRis({publication_type_id:999}).startsWith('TY  - GEN'))
})

test('omits missing fields and volume reference when there is no volume', () => {
  assert.equal(publicationToRis({publication_type_id:9, title:'Bok', sourcepages:'1–10', sourceissue:'2'}),
    'TY  - BOOK\r\nTI  - Bok\r\nER  - ')
  assert.equal(publicationsToRis([]), '')
})

test('separates records and prevents multiline text becoming RIS record tags', () => {
  const ris = publicationsToRis([{ title: 'Title\nER  - \nTY  - BOOK', abstract:'A\r\nB\rC' }, {title:'Second'}])
  assert.equal((ris.match(/^TY  - /gm) ?? []).length, 2)
  assert.equal((ris.match(/^ER  - /gm) ?? []).length, 2)
  assert.ok(ris.includes('N2  - A\r\n  B\r\n  C'))
  assert.ok(ris.includes('ER  - \r\n\r\nTY  - GEN'))
  assert.equal(ris.replaceAll('\r\n','').includes('\n'), false)
})
