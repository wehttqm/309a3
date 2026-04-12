import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  deriveUserAvatarStatus,
  formatAvatarStatusLabel,
  getResolvedAvatarSrc,
  getUserInitials,
} from "@/lib/user-status"

export function UserAvatar({
  user,
  status,
  className,
  fallbackClassName,
  imageClassName,
  title,
  showStatus = true,
}) {
  const resolvedStatus = status || deriveUserAvatarStatus(user)
  const resolvedTitle = title || formatAvatarStatusLabel(resolvedStatus)

  return (
    <Avatar
      className={className}
      status={resolvedStatus}
      showStatus={showStatus}
      title={resolvedTitle}
      aria-label={resolvedTitle}
    >
      <AvatarImage src={getResolvedAvatarSrc(user) || undefined} className={imageClassName} />
      <AvatarFallback className={fallbackClassName}>{getUserInitials(user)}</AvatarFallback>
    </Avatar>
  )
}
