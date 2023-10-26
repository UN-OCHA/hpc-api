--
-- PostgreSQL database dump
--

-- Dumped from database version 11.7 (Debian 11.7-2.pgdg90+1)
-- Dumped by pg_dump version 11.7 (Debian 11.7-2.pgdg90+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO postgres;

--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: enum_authGrantee_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_authGrantee_type" AS ENUM (
    'user'
);


ALTER TYPE public."enum_authGrantee_type" OWNER TO postgres;

--
-- Name: enum_authTarget_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_authTarget_type" AS ENUM (
    'global',
    'operation',
    'operationCluster',
    'plan',
    'governingEntity',
    'project'
);


ALTER TYPE public."enum_authTarget_type" OWNER TO postgres;

--
-- Name: enum_flowObject_behavior; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_flowObject_behavior" AS ENUM (
    'overlap',
    'shared'
);


ALTER TYPE public."enum_flowObject_behavior" OWNER TO postgres;

--
-- Name: enum_form_belongsToType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_form_belongsToType" AS ENUM (
    'global',
    'operation'
);


ALTER TYPE public."enum_form_belongsToType" OWNER TO postgres;

--
-- Name: enum_iatiPublisher_fetchStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_iatiPublisher_fetchStatus" AS ENUM (
    'queued',
    'downloading',
    'downloaded',
    'halted'
);


ALTER TYPE public."enum_iatiPublisher_fetchStatus" OWNER TO postgres;

--
-- Name: enum_job_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_job_status AS ENUM (
    'pending',
    'success',
    'failed'
);


ALTER TYPE public.enum_job_status OWNER TO postgres;

--
-- Name: enum_job_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_job_type AS ENUM (
    'projectPdfGeneration',
    'locationImport',
    'confirmableCommand'
);


ALTER TYPE public.enum_job_type OWNER TO postgres;

--
-- Name: enum_objectExclude_module; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_objectExclude_module" AS ENUM (
    'FTS',
    'RPM',
    'Public'
);


ALTER TYPE public."enum_objectExclude_module" OWNER TO postgres;

--
-- Name: enum_project_implementationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_project_implementationStatus" AS ENUM (
    'Planning',
    'Implementing',
    'Ended - Completed',
    'Ended - Terminated',
    'Ended - Not started and abandoned'
);


ALTER TYPE public."enum_project_implementationStatus" OWNER TO postgres;

--
-- Name: enum_reportingWindowAssignment_assigneeType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_reportingWindowAssignment_assigneeType" AS ENUM (
    'operation',
    'operationCluster'
);


ALTER TYPE public."enum_reportingWindowAssignment_assigneeType" OWNER TO postgres;

--
-- Name: enum_reportingWindow_belongsToType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_reportingWindow_belongsToType" AS ENUM (
    'global',
    'operation'
);


ALTER TYPE public."enum_reportingWindow_belongsToType" OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: governingEntity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."governingEntity" (
    id integer NOT NULL,
    "planId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "entityPrototypeId" integer NOT NULL,
    "deletedAt" timestamp with time zone,
    "currentVersion" boolean DEFAULT false NOT NULL,
    "latestVersion" boolean DEFAULT false NOT NULL,
    "latestTaggedVersion" boolean DEFAULT false NOT NULL,
    "versionTags" character varying(8)[] DEFAULT (ARRAY[]::character varying[])::character varying(8)[]
);


ALTER TABLE public."governingEntity" OWNER TO postgres;

--
-- Name: entityType(public."governingEntity"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public."entityType"(public."governingEntity") RETURNS character varying
    LANGUAGE sql IMMUTABLE
    AS $_$  SELECT "entityPrototype"."refCode" FROM "public"."entityPrototype" WHERE "entityPrototype"."id" = $1."entityPrototypeId" $_$;


ALTER FUNCTION public."entityType"(public."governingEntity") OWNER TO postgres;

--
-- Name: projectVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."projectVersion" (
    id integer NOT NULL,
    "projectId" integer NOT NULL,
    version integer NOT NULL,
    name text NOT NULL,
    "currentRequestedFunds" bigint,
    "startDate" date,
    "endDate" date,
    objective text,
    partners text,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    code character varying(255),
    "editorParticipantId" integer,
    tags character varying(25)[] DEFAULT (ARRAY[]::character varying[])::character varying(25)[]
);


ALTER TABLE public."projectVersion" OWNER TO postgres;

--
-- Name: implementationStatus(public."projectVersion"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public."implementationStatus"(public."projectVersion") RETURNS character varying
    LANGUAGE sql STABLE
    AS $_$ SELECT (CASE WHEN "project"."currentPublishedVersionId" = $1."id" THEN 'published' WHEN "project"."currentPublishedVersionId" IS NULL AND $1."id" = "project"."latestVersionId" THEN 'unpublished' WHEN "project"."currentPublishedVersionId" IS NOT NULL AND $1."id" = "project"."latestVersionId" THEN 'draft' ELSE 'archived' END) FROM "project" WHERE "project"."id" = $1."projectId" $_$;


ALTER FUNCTION public."implementationStatus"(public."projectVersion") OWNER TO postgres;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO postgres;

--
-- Name: attachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attachment (
    id integer NOT NULL,
    "objectId" integer NOT NULL,
    "objectType" character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "attachmentPrototypeId" integer,
    "deletedAt" timestamp with time zone,
    "currentVersion" boolean DEFAULT false NOT NULL,
    "latestVersion" boolean DEFAULT false NOT NULL,
    "latestTaggedVersion" boolean DEFAULT false NOT NULL,
    "versionTags" character varying(8)[] DEFAULT (ARRAY[]::character varying[])::character varying(8)[],
    "planId" integer
);


ALTER TABLE public.attachment OWNER TO postgres;

--
-- Name: attachmentPrototype; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."attachmentPrototype" (
    id integer NOT NULL,
    "refCode" character varying(255),
    type character varying(255),
    value json,
    "planId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."attachmentPrototype" OWNER TO postgres;

--
-- Name: attachmentPrototype_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."attachmentPrototype_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."attachmentPrototype_id_seq" OWNER TO postgres;

--
-- Name: attachmentPrototype_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."attachmentPrototype_id_seq" OWNED BY public."attachmentPrototype".id;


--
-- Name: attachmentVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."attachmentVersion" (
    id integer NOT NULL,
    "attachmentId" integer,
    "customReference" character varying(255),
    value jsonb,
    "currentVersion" boolean DEFAULT false NOT NULL,
    "latestVersion" boolean DEFAULT false NOT NULL,
    "latestTaggedVersion" boolean DEFAULT false NOT NULL,
    "versionTags" character varying(8)[] DEFAULT (ARRAY[]::character varying[])::character varying(8)[],
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "hasDisaggregatedData" boolean DEFAULT false
);


ALTER TABLE public."attachmentVersion" OWNER TO postgres;

--
-- Name: attachmentVersion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."attachmentVersion_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."attachmentVersion_id_seq" OWNER TO postgres;

--
-- Name: attachmentVersion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."attachmentVersion_id_seq" OWNED BY public."attachmentVersion".id;


--
-- Name: attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attachment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.attachment_id_seq OWNER TO postgres;

--
-- Name: attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attachment_id_seq OWNED BY public.attachment.id;


--
-- Name: authGrant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."authGrant" (
    "createdAt" timestamp with time zone NOT NULL,
    grantee integer NOT NULL,
    roles character varying(255)[] NOT NULL,
    target integer NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."authGrant" OWNER TO postgres;

--
-- Name: authGrantLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."authGrantLog" (
    actor integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    date timestamp with time zone NOT NULL,
    grantee integer NOT NULL,
    id integer NOT NULL,
    "newRoles" character varying(255)[] NOT NULL,
    target integer NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."authGrantLog" OWNER TO postgres;

--
-- Name: authGrantLog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."authGrantLog_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."authGrantLog_id_seq" OWNER TO postgres;

--
-- Name: authGrantLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."authGrantLog_id_seq" OWNED BY public."authGrantLog".id;


--
-- Name: authGrantee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."authGrantee" (
    "createdAt" timestamp with time zone NOT NULL,
    "granteeId" integer NOT NULL,
    id integer NOT NULL,
    type public."enum_authGrantee_type" NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."authGrantee" OWNER TO postgres;

--
-- Name: authGrantee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."authGrantee_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."authGrantee_id_seq" OWNER TO postgres;

--
-- Name: authGrantee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."authGrantee_id_seq" OWNED BY public."authGrantee".id;


--
-- Name: authInvite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."authInvite" (
    actor integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    email character varying(255) NOT NULL,
    roles character varying(255)[] NOT NULL,
    target integer NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."authInvite" OWNER TO postgres;

--
-- Name: authTarget; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."authTarget" (
    "createdAt" timestamp with time zone NOT NULL,
    id integer NOT NULL,
    "targetId" integer,
    type public."enum_authTarget_type" NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."authTarget" OWNER TO postgres;

--
-- Name: authTarget_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."authTarget_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."authTarget_id_seq" OWNER TO postgres;

--
-- Name: authTarget_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."authTarget_id_seq" OWNED BY public."authTarget".id;


--
-- Name: authToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."authToken" (
    "createdAt" timestamp with time zone NOT NULL,
    expires timestamp with time zone,
    participant integer NOT NULL,
    "tokenHash" character varying(255) NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."authToken" OWNER TO postgres;

--
-- Name: blueprint; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blueprint (
    id integer NOT NULL,
    name character varying(255),
    description text,
    status character varying(255),
    model json,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    type character varying(255)
);


ALTER TABLE public.blueprint OWNER TO postgres;

--
-- Name: budgetSegment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."budgetSegment" (
    id integer NOT NULL,
    "projectVersionId" integer NOT NULL,
    name character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."budgetSegment" OWNER TO postgres;

--
-- Name: budgetSegmentBreakdown; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."budgetSegmentBreakdown" (
    id integer NOT NULL,
    "budgetSegmentId" integer,
    name character varying(255),
    content jsonb,
    type character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."budgetSegmentBreakdown" OWNER TO postgres;

--
-- Name: budgetSegmentBreakdownEntity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."budgetSegmentBreakdownEntity" (
    id integer NOT NULL,
    "budgetSegmentBreakdownId" integer,
    "objectType" character varying(255) NOT NULL,
    "objectId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."budgetSegmentBreakdownEntity" OWNER TO postgres;

--
-- Name: budgetSegmentBreakdownEntity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."budgetSegmentBreakdownEntity_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."budgetSegmentBreakdownEntity_id_seq" OWNER TO postgres;

--
-- Name: budgetSegmentBreakdownEntity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."budgetSegmentBreakdownEntity_id_seq" OWNED BY public."budgetSegmentBreakdownEntity".id;


--
-- Name: budgetSegmentBreakdown_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."budgetSegmentBreakdown_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."budgetSegmentBreakdown_id_seq" OWNER TO postgres;

--
-- Name: budgetSegmentBreakdown_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."budgetSegmentBreakdown_id_seq" OWNED BY public."budgetSegmentBreakdown".id;


--
-- Name: budgetSegment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."budgetSegment_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."budgetSegment_id_seq" OWNER TO postgres;

--
-- Name: budgetSegment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."budgetSegment_id_seq" OWNED BY public."budgetSegment".id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cache (
    "createdAt" timestamp with time zone NOT NULL,
    data jsonb NOT NULL,
    fingerprint character varying(255) NOT NULL,
    namespace character varying(255) NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    tag character varying(255)
);


ALTER TABLE public.cache OWNER TO postgres;

--
-- Name: category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.category (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    "parentID" integer,
    "group" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    code character varying(255),
    "includeTotals" boolean
);


ALTER TABLE public.category OWNER TO postgres;

--
-- Name: categoryGroup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."categoryGroup" (
    type character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."categoryGroup" OWNER TO postgres;

--
-- Name: categoryLegacy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."categoryLegacy" (
    id integer NOT NULL,
    "group" character varying(255) NOT NULL,
    "legacyID" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."categoryLegacy" OWNER TO postgres;

--
-- Name: categoryRef; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."categoryRef" (
    "objectID" integer NOT NULL,
    "versionID" integer DEFAULT 1 NOT NULL,
    "objectType" character varying(32) NOT NULL,
    "categoryID" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."categoryRef" OWNER TO postgres;

--
-- Name: category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.category_id_seq OWNER TO postgres;

--
-- Name: category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.category_id_seq OWNED BY public.category.id;


--
-- Name: client; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client (
    id integer NOT NULL,
    "clientId" character varying(255),
    "clientSecret" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.client OWNER TO postgres;

--
-- Name: client_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.client_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.client_id_seq OWNER TO postgres;

--
-- Name: client_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_id_seq OWNED BY public.client.id;


--
-- Name: conditionField; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."conditionField" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "fieldType" character varying(255) NOT NULL,
    rules jsonb,
    required boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "order" integer,
    description text,
    "grouping" boolean DEFAULT true NOT NULL,
    label jsonb DEFAULT '{}'::jsonb NOT NULL,
    "planId" integer NOT NULL
);


ALTER TABLE public."conditionField" OWNER TO postgres;

--
-- Name: conditionFieldReliesOn; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."conditionFieldReliesOn" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "reliedOnById" integer NOT NULL,
    "reliesOnId" integer NOT NULL
);


ALTER TABLE public."conditionFieldReliesOn" OWNER TO postgres;

--
-- Name: conditionFieldType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."conditionFieldType" (
    type character varying(32) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."conditionFieldType" OWNER TO postgres;

--
-- Name: conditionField_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."conditionField_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."conditionField_id_seq" OWNER TO postgres;

--
-- Name: conditionField_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."conditionField_id_seq" OWNED BY public."conditionField".id;


--
-- Name: currency; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.currency (
    id integer NOT NULL,
    code character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.currency OWNER TO postgres;

--
-- Name: currency_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.currency_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.currency_id_seq OWNER TO postgres;

--
-- Name: currency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.currency_id_seq OWNED BY public.currency.id;


--
-- Name: disaggregationCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."disaggregationCategory" (
    id integer NOT NULL,
    name character varying(255),
    label character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "disaggregationCategoryGroupId" integer,
    "tagHxl" character varying(255)
);


ALTER TABLE public."disaggregationCategory" OWNER TO postgres;

--
-- Name: disaggregationCategoryGroup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."disaggregationCategoryGroup" (
    id integer NOT NULL,
    name character varying(255),
    label character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "unitTypeId" integer,
    "planId" integer
);


ALTER TABLE public."disaggregationCategoryGroup" OWNER TO postgres;

--
-- Name: disaggregationCategoryGroup_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."disaggregationCategoryGroup_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."disaggregationCategoryGroup_id_seq" OWNER TO postgres;

--
-- Name: disaggregationCategoryGroup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."disaggregationCategoryGroup_id_seq" OWNED BY public."disaggregationCategoryGroup".id;


--
-- Name: disaggregationCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."disaggregationCategory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."disaggregationCategory_id_seq" OWNER TO postgres;

--
-- Name: disaggregationCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."disaggregationCategory_id_seq" OWNED BY public."disaggregationCategory".id;


--
-- Name: disaggregationModel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."disaggregationModel" (
    id integer NOT NULL,
    name character varying(255),
    creator json,
    value json,
    "planId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."disaggregationModel" OWNER TO postgres;

--
-- Name: disaggregationModel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."disaggregationModel_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."disaggregationModel_id_seq" OWNER TO postgres;

--
-- Name: disaggregationModel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."disaggregationModel_id_seq" OWNED BY public."disaggregationModel".id;


--
-- Name: emergency; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.emergency (
    id integer NOT NULL,
    name character varying(255),
    description text,
    date timestamp with time zone,
    "glideId" character varying(255),
    "levelThree" boolean,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    active boolean DEFAULT true,
    restricted boolean
);


ALTER TABLE public.emergency OWNER TO postgres;

--
-- Name: emergencyLocation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."emergencyLocation" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "emergencyId" integer NOT NULL,
    "locationId" integer NOT NULL
);


ALTER TABLE public."emergencyLocation" OWNER TO postgres;

--
-- Name: emergency_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.emergency_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.emergency_id_seq OWNER TO postgres;

--
-- Name: emergency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.emergency_id_seq OWNED BY public.emergency.id;


--
-- Name: endpointLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."endpointLog" (
    id integer NOT NULL,
    "participantId" integer,
    "entityType" character varying(255),
    "entityId" integer,
    "editType" character varying(255),
    value jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."endpointLog" OWNER TO postgres;

--
-- Name: endpointLog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."endpointLog_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."endpointLog_id_seq" OWNER TO postgres;

--
-- Name: endpointLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."endpointLog_id_seq" OWNED BY public."endpointLog".id;


--
-- Name: endpointTrace; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."endpointTrace" (
    id uuid NOT NULL,
    route character varying(255),
    method character varying(255),
    container character varying(255),
    "memBefore" jsonb,
    "memAfter" jsonb,
    status integer,
    "time" integer,
    "createdAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."endpointTrace" OWNER TO postgres;

--
-- Name: endpointUsage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."endpointUsage" (
    path character varying(255) NOT NULL,
    method character varying(255) NOT NULL,
    nb integer DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."endpointUsage" OWNER TO postgres;

--
-- Name: entitiesAssociation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."entitiesAssociation" (
    "parentId" integer NOT NULL,
    "parentType" character varying(255) NOT NULL,
    "childId" integer NOT NULL,
    "childType" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."entitiesAssociation" OWNER TO postgres;

--
-- Name: entityCategories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."entityCategories" (
    id integer NOT NULL,
    value json,
    "planId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."entityCategories" OWNER TO postgres;

--
-- Name: entityCategories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."entityCategories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."entityCategories_id_seq" OWNER TO postgres;

--
-- Name: entityCategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."entityCategories_id_seq" OWNED BY public."entityCategories".id;


--
-- Name: entityCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."entityCategory" (
    id integer NOT NULL,
    value json,
    "planId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."entityCategory" OWNER TO postgres;

--
-- Name: entityCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."entityCategory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."entityCategory_id_seq" OWNER TO postgres;

--
-- Name: entityCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."entityCategory_id_seq" OWNED BY public."entityCategory".id;


--
-- Name: entityPrototype; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."entityPrototype" (
    id integer NOT NULL,
    "refCode" character varying(255),
    type character varying(255),
    "planId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "orderNumber" integer,
    value json
);


ALTER TABLE public."entityPrototype" OWNER TO postgres;

--
-- Name: entityPrototype_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."entityPrototype_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."entityPrototype_id_seq" OWNER TO postgres;

--
-- Name: entityPrototype_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."entityPrototype_id_seq" OWNED BY public."entityPrototype".id;


--
-- Name: externalData; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."externalData" (
    id integer NOT NULL,
    "flowID" integer NOT NULL,
    "versionID" integer,
    "systemID" character varying(255) NOT NULL,
    "externalRefID" character varying(255),
    "externalRefDate" timestamp with time zone,
    "objectType" character varying(255),
    "refDirection" character varying(255),
    data text,
    matched boolean,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."externalData" OWNER TO postgres;

--
-- Name: externalData_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."externalData_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."externalData_id_seq" OWNER TO postgres;

--
-- Name: externalData_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."externalData_id_seq" OWNED BY public."externalData".id;


--
-- Name: externalReference; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."externalReference" (
    id integer NOT NULL,
    "systemID" character varying(255) NOT NULL,
    "flowID" integer NOT NULL,
    "versionID" integer,
    "externalRecordID" character varying(255),
    "externalRecordDate" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "importInformation" json
);


ALTER TABLE public."externalReference" OWNER TO postgres;

--
-- Name: externalReference_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."externalReference_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."externalReference_id_seq" OWNER TO postgres;

--
-- Name: externalReference_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."externalReference_id_seq" OWNED BY public."externalReference".id;


--
-- Name: fileAssetEntity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."fileAssetEntity" (
    id integer NOT NULL,
    filename character varying(255),
    originalname character varying(255),
    size integer,
    mimetype character varying(255),
    path character varying(255),
    collection character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."fileAssetEntity" OWNER TO postgres;

--
-- Name: fileAssetEntity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."fileAssetEntity_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."fileAssetEntity_id_seq" OWNER TO postgres;

--
-- Name: fileAssetEntity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."fileAssetEntity_id_seq" OWNED BY public."fileAssetEntity".id;


--
-- Name: fileRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."fileRecord" (
    "createdAt" timestamp with time zone NOT NULL,
    hash character varying(255) NOT NULL,
    namespace character varying(255) NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."fileRecord" OWNER TO postgres;

--
-- Name: flow; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flow (
    id integer NOT NULL,
    "versionID" integer DEFAULT 1 NOT NULL,
    "amountUSD" bigint NOT NULL,
    "flowDate" timestamp with time zone,
    "decisionDate" timestamp with time zone,
    "firstReportedDate" timestamp with time zone,
    "budgetYear" character varying(255),
    "origAmount" bigint,
    "origCurrency" character varying(255),
    "exchangeRate" numeric(18,6),
    "activeStatus" boolean DEFAULT true NOT NULL,
    restricted boolean DEFAULT false NOT NULL,
    description text,
    notes text,
    "versionStartDate" timestamp with time zone,
    "versionEndDate" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "newMoney" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.flow OWNER TO postgres;

--
-- Name: flowLink; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."flowLink" (
    "parentID" integer NOT NULL,
    "childID" integer NOT NULL,
    depth integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."flowLink" OWNER TO postgres;

--
-- Name: flowObject; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."flowObject" (
    "flowID" integer NOT NULL,
    "objectID" integer NOT NULL,
    "versionID" integer DEFAULT 1 NOT NULL,
    "objectType" character varying(32) NOT NULL,
    "refDirection" character varying(255) NOT NULL,
    behavior public."enum_flowObject_behavior",
    "objectDetail" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."flowObject" OWNER TO postgres;

--
-- Name: flowObjectType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."flowObjectType" (
    type character varying(32) NOT NULL,
    name character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."flowObjectType" OWNER TO postgres;

--
-- Name: flow_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flow_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.flow_id_seq OWNER TO postgres;

--
-- Name: flow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flow_id_seq OWNED BY public.flow.id;


--
-- Name: form; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.form (
    "belongsToId" integer,
    "belongsToType" public."enum_form_belongsToType" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    id integer NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.form OWNER TO postgres;

--
-- Name: formVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."formVersion" (
    "createdAt" timestamp with time zone NOT NULL,
    data jsonb NOT NULL,
    "isLatest" boolean NOT NULL,
    "modifiedBy" integer,
    root integer NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    version integer NOT NULL
);


ALTER TABLE public."formVersion" OWNER TO postgres;

--
-- Name: form_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.form_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.form_id_seq OWNER TO postgres;

--
-- Name: form_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.form_id_seq OWNED BY public.form.id;


--
-- Name: projectVersionComment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."projectVersionComment" (
    id integer NOT NULL,
    content text,
    "participantId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "projectVersionPlanId" integer,
    step character varying(255)
);


ALTER TABLE public."projectVersionComment" OWNER TO postgres;

--
-- Name: fulfillmentComment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."fulfillmentComment_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."fulfillmentComment_id_seq" OWNER TO postgres;

--
-- Name: fulfillmentComment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."fulfillmentComment_id_seq" OWNED BY public."projectVersionComment".id;


--
-- Name: globalCluster; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."globalCluster" (
    id integer NOT NULL,
    "hrinfoId" integer,
    type character varying(255),
    name character varying(255),
    code character varying(255),
    homepage character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "parentId" integer,
    "defaultIconId" character varying(255),
    "displayFTSSummariesFromYear" integer
);


ALTER TABLE public."globalCluster" OWNER TO postgres;

--
-- Name: globalClusterAssociation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."globalClusterAssociation" (
    id integer NOT NULL,
    "globalClusterId" integer,
    "governingEntityId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."globalClusterAssociation" OWNER TO postgres;

--
-- Name: globalClusterAssociation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."globalClusterAssociation_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."globalClusterAssociation_id_seq" OWNER TO postgres;

--
-- Name: globalClusterAssociation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."globalClusterAssociation_id_seq" OWNED BY public."globalClusterAssociation".id;


--
-- Name: globalCluster_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."globalCluster_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."globalCluster_id_seq" OWNER TO postgres;

--
-- Name: globalCluster_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."globalCluster_id_seq" OWNED BY public."globalCluster".id;


--
-- Name: globalIndicator; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."globalIndicator" (
    id integer NOT NULL,
    "hrinfoId" integer,
    label text,
    "subDomain" character varying(255),
    code character varying(255),
    unit character varying(255),
    "searchData" text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."globalIndicator" OWNER TO postgres;

--
-- Name: globalIndicator_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."globalIndicator_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."globalIndicator_id_seq" OWNER TO postgres;

--
-- Name: globalIndicator_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."globalIndicator_id_seq" OWNED BY public."globalIndicator".id;


--
-- Name: governingEntityVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."governingEntityVersion" (
    id integer NOT NULL,
    "governingEntityId" integer,
    name character varying(255),
    "customReference" character varying(255),
    value json,
    overriding boolean DEFAULT false NOT NULL,
    "currentVersion" boolean DEFAULT false NOT NULL,
    "latestVersion" boolean DEFAULT false NOT NULL,
    "latestTaggedVersion" boolean DEFAULT false NOT NULL,
    "versionTags" character varying(8)[] DEFAULT (ARRAY[]::character varying[])::character varying(8)[],
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    tags character varying(25)[] DEFAULT (ARRAY[]::character varying[])::character varying(25)[]
);


ALTER TABLE public."governingEntityVersion" OWNER TO postgres;

--
-- Name: governingEntityVersion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."governingEntityVersion_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."governingEntityVersion_id_seq" OWNER TO postgres;

--
-- Name: governingEntityVersion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."governingEntityVersion_id_seq" OWNED BY public."governingEntityVersion".id;


--
-- Name: governingEntity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."governingEntity_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."governingEntity_id_seq" OWNER TO postgres;

--
-- Name: governingEntity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."governingEntity_id_seq" OWNED BY public."governingEntity".id;


--
-- Name: highWater; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."highWater" (
    "jobName" character varying(255) NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."highWater" OWNER TO postgres;

--
-- Name: iatiActivity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."iatiActivity" (
    id integer NOT NULL,
    "iatiIdentifier" character varying(255),
    title text,
    version character varying(255),
    "startDate" date,
    "endDate" date,
    description text,
    "reportingOrgRef" character varying(255),
    "reportingOrgName" character varying(255),
    currency character varying(255),
    humanitarian boolean DEFAULT false,
    "iatiHumanitarian" boolean DEFAULT false,
    hash character varying(255),
    "lastUpdatedAt" timestamp with time zone,
    "updatedStatus" boolean DEFAULT false,
    viewed boolean DEFAULT false,
    "iatiPublisherId" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."iatiActivity" OWNER TO postgres;

--
-- Name: iatiActivity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."iatiActivity_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."iatiActivity_id_seq" OWNER TO postgres;

--
-- Name: iatiActivity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."iatiActivity_id_seq" OWNED BY public."iatiActivity".id;


--
-- Name: iatiFTSMap; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."iatiFTSMap" (
    id integer NOT NULL,
    data json NOT NULL,
    "oldData" json,
    "sourceOrganizations" character varying(255)[],
    "destinationOrganizations" character varying(255)[],
    "recipientCountries" character varying(255)[],
    updated boolean DEFAULT true NOT NULL,
    added boolean DEFAULT false NOT NULL,
    humanitarian boolean DEFAULT false,
    active boolean DEFAULT true,
    "iatiPublisherID" character varying(255),
    "iatiActivityID" integer,
    "flowID" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."iatiFTSMap" OWNER TO postgres;

--
-- Name: iatiFTSMap_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."iatiFTSMap_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."iatiFTSMap_id_seq" OWNER TO postgres;

--
-- Name: iatiFTSMap_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."iatiFTSMap_id_seq" OWNED BY public."iatiFTSMap".id;


--
-- Name: iatiFTSMatch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."iatiFTSMatch" (
    id integer NOT NULL,
    data json NOT NULL,
    "iatiFTSMapID" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."iatiFTSMatch" OWNER TO postgres;

--
-- Name: iatiFTSMatch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."iatiFTSMatch_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."iatiFTSMatch_id_seq" OWNER TO postgres;

--
-- Name: iatiFTSMatch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."iatiFTSMatch_id_seq" OWNED BY public."iatiFTSMatch".id;


--
-- Name: iatiHumanitarianScope; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."iatiHumanitarianScope" (
    id integer NOT NULL,
    "iatiIdentifier" character varying(255),
    type character varying(255),
    vocabulary character varying(255),
    "vocabularyUrl" character varying(255),
    code character varying(255),
    "iatiActivityId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."iatiHumanitarianScope" OWNER TO postgres;

--
-- Name: iatiHumanitarianScope_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."iatiHumanitarianScope_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."iatiHumanitarianScope_id_seq" OWNER TO postgres;

--
-- Name: iatiHumanitarianScope_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."iatiHumanitarianScope_id_seq" OWNED BY public."iatiHumanitarianScope".id;


--
-- Name: iatiParticipatingOrg; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."iatiParticipatingOrg" (
    id integer NOT NULL,
    "iatiIdentifier" character varying(255),
    ref character varying(255),
    type character varying(255),
    role character varying(255),
    name character varying(255),
    "iatiActivityId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."iatiParticipatingOrg" OWNER TO postgres;

--
-- Name: iatiParticipatingOrg_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."iatiParticipatingOrg_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."iatiParticipatingOrg_id_seq" OWNER TO postgres;

--
-- Name: iatiParticipatingOrg_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."iatiParticipatingOrg_id_seq" OWNED BY public."iatiParticipatingOrg".id;


--
-- Name: iatiPublisher; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."iatiPublisher" (
    id character varying(255) NOT NULL,
    active boolean DEFAULT false,
    "queuedAt" timestamp with time zone,
    "fetchStatus" public."enum_iatiPublisher_fetchStatus" DEFAULT 'halted'::public."enum_iatiPublisher_fetchStatus",
    "lastFetchedAt" timestamp with time zone,
    name character varying(255) NOT NULL,
    country character varying(255),
    "organizationType" character varying(255),
    datasets integer,
    "xmlData" text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."iatiPublisher" OWNER TO postgres;

--
-- Name: iatiRecipientCountry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."iatiRecipientCountry" (
    id integer NOT NULL,
    "iatiIdentifier" character varying(255),
    code character varying(255),
    iso3 character varying(255),
    percentage character varying(255),
    text character varying(255),
    "isCountry" boolean,
    "iatiActivityId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."iatiRecipientCountry" OWNER TO postgres;

--
-- Name: iatiRecipientCountry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."iatiRecipientCountry_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."iatiRecipientCountry_id_seq" OWNER TO postgres;

--
-- Name: iatiRecipientCountry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."iatiRecipientCountry_id_seq" OWNED BY public."iatiRecipientCountry".id;


--
-- Name: iatiSector; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."iatiSector" (
    id integer NOT NULL,
    "iatiIdentifier" character varying(255),
    code character varying(255),
    percentage character varying(255),
    text text,
    "iatiActivityId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    vocabulary character varying(255)
);


ALTER TABLE public."iatiSector" OWNER TO postgres;

--
-- Name: iatiSector_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."iatiSector_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."iatiSector_id_seq" OWNER TO postgres;

--
-- Name: iatiSector_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."iatiSector_id_seq" OWNED BY public."iatiSector".id;


--
-- Name: iatiTransaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."iatiTransaction" (
    id integer NOT NULL,
    "iatiIdentifier" character varying(255),
    ref text,
    sector json,
    date character varying(255),
    type character varying(255),
    currency character varying(255),
    humanitarian boolean DEFAULT false,
    value double precision,
    "providerOrgRef" character varying(255),
    "providerOrgName" character varying(255),
    "receiverOrgRef" character varying(255),
    "receiverOrgName" character varying(255),
    "recipientCountry" json,
    "iatiActivityId" integer,
    "iatiFTSMapId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    description text
);


ALTER TABLE public."iatiTransaction" OWNER TO postgres;

--
-- Name: iatiTransaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."iatiTransaction_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."iatiTransaction_id_seq" OWNER TO postgres;

--
-- Name: iatiTransaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."iatiTransaction_id_seq" OWNED BY public."iatiTransaction".id;


--
-- Name: icon; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.icon (
    id character varying(255) NOT NULL,
    svg bytea,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.icon OWNER TO postgres;

--
-- Name: job; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job (
    id integer NOT NULL,
    "startAt" timestamp with time zone NOT NULL,
    "endAt" timestamp with time zone,
    status public.enum_job_status DEFAULT 'pending'::public.enum_job_status NOT NULL,
    type public.enum_job_type NOT NULL,
    metadata jsonb,
    "totalTaskCount" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.job OWNER TO postgres;

--
-- Name: jobAssociation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."jobAssociation" (
    "jobId" integer NOT NULL,
    "objectId" integer NOT NULL,
    "objectType" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."jobAssociation" OWNER TO postgres;

--
-- Name: job_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.job_id_seq OWNER TO postgres;

--
-- Name: job_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_id_seq OWNED BY public.job.id;


--
-- Name: legacy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.legacy (
    "objectType" character varying(32) NOT NULL,
    "objectID" integer NOT NULL,
    "legacyID" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.legacy OWNER TO postgres;

--
-- Name: location; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.location (
    id integer NOT NULL,
    "externalId" character varying(255),
    name character varying(255),
    "adminLevel" integer,
    latitude double precision,
    longitude double precision,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "parentId" integer,
    iso3 character varying(3),
    pcode character varying(255),
    status character varying(255),
    "validOn" bigint,
    "itosSync" boolean DEFAULT true
);


ALTER TABLE public.location OWNER TO postgres;

--
-- Name: location_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.location_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.location_id_seq OWNER TO postgres;

--
-- Name: location_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.location_id_seq OWNED BY public.location.id;


--
-- Name: measurement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.measurement (
    id integer NOT NULL,
    "attachmentId" integer,
    "planReportingPeriodId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "currentVersion" boolean DEFAULT false NOT NULL,
    "latestVersion" boolean DEFAULT false NOT NULL,
    "latestTaggedVersion" boolean DEFAULT false NOT NULL,
    "versionTags" character varying(8)[] DEFAULT (ARRAY[]::character varying[])::character varying(8)[]
);


ALTER TABLE public.measurement OWNER TO postgres;

--
-- Name: measurementVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."measurementVersion" (
    id integer NOT NULL,
    "measurementId" integer,
    value jsonb,
    "currentVersion" boolean DEFAULT false NOT NULL,
    "latestVersion" boolean DEFAULT false NOT NULL,
    "latestTaggedVersion" boolean DEFAULT false NOT NULL,
    "versionTags" character varying(8)[] DEFAULT (ARRAY[]::character varying[])::character varying(8)[],
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."measurementVersion" OWNER TO postgres;

--
-- Name: measurementVersion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."measurementVersion_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."measurementVersion_id_seq" OWNER TO postgres;

--
-- Name: measurementVersion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."measurementVersion_id_seq" OWNED BY public."measurementVersion".id;


--
-- Name: measurement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.measurement_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.measurement_id_seq OWNER TO postgres;

--
-- Name: measurement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.measurement_id_seq OWNED BY public.measurement.id;


--
-- Name: objectExclude; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."objectExclude" (
    "objectType" character varying(32) NOT NULL,
    "objectID" integer NOT NULL,
    module public."enum_objectExclude_module" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."objectExclude" OWNER TO postgres;

--
-- Name: operation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operation (
    "createdAt" timestamp with time zone NOT NULL,
    id integer NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.operation OWNER TO postgres;

--
-- Name: operationCluster; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."operationCluster" (
    "createdAt" timestamp with time zone NOT NULL,
    id integer NOT NULL,
    "operationId" integer NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."operationCluster" OWNER TO postgres;

--
-- Name: operationClusterVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."operationClusterVersion" (
    "createdAt" timestamp with time zone NOT NULL,
    data jsonb NOT NULL,
    "isLatest" boolean NOT NULL,
    "modifiedBy" integer,
    root integer NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    version integer NOT NULL
);


ALTER TABLE public."operationClusterVersion" OWNER TO postgres;

--
-- Name: operationCluster_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."operationCluster_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."operationCluster_id_seq" OWNER TO postgres;

--
-- Name: operationCluster_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."operationCluster_id_seq" OWNED BY public."operationCluster".id;


--
-- Name: operationVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."operationVersion" (
    "createdAt" timestamp with time zone NOT NULL,
    data jsonb NOT NULL,
    "isLatest" boolean NOT NULL,
    "modifiedBy" integer,
    root integer NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    version integer NOT NULL
);


ALTER TABLE public."operationVersion" OWNER TO postgres;

--
-- Name: operation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.operation_id_seq OWNER TO postgres;

--
-- Name: operation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operation_id_seq OWNED BY public.operation.id;


--
-- Name: organization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    abbreviation character varying(255),
    url text,
    "parentID" integer,
    "nativeName" character varying(255),
    comments text,
    "collectiveInd" boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "deletedAt" timestamp with time zone,
    "newOrganizationId" integer,
    verified boolean DEFAULT false NOT NULL,
    notes text
);


ALTER TABLE public.organization OWNER TO postgres;

--
-- Name: organizationLocation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."organizationLocation" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "organizationId" integer NOT NULL,
    "locationId" integer NOT NULL
);


ALTER TABLE public."organizationLocation" OWNER TO postgres;

--
-- Name: organization_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organization_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.organization_id_seq OWNER TO postgres;

--
-- Name: organization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organization_id_seq OWNED BY public.organization.id;


--
-- Name: parameterValueIndicatorGoal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."parameterValueIndicatorGoal" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "indicatorGoalId" integer NOT NULL,
    "parameterValueId" integer NOT NULL
);


ALTER TABLE public."parameterValueIndicatorGoal" OWNER TO postgres;

--
-- Name: participant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.participant (
    id integer NOT NULL,
    "hidId" character varying(255),
    email character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "hidSub" character varying(255),
    "internalUse" character varying(255),
    name character varying(255)
);


ALTER TABLE public.participant OWNER TO postgres;

--
-- Name: participantCountry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."participantCountry" (
    id integer NOT NULL,
    "locationId" integer,
    "participantId" integer,
    validated boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."participantCountry" OWNER TO postgres;

--
-- Name: participantCountry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."participantCountry_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."participantCountry_id_seq" OWNER TO postgres;

--
-- Name: participantCountry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."participantCountry_id_seq" OWNED BY public."participantCountry".id;


--
-- Name: participantOrganization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."participantOrganization" (
    id integer NOT NULL,
    "organizationId" integer,
    "participantId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    validated boolean DEFAULT true
);


ALTER TABLE public."participantOrganization" OWNER TO postgres;

--
-- Name: participantOrganization_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."participantOrganization_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."participantOrganization_id_seq" OWNER TO postgres;

--
-- Name: participantOrganization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."participantOrganization_id_seq" OWNED BY public."participantOrganization".id;


--
-- Name: participantRole; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."participantRole" (
    id integer NOT NULL,
    "roleId" integer,
    "participantId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "objectId" integer,
    "objectType" character varying(255)
);


ALTER TABLE public."participantRole" OWNER TO postgres;

--
-- Name: participantRole_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."participantRole_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."participantRole_id_seq" OWNER TO postgres;

--
-- Name: participantRole_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."participantRole_id_seq" OWNED BY public."participantRole".id;


--
-- Name: participant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.participant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.participant_id_seq OWNER TO postgres;

--
-- Name: participant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.participant_id_seq OWNED BY public.participant.id;


--
-- Name: permittedAction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."permittedAction" (
    id character varying(255) NOT NULL,
    value jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."permittedAction" OWNER TO postgres;

--
-- Name: plan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plan (
    id integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    restricted boolean,
    "revisionState" character varying(255)
);


ALTER TABLE public.plan OWNER TO postgres;

--
-- Name: planBlueprint_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."planBlueprint_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."planBlueprint_id_seq" OWNER TO postgres;

--
-- Name: planBlueprint_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."planBlueprint_id_seq" OWNED BY public.blueprint.id;


--
-- Name: planEmergency; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."planEmergency" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "planId" integer NOT NULL,
    "emergencyId" integer NOT NULL
);


ALTER TABLE public."planEmergency" OWNER TO postgres;

--
-- Name: planEntity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."planEntity" (
    id integer NOT NULL,
    "planId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "entityPrototypeId" integer NOT NULL,
    "deletedAt" timestamp with time zone,
    "currentVersion" boolean DEFAULT false NOT NULL,
    "latestVersion" boolean DEFAULT false NOT NULL,
    "latestTaggedVersion" boolean DEFAULT false NOT NULL,
    "versionTags" character varying(8)[] DEFAULT (ARRAY[]::character varying[])::character varying(8)[]
);


ALTER TABLE public."planEntity" OWNER TO postgres;

--
-- Name: planEntityVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."planEntityVersion" (
    id integer NOT NULL,
    "planEntityId" integer,
    "customReference" character varying(255),
    value json,
    "currentVersion" boolean DEFAULT false NOT NULL,
    "latestVersion" boolean DEFAULT false NOT NULL,
    "latestTaggedVersion" boolean DEFAULT false NOT NULL,
    "versionTags" character varying(8)[] DEFAULT (ARRAY[]::character varying[])::character varying(8)[],
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."planEntityVersion" OWNER TO postgres;

--
-- Name: planEntityVersion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."planEntityVersion_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."planEntityVersion_id_seq" OWNER TO postgres;

--
-- Name: planEntityVersion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."planEntityVersion_id_seq" OWNED BY public."planEntityVersion".id;


--
-- Name: planEntity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."planEntity_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."planEntity_id_seq" OWNER TO postgres;

--
-- Name: planEntity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."planEntity_id_seq" OWNED BY public."planEntity".id;


--
-- Name: planLocation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."planLocation" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "planId" integer NOT NULL,
    "locationId" integer NOT NULL,
    id integer NOT NULL,
    "deletedAt" timestamp with time zone,
    "currentVersion" boolean DEFAULT false NOT NULL,
    "latestVersion" boolean DEFAULT false NOT NULL,
    "latestTaggedVersion" boolean DEFAULT false NOT NULL,
    "versionTags" character varying(8)[] DEFAULT (ARRAY[]::character varying[])::character varying(8)[]
);


ALTER TABLE public."planLocation" OWNER TO postgres;

--
-- Name: planLocation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."planLocation_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."planLocation_id_seq" OWNER TO postgres;

--
-- Name: planLocation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."planLocation_id_seq" OWNED BY public."planLocation".id;


--
-- Name: planReportingPeriod; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."planReportingPeriod" (
    id integer NOT NULL,
    "startDate" date,
    "endDate" date,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "expiryDate" date,
    "periodNumber" integer,
    "planId" integer,
    "measurementsGenerated" boolean DEFAULT false
);


ALTER TABLE public."planReportingPeriod" OWNER TO postgres;

--
-- Name: planReportingPeriod_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."planReportingPeriod_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."planReportingPeriod_id_seq" OWNER TO postgres;

--
-- Name: planReportingPeriod_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."planReportingPeriod_id_seq" OWNED BY public."planReportingPeriod".id;


--
-- Name: planTag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."planTag" (
    id integer NOT NULL,
    "planId" integer NOT NULL,
    name character varying(255) NOT NULL,
    public boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    comment character varying(255),
    "revisionState" character varying(255)
);


ALTER TABLE public."planTag" OWNER TO postgres;

--
-- Name: planTag_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."planTag_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."planTag_id_seq" OWNER TO postgres;

--
-- Name: planTag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."planTag_id_seq" OWNED BY public."planTag".id;


--
-- Name: planVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."planVersion" (
    id integer NOT NULL,
    "planId" integer,
    name character varying(255),
    "startDate" date,
    "endDate" date,
    comments text,
    "isForHPCProjects" boolean DEFAULT false NOT NULL,
    code character varying(255),
    "customLocationCode" character varying(255),
    "currentReportingPeriodId" integer,
    "currentVersion" boolean DEFAULT false NOT NULL,
    "latestVersion" boolean DEFAULT false NOT NULL,
    "latestTaggedVersion" boolean DEFAULT false NOT NULL,
    "versionTags" character varying(8)[] DEFAULT (ARRAY[]::character varying[])::character varying(8)[],
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "lastPublishedReportingPeriodId" integer,
    "clusterSelectionType" character varying(255)
);


ALTER TABLE public."planVersion" OWNER TO postgres;

--
-- Name: planVersion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."planVersion_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."planVersion_id_seq" OWNER TO postgres;

--
-- Name: planVersion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."planVersion_id_seq" OWNED BY public."planVersion".id;


--
-- Name: planYear; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."planYear" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "planId" integer NOT NULL,
    "usageYearId" integer NOT NULL,
    id integer NOT NULL,
    "deletedAt" timestamp with time zone,
    "currentVersion" boolean DEFAULT false NOT NULL,
    "latestVersion" boolean DEFAULT false NOT NULL,
    "latestTaggedVersion" boolean DEFAULT false NOT NULL,
    "versionTags" character varying(8)[] DEFAULT (ARRAY[]::character varying[])::character varying(8)[]
);


ALTER TABLE public."planYear" OWNER TO postgres;

--
-- Name: planYear_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."planYear_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."planYear_id_seq" OWNER TO postgres;

--
-- Name: planYear_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."planYear_id_seq" OWNED BY public."planYear".id;


--
-- Name: plan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plan_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.plan_id_seq OWNER TO postgres;

--
-- Name: plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plan_id_seq OWNED BY public.plan.id;


--
-- Name: procedureEntityPrototype; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."procedureEntityPrototype" (
    id integer NOT NULL,
    "planId" integer NOT NULL,
    "entityPrototypeId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."procedureEntityPrototype" OWNER TO postgres;

--
-- Name: procedureEntityPrototype_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."procedureEntityPrototype_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."procedureEntityPrototype_id_seq" OWNER TO postgres;

--
-- Name: procedureEntityPrototype_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."procedureEntityPrototype_id_seq" OWNED BY public."procedureEntityPrototype".id;


--
-- Name: procedureSection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."procedureSection" (
    id integer NOT NULL,
    name character varying(255),
    "order" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "planId" integer NOT NULL,
    description json
);


ALTER TABLE public."procedureSection" OWNER TO postgres;

--
-- Name: procedureSectionField; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."procedureSectionField" (
    "procedureSectionId" integer NOT NULL,
    "conditionFieldId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."procedureSectionField" OWNER TO postgres;

--
-- Name: procedureSection_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."procedureSection_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."procedureSection_id_seq" OWNER TO postgres;

--
-- Name: procedureSection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."procedureSection_id_seq" OWNED BY public."procedureSection".id;


--
-- Name: project; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project (
    id integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    code character varying(255),
    "currentPublishedVersionId" integer,
    "creatorParticipantId" integer,
    "latestVersionId" integer,
    "implementationStatus" public."enum_project_implementationStatus",
    pdf json
);


ALTER TABLE public.project OWNER TO postgres;

--
-- Name: projectContact; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."projectContact" (
    id integer NOT NULL,
    "projectVersionId" integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    website character varying(255),
    "phoneNumber" character varying(255),
    "participantId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."projectContact" OWNER TO postgres;

--
-- Name: projectContact_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."projectContact_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."projectContact_id_seq" OWNER TO postgres;

--
-- Name: projectContact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."projectContact_id_seq" OWNED BY public."projectContact".id;


--
-- Name: projectVersionField; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."projectVersionField" (
    id integer NOT NULL,
    "conditionFieldId" integer,
    value text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "projectVersionPlanId" integer
);


ALTER TABLE public."projectVersionField" OWNER TO postgres;

--
-- Name: projectField_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."projectField_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."projectField_id_seq" OWNER TO postgres;

--
-- Name: projectField_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."projectField_id_seq" OWNED BY public."projectVersionField".id;


--
-- Name: projectGlobalClusters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."projectGlobalClusters" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "globalClusterId" integer NOT NULL,
    "projectVersionId" integer NOT NULL
);


ALTER TABLE public."projectGlobalClusters" OWNER TO postgres;

--
-- Name: projectLocations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."projectLocations" (
    "projectVersionId" integer NOT NULL,
    "locationId" integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE public."projectLocations" OWNER TO postgres;

--
-- Name: projectVersionAttachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."projectVersionAttachment" (
    "projectVersionId" integer NOT NULL,
    "attachmentId" integer NOT NULL,
    value jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    total double precision,
    "attachmentVersionId" integer
);


ALTER TABLE public."projectVersionAttachment" OWNER TO postgres;

--
-- Name: projectVersionGoverningEntity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."projectVersionGoverningEntity" (
    "projectVersionId" integer NOT NULL,
    "governingEntityId" integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "governingEntityVersionId" integer
);


ALTER TABLE public."projectVersionGoverningEntity" OWNER TO postgres;

--
-- Name: projectVersionHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."projectVersionHistory" (
    id integer NOT NULL,
    "projectVersionId" integer NOT NULL,
    "participantId" integer NOT NULL,
    value json,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."projectVersionHistory" OWNER TO postgres;

--
-- Name: projectVersionHistory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."projectVersionHistory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."projectVersionHistory_id_seq" OWNER TO postgres;

--
-- Name: projectVersionHistory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."projectVersionHistory_id_seq" OWNED BY public."projectVersionHistory".id;


--
-- Name: projectVersionOrganization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."projectVersionOrganization" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "organizationId" integer NOT NULL,
    "projectVersionId" integer NOT NULL
);


ALTER TABLE public."projectVersionOrganization" OWNER TO postgres;

--
-- Name: projectVersionPlan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."projectVersionPlan" (
    "projectVersionId" integer NOT NULL,
    "planId" integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    id integer NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    "workflowStatusOptionId" integer
);


ALTER TABLE public."projectVersionPlan" OWNER TO postgres;

--
-- Name: projectVersionPlanEntity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."projectVersionPlanEntity" (
    "projectVersionId" integer NOT NULL,
    "planEntityId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "planEntityVersionId" integer
);


ALTER TABLE public."projectVersionPlanEntity" OWNER TO postgres;

--
-- Name: projectVersionPlan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."projectVersionPlan_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."projectVersionPlan_id_seq" OWNER TO postgres;

--
-- Name: projectVersionPlan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."projectVersionPlan_id_seq" OWNED BY public."projectVersionPlan".id;


--
-- Name: projectVersion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."projectVersion_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."projectVersion_id_seq" OWNER TO postgres;

--
-- Name: projectVersion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."projectVersion_id_seq" OWNED BY public."projectVersion".id;


--
-- Name: project_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.project_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.project_id_seq OWNER TO postgres;

--
-- Name: project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.project_id_seq OWNED BY public.project.id;


--
-- Name: reportDetail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."reportDetail" (
    id integer NOT NULL,
    "flowID" integer NOT NULL,
    "versionID" integer NOT NULL,
    "contactInfo" text,
    source character varying(255) NOT NULL,
    date timestamp with time zone,
    "sourceID" character varying(255),
    "refCode" character varying(255),
    verified boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "organizationID" integer
);


ALTER TABLE public."reportDetail" OWNER TO postgres;

--
-- Name: reportDetail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."reportDetail_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."reportDetail_id_seq" OWNER TO postgres;

--
-- Name: reportDetail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."reportDetail_id_seq" OWNED BY public."reportDetail".id;


--
-- Name: reportFile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."reportFile" (
    id integer NOT NULL,
    "reportID" integer,
    title character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    url character varying(255),
    "fileAssetID" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."reportFile" OWNER TO postgres;

--
-- Name: reportFile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."reportFile_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."reportFile_id_seq" OWNER TO postgres;

--
-- Name: reportFile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."reportFile_id_seq" OWNED BY public."reportFile".id;


--
-- Name: reportingWindow; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."reportingWindow" (
    "belongsToId" integer,
    "belongsToType" public."enum_reportingWindow_belongsToType" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    id integer NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."reportingWindow" OWNER TO postgres;

--
-- Name: reportingWindowAssignment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."reportingWindowAssignment" (
    "assigneeId" integer NOT NULL,
    "assigneeOperation" integer NOT NULL,
    "assigneeType" public."enum_reportingWindowAssignment_assigneeType" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    id integer NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "reportingWindowId" integer NOT NULL
);


ALTER TABLE public."reportingWindowAssignment" OWNER TO postgres;

--
-- Name: reportingWindowAssignmentVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."reportingWindowAssignmentVersion" (
    "createdAt" timestamp with time zone NOT NULL,
    data jsonb NOT NULL,
    "isLatest" boolean NOT NULL,
    "modifiedBy" integer,
    root integer NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    version integer NOT NULL
);


ALTER TABLE public."reportingWindowAssignmentVersion" OWNER TO postgres;

--
-- Name: reportingWindowAssignment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."reportingWindowAssignment_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."reportingWindowAssignment_id_seq" OWNER TO postgres;

--
-- Name: reportingWindowAssignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."reportingWindowAssignment_id_seq" OWNED BY public."reportingWindowAssignment".id;


--
-- Name: reportingWindowVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."reportingWindowVersion" (
    "createdAt" timestamp with time zone NOT NULL,
    data jsonb NOT NULL,
    "isLatest" boolean NOT NULL,
    "modifiedBy" integer,
    root integer NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    version integer NOT NULL
);


ALTER TABLE public."reportingWindowVersion" OWNER TO postgres;

--
-- Name: reportingWindow_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."reportingWindow_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."reportingWindow_id_seq" OWNER TO postgres;

--
-- Name: reportingWindow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."reportingWindow_id_seq" OWNED BY public."reportingWindow".id;


--
-- Name: role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role (
    id integer NOT NULL,
    name character varying(255),
    description character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "targetTypes" jsonb
);


ALTER TABLE public.role OWNER TO postgres;

--
-- Name: roleAuthenticationKey; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."roleAuthenticationKey" (
    id integer NOT NULL,
    "roleId" integer,
    key character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."roleAuthenticationKey" OWNER TO postgres;

--
-- Name: roleAuthenticationKey_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."roleAuthenticationKey_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."roleAuthenticationKey_id_seq" OWNER TO postgres;

--
-- Name: roleAuthenticationKey_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."roleAuthenticationKey_id_seq" OWNED BY public."roleAuthenticationKey".id;


--
-- Name: rolePermittedAction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."rolePermittedAction" (
    id integer NOT NULL,
    "roleId" integer,
    "permittedActionId" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."rolePermittedAction" OWNER TO postgres;

--
-- Name: rolePermittedAction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."rolePermittedAction_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."rolePermittedAction_id_seq" OWNER TO postgres;

--
-- Name: rolePermittedAction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."rolePermittedAction_id_seq" OWNED BY public."rolePermittedAction".id;


--
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_id_seq OWNER TO postgres;

--
-- Name: role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_id_seq OWNED BY public.role.id;


--
-- Name: tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tag (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tag OWNER TO postgres;

--
-- Name: tag_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tag_id_seq OWNER TO postgres;

--
-- Name: tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tag_id_seq OWNED BY public.tag.id;


--
-- Name: task; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task (
    id integer NOT NULL,
    command character varying(255) NOT NULL,
    requester integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "dataFileHash" character varying(255) NOT NULL,
    run boolean DEFAULT false NOT NULL
);


ALTER TABLE public.task OWNER TO postgres;

--
-- Name: task_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_id_seq OWNER TO postgres;

--
-- Name: task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_id_seq OWNED BY public.task.id;


--
-- Name: unit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unit (
    id integer NOT NULL,
    name character varying(255),
    label character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "unitTypeId" integer
);


ALTER TABLE public.unit OWNER TO postgres;

--
-- Name: unitType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."unitType" (
    id integer NOT NULL,
    name character varying(255),
    label character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."unitType" OWNER TO postgres;

--
-- Name: unitType_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."unitType_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."unitType_id_seq" OWNER TO postgres;

--
-- Name: unitType_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."unitType_id_seq" OWNED BY public."unitType".id;


--
-- Name: unit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.unit_id_seq OWNER TO postgres;

--
-- Name: unit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unit_id_seq OWNED BY public.unit.id;


--
-- Name: usageYear; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."usageYear" (
    id integer NOT NULL,
    year character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."usageYear" OWNER TO postgres;

--
-- Name: usageYear_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."usageYear_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."usageYear_id_seq" OWNER TO postgres;

--
-- Name: usageYear_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."usageYear_id_seq" OWNED BY public."usageYear".id;


--
-- Name: workflowRole; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."workflowRole" (
    id integer NOT NULL,
    "roleId" integer,
    "entityType" character varying(255),
    "entityId" integer,
    "permittedActionIds" jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."workflowRole" OWNER TO postgres;

--
-- Name: workflowRole_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."workflowRole_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."workflowRole_id_seq" OWNER TO postgres;

--
-- Name: workflowRole_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."workflowRole_id_seq" OWNED BY public."workflowRole".id;


--
-- Name: workflowStatusOption; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."workflowStatusOption" (
    id integer NOT NULL,
    type character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    value jsonb,
    "planId" integer NOT NULL
);


ALTER TABLE public."workflowStatusOption" OWNER TO postgres;

--
-- Name: workflowStatusOptionStep; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."workflowStatusOptionStep" (
    id integer NOT NULL,
    "fromId" integer,
    "toId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    value jsonb
);


ALTER TABLE public."workflowStatusOptionStep" OWNER TO postgres;

--
-- Name: workflowStatusOptionStep_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."workflowStatusOptionStep_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."workflowStatusOptionStep_id_seq" OWNER TO postgres;

--
-- Name: workflowStatusOptionStep_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."workflowStatusOptionStep_id_seq" OWNED BY public."workflowStatusOptionStep".id;


--
-- Name: workflowStatusOption_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."workflowStatusOption_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."workflowStatusOption_id_seq" OWNER TO postgres;

--
-- Name: workflowStatusOption_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."workflowStatusOption_id_seq" OWNED BY public."workflowStatusOption".id;


--
-- Name: attachment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachment ALTER COLUMN id SET DEFAULT nextval('public.attachment_id_seq'::regclass);


--
-- Name: attachmentPrototype id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."attachmentPrototype" ALTER COLUMN id SET DEFAULT nextval('public."attachmentPrototype_id_seq"'::regclass);


--
-- Name: attachmentVersion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."attachmentVersion" ALTER COLUMN id SET DEFAULT nextval('public."attachmentVersion_id_seq"'::regclass);


--
-- Name: authGrantLog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authGrantLog" ALTER COLUMN id SET DEFAULT nextval('public."authGrantLog_id_seq"'::regclass);


--
-- Name: authGrantee id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authGrantee" ALTER COLUMN id SET DEFAULT nextval('public."authGrantee_id_seq"'::regclass);


--
-- Name: authTarget id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authTarget" ALTER COLUMN id SET DEFAULT nextval('public."authTarget_id_seq"'::regclass);


--
-- Name: blueprint id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blueprint ALTER COLUMN id SET DEFAULT nextval('public."planBlueprint_id_seq"'::regclass);


--
-- Name: budgetSegment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."budgetSegment" ALTER COLUMN id SET DEFAULT nextval('public."budgetSegment_id_seq"'::regclass);


--
-- Name: budgetSegmentBreakdown id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."budgetSegmentBreakdown" ALTER COLUMN id SET DEFAULT nextval('public."budgetSegmentBreakdown_id_seq"'::regclass);


--
-- Name: budgetSegmentBreakdownEntity id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."budgetSegmentBreakdownEntity" ALTER COLUMN id SET DEFAULT nextval('public."budgetSegmentBreakdownEntity_id_seq"'::regclass);


--
-- Name: category id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category ALTER COLUMN id SET DEFAULT nextval('public.category_id_seq'::regclass);


--
-- Name: client id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client ALTER COLUMN id SET DEFAULT nextval('public.client_id_seq'::regclass);


--
-- Name: conditionField id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."conditionField" ALTER COLUMN id SET DEFAULT nextval('public."conditionField_id_seq"'::regclass);


--
-- Name: currency id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currency ALTER COLUMN id SET DEFAULT nextval('public.currency_id_seq'::regclass);


--
-- Name: disaggregationCategory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."disaggregationCategory" ALTER COLUMN id SET DEFAULT nextval('public."disaggregationCategory_id_seq"'::regclass);


--
-- Name: disaggregationCategoryGroup id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."disaggregationCategoryGroup" ALTER COLUMN id SET DEFAULT nextval('public."disaggregationCategoryGroup_id_seq"'::regclass);


--
-- Name: disaggregationModel id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."disaggregationModel" ALTER COLUMN id SET DEFAULT nextval('public."disaggregationModel_id_seq"'::regclass);


--
-- Name: emergency id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency ALTER COLUMN id SET DEFAULT nextval('public.emergency_id_seq'::regclass);


--
-- Name: endpointLog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."endpointLog" ALTER COLUMN id SET DEFAULT nextval('public."endpointLog_id_seq"'::regclass);


--
-- Name: entityCategories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."entityCategories" ALTER COLUMN id SET DEFAULT nextval('public."entityCategories_id_seq"'::regclass);


--
-- Name: entityCategory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."entityCategory" ALTER COLUMN id SET DEFAULT nextval('public."entityCategory_id_seq"'::regclass);


--
-- Name: entityPrototype id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."entityPrototype" ALTER COLUMN id SET DEFAULT nextval('public."entityPrototype_id_seq"'::regclass);


--
-- Name: externalData id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."externalData" ALTER COLUMN id SET DEFAULT nextval('public."externalData_id_seq"'::regclass);


--
-- Name: externalReference id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."externalReference" ALTER COLUMN id SET DEFAULT nextval('public."externalReference_id_seq"'::regclass);


--
-- Name: fileAssetEntity id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."fileAssetEntity" ALTER COLUMN id SET DEFAULT nextval('public."fileAssetEntity_id_seq"'::regclass);


--
-- Name: flow id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow ALTER COLUMN id SET DEFAULT nextval('public.flow_id_seq'::regclass);


--
-- Name: form id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form ALTER COLUMN id SET DEFAULT nextval('public.form_id_seq'::regclass);


--
-- Name: globalCluster id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."globalCluster" ALTER COLUMN id SET DEFAULT nextval('public."globalCluster_id_seq"'::regclass);


--
-- Name: globalClusterAssociation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."globalClusterAssociation" ALTER COLUMN id SET DEFAULT nextval('public."globalClusterAssociation_id_seq"'::regclass);


--
-- Name: globalIndicator id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."globalIndicator" ALTER COLUMN id SET DEFAULT nextval('public."globalIndicator_id_seq"'::regclass);


--
-- Name: governingEntity id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."governingEntity" ALTER COLUMN id SET DEFAULT nextval('public."governingEntity_id_seq"'::regclass);


--
-- Name: governingEntityVersion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."governingEntityVersion" ALTER COLUMN id SET DEFAULT nextval('public."governingEntityVersion_id_seq"'::regclass);


--
-- Name: iatiActivity id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiActivity" ALTER COLUMN id SET DEFAULT nextval('public."iatiActivity_id_seq"'::regclass);


--
-- Name: iatiFTSMap id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiFTSMap" ALTER COLUMN id SET DEFAULT nextval('public."iatiFTSMap_id_seq"'::regclass);


--
-- Name: iatiFTSMatch id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiFTSMatch" ALTER COLUMN id SET DEFAULT nextval('public."iatiFTSMatch_id_seq"'::regclass);


--
-- Name: iatiHumanitarianScope id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiHumanitarianScope" ALTER COLUMN id SET DEFAULT nextval('public."iatiHumanitarianScope_id_seq"'::regclass);


--
-- Name: iatiParticipatingOrg id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiParticipatingOrg" ALTER COLUMN id SET DEFAULT nextval('public."iatiParticipatingOrg_id_seq"'::regclass);


--
-- Name: iatiRecipientCountry id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiRecipientCountry" ALTER COLUMN id SET DEFAULT nextval('public."iatiRecipientCountry_id_seq"'::regclass);


--
-- Name: iatiSector id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiSector" ALTER COLUMN id SET DEFAULT nextval('public."iatiSector_id_seq"'::regclass);


--
-- Name: iatiTransaction id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiTransaction" ALTER COLUMN id SET DEFAULT nextval('public."iatiTransaction_id_seq"'::regclass);


--
-- Name: job id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job ALTER COLUMN id SET DEFAULT nextval('public.job_id_seq'::regclass);


--
-- Name: location id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location ALTER COLUMN id SET DEFAULT nextval('public.location_id_seq'::regclass);


--
-- Name: measurement id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.measurement ALTER COLUMN id SET DEFAULT nextval('public.measurement_id_seq'::regclass);


--
-- Name: measurementVersion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."measurementVersion" ALTER COLUMN id SET DEFAULT nextval('public."measurementVersion_id_seq"'::regclass);


--
-- Name: operation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation ALTER COLUMN id SET DEFAULT nextval('public.operation_id_seq'::regclass);


--
-- Name: operationCluster id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."operationCluster" ALTER COLUMN id SET DEFAULT nextval('public."operationCluster_id_seq"'::regclass);


--
-- Name: organization id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization ALTER COLUMN id SET DEFAULT nextval('public.organization_id_seq'::regclass);


--
-- Name: participant id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participant ALTER COLUMN id SET DEFAULT nextval('public.participant_id_seq'::regclass);


--
-- Name: participantCountry id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."participantCountry" ALTER COLUMN id SET DEFAULT nextval('public."participantCountry_id_seq"'::regclass);


--
-- Name: participantOrganization id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."participantOrganization" ALTER COLUMN id SET DEFAULT nextval('public."participantOrganization_id_seq"'::regclass);


--
-- Name: participantRole id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."participantRole" ALTER COLUMN id SET DEFAULT nextval('public."participantRole_id_seq"'::regclass);


--
-- Name: plan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan ALTER COLUMN id SET DEFAULT nextval('public.plan_id_seq'::regclass);


--
-- Name: planEntity id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planEntity" ALTER COLUMN id SET DEFAULT nextval('public."planEntity_id_seq"'::regclass);


--
-- Name: planEntityVersion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planEntityVersion" ALTER COLUMN id SET DEFAULT nextval('public."planEntityVersion_id_seq"'::regclass);


--
-- Name: planLocation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planLocation" ALTER COLUMN id SET DEFAULT nextval('public."planLocation_id_seq"'::regclass);


--
-- Name: planReportingPeriod id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planReportingPeriod" ALTER COLUMN id SET DEFAULT nextval('public."planReportingPeriod_id_seq"'::regclass);


--
-- Name: planTag id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planTag" ALTER COLUMN id SET DEFAULT nextval('public."planTag_id_seq"'::regclass);


--
-- Name: planVersion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planVersion" ALTER COLUMN id SET DEFAULT nextval('public."planVersion_id_seq"'::regclass);


--
-- Name: planYear id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planYear" ALTER COLUMN id SET DEFAULT nextval('public."planYear_id_seq"'::regclass);


--
-- Name: procedureEntityPrototype id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."procedureEntityPrototype" ALTER COLUMN id SET DEFAULT nextval('public."procedureEntityPrototype_id_seq"'::regclass);


--
-- Name: procedureSection id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."procedureSection" ALTER COLUMN id SET DEFAULT nextval('public."procedureSection_id_seq"'::regclass);


--
-- Name: project id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project ALTER COLUMN id SET DEFAULT nextval('public.project_id_seq'::regclass);


--
-- Name: projectContact id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectContact" ALTER COLUMN id SET DEFAULT nextval('public."projectContact_id_seq"'::regclass);


--
-- Name: projectVersion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersion" ALTER COLUMN id SET DEFAULT nextval('public."projectVersion_id_seq"'::regclass);


--
-- Name: projectVersionComment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionComment" ALTER COLUMN id SET DEFAULT nextval('public."fulfillmentComment_id_seq"'::regclass);


--
-- Name: projectVersionField id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionField" ALTER COLUMN id SET DEFAULT nextval('public."projectField_id_seq"'::regclass);


--
-- Name: projectVersionHistory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionHistory" ALTER COLUMN id SET DEFAULT nextval('public."projectVersionHistory_id_seq"'::regclass);


--
-- Name: projectVersionPlan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionPlan" ALTER COLUMN id SET DEFAULT nextval('public."projectVersionPlan_id_seq"'::regclass);


--
-- Name: reportDetail id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportDetail" ALTER COLUMN id SET DEFAULT nextval('public."reportDetail_id_seq"'::regclass);


--
-- Name: reportFile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportFile" ALTER COLUMN id SET DEFAULT nextval('public."reportFile_id_seq"'::regclass);


--
-- Name: reportingWindow id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportingWindow" ALTER COLUMN id SET DEFAULT nextval('public."reportingWindow_id_seq"'::regclass);


--
-- Name: reportingWindowAssignment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportingWindowAssignment" ALTER COLUMN id SET DEFAULT nextval('public."reportingWindowAssignment_id_seq"'::regclass);


--
-- Name: role id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role ALTER COLUMN id SET DEFAULT nextval('public.role_id_seq'::regclass);


--
-- Name: roleAuthenticationKey id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."roleAuthenticationKey" ALTER COLUMN id SET DEFAULT nextval('public."roleAuthenticationKey_id_seq"'::regclass);


--
-- Name: rolePermittedAction id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."rolePermittedAction" ALTER COLUMN id SET DEFAULT nextval('public."rolePermittedAction_id_seq"'::regclass);


--
-- Name: tag id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag ALTER COLUMN id SET DEFAULT nextval('public.tag_id_seq'::regclass);


--
-- Name: task id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task ALTER COLUMN id SET DEFAULT nextval('public.task_id_seq'::regclass);


--
-- Name: unit id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit ALTER COLUMN id SET DEFAULT nextval('public.unit_id_seq'::regclass);


--
-- Name: unitType id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."unitType" ALTER COLUMN id SET DEFAULT nextval('public."unitType_id_seq"'::regclass);


--
-- Name: usageYear id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."usageYear" ALTER COLUMN id SET DEFAULT nextval('public."usageYear_id_seq"'::regclass);


--
-- Name: workflowRole id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."workflowRole" ALTER COLUMN id SET DEFAULT nextval('public."workflowRole_id_seq"'::regclass);


--
-- Name: workflowStatusOption id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."workflowStatusOption" ALTER COLUMN id SET DEFAULT nextval('public."workflowStatusOption_id_seq"'::regclass);


--
-- Name: workflowStatusOptionStep id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."workflowStatusOptionStep" ALTER COLUMN id SET DEFAULT nextval('public."workflowStatusOptionStep_id_seq"'::regclass);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: attachmentPrototype attachmentPrototype_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."attachmentPrototype"
    ADD CONSTRAINT "attachmentPrototype_pkey" PRIMARY KEY (id);


--
-- Name: attachmentVersion attachmentVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."attachmentVersion"
    ADD CONSTRAINT "attachmentVersion_pkey" PRIMARY KEY (id);


--
-- Name: attachment attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachment
    ADD CONSTRAINT attachment_pkey PRIMARY KEY (id);


--
-- Name: authGrantLog authGrantLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authGrantLog"
    ADD CONSTRAINT "authGrantLog_pkey" PRIMARY KEY (id);


--
-- Name: authGrant authGrant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authGrant"
    ADD CONSTRAINT "authGrant_pkey" PRIMARY KEY (target, grantee);


--
-- Name: authGrantee authGrantee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authGrantee"
    ADD CONSTRAINT "authGrantee_pkey" PRIMARY KEY (id);


--
-- Name: authInvite authInvite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authInvite"
    ADD CONSTRAINT "authInvite_pkey" PRIMARY KEY (target, email);


--
-- Name: authTarget authTarget_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authTarget"
    ADD CONSTRAINT "authTarget_pkey" PRIMARY KEY (id);


--
-- Name: authToken authToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authToken"
    ADD CONSTRAINT "authToken_pkey" PRIMARY KEY ("tokenHash");


--
-- Name: budgetSegmentBreakdownEntity budgetSegmentBreakdownEntity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."budgetSegmentBreakdownEntity"
    ADD CONSTRAINT "budgetSegmentBreakdownEntity_pkey" PRIMARY KEY (id);


--
-- Name: budgetSegmentBreakdown budgetSegmentBreakdown_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."budgetSegmentBreakdown"
    ADD CONSTRAINT "budgetSegmentBreakdown_pkey" PRIMARY KEY (id);


--
-- Name: budgetSegment budgetSegment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."budgetSegment"
    ADD CONSTRAINT "budgetSegment_pkey" PRIMARY KEY (id);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (namespace, fingerprint);


--
-- Name: categoryGroup categoryGroup_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."categoryGroup"
    ADD CONSTRAINT "categoryGroup_name_key" UNIQUE (name);


--
-- Name: categoryGroup categoryGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."categoryGroup"
    ADD CONSTRAINT "categoryGroup_pkey" PRIMARY KEY (type);


--
-- Name: categoryRef categoryRef_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."categoryRef"
    ADD CONSTRAINT "categoryRef_pkey" PRIMARY KEY ("objectID", "versionID", "objectType", "categoryID");


--
-- Name: category category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (id);


--
-- Name: client client_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT client_pkey PRIMARY KEY (id);


--
-- Name: conditionFieldReliesOn conditionFieldReliesOn_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."conditionFieldReliesOn"
    ADD CONSTRAINT "conditionFieldReliesOn_pkey" PRIMARY KEY ("reliedOnById", "reliesOnId");


--
-- Name: conditionFieldType conditionFieldType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."conditionFieldType"
    ADD CONSTRAINT "conditionFieldType_pkey" PRIMARY KEY (type);


--
-- Name: conditionField conditionField_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."conditionField"
    ADD CONSTRAINT "conditionField_pkey" PRIMARY KEY (id);


--
-- Name: currency currency_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currency
    ADD CONSTRAINT currency_code_key UNIQUE (code);


--
-- Name: currency currency_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currency
    ADD CONSTRAINT currency_pkey PRIMARY KEY (id);


--
-- Name: disaggregationCategoryGroup disaggregationCategoryGroup_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."disaggregationCategoryGroup"
    ADD CONSTRAINT "disaggregationCategoryGroup_id_key" UNIQUE (id);


--
-- Name: disaggregationCategoryGroup disaggregationCategoryGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."disaggregationCategoryGroup"
    ADD CONSTRAINT "disaggregationCategoryGroup_pkey" PRIMARY KEY (id);


--
-- Name: disaggregationCategory disaggregationCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."disaggregationCategory"
    ADD CONSTRAINT "disaggregationCategory_pkey" PRIMARY KEY (id);


--
-- Name: disaggregationModel disaggregationModel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."disaggregationModel"
    ADD CONSTRAINT "disaggregationModel_pkey" PRIMARY KEY (id);


--
-- Name: emergencyLocation emergencyLocation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."emergencyLocation"
    ADD CONSTRAINT "emergencyLocation_pkey" PRIMARY KEY ("emergencyId", "locationId");


--
-- Name: emergency emergency_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergency
    ADD CONSTRAINT emergency_pkey PRIMARY KEY (id);


--
-- Name: endpointLog endpointLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."endpointLog"
    ADD CONSTRAINT "endpointLog_pkey" PRIMARY KEY (id);


--
-- Name: endpointTrace endpointTrace_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."endpointTrace"
    ADD CONSTRAINT "endpointTrace_pkey" PRIMARY KEY (id);


--
-- Name: endpointUsage endpointUsage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."endpointUsage"
    ADD CONSTRAINT "endpointUsage_pkey" PRIMARY KEY (path, method);


--
-- Name: entitiesAssociation entitiesAssociation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."entitiesAssociation"
    ADD CONSTRAINT "entitiesAssociation_pkey" PRIMARY KEY ("parentId", "childId");


--
-- Name: entityCategories entityCategories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."entityCategories"
    ADD CONSTRAINT "entityCategories_pkey" PRIMARY KEY (id);


--
-- Name: entityCategory entityCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."entityCategory"
    ADD CONSTRAINT "entityCategory_pkey" PRIMARY KEY (id);


--
-- Name: entityPrototype entityPrototype_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."entityPrototype"
    ADD CONSTRAINT "entityPrototype_pkey" PRIMARY KEY (id);


--
-- Name: externalData externalData_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."externalData"
    ADD CONSTRAINT "externalData_pkey" PRIMARY KEY (id);


--
-- Name: externalReference externalReference_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."externalReference"
    ADD CONSTRAINT "externalReference_pkey" PRIMARY KEY (id);


--
-- Name: fileAssetEntity fileAssetEntity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."fileAssetEntity"
    ADD CONSTRAINT "fileAssetEntity_pkey" PRIMARY KEY (id);


--
-- Name: fileRecord fileRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."fileRecord"
    ADD CONSTRAINT "fileRecord_pkey" PRIMARY KEY (namespace, hash);


--
-- Name: flowLink flowLink_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."flowLink"
    ADD CONSTRAINT "flowLink_pkey" PRIMARY KEY ("parentID", "childID");


--
-- Name: flowObjectType flowObjectType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."flowObjectType"
    ADD CONSTRAINT "flowObjectType_pkey" PRIMARY KEY (type);


--
-- Name: flowObject flowObject_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."flowObject"
    ADD CONSTRAINT "flowObject_pkey" PRIMARY KEY ("flowID", "objectID", "versionID", "objectType", "refDirection");


--
-- Name: flow flow_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow
    ADD CONSTRAINT flow_pkey PRIMARY KEY (id, "versionID");


--
-- Name: formVersion formVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."formVersion"
    ADD CONSTRAINT "formVersion_pkey" PRIMARY KEY (root, version);


--
-- Name: form form_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form
    ADD CONSTRAINT form_pkey PRIMARY KEY (id);


--
-- Name: projectVersionComment fulfillmentComment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionComment"
    ADD CONSTRAINT "fulfillmentComment_pkey" PRIMARY KEY (id);


--
-- Name: globalClusterAssociation globalClusterAssociation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."globalClusterAssociation"
    ADD CONSTRAINT "globalClusterAssociation_pkey" PRIMARY KEY (id);


--
-- Name: globalCluster globalCluster_hrinfoId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."globalCluster"
    ADD CONSTRAINT "globalCluster_hrinfoId_key" UNIQUE ("hrinfoId");


--
-- Name: globalCluster globalCluster_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."globalCluster"
    ADD CONSTRAINT "globalCluster_pkey" PRIMARY KEY (id);


--
-- Name: globalIndicator globalIndicator_hrinfoId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."globalIndicator"
    ADD CONSTRAINT "globalIndicator_hrinfoId_key" UNIQUE ("hrinfoId");


--
-- Name: globalIndicator globalIndicator_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."globalIndicator"
    ADD CONSTRAINT "globalIndicator_pkey" PRIMARY KEY (id);


--
-- Name: governingEntityVersion governingEntityVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."governingEntityVersion"
    ADD CONSTRAINT "governingEntityVersion_pkey" PRIMARY KEY (id);


--
-- Name: governingEntity governingEntity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."governingEntity"
    ADD CONSTRAINT "governingEntity_pkey" PRIMARY KEY (id);


--
-- Name: highWater highWater_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."highWater"
    ADD CONSTRAINT "highWater_pkey" PRIMARY KEY ("jobName");


--
-- Name: iatiActivity iatiActivity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiActivity"
    ADD CONSTRAINT "iatiActivity_pkey" PRIMARY KEY (id);


--
-- Name: iatiFTSMap iatiFTSMap_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiFTSMap"
    ADD CONSTRAINT "iatiFTSMap_pkey" PRIMARY KEY (id);


--
-- Name: iatiFTSMatch iatiFTSMatch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiFTSMatch"
    ADD CONSTRAINT "iatiFTSMatch_pkey" PRIMARY KEY (id);


--
-- Name: iatiHumanitarianScope iatiHumanitarianScope_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiHumanitarianScope"
    ADD CONSTRAINT "iatiHumanitarianScope_pkey" PRIMARY KEY (id);


--
-- Name: iatiParticipatingOrg iatiParticipatingOrg_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiParticipatingOrg"
    ADD CONSTRAINT "iatiParticipatingOrg_pkey" PRIMARY KEY (id);


--
-- Name: iatiPublisher iatiPublisher_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiPublisher"
    ADD CONSTRAINT "iatiPublisher_pkey" PRIMARY KEY (id);


--
-- Name: iatiRecipientCountry iatiRecipientCountry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiRecipientCountry"
    ADD CONSTRAINT "iatiRecipientCountry_pkey" PRIMARY KEY (id);


--
-- Name: iatiSector iatiSector_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiSector"
    ADD CONSTRAINT "iatiSector_pkey" PRIMARY KEY (id);


--
-- Name: iatiTransaction iatiTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiTransaction"
    ADD CONSTRAINT "iatiTransaction_pkey" PRIMARY KEY (id);


--
-- Name: icon icon_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.icon
    ADD CONSTRAINT icon_pkey PRIMARY KEY (id);


--
-- Name: jobAssociation jobAssociation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."jobAssociation"
    ADD CONSTRAINT "jobAssociation_pkey" PRIMARY KEY ("jobId", "objectId", "objectType");


--
-- Name: job job_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job
    ADD CONSTRAINT job_pkey PRIMARY KEY (id);


--
-- Name: legacy legacy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legacy
    ADD CONSTRAINT legacy_pkey PRIMARY KEY ("objectType", "objectID", "legacyID");


--
-- Name: location location_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_pkey PRIMARY KEY (id);


--
-- Name: measurementVersion measurementVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."measurementVersion"
    ADD CONSTRAINT "measurementVersion_pkey" PRIMARY KEY (id);


--
-- Name: measurement measurement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.measurement
    ADD CONSTRAINT measurement_pkey PRIMARY KEY (id);


--
-- Name: objectExclude objectExclude_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."objectExclude"
    ADD CONSTRAINT "objectExclude_pkey" PRIMARY KEY ("objectType", "objectID", module);


--
-- Name: operationClusterVersion operationClusterVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."operationClusterVersion"
    ADD CONSTRAINT "operationClusterVersion_pkey" PRIMARY KEY (root, version);


--
-- Name: operationCluster operationCluster_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."operationCluster"
    ADD CONSTRAINT "operationCluster_pkey" PRIMARY KEY (id);


--
-- Name: operationVersion operationVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."operationVersion"
    ADD CONSTRAINT "operationVersion_pkey" PRIMARY KEY (root, version);


--
-- Name: operation operation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operation
    ADD CONSTRAINT operation_pkey PRIMARY KEY (id);


--
-- Name: organizationLocation organizationLocation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."organizationLocation"
    ADD CONSTRAINT "organizationLocation_pkey" PRIMARY KEY ("organizationId", "locationId");


--
-- Name: organization organization_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_name_key UNIQUE (name);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: parameterValueIndicatorGoal parameterValueIndicatorGoal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."parameterValueIndicatorGoal"
    ADD CONSTRAINT "parameterValueIndicatorGoal_pkey" PRIMARY KEY ("indicatorGoalId", "parameterValueId");


--
-- Name: participantCountry participantCountry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."participantCountry"
    ADD CONSTRAINT "participantCountry_pkey" PRIMARY KEY (id);


--
-- Name: participantOrganization participantOrganization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."participantOrganization"
    ADD CONSTRAINT "participantOrganization_pkey" PRIMARY KEY (id);


--
-- Name: participantRole participantRole_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."participantRole"
    ADD CONSTRAINT "participantRole_pkey" PRIMARY KEY (id);


--
-- Name: participant participant_hidId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participant
    ADD CONSTRAINT "participant_hidId_key" UNIQUE ("hidId");


--
-- Name: participant participant_internalUse_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participant
    ADD CONSTRAINT "participant_internalUse_key" UNIQUE ("internalUse");


--
-- Name: participant participant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participant
    ADD CONSTRAINT participant_pkey PRIMARY KEY (id);


--
-- Name: permittedAction permittedAction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."permittedAction"
    ADD CONSTRAINT "permittedAction_pkey" PRIMARY KEY (id);


--
-- Name: blueprint planBlueprint_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blueprint
    ADD CONSTRAINT "planBlueprint_pkey" PRIMARY KEY (id);


--
-- Name: planEmergency planEmergency_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planEmergency"
    ADD CONSTRAINT "planEmergency_pkey" PRIMARY KEY ("planId", "emergencyId");


--
-- Name: planEntityVersion planEntityVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planEntityVersion"
    ADD CONSTRAINT "planEntityVersion_pkey" PRIMARY KEY (id);


--
-- Name: planEntity planEntity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planEntity"
    ADD CONSTRAINT "planEntity_pkey" PRIMARY KEY (id);


--
-- Name: planLocation planLocation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planLocation"
    ADD CONSTRAINT "planLocation_pkey" PRIMARY KEY (id);


--
-- Name: planReportingPeriod planReportingPeriod_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planReportingPeriod"
    ADD CONSTRAINT "planReportingPeriod_pkey" PRIMARY KEY (id);


--
-- Name: planTag planTag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planTag"
    ADD CONSTRAINT "planTag_pkey" PRIMARY KEY (id);


--
-- Name: planVersion planVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planVersion"
    ADD CONSTRAINT "planVersion_pkey" PRIMARY KEY (id);


--
-- Name: planYear planYear_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planYear"
    ADD CONSTRAINT "planYear_pkey" PRIMARY KEY (id);


--
-- Name: plan plan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan
    ADD CONSTRAINT plan_pkey PRIMARY KEY (id);


--
-- Name: procedureEntityPrototype procedureEntityPrototype_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."procedureEntityPrototype"
    ADD CONSTRAINT "procedureEntityPrototype_pkey" PRIMARY KEY (id);


--
-- Name: procedureEntityPrototype procedureEntityPrototype_planId_entityPrototypeId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."procedureEntityPrototype"
    ADD CONSTRAINT "procedureEntityPrototype_planId_entityPrototypeId_key" UNIQUE ("planId", "entityPrototypeId");


--
-- Name: procedureSectionField procedureSectionField_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."procedureSectionField"
    ADD CONSTRAINT "procedureSectionField_pkey" PRIMARY KEY ("procedureSectionId", "conditionFieldId");


--
-- Name: procedureSection procedureSection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."procedureSection"
    ADD CONSTRAINT "procedureSection_pkey" PRIMARY KEY (id);


--
-- Name: projectVersionAttachment projectAttachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionAttachment"
    ADD CONSTRAINT "projectAttachment_pkey" PRIMARY KEY ("projectVersionId", "attachmentId");


--
-- Name: projectContact projectContact_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectContact"
    ADD CONSTRAINT "projectContact_pkey" PRIMARY KEY (id);


--
-- Name: projectVersionField projectField_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionField"
    ADD CONSTRAINT "projectField_pkey" PRIMARY KEY (id);


--
-- Name: projectGlobalClusters projectGlobalClusters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectGlobalClusters"
    ADD CONSTRAINT "projectGlobalClusters_pkey" PRIMARY KEY ("projectVersionId", "globalClusterId");


--
-- Name: projectVersionGoverningEntity projectGoverningEntities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionGoverningEntity"
    ADD CONSTRAINT "projectGoverningEntities_pkey" PRIMARY KEY ("projectVersionId", "governingEntityId");


--
-- Name: projectLocations projectLocations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectLocations"
    ADD CONSTRAINT "projectLocations_pkey" PRIMARY KEY ("projectVersionId", "locationId");


--
-- Name: projectVersionOrganization projectOrganizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionOrganization"
    ADD CONSTRAINT "projectOrganizations_pkey" PRIMARY KEY ("projectVersionId", "organizationId");


--
-- Name: projectVersionPlanEntity projectPlanEntities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionPlanEntity"
    ADD CONSTRAINT "projectPlanEntities_pkey" PRIMARY KEY ("projectVersionId", "planEntityId");


--
-- Name: projectVersionPlan projectPlans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionPlan"
    ADD CONSTRAINT "projectPlans_pkey" PRIMARY KEY ("projectVersionId", "planId");


--
-- Name: projectVersionAttachment projectVersionAttachment_attachmentId_projectVersionId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionAttachment"
    ADD CONSTRAINT "projectVersionAttachment_attachmentId_projectVersionId_key" UNIQUE ("attachmentId", "projectVersionId");


--
-- Name: projectVersionGoverningEntity projectVersionGoverningEntity_governingEntityId_projectVers_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionGoverningEntity"
    ADD CONSTRAINT "projectVersionGoverningEntity_governingEntityId_projectVers_key" UNIQUE ("governingEntityId", "projectVersionId");


--
-- Name: projectVersionHistory projectVersionHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionHistory"
    ADD CONSTRAINT "projectVersionHistory_pkey" PRIMARY KEY (id);


--
-- Name: projectVersionPlanEntity projectVersionPlanEntity_planEntityId_projectVersionId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionPlanEntity"
    ADD CONSTRAINT "projectVersionPlanEntity_planEntityId_projectVersionId_key" UNIQUE ("planEntityId", "projectVersionId");


--
-- Name: projectVersionPlan projectVersionPlan_unique_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionPlan"
    ADD CONSTRAINT "projectVersionPlan_unique_id" UNIQUE (id);


--
-- Name: projectVersion projectVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersion"
    ADD CONSTRAINT "projectVersion_pkey" PRIMARY KEY (id);


--
-- Name: project project_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_code_key UNIQUE (code);


--
-- Name: project project_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (id);


--
-- Name: reportDetail reportDetail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportDetail"
    ADD CONSTRAINT "reportDetail_pkey" PRIMARY KEY (id);


--
-- Name: reportFile reportFile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportFile"
    ADD CONSTRAINT "reportFile_pkey" PRIMARY KEY (id);


--
-- Name: reportingWindowAssignmentVersion reportingWindowAssignmentVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportingWindowAssignmentVersion"
    ADD CONSTRAINT "reportingWindowAssignmentVersion_pkey" PRIMARY KEY (root, version);


--
-- Name: reportingWindowAssignment reportingWindowAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportingWindowAssignment"
    ADD CONSTRAINT "reportingWindowAssignment_pkey" PRIMARY KEY (id);


--
-- Name: reportingWindowVersion reportingWindowVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportingWindowVersion"
    ADD CONSTRAINT "reportingWindowVersion_pkey" PRIMARY KEY (root, version);


--
-- Name: reportingWindow reportingwindow_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportingWindow"
    ADD CONSTRAINT reportingwindow_pkey PRIMARY KEY (id);


--
-- Name: roleAuthenticationKey roleAuthenticationKey_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."roleAuthenticationKey"
    ADD CONSTRAINT "roleAuthenticationKey_pkey" PRIMARY KEY (id);


--
-- Name: rolePermittedAction rolePermittedAction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."rolePermittedAction"
    ADD CONSTRAINT "rolePermittedAction_pkey" PRIMARY KEY (id);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: tag tag_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_name_key UNIQUE (name);


--
-- Name: tag tag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_pkey PRIMARY KEY (id);


--
-- Name: task task_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);


--
-- Name: unitType unitType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."unitType"
    ADD CONSTRAINT "unitType_pkey" PRIMARY KEY (id);


--
-- Name: unit unit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT unit_pkey PRIMARY KEY (id);


--
-- Name: usageYear usageYear_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."usageYear"
    ADD CONSTRAINT "usageYear_pkey" PRIMARY KEY (id);


--
-- Name: usageYear usageYear_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."usageYear"
    ADD CONSTRAINT "usageYear_year_key" UNIQUE (year);


--
-- Name: workflowRole workflowRole_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."workflowRole"
    ADD CONSTRAINT "workflowRole_pkey" PRIMARY KEY (id);


--
-- Name: workflowStatusOptionStep workflowStatusOptionStep_fromId_toId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."workflowStatusOptionStep"
    ADD CONSTRAINT "workflowStatusOptionStep_fromId_toId_key" UNIQUE ("fromId", "toId");


--
-- Name: workflowStatusOptionStep workflowStatusOptionStep_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."workflowStatusOptionStep"
    ADD CONSTRAINT "workflowStatusOptionStep_pkey" PRIMARY KEY (id);


--
-- Name: workflowStatusOption workflowStatusOption_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."workflowStatusOption"
    ADD CONSTRAINT "workflowStatusOption_pkey" PRIMARY KEY (id);


--
-- Name: attachmentPrototype_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "attachmentPrototype_plan_index" ON public."attachmentPrototype" USING btree ("planId");


--
-- Name: attachmentPrototype_refCode_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "attachmentPrototype_refCode_index" ON public."attachmentPrototype" USING btree ("refCode");


--
-- Name: attachmentVersion_attachmentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "attachmentVersion_attachmentId_idx" ON public."attachmentVersion" USING btree ("attachmentId");


--
-- Name: attachmentVersion_current_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "attachmentVersion_current_index" ON public."attachmentVersion" USING btree ("currentVersion") WHERE ("currentVersion" = true);


--
-- Name: attachmentVersion_latestTagged_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "attachmentVersion_latestTagged_index" ON public."attachmentVersion" USING btree ("latestTaggedVersion") WHERE ("latestTaggedVersion" = true);


--
-- Name: attachmentVersion_latest_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "attachmentVersion_latest_index" ON public."attachmentVersion" USING btree ("latestVersion") WHERE ("latestVersion" = true);


--
-- Name: attachmentVersion_versionTags_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "attachmentVersion_versionTags_index" ON public."attachmentVersion" USING gin ("versionTags");


--
-- Name: attachment_attachmentPrototypeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "attachment_attachmentPrototypeId_idx" ON public.attachment USING btree ("attachmentPrototypeId");


--
-- Name: attachment_current_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attachment_current_index ON public.attachment USING btree ("currentVersion") WHERE ("currentVersion" = true);


--
-- Name: attachment_latestTagged_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "attachment_latestTagged_index" ON public.attachment USING btree ("latestTaggedVersion") WHERE ("latestTaggedVersion" = true);


--
-- Name: attachment_latest_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attachment_latest_index ON public.attachment USING btree ("latestVersion") WHERE ("latestVersion" = true);


--
-- Name: attachment_object_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attachment_object_index ON public.attachment USING btree ("objectId", "objectType");


--
-- Name: attachment_planId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "attachment_planId_idx" ON public.attachment USING btree ("planId");


--
-- Name: attachment_versionTags_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "attachment_versionTags_index" ON public.attachment USING gin ("versionTags");


--
-- Name: auth_grant_grantee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_grant_grantee ON public."authGrant" USING btree (grantee);


--
-- Name: auth_grant_log_grantee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_grant_log_grantee ON public."authGrantLog" USING btree (grantee);


--
-- Name: auth_grant_log_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_grant_log_target ON public."authGrantLog" USING btree (target);


--
-- Name: auth_grant_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_grant_target ON public."authGrant" USING btree (target);


--
-- Name: auth_grantee_type_grantee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX auth_grantee_type_grantee_id ON public."authGrantee" USING btree (type, "granteeId");


--
-- Name: auth_invite_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_invite_email ON public."authInvite" USING btree (email);


--
-- Name: auth_invite_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_invite_target ON public."authInvite" USING btree (target);


--
-- Name: auth_target_type_target_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX auth_target_type_target_id ON public."authTarget" USING btree (type, "targetId");


--
-- Name: budgetSegmentBreakdownEntity_budgetSegmentBreakdownId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "budgetSegmentBreakdownEntity_budgetSegmentBreakdownId_idx" ON public."budgetSegmentBreakdownEntity" USING btree ("budgetSegmentBreakdownId");


--
-- Name: budgetSegmentBreakdownEntity_budgetSegmentBreakdownId_objec_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "budgetSegmentBreakdownEntity_budgetSegmentBreakdownId_objec_idx" ON public."budgetSegmentBreakdownEntity" USING btree ("budgetSegmentBreakdownId", "objectType");


--
-- Name: budgetSegmentBreakdown_budgetSegmentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "budgetSegmentBreakdown_budgetSegmentId_idx" ON public."budgetSegmentBreakdown" USING btree ("budgetSegmentId");


--
-- Name: budgetSegment_projectVersionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "budgetSegment_projectVersionId_idx" ON public."budgetSegment" USING btree ("projectVersionId");


--
-- Name: cache_namespace_fingerprint; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cache_namespace_fingerprint ON public.cache USING btree (namespace, fingerprint);


--
-- Name: categoryLegacy_group_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "categoryLegacy_group_idx" ON public."categoryLegacy" USING btree ("group");


--
-- Name: categoryLegacy_pkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "categoryLegacy_pkey" ON public."categoryLegacy" USING btree (id, "group", "legacyID");


--
-- Name: categoryRef_categoryID_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "categoryRef_categoryID_idx" ON public."categoryRef" USING btree ("categoryID");


--
-- Name: category_group_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX category_group_idx ON public.category USING btree ("group");


--
-- Name: category_name_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX category_name_group ON public.category USING btree (name, "group");


--
-- Name: category_parent_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX category_parent_index ON public.category USING btree ("parentID");


--
-- Name: childID; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "childID" ON public."flowLink" USING btree ("childID");


--
-- Name: client_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX client_id_index ON public.client USING btree ("clientId");


--
-- Name: conditionFieldReliesOn_reliesOnId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "conditionFieldReliesOn_reliesOnId_idx" ON public."conditionFieldReliesOn" USING btree ("reliesOnId");


--
-- Name: conditionField_fieldType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "conditionField_fieldType_idx" ON public."conditionField" USING btree ("fieldType");


--
-- Name: conditionField_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "conditionField_plan_index" ON public."conditionField" USING btree ("planId");


--
-- Name: conditionfield_lowercase_name_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conditionfield_lowercase_name_index ON public."conditionField" USING btree (lower((name)::text));


--
-- Name: disaggregationCategoryGroup_planId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "disaggregationCategoryGroup_planId_idx" ON public."disaggregationCategoryGroup" USING btree ("planId");


--
-- Name: disaggregationCategoryGroup_unitTypeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "disaggregationCategoryGroup_unitTypeId_idx" ON public."disaggregationCategoryGroup" USING btree ("unitTypeId");


--
-- Name: disaggregationCategory_disaggregationCategoryGroupId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "disaggregationCategory_disaggregationCategoryGroupId_idx" ON public."disaggregationCategory" USING btree ("disaggregationCategoryGroupId");


--
-- Name: disaggregationModel_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "disaggregationModel_plan_index" ON public."disaggregationModel" USING btree ("planId");


--
-- Name: emergencyLocation_locationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "emergencyLocation_locationId_idx" ON public."emergencyLocation" USING btree ("locationId");


--
-- Name: emergency_name_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX emergency_name_index ON public.emergency USING btree (name);


--
-- Name: emergency_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX emergency_status_index ON public.emergency USING btree (active DESC NULLS LAST, restricted NULLS FIRST);


--
-- Name: endpointLog_entity_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "endpointLog_entity_index" ON public."endpointLog" USING btree ("entityId", "entityType");


--
-- Name: endpointLog_participantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "endpointLog_participantId_idx" ON public."endpointLog" USING btree ("participantId");


--
-- Name: entitiesAssociation_child_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "entitiesAssociation_child_index" ON public."entitiesAssociation" USING btree ("childId", "childType");


--
-- Name: entitiesAssociation_parent_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "entitiesAssociation_parent_index" ON public."entitiesAssociation" USING btree ("parentId", "parentType");


--
-- Name: entityCategories_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "entityCategories_plan_index" ON public."entityCategories" USING btree ("planId");


--
-- Name: entityCategory_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "entityCategory_plan_index" ON public."entityCategory" USING btree ("planId");


--
-- Name: entityPrototype_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "entityPrototype_plan_index" ON public."entityPrototype" USING btree ("planId");


--
-- Name: entityPrototype_refCode_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "entityPrototype_refCode_index" ON public."entityPrototype" USING btree ("refCode");


--
-- Name: externalData_flow_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "externalData_flow_index" ON public."externalData" USING btree ("flowID", "versionID");


--
-- Name: externalData_system_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "externalData_system_index" ON public."externalData" USING btree ("systemID");


--
-- Name: externalReference_flow_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "externalReference_flow_index" ON public."externalReference" USING btree ("flowID", "versionID");


--
-- Name: externalReference_system_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "externalReference_system_index" ON public."externalReference" USING btree ("systemID");


--
-- Name: file_record_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX file_record_hash ON public."fileRecord" USING btree (hash);


--
-- Name: file_record_namespace; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX file_record_namespace ON public."fileRecord" USING btree (namespace);


--
-- Name: flowObject_directional_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "flowObject_directional_index" ON public."flowObject" USING btree ("flowID", "objectID", "objectType", "refDirection");


--
-- Name: flowObject_objectID_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "flowObject_objectID_idx" ON public."flowObject" USING btree ("objectID");


--
-- Name: flowObject_objectType_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "flowObject_objectType_index" ON public."flowObject" USING btree ("objectType");


--
-- Name: flowObject_referential_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "flowObject_referential_index" ON public."flowObject" USING btree ("flowID", "versionID", "objectType");


--
-- Name: flow_object_flow_i_d_object_i_d_object_type_ref_direction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flow_object_flow_i_d_object_i_d_object_type_ref_direction ON public."flowObject" USING btree ("flowID", "objectID", "objectType", "refDirection");


--
-- Name: flow_referential_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flow_referential_index ON public.flow USING btree (id, "versionID");


--
-- Name: flow_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flow_status_index ON public.flow USING btree ("deletedAt" NULLS FIRST, "activeStatus" DESC NULLS LAST, restricted NULLS FIRST);


--
-- Name: flow_updated_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flow_updated_index ON public.flow USING btree ("updatedAt");


--
-- Name: formLatestVersions; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "formLatestVersions" ON public."formVersion" USING btree ("isLatest", root) WHERE ("isLatest" = true);


--
-- Name: globalClusterAssociation_globalCluster_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "globalClusterAssociation_globalCluster_index" ON public."globalClusterAssociation" USING btree ("globalClusterId");


--
-- Name: globalClusterAssociation_governingEntity_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "globalClusterAssociation_governingEntity_index" ON public."globalClusterAssociation" USING btree ("governingEntityId");


--
-- Name: globalCluster_code_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "globalCluster_code_index" ON public."globalCluster" USING btree (code);


--
-- Name: globalCluster_name_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "globalCluster_name_index" ON public."globalCluster" USING btree (name);


--
-- Name: globalCluster_parent_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "globalCluster_parent_index" ON public."globalCluster" USING btree ("parentId");


--
-- Name: governingEntityVersion_current_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntityVersion_current_index" ON public."governingEntityVersion" USING btree ("currentVersion") WHERE ("currentVersion" = true);


--
-- Name: governingEntityVersion_governingEntityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntityVersion_governingEntityId_idx" ON public."governingEntityVersion" USING btree ("governingEntityId");


--
-- Name: governingEntityVersion_latestTagged_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntityVersion_latestTagged_index" ON public."governingEntityVersion" USING btree ("latestTaggedVersion") WHERE ("latestTaggedVersion" = true);


--
-- Name: governingEntityVersion_latest_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntityVersion_latest_index" ON public."governingEntityVersion" USING btree ("latestVersion") WHERE ("latestVersion" = true);


--
-- Name: governingEntityVersion_updated_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntityVersion_updated_index" ON public."governingEntityVersion" USING btree ("updatedAt");


--
-- Name: governingEntityVersion_versionTags_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntityVersion_versionTags_index" ON public."governingEntityVersion" USING gin ("versionTags");


--
-- Name: governingEntity_current_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntity_current_index" ON public."governingEntity" USING btree ("currentVersion") WHERE ("currentVersion" = true);


--
-- Name: governingEntity_entityPrototypeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntity_entityPrototypeId_idx" ON public."governingEntity" USING btree ("entityPrototypeId");


--
-- Name: governingEntity_entityType_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntity_entityType_index" ON public."governingEntity" USING btree (((public."entityType"("governingEntity".*))::text));


--
-- Name: governingEntity_latestTagged_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntity_latestTagged_index" ON public."governingEntity" USING btree ("latestTaggedVersion") WHERE ("latestTaggedVersion" = true);


--
-- Name: governingEntity_latest_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntity_latest_index" ON public."governingEntity" USING btree ("latestVersion") WHERE ("latestVersion" = true);


--
-- Name: governingEntity_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntity_plan_index" ON public."governingEntity" USING btree ("planId");


--
-- Name: governingEntity_updated_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntity_updated_index" ON public."governingEntity" USING btree ("updatedAt");


--
-- Name: governingEntity_versionTags_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "governingEntity_versionTags_index" ON public."governingEntity" USING gin ("versionTags");


--
-- Name: iatiActivity_iatiPublisherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "iatiActivity_iatiPublisherId_idx" ON public."iatiActivity" USING btree ("iatiPublisherId");


--
-- Name: iatiFTSMap_iatiActivityID_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "iatiFTSMap_iatiActivityID_idx" ON public."iatiFTSMap" USING btree ("iatiActivityID");


--
-- Name: iatiFTSMap_iatiPublisherID_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "iatiFTSMap_iatiPublisherID_idx" ON public."iatiFTSMap" USING btree ("iatiPublisherID");


--
-- Name: iatiFTSMatch_iatiFTSMapID_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "iatiFTSMatch_iatiFTSMapID_idx" ON public."iatiFTSMatch" USING btree ("iatiFTSMapID");


--
-- Name: iatiHumanitarianScope_iatiActivityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "iatiHumanitarianScope_iatiActivityId_idx" ON public."iatiHumanitarianScope" USING btree ("iatiActivityId");


--
-- Name: iatiParticipatingOrg_iatiActivityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "iatiParticipatingOrg_iatiActivityId_idx" ON public."iatiParticipatingOrg" USING btree ("iatiActivityId");


--
-- Name: iatiRecipientCountry_iatiActivityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "iatiRecipientCountry_iatiActivityId_idx" ON public."iatiRecipientCountry" USING btree ("iatiActivityId");


--
-- Name: iatiSector_iatiActivityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "iatiSector_iatiActivityId_idx" ON public."iatiSector" USING btree ("iatiActivityId");


--
-- Name: iatiTransaction_iatiActivityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "iatiTransaction_iatiActivityId_idx" ON public."iatiTransaction" USING btree ("iatiActivityId");


--
-- Name: iatiTransaction_iatiFTSMapId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "iatiTransaction_iatiFTSMapId_idx" ON public."iatiTransaction" USING btree ("iatiFTSMapId");


--
-- Name: location_iso3_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX location_iso3_index ON public.location USING btree (iso3);


--
-- Name: location_name_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX location_name_index ON public.location USING btree (name);


--
-- Name: location_parentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "location_parentId_idx" ON public.location USING btree ("parentId");


--
-- Name: measurementVersion_current_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "measurementVersion_current_index" ON public."measurementVersion" USING btree ("currentVersion") WHERE ("currentVersion" = true);


--
-- Name: measurementVersion_latestTagged_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "measurementVersion_latestTagged_index" ON public."measurementVersion" USING btree ("latestTaggedVersion") WHERE ("latestTaggedVersion" = true);


--
-- Name: measurementVersion_latest_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "measurementVersion_latest_index" ON public."measurementVersion" USING btree ("latestVersion") WHERE ("latestVersion" = true);


--
-- Name: measurementVersion_measurementId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "measurementVersion_measurementId_idx" ON public."measurementVersion" USING btree ("measurementId");


--
-- Name: measurementVersion_versionTags_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "measurementVersion_versionTags_index" ON public."measurementVersion" USING gin ("versionTags");


--
-- Name: measurement_attachment_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX measurement_attachment_index ON public.measurement USING btree ("attachmentId");


--
-- Name: measurement_current_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX measurement_current_index ON public.measurement USING btree ("currentVersion") WHERE ("currentVersion" = true);


--
-- Name: measurement_latestTagged_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "measurement_latestTagged_index" ON public.measurement USING btree ("latestTaggedVersion") WHERE ("latestTaggedVersion" = true);


--
-- Name: measurement_latest_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX measurement_latest_index ON public.measurement USING btree ("latestVersion") WHERE ("latestVersion" = true);


--
-- Name: measurement_planReportingPeriod_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "measurement_planReportingPeriod_index" ON public.measurement USING btree ("planReportingPeriodId");


--
-- Name: measurement_versionTags_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "measurement_versionTags_index" ON public.measurement USING gin ("versionTags");


--
-- Name: operationClusterLatestVersions; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "operationClusterLatestVersions" ON public."operationClusterVersion" USING btree ("isLatest", root) WHERE ("isLatest" = true);


--
-- Name: operationLatestVersions; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "operationLatestVersions" ON public."operationVersion" USING btree ("isLatest", root) WHERE ("isLatest" = true);


--
-- Name: organizationLocation_locationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "organizationLocation_locationId_idx" ON public."organizationLocation" USING btree ("locationId");


--
-- Name: organization_abbreviation_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX organization_abbreviation_index ON public.organization USING btree (abbreviation);


--
-- Name: organization_name_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX organization_name_index ON public.organization USING btree (name);


--
-- Name: organization_nativeName_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "organization_nativeName_index" ON public.organization USING btree ("nativeName");


--
-- Name: organization_newOrganizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "organization_newOrganizationId_idx" ON public.organization USING btree ("newOrganizationId");


--
-- Name: organization_parent_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX organization_parent_index ON public.organization USING btree ("parentID");


--
-- Name: parentID; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "parentID" ON public."flowLink" USING btree ("parentID");


--
-- Name: participantCountry_location_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "participantCountry_location_index" ON public."participantCountry" USING btree ("locationId");


--
-- Name: participantCountry_participant_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "participantCountry_participant_index" ON public."participantCountry" USING btree ("participantId");


--
-- Name: participantOrganization_organization_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "participantOrganization_organization_index" ON public."participantOrganization" USING btree ("organizationId");


--
-- Name: participantOrganization_participant_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "participantOrganization_participant_index" ON public."participantOrganization" USING btree ("participantId");


--
-- Name: participantRole_object_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "participantRole_object_index" ON public."participantRole" USING btree ("objectId", "objectType");


--
-- Name: participantRole_participant_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "participantRole_participant_index" ON public."participantRole" USING btree ("participantId");


--
-- Name: participantRole_permittedAction_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "participantRole_permittedAction_index" ON public."rolePermittedAction" USING btree ("permittedActionId");


--
-- Name: participantRole_role_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "participantRole_role_index" ON public."participantRole" USING btree ("roleId");


--
-- Name: participantRole_role_index2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "participantRole_role_index2" ON public."rolePermittedAction" USING btree ("roleId");


--
-- Name: participant_hidSub_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "participant_hidSub_key" ON public.participant USING btree ("hidSub");


--
-- Name: planEmergency_emergencyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planEmergency_emergencyId_idx" ON public."planEmergency" USING btree ("emergencyId");


--
-- Name: planEntityVersion_current_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planEntityVersion_current_index" ON public."planEntityVersion" USING btree ("currentVersion") WHERE ("currentVersion" = true);


--
-- Name: planEntityVersion_latestTagged_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planEntityVersion_latestTagged_index" ON public."planEntityVersion" USING btree ("latestTaggedVersion") WHERE ("latestTaggedVersion" = true);


--
-- Name: planEntityVersion_latest_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planEntityVersion_latest_index" ON public."planEntityVersion" USING btree ("latestVersion") WHERE ("latestVersion" = true);


--
-- Name: planEntityVersion_planEntityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planEntityVersion_planEntityId_idx" ON public."planEntityVersion" USING btree ("planEntityId");


--
-- Name: planEntityVersion_versionTags_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planEntityVersion_versionTags_index" ON public."planEntityVersion" USING gin ("versionTags");


--
-- Name: planEntity_current_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planEntity_current_index" ON public."planEntity" USING btree ("currentVersion") WHERE ("currentVersion" = true);


--
-- Name: planEntity_entityPrototypeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planEntity_entityPrototypeId_idx" ON public."planEntity" USING btree ("entityPrototypeId");


--
-- Name: planEntity_latestTagged_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planEntity_latestTagged_index" ON public."planEntity" USING btree ("latestTaggedVersion") WHERE ("latestTaggedVersion" = true);


--
-- Name: planEntity_latest_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planEntity_latest_index" ON public."planEntity" USING btree ("latestVersion") WHERE ("latestVersion" = true);


--
-- Name: planEntity_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planEntity_plan_index" ON public."planEntity" USING btree ("planId");


--
-- Name: planEntity_versionTags_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planEntity_versionTags_index" ON public."planEntity" USING gin ("versionTags");


--
-- Name: planLocation_current_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planLocation_current_index" ON public."planLocation" USING btree ("currentVersion") WHERE ("currentVersion" = true);


--
-- Name: planLocation_latestTagged_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planLocation_latestTagged_index" ON public."planLocation" USING btree ("latestTaggedVersion") WHERE ("latestTaggedVersion" = true);


--
-- Name: planLocation_latest_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planLocation_latest_index" ON public."planLocation" USING btree ("latestVersion") WHERE ("latestVersion" = true);


--
-- Name: planLocation_location_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planLocation_location_index" ON public."planLocation" USING btree ("locationId");


--
-- Name: planLocation_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planLocation_plan_index" ON public."planLocation" USING btree ("planId");


--
-- Name: planLocation_versionTags_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planLocation_versionTags_index" ON public."planLocation" USING gin ("versionTags");


--
-- Name: planReportingPeriod_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planReportingPeriod_plan_index" ON public."planReportingPeriod" USING btree ("planId");


--
-- Name: planTag_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planTag_plan_index" ON public."planTag" USING btree ("planId");


--
-- Name: planTag_public_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planTag_public_index" ON public."planTag" USING btree (public);


--
-- Name: planVersion_current_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planVersion_current_index" ON public."planVersion" USING btree ("currentVersion") WHERE ("currentVersion" = true);


--
-- Name: planVersion_latestTagged_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planVersion_latestTagged_index" ON public."planVersion" USING btree ("latestTaggedVersion") WHERE ("latestTaggedVersion" = true);


--
-- Name: planVersion_latest_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planVersion_latest_index" ON public."planVersion" USING btree ("latestVersion") WHERE ("latestVersion" = true);


--
-- Name: planVersion_name_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planVersion_name_index" ON public."planVersion" USING btree (name);


--
-- Name: planVersion_planReportingPeriod_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planVersion_planReportingPeriod_index" ON public."planVersion" USING btree ("currentReportingPeriodId");


--
-- Name: planVersion_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planVersion_plan_index" ON public."planVersion" USING btree ("planId");


--
-- Name: planVersion_versionTags_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planVersion_versionTags_index" ON public."planVersion" USING gin ("versionTags");


--
-- Name: planYear_current_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planYear_current_index" ON public."planYear" USING btree ("currentVersion") WHERE ("currentVersion" = true);


--
-- Name: planYear_latestTagged_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planYear_latestTagged_index" ON public."planYear" USING btree ("latestTaggedVersion") WHERE ("latestTaggedVersion" = true);


--
-- Name: planYear_latest_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planYear_latest_index" ON public."planYear" USING btree ("latestVersion") WHERE ("latestVersion" = true);


--
-- Name: planYear_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planYear_plan_index" ON public."planYear" USING btree ("planId");


--
-- Name: planYear_usageYear_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planYear_usageYear_index" ON public."planYear" USING btree ("usageYearId");


--
-- Name: planYear_versionTags_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "planYear_versionTags_index" ON public."planYear" USING gin ("versionTags");


--
-- Name: procedureEntityPrototype_entityPrototype_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "procedureEntityPrototype_entityPrototype_index" ON public."procedureEntityPrototype" USING btree ("entityPrototypeId");


--
-- Name: procedureEntityPrototype_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "procedureEntityPrototype_plan_index" ON public."procedureEntityPrototype" USING btree ("planId");


--
-- Name: procedureSectionField_conditionField_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "procedureSectionField_conditionField_index" ON public."procedureSectionField" USING btree ("conditionFieldId");


--
-- Name: procedureSectionField_procedureSection_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "procedureSectionField_procedureSection_index" ON public."procedureSectionField" USING btree ("procedureSectionId");


--
-- Name: procedureSection_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "procedureSection_plan_index" ON public."procedureSection" USING btree ("planId");


--
-- Name: projectAttachment_attachment_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectAttachment_attachment_index" ON public."projectVersionAttachment" USING btree ("attachmentId");


--
-- Name: projectAttachment_projectVersion_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectAttachment_projectVersion_index" ON public."projectVersionAttachment" USING btree ("projectVersionId");


--
-- Name: projectContact_participantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectContact_participantId_idx" ON public."projectContact" USING btree ("participantId");


--
-- Name: projectContact_projectVersionId_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectContact_projectVersionId_index" ON public."projectContact" USING btree ("projectVersionId");


--
-- Name: projectField_value_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectField_value_index" ON public."projectVersionField" USING gin (to_tsvector('english'::regconfig, value));


--
-- Name: projectGlobalClusters_globalClusterId_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectGlobalClusters_globalClusterId_index" ON public."projectGlobalClusters" USING btree ("globalClusterId");


--
-- Name: projectGlobalClusters_projectVersionId_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectGlobalClusters_projectVersionId_index" ON public."projectGlobalClusters" USING btree ("projectVersionId");


--
-- Name: projectGoverningEntities_governingEntityId_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectGoverningEntities_governingEntityId_index" ON public."projectVersionGoverningEntity" USING btree ("governingEntityId");


--
-- Name: projectGoverningEntities_projectVersionId_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectGoverningEntities_projectVersionId_index" ON public."projectVersionGoverningEntity" USING btree ("projectVersionId");


--
-- Name: projectLocations_locationId_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectLocations_locationId_index" ON public."projectLocations" USING btree ("locationId");


--
-- Name: projectLocations_projectVersionId_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectLocations_projectVersionId_index" ON public."projectLocations" USING btree ("projectVersionId");


--
-- Name: projectOrganizations_organizationId_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectOrganizations_organizationId_index" ON public."projectVersionOrganization" USING btree ("organizationId");


--
-- Name: projectOrganizations_projectVersionId_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectOrganizations_projectVersionId_index" ON public."projectVersionOrganization" USING btree ("projectVersionId");


--
-- Name: projectPlans_planId_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectPlans_planId_index" ON public."projectVersionPlan" USING btree ("planId");


--
-- Name: projectPlans_projectVersionId_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectPlans_projectVersionId_index" ON public."projectVersionPlan" USING btree ("projectVersionId");


--
-- Name: projectPlans_projectVersionId_planId_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectPlans_projectVersionId_planId_index" ON public."projectVersionPlan" USING btree ("planId", "projectVersionId");


--
-- Name: projectVersionAttachment_attachmentVersionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectVersionAttachment_attachmentVersionId_idx" ON public."projectVersionAttachment" USING btree ("attachmentVersionId");


--
-- Name: projectVersionComment_participantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectVersionComment_participantId_idx" ON public."projectVersionComment" USING btree ("participantId");


--
-- Name: projectVersionComment_projectVersionPlanId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectVersionComment_projectVersionPlanId_idx" ON public."projectVersionComment" USING btree ("projectVersionPlanId");


--
-- Name: projectVersionGoverningEntity_governingEntityVersionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectVersionGoverningEntity_governingEntityVersionId_idx" ON public."projectVersionGoverningEntity" USING btree ("governingEntityVersionId");


--
-- Name: projectVersionPlanEntity_planEntityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectVersionPlanEntity_planEntityId_idx" ON public."projectVersionPlanEntity" USING btree ("planEntityId");


--
-- Name: projectVersionPlanEntity_planEntityVersionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectVersionPlanEntity_planEntityVersionId_idx" ON public."projectVersionPlanEntity" USING btree ("planEntityVersionId");


--
-- Name: projectVersionPlan_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectVersionPlan_id_idx" ON public."projectVersionPlan" USING btree (id);


--
-- Name: projectVersionPlan_workflowStatusOptionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectVersionPlan_workflowStatusOptionId_idx" ON public."projectVersionPlan" USING btree ("workflowStatusOptionId");


--
-- Name: projectVersion_startDate_endDate_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "projectVersion_startDate_endDate_index" ON public."projectVersion" USING btree ("startDate", "endDate");


--
-- Name: projectVersion_version_projectId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "projectVersion_version_projectId_key" ON public."projectVersion" USING btree (version, "projectId");


--
-- Name: project_code_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX project_code_index ON public.project USING btree (code);


--
-- Name: project_creatorParticipant_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "project_creatorParticipant_index" ON public.project USING btree ("creatorParticipantId");


--
-- Name: project_currentPublishedVersion_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "project_currentPublishedVersion_index" ON public.project USING btree ("currentPublishedVersionId");


--
-- Name: project_latestVersion_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "project_latestVersion_index" ON public.project USING btree ("latestVersionId");


--
-- Name: projectversion_name_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX projectversion_name_index ON public."projectVersion" USING btree (name);


--
-- Name: projectversion_project_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX projectversion_project_index ON public."projectVersion" USING btree ("projectId");


--
-- Name: projectversionfield_conditionfieldid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX projectversionfield_conditionfieldid_idx ON public."projectVersionField" USING btree ("conditionFieldId");


--
-- Name: projectversionfield_projectversionplanid_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX projectversionfield_projectversionplanid_idx ON public."projectVersionField" USING btree ("projectVersionPlanId");


--
-- Name: reportDetail_flow_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "reportDetail_flow_index" ON public."reportDetail" USING btree ("flowID", "versionID");


--
-- Name: reportDetail_organizationID_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "reportDetail_organizationID_idx" ON public."reportDetail" USING btree ("organizationID");


--
-- Name: reportFile_fileAsset_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "reportFile_fileAsset_index" ON public."reportFile" USING btree ("fileAssetID");


--
-- Name: reportFile_report_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "reportFile_report_index" ON public."reportFile" USING btree ("reportID");


--
-- Name: reportingWindowAssignmentLatestVersions; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "reportingWindowAssignmentLatestVersions" ON public."reportingWindowAssignmentVersion" USING btree ("isLatest", root) WHERE ("isLatest" = true);


--
-- Name: reportingWindowLatestVersions; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "reportingWindowLatestVersions" ON public."reportingWindowVersion" USING btree ("isLatest", root) WHERE ("isLatest" = true);


--
-- Name: roleAuthenticationKey_roleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "roleAuthenticationKey_roleId_idx" ON public."roleAuthenticationKey" USING btree ("roleId");


--
-- Name: role_name_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX role_name_index ON public.role USING btree (name);


--
-- Name: unit_unitTypeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "unit_unitTypeId_idx" ON public.unit USING btree ("unitTypeId");


--
-- Name: upper_case_category_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX upper_case_category_name ON public.category USING btree (lower((name)::text));


--
-- Name: workflowRole_role_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "workflowRole_role_index" ON public."workflowRole" USING btree ("roleId");


--
-- Name: workflowStatusOptionStep_toId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "workflowStatusOptionStep_toId_idx" ON public."workflowStatusOptionStep" USING btree ("toId");


--
-- Name: workflowStatusOption_plan_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "workflowStatusOption_plan_index" ON public."workflowStatusOption" USING btree ("planId");


--
-- Name: attachmentPrototype attachmentPrototype_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."attachmentPrototype"
    ADD CONSTRAINT "attachmentPrototype_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON DELETE CASCADE;


--
-- Name: attachmentVersion attachmentVersion_attachmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."attachmentVersion"
    ADD CONSTRAINT "attachmentVersion_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES public.attachment(id);


--
-- Name: attachment attachment_attachmentPrototypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachment
    ADD CONSTRAINT "attachment_attachmentPrototypeId_fkey" FOREIGN KEY ("attachmentPrototypeId") REFERENCES public."attachmentPrototype"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attachment attachment_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attachment
    ADD CONSTRAINT "attachment_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id);


--
-- Name: authGrantLog authGrantLog_actor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authGrantLog"
    ADD CONSTRAINT "authGrantLog_actor_fkey" FOREIGN KEY (actor) REFERENCES public.participant(id);


--
-- Name: authGrantLog authGrantLog_grantee_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authGrantLog"
    ADD CONSTRAINT "authGrantLog_grantee_fkey" FOREIGN KEY (grantee) REFERENCES public."authGrantee"(id);


--
-- Name: authGrantLog authGrantLog_target_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authGrantLog"
    ADD CONSTRAINT "authGrantLog_target_fkey" FOREIGN KEY (target) REFERENCES public."authTarget"(id);


--
-- Name: authGrant authGrant_grantee_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authGrant"
    ADD CONSTRAINT "authGrant_grantee_fkey" FOREIGN KEY (grantee) REFERENCES public."authGrantee"(id) ON UPDATE CASCADE;


--
-- Name: authGrant authGrant_target_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authGrant"
    ADD CONSTRAINT "authGrant_target_fkey" FOREIGN KEY (target) REFERENCES public."authTarget"(id) ON UPDATE CASCADE;


--
-- Name: authInvite authInvite_actor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authInvite"
    ADD CONSTRAINT "authInvite_actor_fkey" FOREIGN KEY (actor) REFERENCES public.participant(id);


--
-- Name: authInvite authInvite_target_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authInvite"
    ADD CONSTRAINT "authInvite_target_fkey" FOREIGN KEY (target) REFERENCES public."authTarget"(id);


--
-- Name: authToken authToken_participant_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."authToken"
    ADD CONSTRAINT "authToken_participant_fkey" FOREIGN KEY (participant) REFERENCES public.participant(id);


--
-- Name: budgetSegmentBreakdownEntity budgetSegmentBreakdownEntity_budgetSegmentBreakdownId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."budgetSegmentBreakdownEntity"
    ADD CONSTRAINT "budgetSegmentBreakdownEntity_budgetSegmentBreakdownId_fkey" FOREIGN KEY ("budgetSegmentBreakdownId") REFERENCES public."budgetSegmentBreakdown"(id) ON DELETE CASCADE;


--
-- Name: budgetSegmentBreakdown budgetSegmentBreakdown_budgetSegmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."budgetSegmentBreakdown"
    ADD CONSTRAINT "budgetSegmentBreakdown_budgetSegmentId_fkey" FOREIGN KEY ("budgetSegmentId") REFERENCES public."budgetSegment"(id) ON DELETE CASCADE;


--
-- Name: budgetSegment budgetSegment_projectVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."budgetSegment"
    ADD CONSTRAINT "budgetSegment_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES public."projectVersion"(id) ON DELETE CASCADE;


--
-- Name: categoryLegacy categoryLegacy_group_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."categoryLegacy"
    ADD CONSTRAINT "categoryLegacy_group_fkey" FOREIGN KEY ("group") REFERENCES public."categoryGroup"(type) DEFERRABLE;


--
-- Name: categoryLegacy categoryLegacy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."categoryLegacy"
    ADD CONSTRAINT "categoryLegacy_id_fkey" FOREIGN KEY (id) REFERENCES public.category(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: categoryRef categoryRef_categoryID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."categoryRef"
    ADD CONSTRAINT "categoryRef_categoryID_fkey" FOREIGN KEY ("categoryID") REFERENCES public.category(id) ON DELETE CASCADE;


--
-- Name: category category_group_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_group_fkey FOREIGN KEY ("group") REFERENCES public."categoryGroup"(type) ON UPDATE CASCADE DEFERRABLE;


--
-- Name: category category_parentID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT "category_parentID_fkey" FOREIGN KEY ("parentID") REFERENCES public.category(id) ON UPDATE CASCADE;


--
-- Name: conditionFieldReliesOn conditionFieldReliesOn_reliedOnById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."conditionFieldReliesOn"
    ADD CONSTRAINT "conditionFieldReliesOn_reliedOnById_fkey" FOREIGN KEY ("reliedOnById") REFERENCES public."conditionField"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conditionFieldReliesOn conditionFieldReliesOn_reliesOnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."conditionFieldReliesOn"
    ADD CONSTRAINT "conditionFieldReliesOn_reliesOnId_fkey" FOREIGN KEY ("reliesOnId") REFERENCES public."conditionField"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conditionField conditionField_fieldType_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."conditionField"
    ADD CONSTRAINT "conditionField_fieldType_fkey" FOREIGN KEY ("fieldType") REFERENCES public."conditionFieldType"(type) ON UPDATE CASCADE DEFERRABLE;


--
-- Name: conditionField conditionField_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."conditionField"
    ADD CONSTRAINT "conditionField_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: disaggregationCategoryGroup disaggregationCategoryGroup_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."disaggregationCategoryGroup"
    ADD CONSTRAINT "disaggregationCategoryGroup_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON DELETE CASCADE;


--
-- Name: disaggregationCategoryGroup disaggregationCategoryGroup_unitTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."disaggregationCategoryGroup"
    ADD CONSTRAINT "disaggregationCategoryGroup_unitTypeId_fkey" FOREIGN KEY ("unitTypeId") REFERENCES public."unitType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: disaggregationCategory disaggregationCategory_disaggregationCategoryGroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."disaggregationCategory"
    ADD CONSTRAINT "disaggregationCategory_disaggregationCategoryGroupId_fkey" FOREIGN KEY ("disaggregationCategoryGroupId") REFERENCES public."disaggregationCategoryGroup"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: disaggregationModel disaggregationModel_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."disaggregationModel"
    ADD CONSTRAINT "disaggregationModel_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON DELETE CASCADE;


--
-- Name: emergencyLocation emergencyLocation_emergencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."emergencyLocation"
    ADD CONSTRAINT "emergencyLocation_emergencyId_fkey" FOREIGN KEY ("emergencyId") REFERENCES public.emergency(id) ON DELETE CASCADE;


--
-- Name: emergencyLocation emergencyLocation_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."emergencyLocation"
    ADD CONSTRAINT "emergencyLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public.location(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: endpointLog endpointLog_participantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."endpointLog"
    ADD CONSTRAINT "endpointLog_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES public.participant(id) ON DELETE CASCADE;


--
-- Name: entityPrototype entityPrototype_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."entityPrototype"
    ADD CONSTRAINT "entityPrototype_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON DELETE CASCADE;


--
-- Name: flowObject flowObject_objectType_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."flowObject"
    ADD CONSTRAINT "flowObject_objectType_fkey" FOREIGN KEY ("objectType") REFERENCES public."flowObjectType"(type) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE;


--
-- Name: formVersion formVersion_modifiedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."formVersion"
    ADD CONSTRAINT "formVersion_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES public.participant(id);


--
-- Name: formVersion formVersion_root_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."formVersion"
    ADD CONSTRAINT "formVersion_root_fkey" FOREIGN KEY (root) REFERENCES public.form(id);


--
-- Name: projectVersionComment fulfillmentComment_participantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionComment"
    ADD CONSTRAINT "fulfillmentComment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES public.participant(id);


--
-- Name: globalClusterAssociation globalClusterAssociation_globalClusterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."globalClusterAssociation"
    ADD CONSTRAINT "globalClusterAssociation_globalClusterId_fkey" FOREIGN KEY ("globalClusterId") REFERENCES public."globalCluster"(id) ON UPDATE CASCADE;


--
-- Name: globalClusterAssociation globalClusterAssociation_governingEntityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."globalClusterAssociation"
    ADD CONSTRAINT "globalClusterAssociation_governingEntityId_fkey" FOREIGN KEY ("governingEntityId") REFERENCES public."governingEntity"(id) ON UPDATE CASCADE;


--
-- Name: governingEntityVersion governingEntityVersion_governingEntityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."governingEntityVersion"
    ADD CONSTRAINT "governingEntityVersion_governingEntityId_fkey" FOREIGN KEY ("governingEntityId") REFERENCES public."governingEntity"(id);


--
-- Name: governingEntity governingEntity_entityPrototypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."governingEntity"
    ADD CONSTRAINT "governingEntity_entityPrototypeId_fkey" FOREIGN KEY ("entityPrototypeId") REFERENCES public."entityPrototype"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: governingEntity governingEntity_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."governingEntity"
    ADD CONSTRAINT "governingEntity_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON DELETE CASCADE;


--
-- Name: iatiActivity iatiActivity_iatiPublisherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiActivity"
    ADD CONSTRAINT "iatiActivity_iatiPublisherId_fkey" FOREIGN KEY ("iatiPublisherId") REFERENCES public."iatiPublisher"(id);


--
-- Name: iatiFTSMap iatiFTSMap_iatiActivityID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiFTSMap"
    ADD CONSTRAINT "iatiFTSMap_iatiActivityID_fkey" FOREIGN KEY ("iatiActivityID") REFERENCES public."iatiActivity"(id);


--
-- Name: iatiFTSMap iatiFTSMap_iatiPublisherID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiFTSMap"
    ADD CONSTRAINT "iatiFTSMap_iatiPublisherID_fkey" FOREIGN KEY ("iatiPublisherID") REFERENCES public."iatiPublisher"(id);


--
-- Name: iatiFTSMatch iatiFTSMatch_iatiFTSMapID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiFTSMatch"
    ADD CONSTRAINT "iatiFTSMatch_iatiFTSMapID_fkey" FOREIGN KEY ("iatiFTSMapID") REFERENCES public."iatiFTSMap"(id);


--
-- Name: iatiHumanitarianScope iatiHumanitarianScope_iatiActivityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiHumanitarianScope"
    ADD CONSTRAINT "iatiHumanitarianScope_iatiActivityId_fkey" FOREIGN KEY ("iatiActivityId") REFERENCES public."iatiActivity"(id);


--
-- Name: iatiParticipatingOrg iatiParticipatingOrg_iatiActivityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiParticipatingOrg"
    ADD CONSTRAINT "iatiParticipatingOrg_iatiActivityId_fkey" FOREIGN KEY ("iatiActivityId") REFERENCES public."iatiActivity"(id);


--
-- Name: iatiRecipientCountry iatiRecipientCountry_iatiActivityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiRecipientCountry"
    ADD CONSTRAINT "iatiRecipientCountry_iatiActivityId_fkey" FOREIGN KEY ("iatiActivityId") REFERENCES public."iatiActivity"(id);


--
-- Name: iatiSector iatiSector_iatiActivityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiSector"
    ADD CONSTRAINT "iatiSector_iatiActivityId_fkey" FOREIGN KEY ("iatiActivityId") REFERENCES public."iatiActivity"(id);


--
-- Name: iatiTransaction iatiTransaction_iatiActivityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiTransaction"
    ADD CONSTRAINT "iatiTransaction_iatiActivityId_fkey" FOREIGN KEY ("iatiActivityId") REFERENCES public."iatiActivity"(id);


--
-- Name: iatiTransaction iatiTransaction_iatiFTSMapId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."iatiTransaction"
    ADD CONSTRAINT "iatiTransaction_iatiFTSMapId_fkey" FOREIGN KEY ("iatiFTSMapId") REFERENCES public."iatiFTSMap"(id);


--
-- Name: jobAssociation jobAssociation_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."jobAssociation"
    ADD CONSTRAINT "jobAssociation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public.job(id);


--
-- Name: legacy legacy_objectType_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legacy
    ADD CONSTRAINT "legacy_objectType_fkey" FOREIGN KEY ("objectType") REFERENCES public."flowObjectType"(type) DEFERRABLE;


--
-- Name: location location_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT "location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.location(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: measurementVersion measurementVersion_measurementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."measurementVersion"
    ADD CONSTRAINT "measurementVersion_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES public.measurement(id) ON DELETE CASCADE;


--
-- Name: measurement measurement_attachmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.measurement
    ADD CONSTRAINT "measurement_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES public.attachment(id) ON DELETE CASCADE;


--
-- Name: measurement measurement_planReportingPeriodId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.measurement
    ADD CONSTRAINT "measurement_planReportingPeriodId_fkey" FOREIGN KEY ("planReportingPeriodId") REFERENCES public."planReportingPeriod"(id) ON DELETE CASCADE;


--
-- Name: objectExclude objectExclude_objectType_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."objectExclude"
    ADD CONSTRAINT "objectExclude_objectType_fkey" FOREIGN KEY ("objectType") REFERENCES public."flowObjectType"(type) DEFERRABLE;


--
-- Name: operationClusterVersion operationClusterVersion_modifiedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."operationClusterVersion"
    ADD CONSTRAINT "operationClusterVersion_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES public.participant(id);


--
-- Name: operationClusterVersion operationClusterVersion_root_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."operationClusterVersion"
    ADD CONSTRAINT "operationClusterVersion_root_fkey" FOREIGN KEY (root) REFERENCES public."operationCluster"(id);


--
-- Name: operationVersion operationVersion_modifiedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."operationVersion"
    ADD CONSTRAINT "operationVersion_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES public.participant(id);


--
-- Name: operationVersion operationVersion_root_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."operationVersion"
    ADD CONSTRAINT "operationVersion_root_fkey" FOREIGN KEY (root) REFERENCES public.operation(id);


--
-- Name: organizationLocation organizationLocation_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."organizationLocation"
    ADD CONSTRAINT "organizationLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public.location(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organizationLocation organizationLocation_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."organizationLocation"
    ADD CONSTRAINT "organizationLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organization(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization organization_newOrganizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization
    ADD CONSTRAINT "organization_newOrganizationId_fkey" FOREIGN KEY ("newOrganizationId") REFERENCES public.organization(id);


--
-- Name: participantCountry participantCountry_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."participantCountry"
    ADD CONSTRAINT "participantCountry_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public.location(id);


--
-- Name: participantCountry participantCountry_participantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."participantCountry"
    ADD CONSTRAINT "participantCountry_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES public.participant(id) ON DELETE CASCADE;


--
-- Name: participantOrganization participantOrganization_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."participantOrganization"
    ADD CONSTRAINT "participantOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organization(id);


--
-- Name: participantOrganization participantOrganization_participantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."participantOrganization"
    ADD CONSTRAINT "participantOrganization_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES public.participant(id) ON DELETE CASCADE;


--
-- Name: participantRole participantRole_participantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."participantRole"
    ADD CONSTRAINT "participantRole_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES public.participant(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: participantRole participantRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."participantRole"
    ADD CONSTRAINT "participantRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.role(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planEmergency planEmergency_emergencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planEmergency"
    ADD CONSTRAINT "planEmergency_emergencyId_fkey" FOREIGN KEY ("emergencyId") REFERENCES public.emergency(id) ON DELETE CASCADE;


--
-- Name: planEmergency planEmergency_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planEmergency"
    ADD CONSTRAINT "planEmergency_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planEntityVersion planEntityVersion_planEntityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planEntityVersion"
    ADD CONSTRAINT "planEntityVersion_planEntityId_fkey" FOREIGN KEY ("planEntityId") REFERENCES public."planEntity"(id);


--
-- Name: planEntity planEntity_entityPrototypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planEntity"
    ADD CONSTRAINT "planEntity_entityPrototypeId_fkey" FOREIGN KEY ("entityPrototypeId") REFERENCES public."entityPrototype"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: planEntity planEntity_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planEntity"
    ADD CONSTRAINT "planEntity_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON DELETE CASCADE;


--
-- Name: planLocation planLocation_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planLocation"
    ADD CONSTRAINT "planLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public.location(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planLocation planLocation_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planLocation"
    ADD CONSTRAINT "planLocation_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planReportingPeriod planReportingPeriod_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planReportingPeriod"
    ADD CONSTRAINT "planReportingPeriod_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON DELETE CASCADE;


--
-- Name: planTag planTag_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planTag"
    ADD CONSTRAINT "planTag_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id);


--
-- Name: planVersion planVersion_currentReportingPeriodId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planVersion"
    ADD CONSTRAINT "planVersion_currentReportingPeriodId_fkey" FOREIGN KEY ("currentReportingPeriodId") REFERENCES public."planReportingPeriod"(id);


--
-- Name: planVersion planVersion_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planVersion"
    ADD CONSTRAINT "planVersion_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id);


--
-- Name: planYear planYear_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planYear"
    ADD CONSTRAINT "planYear_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planYear planYear_usageYearId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."planYear"
    ADD CONSTRAINT "planYear_usageYearId_fkey" FOREIGN KEY ("usageYearId") REFERENCES public."usageYear"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: procedureEntityPrototype procedureEntityPrototype_entityPrototypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."procedureEntityPrototype"
    ADD CONSTRAINT "procedureEntityPrototype_entityPrototypeId_fkey" FOREIGN KEY ("entityPrototypeId") REFERENCES public."entityPrototype"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: procedureEntityPrototype procedureEntityPrototype_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."procedureEntityPrototype"
    ADD CONSTRAINT "procedureEntityPrototype_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: procedureSectionField procedureSectionField_conditionFieldId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."procedureSectionField"
    ADD CONSTRAINT "procedureSectionField_conditionFieldId_fkey" FOREIGN KEY ("conditionFieldId") REFERENCES public."conditionField"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: procedureSectionField procedureSectionField_procedureSectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."procedureSectionField"
    ADD CONSTRAINT "procedureSectionField_procedureSectionId_fkey" FOREIGN KEY ("procedureSectionId") REFERENCES public."procedureSection"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: procedureSection procedureSection_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."procedureSection"
    ADD CONSTRAINT "procedureSection_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projectVersionAttachment projectAttachment_attachmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionAttachment"
    ADD CONSTRAINT "projectAttachment_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES public.attachment(id) ON DELETE CASCADE;


--
-- Name: projectVersionAttachment projectAttachment_projectVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionAttachment"
    ADD CONSTRAINT "projectAttachment_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES public."projectVersion"(id) ON DELETE CASCADE;


--
-- Name: projectContact projectContact_participantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectContact"
    ADD CONSTRAINT "projectContact_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES public.participant(id) ON UPDATE CASCADE;


--
-- Name: projectContact projectContact_projectVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectContact"
    ADD CONSTRAINT "projectContact_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES public."projectVersion"(id) ON DELETE CASCADE;


--
-- Name: projectVersionField projectField_conditionFieldId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionField"
    ADD CONSTRAINT "projectField_conditionFieldId_fkey" FOREIGN KEY ("conditionFieldId") REFERENCES public."conditionField"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: projectGlobalClusters projectGlobalClusters_globalClusterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectGlobalClusters"
    ADD CONSTRAINT "projectGlobalClusters_globalClusterId_fkey" FOREIGN KEY ("globalClusterId") REFERENCES public."globalCluster"(id) ON DELETE CASCADE;


--
-- Name: projectGlobalClusters projectGlobalClusters_projectVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectGlobalClusters"
    ADD CONSTRAINT "projectGlobalClusters_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES public."projectVersion"(id) ON DELETE CASCADE;


--
-- Name: projectVersionGoverningEntity projectGoverningEntities_governingEntityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionGoverningEntity"
    ADD CONSTRAINT "projectGoverningEntities_governingEntityId_fkey" FOREIGN KEY ("governingEntityId") REFERENCES public."governingEntity"(id) ON DELETE CASCADE;


--
-- Name: projectVersionGoverningEntity projectGoverningEntities_projectVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionGoverningEntity"
    ADD CONSTRAINT "projectGoverningEntities_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES public."projectVersion"(id) ON DELETE CASCADE;


--
-- Name: projectLocations projectLocations_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectLocations"
    ADD CONSTRAINT "projectLocations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public.location(id) ON DELETE CASCADE;


--
-- Name: projectLocations projectLocations_projectVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectLocations"
    ADD CONSTRAINT "projectLocations_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES public."projectVersion"(id) ON DELETE CASCADE;


--
-- Name: projectVersionOrganization projectOrganizations_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionOrganization"
    ADD CONSTRAINT "projectOrganizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organization(id) ON DELETE CASCADE;


--
-- Name: projectVersionOrganization projectOrganizations_projectVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionOrganization"
    ADD CONSTRAINT "projectOrganizations_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES public."projectVersion"(id) ON DELETE CASCADE;


--
-- Name: projectVersionPlanEntity projectPlanEntities_planEntityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionPlanEntity"
    ADD CONSTRAINT "projectPlanEntities_planEntityId_fkey" FOREIGN KEY ("planEntityId") REFERENCES public."planEntity"(id) ON DELETE CASCADE;


--
-- Name: projectVersionPlanEntity projectPlanEntities_projectVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionPlanEntity"
    ADD CONSTRAINT "projectPlanEntities_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES public."projectVersion"(id) ON DELETE CASCADE;


--
-- Name: projectVersionAttachment projectVersionAttachment_attachmentVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionAttachment"
    ADD CONSTRAINT "projectVersionAttachment_attachmentVersionId_fkey" FOREIGN KEY ("attachmentVersionId") REFERENCES public."attachmentVersion"(id) ON DELETE CASCADE;


--
-- Name: projectVersionComment projectVersionComment_projectVersionPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionComment"
    ADD CONSTRAINT "projectVersionComment_projectVersionPlanId_fkey" FOREIGN KEY ("projectVersionPlanId") REFERENCES public."projectVersionPlan"(id) ON DELETE CASCADE;


--
-- Name: projectVersionField projectVersionField_projectVersionPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionField"
    ADD CONSTRAINT "projectVersionField_projectVersionPlanId_fkey" FOREIGN KEY ("projectVersionPlanId") REFERENCES public."projectVersionPlan"(id) ON DELETE CASCADE;


--
-- Name: projectVersionGoverningEntity projectVersionGoverningEntity_governingEntityVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionGoverningEntity"
    ADD CONSTRAINT "projectVersionGoverningEntity_governingEntityVersionId_fkey" FOREIGN KEY ("governingEntityVersionId") REFERENCES public."governingEntityVersion"(id) ON DELETE CASCADE;


--
-- Name: projectVersionHistory projectVersionHistory_participantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionHistory"
    ADD CONSTRAINT "projectVersionHistory_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES public.participant(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projectVersionHistory projectVersionHistory_projectVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionHistory"
    ADD CONSTRAINT "projectVersionHistory_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES public."projectVersion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projectVersionPlanEntity projectVersionPlanEntity_planEntityVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionPlanEntity"
    ADD CONSTRAINT "projectVersionPlanEntity_planEntityVersionId_fkey" FOREIGN KEY ("planEntityVersionId") REFERENCES public."planEntityVersion"(id) ON DELETE CASCADE;


--
-- Name: projectVersionPlan projectVersionPlan_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionPlan"
    ADD CONSTRAINT "projectVersionPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projectVersionPlan projectVersionPlan_projectVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionPlan"
    ADD CONSTRAINT "projectVersionPlan_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES public."projectVersion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projectVersionPlan projectVersionPlan_workflowStatusOptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersionPlan"
    ADD CONSTRAINT "projectVersionPlan_workflowStatusOptionId_fkey" FOREIGN KEY ("workflowStatusOptionId") REFERENCES public."workflowStatusOption"(id) ON DELETE CASCADE;


--
-- Name: projectVersion projectVersion_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."projectVersion"
    ADD CONSTRAINT "projectVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: project project_creatorParticipantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT "project_creatorParticipantId_fkey" FOREIGN KEY ("creatorParticipantId") REFERENCES public.participant(id);


--
-- Name: project project_currentPublishedVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT "project_currentPublishedVersionId_fkey" FOREIGN KEY ("currentPublishedVersionId") REFERENCES public."projectVersion"(id) ON DELETE CASCADE;


--
-- Name: project project_latestVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT "project_latestVersionId_fkey" FOREIGN KEY ("latestVersionId") REFERENCES public."projectVersion"(id) ON DELETE CASCADE;


--
-- Name: reportDetail reportDetail_organizationID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportDetail"
    ADD CONSTRAINT "reportDetail_organizationID_fkey" FOREIGN KEY ("organizationID") REFERENCES public.organization(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reportFile reportFile_fileAssetID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportFile"
    ADD CONSTRAINT "reportFile_fileAssetID_fkey" FOREIGN KEY ("fileAssetID") REFERENCES public."fileAssetEntity"(id) ON UPDATE CASCADE;


--
-- Name: reportFile reportFile_reportID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportFile"
    ADD CONSTRAINT "reportFile_reportID_fkey" FOREIGN KEY ("reportID") REFERENCES public."reportDetail"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reportingWindowAssignmentVersion reportingWindowAssignmentVersion_modifiedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportingWindowAssignmentVersion"
    ADD CONSTRAINT "reportingWindowAssignmentVersion_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES public.participant(id);


--
-- Name: reportingWindowAssignmentVersion reportingWindowAssignmentVersion_root_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportingWindowAssignmentVersion"
    ADD CONSTRAINT "reportingWindowAssignmentVersion_root_fkey" FOREIGN KEY (root) REFERENCES public."reportingWindowAssignment"(id);


--
-- Name: reportingWindowVersion reportingWindowVersion_modifiedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportingWindowVersion"
    ADD CONSTRAINT "reportingWindowVersion_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES public.participant(id);


--
-- Name: reportingWindowVersion reportingWindowVersion_root_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."reportingWindowVersion"
    ADD CONSTRAINT "reportingWindowVersion_root_fkey" FOREIGN KEY (root) REFERENCES public."reportingWindow"(id);


--
-- Name: roleAuthenticationKey roleAuthenticationKey_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."roleAuthenticationKey"
    ADD CONSTRAINT "roleAuthenticationKey_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.role(id);


--
-- Name: rolePermittedAction rolePermittedAction_permittedActionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."rolePermittedAction"
    ADD CONSTRAINT "rolePermittedAction_permittedActionId_fkey" FOREIGN KEY ("permittedActionId") REFERENCES public."permittedAction"(id);


--
-- Name: rolePermittedAction rolePermittedAction_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."rolePermittedAction"
    ADD CONSTRAINT "rolePermittedAction_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.role(id);


--
-- Name: task task_requester_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_requester_fkey FOREIGN KEY (requester) REFERENCES public.participant(id);


--
-- Name: unit unit_unitTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unit
    ADD CONSTRAINT "unit_unitTypeId_fkey" FOREIGN KEY ("unitTypeId") REFERENCES public."unitType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workflowRole workflowRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."workflowRole"
    ADD CONSTRAINT "workflowRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.role(id) ON UPDATE CASCADE;


--
-- Name: workflowStatusOptionStep workflowStatusOptionStep_fromId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."workflowStatusOptionStep"
    ADD CONSTRAINT "workflowStatusOptionStep_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES public."workflowStatusOption"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workflowStatusOptionStep workflowStatusOptionStep_toId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."workflowStatusOptionStep"
    ADD CONSTRAINT "workflowStatusOptionStep_toId_fkey" FOREIGN KEY ("toId") REFERENCES public."workflowStatusOption"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workflowStatusOption workflowStatusOption_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."workflowStatusOption"
    ADD CONSTRAINT "workflowStatusOption_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plan(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--
