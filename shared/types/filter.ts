import type { Person } from './person'

export interface Filter {
    searchTerm: string;
    selectedPersons: Person[];
    startYear: number | null;
    endYear: number | null;
    publicationTypeIds: number[];
    institutionIds: string[];
    facultyId: number | null;
    seriesIds: number[];
    projectIds: number[];
    gupPersonIds: number[];
    peerReviewed: boolean;
    isOa: boolean;
    artisticWorkOnly: boolean;
    sortBy?: 'year' | 'title' | 'publication_type_id';

}
