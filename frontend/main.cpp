#include <QApplication>
#include <QWebEngineView>
#include <QWebChannel>
#include <QWebEnginePage>
#include <QMainWindow>
#include <QVBoxLayout>
#include <QDir>

#include "bridge/ipc_bridge.h"
#include "bridge/notification_bridge.h"

int main(int argc, char *argv[])
{
    qputenv("QTWEBENGINE_CHROMIUM_FLAGS", "--disable-gpu --disable-software-rasterizer=0");
    qputenv("QSG_RHI_BACKEND", "software");

    QApplication app(argc, argv);
    app.setApplicationName("PewPaw");
    app.setApplicationVersion("0.1.0");

    IpcBridge ipc;
    NotificationBridge notifications;

    QWebChannel channel;
    channel.registerObject("ipc", &ipc);
    channel.registerObject("notifications", &notifications);

    QWebEngineView *web = new QWebEngineView();
    web->page()->setWebChannel(&channel);
    web->setContextMenuPolicy(Qt::NoContextMenu);
    web->setWindowTitle("PewPaw");
    web->resize(900, 600);
    web->setMinimumSize(600, 400);

    QUrl url = QUrl("qrc:/index.html");
    web->load(url);
    web->show();

    ipc.connectToBackend();

    return app.exec();
}
