const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Resets a user's password to a new temporary password.
 * This function should only be called by an authenticated administrator.
 * @param {object} data - The data sent to the function.
 * @param {string} data.userId - The UID of the user whose password needs to be reset.
 * @param {string} data.newPassword - The new temporary password for the user.
 * @param {object} context - The context of the function call.
 * @returns {object} - A result object indicating success or failure.
 */
exports.resetUserPasswordAdmin = functions.https.onCall(async (data, context) => {
  // 1. Check if the caller is authenticated and is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const callerUid = context.auth.uid;
  try {
    const callerUserRecord = await admin.auth().getUser(callerUid);
    if (!callerUserRecord.customClaims || !callerUserRecord.customClaims.admin) {
      // You might want to check a specific role, e.g., 'admin' or 'super_admin'
      const userDoc = await admin.firestore().collection('users').doc(callerUid).get();
      if (!userDoc.exists || userDoc.data().role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only administrators can perform this action.');
      }
    }
  } catch (error) {
    console.error('Admin permission check failed:', error);
    throw new functions.https.HttpsError('permission-denied', 'Admin permission check failed.', error.message);
  }

  // 2. Validate input data
  const { userId, newPassword } = data;

  if (!userId || typeof userId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'The userId is required and must be a string.');
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'The newPassword is required and must be a string of at least 6 characters.');
  }

  try {
    // 3. Update the user's password using Firebase Admin SDK
    await admin.auth().updateUser(userId, {
      password: newPassword,
    });

    // 4. Optionally, update Firestore to mark password reset required for next login
    // This part is already handled on the client side, but can be duplicated here for robustness
    // or removed from client if this function becomes the single source of truth.
    await admin.firestore().collection('users').doc(userId).update({
      passwordResetRequired: true,
      passwordResetAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5. Log the action in userHistory (can be moved here from client for consistency)
    await admin.firestore().collection('userHistory').add({
      userId,
      action: 'password_reset',
      reason: data.reason || 'Admin initiated password reset.',
      adminId: callerUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`User ${userId} password reset by admin ${callerUid}.`);

    return { success: true, message: 'User password reset successfully.' };
  } catch (error) {
    console.error('Error resetting user password:', error);
    // Re-throw as an HttpsError for client-side handling
    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError('not-found', 'User not found.', error.message);
    } else if (error.code === 'auth/invalid-password') {
      throw new functions.https.HttpsError('invalid-argument', 'The new password is too weak or invalid.', error.message);
    } else {
      throw new functions.https.HttpsError('internal', 'Failed to reset user password.', error.message);
    }
  }
});
