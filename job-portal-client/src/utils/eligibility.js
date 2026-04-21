function normalizeSkill(s) {
  return String(s || '')
    .trim()
    .toLowerCase();
}

function jobSkillList(job) {
  const raw = Array.isArray(job?.skills) ? job.skills : [];
  return raw
    .map((x) => normalizeSkill(x?.value ?? x?.label ?? x))
    .filter(Boolean);
}

function seekerSkillSet(profile) {
  const raw = Array.isArray(profile?.skills) ? profile.skills : [];
  return new Set(raw.map(normalizeSkill).filter(Boolean));
}

export function computeEligibility({ job, seekerProfile }) {
  const reasons = [];
  if (!seekerProfile) {
    return { eligible: null, reasons: ['Login as a student and complete your profile to see eligibility.'], skillMatchPercent: null };
  }

  const seekerExp = Number(seekerProfile.experienceYears ?? 0);
  const minExp = job?.minExperienceYears !== undefined && job?.minExperienceYears !== null && job?.minExperienceYears !== ''
    ? Number(job.minExperienceYears)
    : null;

  if (minExp !== null && Number.isFinite(minExp) && seekerExp < minExp) {
    reasons.push(`Needs at least ${minExp} years experience (you have ${seekerExp}).`);
  }

  const requiredSkills = jobSkillList(job);
  const seekerSkills = seekerSkillSet(seekerProfile);
  const matched = requiredSkills.filter((s) => seekerSkills.has(s));
  const skillMatchPercent = requiredSkills.length === 0 ? 100 : Math.round((matched.length / requiredSkills.length) * 100);

  const minSkillMatch = job?.minSkillMatch !== undefined && job?.minSkillMatch !== null && job?.minSkillMatch !== ''
    ? Number(job.minSkillMatch)
    : null;

  if (minSkillMatch !== null && Number.isFinite(minSkillMatch) && skillMatchPercent < minSkillMatch) {
    reasons.push(`Skill match ${skillMatchPercent}% is below required ${minSkillMatch}%.`);
  }

  const eligible = reasons.length === 0;
  return { eligible, reasons, skillMatchPercent, matchedSkills: matched, requiredSkills };
}

