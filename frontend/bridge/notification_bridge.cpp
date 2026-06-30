#include "notification_bridge.h"
#include <QVariantMap>

NotificationBridge::NotificationBridge(QObject *parent)
    : QObject(parent)
    , m_iface(nullptr)
{
    m_iface = new QDBusInterface(
        "org.freedesktop.Notifications",
        "/org/freedesktop/Notifications",
        "org.freedesktop.Notifications",
        QDBusConnection::sessionBus(), this);

    if (!m_iface->isValid())
        qWarning() << "[NotificationBridge] D-Bus notifications unavailable";
}

void NotificationBridge::showNotification(const QString &title, const QString &body)
{
    if (!m_iface || !m_iface->isValid())
        return;

    QVariantMap hints;
    m_iface->call("Notify",
                  "PewPaw",           // app_name
                  (uint)0,            // replaces_id
                  "pewpaw",           // app_icon
                  title,              // summary
                  body,               // body
                  QStringList(),      // actions
                  hints,              // hints
                  (int)-1);           // expire_timeout
}

void NotificationBridge::showMention(const QString &senderJid)
{
    showNotification("PewPaw Mention",
                     QString("You were mentioned by %1").arg(senderJid));
}
