export type GeographyOverride = {
  id: string;
  sourceLabel: string;
  countryCode: string;
  matchedName: string;
  adminName1: string;
  adminName2: string;
  latitude: number;
  longitude: number;
  artistCount: number;
  artists: string[];
};

export const geographyOverrides: GeographyOverride[] = [
  {
    id: 'ch-bale-ville',
    sourceLabel: 'Bâle-Ville',
    countryCode: 'CH',
    matchedName: 'Bâle-Ville',
    adminName1: 'Bâle-Ville',
    adminName2: '',
    latitude: 47.5669,
    longitude: 7.61519,
    artistCount: 1,
    artists: ['Zeal And Ardor'],
  },
  {
    id: 'gb-meriden-angleterre',
    sourceLabel: 'Meriden, Angleterre',
    countryCode: 'GB',
    matchedName: 'Meriden',
    adminName1: 'Angleterre',
    adminName2: 'Solihull',
    latitude: 52.4377,
    longitude: -1.64366,
    artistCount: 1,
    artists: ['Napalm Death'],
  },
  {
    id: 'id-garut-java-occidental',
    sourceLabel: 'Garut, Java occidental',
    countryCode: 'ID',
    matchedName: 'Garut',
    adminName1: 'Java occidental',
    adminName2: 'Kabupaten Garut',
    latitude: -7.245,
    longitude: 107.921,
    artistCount: 1,
    artists: ['Voice Of Baceprot'],
  },
  {
    id: 'it-sacile-frioul-venetie-julienne',
    sourceLabel: 'Sacile, Frioul-Vénétie Julienne',
    countryCode: 'IT',
    matchedName: 'Sacile',
    adminName1: 'Frioul-Vénétie julienne',
    adminName2: 'Pordenone',
    latitude: 45.95412,
    longitude: 12.50274,
    artistCount: 1,
    artists: ['Elvenking'],
  },
  {
    id: 'us-glendale-californie',
    sourceLabel: 'Glendale, Californie',
    countryCode: 'US',
    matchedName: 'Glendale',
    adminName1: 'Californie',
    adminName2: 'Comté de Los Angeles',
    latitude: 34.14251,
    longitude: -118.25508,
    artistCount: 1,
    artists: ['System Of A Down'],
  },
  {
    id: 'us-long-island-etat-de-new-york',
    sourceLabel: 'Long Island, État de New York',
    countryCode: 'US',
    matchedName: 'Long Island',
    adminName1: 'État de New York',
    adminName2: '',
    latitude: 40.7891,
    longitude: -73.135,
    artistCount: 3,
    artists: ["Blackmore's Night", 'Blue Öyster Cult', 'Dream Theater'],
  },
  {
    id: 'us-mechanicsburg-pennsylvanie',
    sourceLabel: 'Mechanicsburg, Pennsylvanie',
    countryCode: 'US',
    matchedName: 'Mechanicsburg',
    adminName1: 'Pennsylvanie',
    adminName2: 'Comté de Cumberland',
    latitude: 40.21426,
    longitude: -77.00859,
    artistCount: 1,
    artists: ['Poison'],
  },
];
