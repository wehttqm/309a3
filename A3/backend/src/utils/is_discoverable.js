const { isEffectivelyAvailable } = require("./availability.js");

function getDiscoverabilityIssues(user, now, availabilityTimeoutMs, options = {}) {
  const { positionTypeId, jobStartTime, jobEndTime } = options;
  const issues = [];

  if (!user?.activated) {
    issues.push({ code: "not_activated", message: "Activate your account before starting a negotiation." });
  }

  if (user?.suspended) {
    issues.push({ code: "suspended", message: "Your account is suspended, so you cannot negotiate right now." });
  }

  if (!isEffectivelyAvailable(user, now, availabilityTimeoutMs)) {
    if (user?.available) {
      issues.push({ code: "inactive", message: "Your availability timed out because of inactivity. Turn availability back on before starting a negotiation." });
    } else {
      issues.push({ code: "unavailable", message: "Turn availability on before starting a negotiation." });
    }
  }

  if (!hasApprovedQualification(user, positionTypeId)) {
    issues.push({ code: "not_qualified", message: "You are no longer qualified for this job." });
  }

  if (hasConflictingCommitment(user, jobStartTime, jobEndTime)) {
    issues.push({ code: "conflicting_commitment", message: "You already have a conflicting confirmed job during this shift." });
  }

  return issues;
}
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
  return getDiscoverabilityIssues(user, now, availabilityTimeoutMs, options).length === 0;
}

module.exports = {
  getDiscoverabilityIssues,
  hasApprovedQualification,
  hasConflictingCommitment,
  isDiscoverable,
};
