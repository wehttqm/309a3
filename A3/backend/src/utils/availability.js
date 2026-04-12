function getAvailabilityTimeoutMs(setting) {
  const seconds = Number(setting?.value ?? 0);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0;
}

function getAvailabilityCutoff(now, availabilityTimeoutMs) {
  return new Date(now.getTime() - Math.max(0, availabilityTimeoutMs));
}

function isEffectivelyAvailable(user, now, availabilityTimeoutMs) {
  if (!user?.available) {
    return false;
  }

  if (!(user.lastActive instanceof Date)) {
    return false;
  }

  const cutoff = getAvailabilityCutoff(now, availabilityTimeoutMs);
  return user.lastActive >= cutoff;
}

function deriveAvailabilityState({
  user,
  now,
  availabilityTimeoutMs,
  approvedQualifications = 0,
}) {
  if (user?.suspended) {
    return {
      effectiveAvailable: false,
      availabilityState: "suspended",
      message:
        "Your account is suspended. You can still review activity, but you cannot be matched right now.",
    };
  }

  const effectiveAvailable = isEffectivelyAvailable(
    user,
    now,
    availabilityTimeoutMs,
  );

  if (effectiveAvailable) {
    return {
      effectiveAvailable: true,
      availabilityState: "available",
      message:
        "You are available. Businesses can discover you for qualified jobs when there is no scheduling conflict.",
    };
  }

  if (user?.available) {
    return {
      effectiveAvailable: false,
      availabilityState: "inactive",
      message:
        "Your availability timed out because of inactivity. Turn it back on to appear in matching again.",
    };
  }

  if (approvedQualifications <= 0) {
    return {
      effectiveAvailable: false,
      availabilityState: "unavailable",
      message:
        "You need at least one approved qualification before you can turn availability on.",
    };
  }

  return {
    effectiveAvailable: false,
    availabilityState: "unavailable",
    message:
      "Your availability is currently off. Turn it on when you want to be discoverable for matching.",
  };
}

module.exports = {
  deriveAvailabilityState,
  getAvailabilityCutoff,
  getAvailabilityTimeoutMs,
  isEffectivelyAvailable,
};
