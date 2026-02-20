/**
 * Envoi de notifications push via Firebase Cloud Messaging
 */
const { getAdmin } = require('./firebaseAdmin');

/**
 * Envoyer une notification push à un ou plusieurs tokens
 * @param {string[]} tokens - Tokens FCM
 * @param {object} notification - { title, body }
 * @param {object} data - Données additionnelles (optionnel)
 */
async function sendPushNotification(tokens, { title, body }, data = {}) {
  const a = getAdmin();
  if (!a || !tokens || tokens.length === 0) return { success: 0, failed: 0 };

  const message = {
    notification: { title, body },
    data: { ...data },
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  };

  const results = await Promise.allSettled(
    tokens.map((token) =>
      a.messaging().send({ ...message, token })
    )
  );

  const success = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { success, failed };
}

module.exports = { sendPushNotification, getAdmin };
