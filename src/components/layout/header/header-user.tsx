import { useAuthStore, useUserRoleOperations } from '@/features/auth';
import { useAuthImage } from '@/services/image.service';
import { LUIAvatar } from '../../ui/avatar/avatar';
import { LUIIcon } from '../../ui/icon/icon';
import { LUIMenu } from '../../ui/menu/menu';

export function HeaderUser() {
  const { data: profile } = useUserRoleOperations();
  const { data: avatarImage } = useAuthImage(profile?.image_url);
  const logout = useAuthStore((s) => s.logout);

  if (!profile) return null;

  const displayName = profile.name || profile.username;

  return (
    <div className="header-user">
      <LUIMenu
        mode="right"
        dropdownDisplay={
          <button type="button" className="header-user-trigger">
            <LUIAvatar imageUrl={avatarImage?.url} name={displayName} size="26px" />
            <span className="header-user-name">{displayName}</span>
            <LUIIcon name="caret-down" size={14} />
          </button>
        }
      >
        <div className="dropdown-item" onClick={logout}>
          <LUIIcon name="logout" size={16} />
          Logout
        </div>
      </LUIMenu>
    </div>
  );
}
