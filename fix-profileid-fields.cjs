const admin = require('firebase-admin');
const serviceAccount = require('./iep-desk-2026-firebase-adminsdk-fbsvc-8061c7e663.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixProfileIdFields() {
  try {
    console.log('Starting to fix profileId fields in meetingPreps collection...');
    
    // Get all documents in meetingPreps collection
    const snapshot = await db.collection('meetingPreps').get();
    
    if (snapshot.empty) {
      console.log('No documents found in meetingPreps collection');
      return;
    }
    
    console.log(`Found ${snapshot.size} documents to check`);
    
    const batch = db.batch();
    let fixedCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const docRef = db.collection('meetingPreps').doc(doc.id);
      
      // Check if the document has the problematic field with trailing space
      if (data.hasOwnProperty('profileId ')) {
        console.log(`Fixing document ${doc.id}`);
        
        // Create new data object with correct field name
        const newData = { ...data };
        newData.profileId = newData['profileId '];
        delete newData['profileId '];
        
        // Update the document
        batch.update(docRef, newData);
        fixedCount++;
      }
    });
    
    if (fixedCount > 0) {
      await batch.commit();
      console.log(`Successfully fixed ${fixedCount} documents`);
    } else {
      console.log('No documents needed fixing');
    }
    
  } catch (error) {
    console.error('Error fixing profileId fields:', error);
  } finally {
    process.exit(0);
  }
}

fixProfileIdFields();
