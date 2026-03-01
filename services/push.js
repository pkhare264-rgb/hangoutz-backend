import admin from 'firebase-admin';

/**
 * Send a push notification to a single device
 */
export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    if (!fcmToken) {
        console.warn('⚠️  No FCM token provided, skipping push notification');
        return null;
    }

    try {
        const message = {
            token: fcmToken,
            notification: { title, body },
            data: Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
            ),
            android: {
                priority: 'high',
                notification: {
                    channelId: 'hangoutz_default',
                    sound: 'default',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK'
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1
                    }
                }
            }
        };

        const response = await admin.messaging().send(message);
        console.log('✅ Push notification sent:', response);
        return response;
    } catch (error) {
        console.error('❌ Push notification failed:', error.message);
        // If token is invalid, return special code so caller can clean up
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            return { error: 'INVALID_TOKEN' };
        }
        return null;
    }
};

/**
 * Send push notification to multiple devices
 */
export const sendToMultiple = async (fcmTokens, title, body, data = {}) => {
    const validTokens = fcmTokens.filter(Boolean);
    if (validTokens.length === 0) return null;

    try {
        const message = {
            tokens: validTokens,
            notification: { title, body },
            data: Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
            )
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`✅ Push sent to ${response.successCount}/${validTokens.length} devices`);
        return response;
    } catch (error) {
        console.error('❌ Multicast push failed:', error.message);
        return null;
    }
};

/**
 * Send event reminder notification
 */
export const sendEventReminder = async (fcmToken, eventTitle, eventId) => {
    return sendPushNotification(
        fcmToken,
        '⏰ Event Reminder',
        `"${eventTitle}" is starting soon!`,
        { type: 'event_reminder', eventId }
    );
};

/**
 * Send join confirmation notification
 */
export const sendJoinConfirmation = async (fcmToken, eventTitle, eventId) => {
    return sendPushNotification(
        fcmToken,
        '🎉 You\'re In!',
        `You joined "${eventTitle}"`,
        { type: 'join_confirmation', eventId }
    );
};

/**
 * Send chat alert notification
 */
export const sendChatAlert = async (fcmToken, senderName, eventTitle, eventId) => {
    return sendPushNotification(
        fcmToken,
        `💬 ${senderName}`,
        `New message in "${eventTitle}"`,
        { type: 'chat_alert', eventId }
    );
};

/**
 * Send event update notification
 */
export const sendEventUpdate = async (fcmToken, eventTitle, eventId, updateType) => {
    const messages = {
        cancelled: `"${eventTitle}" has been cancelled`,
        updated: `"${eventTitle}" has been updated`,
        starting: `"${eventTitle}" is starting now!`
    };

    return sendPushNotification(
        fcmToken,
        '📢 Event Update',
        messages[updateType] || `Update for "${eventTitle}"`,
        { type: 'event_update', eventId, updateType }
    );
};

/**
 * Send subscription expiry reminder
 */
export const sendSubscriptionExpiry = async (fcmToken, daysLeft) => {
    return sendPushNotification(
        fcmToken,
        '⭐ Pro Expiring Soon',
        `Your Hangoutz Pro subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
        { type: 'subscription_expiry', daysLeft: String(daysLeft) }
    );
};
