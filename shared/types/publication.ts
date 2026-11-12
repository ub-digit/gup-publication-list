import type { Author } from './author'
import type { Category } from './category'
import type { PublicationIdentifier } from './publicationIdentifier'
import type { PublicationLink } from './publicationLink'

export interface Publication {
  id: string
  publication_id: number

  title: string
  publication_type_id?: number
  publication_type_label: string
  artistic_basis: boolean | null

  pubyear: string | number
  publanguage: string

  authors?: Author[]

  sourcetitle: string | null
  sourcevolume: string | null
  sourceissue: string | null
  sourcepages: string | null

  abstract: string | null

  publication_links?: PublicationLink[]

  isbn?: string | null
  url?: string | null
  issn: string | null
  eissn: string | null

  keywords?: string | null

  publisher: string | null

  categories?: Category[]

  publication_identifiers?: PublicationIdentifier[]
}
