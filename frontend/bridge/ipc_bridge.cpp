#include "ipc_bridge.h"
#include <QJsonParseError>
#include <QDebug>

IpcBridge::IpcBridge(QObject *parent)
    : QObject(parent)
    , m_socket(new QLocalSocket(this))
{
    connect(m_socket, &QLocalSocket::connected, this, &IpcBridge::onConnected);
    connect(m_socket, &QLocalSocket::disconnected, this, &IpcBridge::onDisconnected);
    connect(m_socket, &QLocalSocket::readyRead, this, &IpcBridge::onReadyRead);
    connect(m_socket, &QLocalSocket::errorOccurred, this, &IpcBridge::onError);
}

IpcBridge::~IpcBridge()
{
    if (m_socket->state() != QLocalSocket::UnconnectedState)
        m_socket->disconnectFromServer();
}

void IpcBridge::connectToBackend()
{
    if (m_socket->state() == QLocalSocket::ConnectedState)
        return;
    m_socket->connectToServer(SOCKET_PATH);
}

bool IpcBridge::isConnected() const
{
    return m_socket->state() == QLocalSocket::ConnectedState;
}

void IpcBridge::sendCommand(const QString &type, const QJsonObject &payload)
{
    QJsonObject cmd;
    cmd["type"] = type;
    if (!payload.isEmpty())
        cmd["payload"] = payload;

    QByteArray data = QJsonDocument(cmd).toJson(QJsonDocument::Compact) + "\n";
    m_socket->write(data);
    m_socket->flush();
}

void IpcBridge::onConnected()
{
    qDebug() << "[IpcBridge] Connected to backend";
    emit connected();
}

void IpcBridge::onDisconnected()
{
    qDebug() << "[IpcBridge] Disconnected from backend";
    emit disconnected();
}

void IpcBridge::onReadyRead()
{
    m_buffer.append(m_socket->readAll());
    while (m_buffer.contains('\n')) {
        int idx = m_buffer.indexOf('\n');
        QByteArray line = m_buffer.left(idx);
        m_buffer.remove(0, idx + 1);
        processLine(line);
    }
}

void IpcBridge::onError(QLocalSocket::LocalSocketError error)
{
    Q_UNUSED(error)
    qWarning() << "[IpcBridge] Socket error:" << m_socket->errorString();
}

void IpcBridge::processLine(const QByteArray &line)
{
    QJsonParseError err;
    QJsonDocument doc = QJsonDocument::fromJson(line, &err);
    if (err.error != QJsonParseError::NoError || !doc.isObject()) {
        qWarning() << "[IpcBridge] Invalid JSON:" << line;
        return;
    }
    emit eventReceived(doc.object());
}
