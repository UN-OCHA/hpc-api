const config = {
    isDevServer: process.env.NODE_ENV === 'dockerdev',
    httpPort: process.env.PORT,
    storageProviders: {
      aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
        s3: {
          endpoint: process.env.AWS_S3_ENDPOINT,
          port: process.env.AWS_S3_PORT
            ? parseInt(process.env.AWS_S3_PORT)
            : undefined,
          bucket: process.env.AWS_S3_BUCKET,
        },
      },
      local: {
        uploadDirectory: process.env.UPLOAD_DIRECTORY || 'media',
      }
    },
    mediaURI: process.env.MEDIA_PATH || 'media',
    uploadTo: 'aws',
    code: {
      gitCommitSha: process.env.HPC_ACTIONS_COMMIT_SHA,
      gitTreeSha: process.env.HPC_ACTIONS_TREE_SHA,
    },
    name: process.env.NODE_ENV,
    appBaseUrl: process.env.APPBASE_URL,
    authBaseUrl: process.env.AUTHBASE_URL,
    authClientId: process.env.AUTHCLIENTID,
    authClientSecret: process.env.AUTHCLIENTSECRET,
    dataConsistencyCheckRecipientEmailAddress:
      process.env.FTS_DATA_CONSISTENCY_EMAIL,
    db: {
      server: process.env.POSTGRES_SERVER,
      name: process.env.POSTGRES_NAME,
      logging: !!parseInt(process.env.POSTGRES_LOGGING || ''),
    },
    logging: {
      mode: process.env.LOG_MODE,
      color:
        process.env.LOG_COLOR === undefined
          ? undefined
          : process.env.LOG_COLOR === 'true',
    },
    /**
     * Use logging instead
     *
     * @deprecated
     */
    debug: parseInt(process.env.DEBUG || '') || 0,
    docsDirectory: process.env.DOCS_DIRECTORY || './data/hpc/www/docs',
    docsURL: process.env.DOCS_URL || 'http://service.hpc.vm/docs/v1',
    edrisDirectory: process.env.EDRIS_DIRECTORY,
    edrisArchiveDirectory: process.env.EDRIS_ARCHIVE_DIRECTORY,
    endpointTrace: !!parseInt(process.env.ENDPOINT_TRACE || ''),
    endpointUsage: !!parseInt(process.env.ENDPOINT_USAGE || ''),
    fileHrefPrefix: process.env.FILEHREF_PREFIX,
    ftsBaseUrl: process.env.FTSBASE_URL,
    ftsNoReplyEmail: process.env.NO_REPLY_EMAIL,
    hidAdminKey: process.env.HID_ADMIN_KEY,
    hidApiUrl: process.env.HID_API_URL,
    hrinfoBaseUrl: process.env.HRINFOBASE_URL,
    iatiDirectory: process.env.IATI_DIRECTORY,
    projectBaseUrl: process.env.PROJECTBASE_URL,
    rootURL: process.env.ROOT_URL,
    requireSSL: !!parseInt(process.env.REQUIRE_SSL || ''),
    reportDocsDirectory: process.env.REPORT_DOCS_DIRECTORY,
    smtpPort: parseInt(process.env.SMTPPORT || ''),
    smtpUser: process.env.SMTPUSER || '',
    smtpPass: process.env.SMTPPASS || '',
    smtpHost: process.env.SMTPHOST || 'localhost',
    smtpTls: process.env.SMTPTLS === 'true',
    snap: {
      url: process.env.SNAP_URL,
      serviceName: process.env.SNAP_SERVICE_PARAM || 'hpc_api',
    },
    solr: {
      host: process.env.SOLR_HOST,
      port: parseInt(process.env.SOLR_PORT || '') || 8983,
      core: process.env.SOLR_CORE,
      path: process.env.SOLR_PATH || '/solr',
      solrVersion: process.env.SOLR_VERSION,
    },
    test: {
      participantEmail: process.env.HPCTEST_PARTICIPANT_EMAIL,
      participantPassword: process.env.HPCTEST_PARTICIPANT_PASS,
    },
    testURL: process.env.TEST_URL,
    tmpDirectory: process.env.TMP_DIRECTORY,
  };
  
  export = config;
  