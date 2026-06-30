package whatsapp

import (
	"context"
	"fmt"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
)

type Client struct {
	WaCli     *whatsmeow.Client
	device    *store.Device
	eventChan chan interface{}
	dbDir     string
	log       waLog.Logger
}

func NewClient(dbDir string) *Client {
	return &Client{
		dbDir:     dbDir,
		eventChan: make(chan interface{}, 256),
		log:       waLog.Stdout("PewPaw", "DEBUG", true),
	}
}

func (c *Client) Init(ctx context.Context) error {
	dbPath := fmt.Sprintf("file:%s/katana.db?_journal_mode=WAL&_foreign_keys=on", c.dbDir)

	container, err := sqlstore.New(ctx, "sqlite3", dbPath, c.log)
	if err != nil {
		return fmt.Errorf("create sqlstore: %w", err)
	}

	device, err := container.GetFirstDevice(ctx)
	if err != nil {
		return fmt.Errorf("get device: %w", err)
	}
	c.device = device

	c.WaCli = whatsmeow.NewClient(c.device, c.log)
	c.WaCli.AddEventHandler(c.eventHandler)

	return nil
}

func (c *Client) Connect(ctx context.Context) error {
	if c.WaCli.IsConnected() {
		return nil
	}
	return c.WaCli.Connect()
}

func (c *Client) Disconnect() {
	c.WaCli.Disconnect()
}

func (c *Client) EventChan() <-chan interface{} {
	return c.eventChan
}

func (c *Client) eventHandler(evt interface{}) {
	select {
	case c.eventChan <- evt:
	default:
	}
}

func (c *Client) HasDevice() bool {
	return c.WaCli != nil && c.WaCli.Store != nil && c.WaCli.Store.ID != nil
}

func (c *Client) IsLoggedIn() bool {
	return c.WaCli != nil && c.WaCli.IsLoggedIn()
}

func (c *Client) GetQRChannel(ctx context.Context) (<-chan whatsmeow.QRChannelItem, error) {
	return c.WaCli.GetQRChannel(ctx)
}

func (c *Client) Logout(ctx context.Context) error {
	return c.WaCli.Logout(ctx)
}
