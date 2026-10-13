import type { Person } from './person'

export interface Filter {
    selectedPersons: Person[];
    startYear: number;
    endYear: number;
    publicationTypeIds: number[];
    institutionIds: string[];
    facultyId: number;
    seriesIds: number[];
    projectIds: number[];
    gupPersonIds: number[];
    peerReviewed: boolean;
    isOa: boolean;
    artisticWorkOnly: boolean;

}