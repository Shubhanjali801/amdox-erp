jest.mock('@aws-sdk/client-s3', () => ({ S3Client: jest.fn(), PutObjectCommand: jest.fn(), GetObjectCommand: jest.fn() }));
jest.mock('@aws-sdk/client-ses', () => ({ SESClient: jest.fn(), SendEmailCommand: jest.fn() }));
