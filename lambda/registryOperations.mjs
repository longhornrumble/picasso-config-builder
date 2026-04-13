/**
 * Tenant Registry Operations Module
 * DynamoDB operations for seeding and updating tenant registry records.
 * Config builder's role is minimal: seed on create, timestamp on save, status on delete.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.TENANT_REGISTRY_TABLE || `picasso-tenant-registry-${process.env.ENVIRONMENT || 'staging'}`;

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Write a full tenant record (used at tenant creation)
 * @param {Object} record - Tenant record with all fields
 */
export async function putTenantRecord(record) {
  const item = {
    tenantId: record.tenantId,
    tenantHash: record.tenantHash,
    companyName: record.companyName,
    s3ConfigPath: record.s3ConfigPath,
    subscriptionTier: record.subscriptionTier || 'free',
    status: record.status || 'active',
    onboardedAt: record.onboardedAt || new Date().toISOString(),
    updatedAt: record.updatedAt || new Date().toISOString(),
    // Portal super admin populates these later:
    networkId: record.networkId ?? null,
    networkName: record.networkName ?? null,
  };

  // GSI key attributes — omit when empty (DynamoDB rejects empty string GSI keys;
  // omitting means the item won't appear in that GSI until linked later)
  if (record.clerkOrgId) item.clerkOrgId = record.clerkOrgId;
  if (record.stripeCustomerId) item.stripeCustomerId = record.stripeCustomerId;

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));

  return item;
}

/**
 * Get a tenant record by ID (existence check)
 * @param {string} tenantId
 * @returns {Object|null}
 */
export async function getTenantById(tenantId) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { tenantId },
  }));
  return result.Item || null;
}

/**
 * Update the updatedAt timestamp (called on config save)
 * @param {string} tenantId
 */
export async function updateTenantTimestamp(tenantId) {
  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { tenantId },
    UpdateExpression: 'SET updatedAt = :now',
    ExpressionAttributeValues: {
      ':now': new Date().toISOString(),
    },
  }));
}

/**
 * Update tenant status (called on delete — soft or hard)
 * @param {string} tenantId
 * @param {string} status - 'active' | 'suspended' | 'churned'
 * @param {Object} [additionalUpdates] - Optional extra fields to update (e.g., nulling s3ConfigPath on hard delete)
 */
export async function updateTenantStatus(tenantId, status, additionalUpdates = {}) {
  let updateExpression = 'SET #status = :status, updatedAt = :now';
  const expressionAttributeNames = { '#status': 'status' };
  const expressionAttributeValues = {
    ':status': status,
    ':now': new Date().toISOString(),
  };

  // Support nulling s3ConfigPath on hard delete
  if ('s3ConfigPath' in additionalUpdates) {
    updateExpression += ', s3ConfigPath = :configPath';
    expressionAttributeValues[':configPath'] = additionalUpdates.s3ConfigPath;
  }

  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { tenantId },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  }));
}
