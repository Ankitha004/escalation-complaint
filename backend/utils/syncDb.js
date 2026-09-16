const mongoose = require('mongoose');

/**
 * Synchronize all collections between source and target database.
 * If direction is 'online-to-local': copies from Atlas to Local MongoDB.
 * If direction is 'local-to-online': copies from Local MongoDB to Atlas.
 */
async function syncDatabases(sourceUri, targetUri) {
  let sourceConn = null;
  let targetConn = null;
  try {
    sourceConn = await mongoose.createConnection(sourceUri, { serverSelectionTimeoutMS: 8000 }).asPromise();
    targetConn = await mongoose.createConnection(targetUri, { serverSelectionTimeoutMS: 8000 }).asPromise();

    const collections = await sourceConn.db.listCollections().toArray();
    for (const collInfo of collections) {
      const name = collInfo.name;
      if (name.startsWith('system.')) continue;

      const docs = await sourceConn.db.collection(name).find({}).toArray();
      if (docs.length > 0) {
        // Replace target collection data with latest source data to keep them in sync
        await targetConn.db.collection(name).deleteMany({});
        await targetConn.db.collection(name).insertMany(docs);
      }
    }
    return true;
  } catch (err) {
    console.warn(`[DataSync] Sync notice: ${err.message}`);
    return false;
  } finally {
    if (sourceConn) await sourceConn.close().catch(() => {});
    if (targetConn) await targetConn.close().catch(() => {});
  }
}

module.exports = { syncDatabases };
