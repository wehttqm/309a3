function isDiscoverable(user, now, availabilityTimeoutMs) {
  const cutoff = new Date(now.getTime() - availabilityTimeoutMs);

  const hasApprovedQualification = user.qualifications?.some(
    (q) => q.status === "approved",
  );

  const hasConflictingCommitment = user.filledJobs?.length > 0;

  return (
    user.activated &&
    !user.suspended &&
    user.available &&
    user.lastActive >= cutoff &&
    hasApprovedQualification &&
    !hasConflictingCommitment
  );
}

module.exports = { isDiscoverable };
