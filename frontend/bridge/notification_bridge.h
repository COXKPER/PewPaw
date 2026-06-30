#ifndef PEWPAW_NOTIFICATION_BRIDGE_H
#define PEWPAW_NOTIFICATION_BRIDGE_H

#include <QObject>
#include <QDBusInterface>

class NotificationBridge : public QObject
{
    Q_OBJECT

public:
    explicit NotificationBridge(QObject *parent = nullptr);

    Q_INVOKABLE void showNotification(const QString &title, const QString &body);
    Q_INVOKABLE void showMention(const QString &senderJid);

private:
    QDBusInterface *m_iface;
};

#endif
