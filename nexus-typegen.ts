/**
 * This file was generated by Nexus Schema
 * Do not make changes to this file directly
 */







declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
}

export interface NexusGenEnums {
}

export interface NexusGenScalars {
  String: string
  Int: number
  Float: number
  Boolean: boolean
  ID: string
}

export interface NexusGenObjects {
  Location: { // root type
    adminLevel: number; // Float!
    externalId: string; // String!
    id: string; // ID!
    iso3: string; // String!
    itosSync: boolean; // Boolean!
    latitude: number; // Float!
    locationParticipants: NexusGenRootTypes['ParticipantCountry'][]; // [ParticipantCountry!]!
    longitude: number; // Float!
    name: string; // String!
    participants: NexusGenRootTypes['Participant']; // Participant!
    pcode: string; // String!
    status: string; // String!
    validOn: number; // Float!
  }
  Organization: { // root type
    abbreviation: string; // String!
    active: boolean; // Boolean!
    children?: NexusGenRootTypes['Organization'][] | null; // [Organization!]
    collectiveInd: boolean; // Boolean!
    comments?: string | null; // String
    id: string; // ID!
    name: string; // String!
    nativeName?: string | null; // String
    newOrganization?: NexusGenRootTypes['Organization'] | null; // Organization
    notes?: string | null; // String
    organizationParticipants: NexusGenRootTypes['ParticipantOrganization'][]; // [ParticipantOrganization!]!
    parent?: NexusGenRootTypes['Organization'] | null; // Organization
    participants: NexusGenRootTypes['Participant'][]; // [Participant!]!
    url?: string | null; // String
    verified: boolean; // Boolean!
  }
  Participant: { // root type
    email?: string | null; // String
    hidId?: string | null; // String
    id: string; // ID!
    locations?: NexusGenRootTypes['Location'][] | null; // [Location!]
    name_family: string; // String!
    name_given: string; // String!
    organizations?: NexusGenRootTypes['Organization'][] | null; // [Organization!]
    participantCountry?: NexusGenRootTypes['ParticipantCountry'][] | null; // [ParticipantCountry!]
    participantOrganizations?: NexusGenRootTypes['ParticipantOrganization'][] | null; // [ParticipantOrganization!]
  }
  ParticipantCountry: { // root type
    id: string; // ID!
    location: NexusGenRootTypes['Location']; // Location!
    participant: NexusGenRootTypes['Participant']; // Participant!
    validated: boolean; // Boolean!
  }
  ParticipantOrganization: { // root type
    id: string; // ID!
    organization: NexusGenRootTypes['Organization']; // Organization!
    participant: NexusGenRootTypes['Participant']; // Participant!
    validated: boolean; // Boolean!
  }
  Query: {};
}

export interface NexusGenInterfaces {
}

export interface NexusGenUnions {
}

export type NexusGenRootTypes = NexusGenObjects

export type NexusGenAllTypes = NexusGenRootTypes & NexusGenScalars

export interface NexusGenFieldTypes {
  Location: { // field return type
    adminLevel: number; // Float!
    externalId: string; // String!
    id: string; // ID!
    iso3: string; // String!
    itosSync: boolean; // Boolean!
    latitude: number; // Float!
    locationParticipants: NexusGenRootTypes['ParticipantCountry'][]; // [ParticipantCountry!]!
    longitude: number; // Float!
    name: string; // String!
    participants: NexusGenRootTypes['Participant']; // Participant!
    pcode: string; // String!
    status: string; // String!
    validOn: number; // Float!
  }
  Organization: { // field return type
    abbreviation: string; // String!
    active: boolean; // Boolean!
    children: NexusGenRootTypes['Organization'][] | null; // [Organization!]
    collectiveInd: boolean; // Boolean!
    comments: string | null; // String
    id: string; // ID!
    name: string; // String!
    nativeName: string | null; // String
    newOrganization: NexusGenRootTypes['Organization'] | null; // Organization
    notes: string | null; // String
    organizationParticipants: NexusGenRootTypes['ParticipantOrganization'][]; // [ParticipantOrganization!]!
    parent: NexusGenRootTypes['Organization'] | null; // Organization
    participants: NexusGenRootTypes['Participant'][]; // [Participant!]!
    url: string | null; // String
    verified: boolean; // Boolean!
  }
  Participant: { // field return type
    email: string | null; // String
    hidId: string | null; // String
    id: string; // ID!
    locations: NexusGenRootTypes['Location'][] | null; // [Location!]
    name_family: string; // String!
    name_given: string; // String!
    organizations: NexusGenRootTypes['Organization'][] | null; // [Organization!]
    participantCountry: NexusGenRootTypes['ParticipantCountry'][] | null; // [ParticipantCountry!]
    participantOrganizations: NexusGenRootTypes['ParticipantOrganization'][] | null; // [ParticipantOrganization!]
  }
  ParticipantCountry: { // field return type
    id: string; // ID!
    location: NexusGenRootTypes['Location']; // Location!
    participant: NexusGenRootTypes['Participant']; // Participant!
    validated: boolean; // Boolean!
  }
  ParticipantOrganization: { // field return type
    id: string; // ID!
    organization: NexusGenRootTypes['Organization']; // Organization!
    participant: NexusGenRootTypes['Participant']; // Participant!
    validated: boolean; // Boolean!
  }
  Query: { // field return type
    allParticipants: NexusGenRootTypes['Participant'][]; // [Participant!]!
  }
}

export interface NexusGenFieldTypeNames {
  Location: { // field return type name
    adminLevel: 'Float'
    externalId: 'String'
    id: 'ID'
    iso3: 'String'
    itosSync: 'Boolean'
    latitude: 'Float'
    locationParticipants: 'ParticipantCountry'
    longitude: 'Float'
    name: 'String'
    participants: 'Participant'
    pcode: 'String'
    status: 'String'
    validOn: 'Float'
  }
  Organization: { // field return type name
    abbreviation: 'String'
    active: 'Boolean'
    children: 'Organization'
    collectiveInd: 'Boolean'
    comments: 'String'
    id: 'ID'
    name: 'String'
    nativeName: 'String'
    newOrganization: 'Organization'
    notes: 'String'
    organizationParticipants: 'ParticipantOrganization'
    parent: 'Organization'
    participants: 'Participant'
    url: 'String'
    verified: 'Boolean'
  }
  Participant: { // field return type name
    email: 'String'
    hidId: 'String'
    id: 'ID'
    locations: 'Location'
    name_family: 'String'
    name_given: 'String'
    organizations: 'Organization'
    participantCountry: 'ParticipantCountry'
    participantOrganizations: 'ParticipantOrganization'
  }
  ParticipantCountry: { // field return type name
    id: 'ID'
    location: 'Location'
    participant: 'Participant'
    validated: 'Boolean'
  }
  ParticipantOrganization: { // field return type name
    id: 'ID'
    organization: 'Organization'
    participant: 'Participant'
    validated: 'Boolean'
  }
  Query: { // field return type name
    allParticipants: 'Participant'
  }
}

export interface NexusGenArgTypes {
}

export interface NexusGenAbstractTypeMembers {
}

export interface NexusGenTypeInterfaces {
}

export type NexusGenObjectNames = keyof NexusGenObjects;

export type NexusGenInputNames = never;

export type NexusGenEnumNames = never;

export type NexusGenInterfaceNames = never;

export type NexusGenScalarNames = keyof NexusGenScalars;

export type NexusGenUnionNames = never;

export type NexusGenObjectsUsingAbstractStrategyIsTypeOf = never;

export type NexusGenAbstractsUsingStrategyResolveType = never;

export type NexusGenFeaturesConfig = {
  abstractTypeStrategies: {
    isTypeOf: false
    resolveType: true
    __typename: false
  }
}

export interface NexusGenTypes {
  context: any;
  inputTypes: NexusGenInputs;
  rootTypes: NexusGenRootTypes;
  inputTypeShapes: NexusGenInputs & NexusGenEnums & NexusGenScalars;
  argTypes: NexusGenArgTypes;
  fieldTypes: NexusGenFieldTypes;
  fieldTypeNames: NexusGenFieldTypeNames;
  allTypes: NexusGenAllTypes;
  typeInterfaces: NexusGenTypeInterfaces;
  objectNames: NexusGenObjectNames;
  inputNames: NexusGenInputNames;
  enumNames: NexusGenEnumNames;
  interfaceNames: NexusGenInterfaceNames;
  scalarNames: NexusGenScalarNames;
  unionNames: NexusGenUnionNames;
  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];
  allOutputTypes: NexusGenTypes['objectNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['unionNames'] | NexusGenTypes['interfaceNames'] | NexusGenTypes['scalarNames'];
  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes']
  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];
  abstractTypeMembers: NexusGenAbstractTypeMembers;
  objectsUsingAbstractStrategyIsTypeOf: NexusGenObjectsUsingAbstractStrategyIsTypeOf;
  abstractsUsingStrategyResolveType: NexusGenAbstractsUsingStrategyResolveType;
  features: NexusGenFeaturesConfig;
}


declare global {
  interface NexusGenPluginTypeConfig<TypeName extends string> {
  }
  interface NexusGenPluginFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginInputFieldConfig<TypeName extends string, FieldName extends string> {
  }
  interface NexusGenPluginSchemaConfig {
  }
  interface NexusGenPluginArgConfig {
  }
}