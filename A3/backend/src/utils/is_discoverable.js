const { isEffectivelyAvailable } = require("./availability.js");

function hasApprovedQualification(user, positionTypeId) {
  return user.qualifications?.some((qualification) => {
    if (qualification.status !== "approved") {
      return false;
    }

    if (positionTypeId === undefined || positionTypeId === null) {
      return true;
    }

    return qualification.positionTypeId === positionTypeId;
  });
}

function hasConflictingCommitment(user, jobStartTime, jobEndTime) {
  if (!Array.isArray(user.filledJobs) || user.filledJobs.length === 0) {
    return false;
  }

  if (!jobStartTime || !jobEndTime) {
    return user.filledJobs.length > 0;
  }

  const targetStart = new Date(jobStartTime).getTime();
  const targetEnd = new Date(jobEndTime).getTime();

  return user.filledJobs.some((job) => {
    const start = new Date(job.startTime).getTime();
    const end = new Date(job.endTime).getTime();

    return start <= targetEnd && end >= targetStart;
  });
}

function isDiscoverable(user, now, availabilityTimeoutMs, options = {}) {
  const {
    positionTypeId,
    jobStartTime,
    jobEndTime,
  } = options;

  return (
    user.activated &&
    !user.suspended &&
    isEffectivelyAvailable(user, now, availabilityTimeoutMs) &&
    hasApprovedQualification(user, positionTypeId) &&
    !hasConflictingCommitment(user, jobStartTime, jobEndTime)
  );
}

module.exports = {
  hasApprovedQualification,
  hasConflictingCommitment,
  isDiscoverable,
};
