// MongoDB initialization script
// Creates indexes for the CMS collections

db = db.getSiblingDB("smilelink_cms");

// Content collection indexes
db.content.createIndex({ contentId: 1 }, { unique: true });
db.content.createIndex({ type: 1, status: 1 });
db.content.createIndex({ status: 1, updatedAt: -1 });
db.content.createIndex({ "variants.en.factCheckStatus": 1 });
db.content.createIndex({ "variants.nl.factCheckStatus": 1 });

// Source documents collection indexes
db.sourceDocuments.createIndex({ path: 1 }, { unique: true });
db.sourceDocuments.createIndex({ fileHash: 1 });
db.sourceDocuments.createIndex({ documentType: 1 });

// Fact check records collection indexes
db.factCheckRecords.createIndex({ contentId: 1, createdAt: -1 });
db.factCheckRecords.createIndex({ overallVerdict: 1 });
db.factCheckRecords.createIndex({ humanReviewed: 1 });

// Generation jobs collection indexes
db.generationJobs.createIndex({ status: 1, createdAt: -1 });
db.generationJobs.createIndex({ contentId: 1 });
db.generationJobs.createIndex({ createdBy: 1, createdAt: -1 });

// Content usage collection indexes
db.contentUsage.createIndex({ contentId: 1, createdAt: -1 });
db.contentUsage.createIndex({ sessionId: 1 });
db.contentUsage.createIndex({ createdAt: -1 });

print("MongoDB indexes created successfully for smilelink_cms database");
