import type { Publication } from '../../shared/types/publication'

// GUP publication.rb#ris_publication_type_mapping, keyed by the IDs used by GUP admin.
export const risTypes: Record<number, string> = {
  21: 'GEN', // other
  42: 'JOUR', // publication_newspaper-article
  5: 'JOUR', // publication_journal-article
  7: 'JOUR', // publication_magazine-article
  43: 'CHAP', // publication_encyclopedia-entry
  9: 'BOOK', // publication_book
  17: 'BOOK', // publication_doctoral-thesis
  22: 'JOUR', // publication_review-article
  40: 'JOUR', // publication_editorial-letter
  10: 'CHAP', // publication_book-chapter
  41: 'CHAP', // publication_report-chapter
  1: 'CPAPER', // conference_other
  34: 'GEN', // artistic-work_original-creative-work
  23: 'GEN', // artistic-work_scientific_and_development
  19: 'BOOK', // publication_licentiate-thesis
  30: 'BOOK', // publication_textbook
  2: 'CPAPER', // conference_paper
  13: 'GEN', // intellectual-property_patent
  3: 'CPAPER', // conference_poster
  45: 'CONF', // conference_proceeding
  16: 'BOOK', // publication_report
  18: 'JOUR', // publication_book-review
  8: 'BOOK', // publication_edited-book
  44: 'JFULL', // publication_journal-issue
  28: 'BOOK', // publication_textcritical-edition
  46: 'BOOK', // publication_working-paper
}

export function publicationToRis(publication: Partial<Publication>): string {
  const fields: string[] = []
  const add = (tag: string, value: unknown) => {
    if (value !== undefined && value !== null) {
      // Continuation lines must not be mistaken for RIS tags or record boundaries.
      const text = String(value).replace(/\r\n?/g, '\n').replace(/\n/g, '\r\n  ')
      fields.push(`${tag}  - ${text}`)
    }
  }
  add('TY', risTypes[publication.publication_type_id!] ?? 'GEN')
  add('TI', publication.title)
  const authors = [...(publication.authors ?? [])]
    .sort((a, b) => (a.position?.[0]?.position ?? Infinity) - (b.position?.[0]?.position ?? Infinity))
    .flatMap(author => author.person?.[0] ? [author.person[0]] : [])
  authors.forEach((person, index) => add(index === 0 ? 'A1' : 'AU',
    [person.last_name, person.first_name].filter(value => value != null).join(', ')))
  add('PY', publication.pubyear)
  add('LA', publication.publanguage)
  add('DO', publication.publication_identifiers?.find(identifier => identifier.identifier_code === 'doi')?.identifier_value)
  const serialNumbers = [publication.issn, publication.eissn, publication.isbn].filter(value => value != null)
  if (serialNumbers.length) add('SN', serialNumbers.join(' '))
  publication.keywords?.split(',').forEach(keyword => add('KW', keyword.trim()))
  add('JF', publication.sourcetitle)
  if (publication.sourcevolume != null) {
    let reference = publication.sourcevolume
    if (publication.sourceissue != null) reference += `:${publication.sourceissue}`
    if (publication.sourcepages != null) reference += `, s. ${publication.sourcepages}`
    add('VL', reference)
  }
  add('PB', publication.publisher)
  add('N2', publication.abstract)
  add('UR', publication.url)
  add('ER', '')
  return fields.join('\r\n')
}

export function publicationsToRis(publications: Partial<Publication>[]): string {
  return publications.length ? publications.map(publicationToRis).join('\r\n\r\n') + '\r\n' : ''
}
