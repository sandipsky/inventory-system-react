import { LUIIcon } from '../../../ui/icon/icon';
import { LUIMenu } from '../../../ui/menu/menu';

interface HeaderNotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
}

/* No API behind this yet — notifications arrive over websockets later. */
const notifications: HeaderNotificationItem[] = [];

export function HeaderNotification() {
  return (
    <div className="header-notification">
      <LUIMenu
        mode="right"
        contentMode
        closeOnItemClick={false}
        dropdownDisplay={
          <button type="button" className="header-icon-button" aria-label="Notifications">
            <LUIIcon name="notification" size={18} />
          </button>
        }
      >
        <div className="header-notification-panel">
          <div className="header-notification-title">Notifications</div>

          {notifications.length === 0 ? (
            <div className="header-notification-empty">No notifications yet</div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="header-notification-item">
                <span className="header-notification-item-title">{notification.title}</span>
                <span className="header-notification-item-message">{notification.message}</span>
                <span className="header-notification-item-time">{notification.time}</span>
              </div>
            ))
          )}
        </div>
      </LUIMenu>
    </div>
  );
}
