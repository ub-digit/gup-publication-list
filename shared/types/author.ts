import type { Affiliation } from './affiliation'
import type { PublicationPerson } from './publicationPerson'

export interface Author {
  person: PublicationPerson[]
  affiliations: Affiliation[]
  position: {
    position: number
  }[]
}
