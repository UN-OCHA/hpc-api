export const CONFIG = {
  commitSha: process.env.HPC_ACTIONS_COMMIT_SHA,
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
      uploadDirectory: process.env.UPLOAD_DIRECTORY ?? 'media',
    },
  },
  mediaURI: process.env.MEDIA_PATH ?? 'media',
  uploadTo: 'aws',
  name: process.env.NODE_ENV,
  authBaseUrl: process.env.AUTHBASE_URL,
  db: {
    batchLimit: 32_768, // 2^15,
    connection: process.env.POSTGRES_SERVER,
    logging: !!parseInt(process.env.POSTGRES_LOGGING ?? ''),
    poolMin: 2,
    poolMax: 10,
    poolIdle: 10_000,
  },
  logging: {
    mode: process.env.LOG_MODE ?? 'live',
    path: process.env.LOG_PATH ?? '/var/log/api/api.log',
    color:
      process.env.LOG_COLOR === undefined
        ? undefined
        : process.env.LOG_COLOR === 'true',
  },
  rootURL: process.env.ROOT_URL,
};
