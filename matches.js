const matchPageHeading = document.getElementById('matchPageHeading');
const matchPageDescription = document.getElementById('matchPageDescription');
const matchList = document.getElementById('matchList');

function createProfileCard(profile, type) {
  const card = document.createElement('article');
  card.className = 'profile-card';

  if (type === 'tutor') {
    const avatar = document.createElement('img');
    avatar.src = profile.photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23e2e8f0"/%3E%3Ccircle cx="50" cy="35" r="20" fill="%23c7d2fe"/%3E%3Crect x="25" y="60" width="50" height="22" rx="10" fill="%23c7d2fe"/%3E%3C/svg%3E';
    avatar.alt = `${profile.name} profile photo`;
    card.appendChild(avatar);
  }

  const details = document.createElement('div');
  details.className = 'profile-details';

  const title = document.createElement('h3');
  title.textContent = profile.name;
  details.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'profile-meta';
  meta.innerHTML = `
    <span class="meta-pill">${profile.pronouns || 'Pronouns not specified'}</span>
    <span class="meta-pill">Grade ${profile.grade}</span>
    <span class="meta-pill">${profile.school}</span>
  `;

  if (type === 'tutor') {
    meta.innerHTML += `<span class="meta-pill">${profile.wage}</span>`;
  }

  details.appendChild(meta);

  const list = document.createElement('ul');
  list.className = 'topics-list';
  list.innerHTML = profile.topics.map(topic => `<li>${topic}</li>`).join('');
  details.appendChild(list);

  const viewLink = document.createElement('a');
  viewLink.href = `detail.html?type=${type}&id=${encodeURIComponent(profile.id)}`;
  viewLink.className = 'profile-link';
  viewLink.textContent = 'View full profile';
  details.appendChild(viewLink);

  card.appendChild(details);
  return card;
}

async function initMatchesPage() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const role = user.role;
  const myProfile = await getProfileByOwnerId(role, user.id);

  if (!myProfile) {
    matchPageHeading.textContent = 'No Profile Found';
    matchPageDescription.textContent = 'Please create a profile first to see matches.';
    matchList.innerHTML = '<div class="empty-state"><strong>No profile found.</strong><p>You need a profile with topics to see matches.</p></div>';
    return;
  }

  const targetRole = role === 'tutor' ? 'student' : 'tutor';
  const targetStorageKey = role === 'tutor' ? STORAGE_STUDENTS : STORAGE_TUTORS;
  
  matchPageHeading.textContent = role === 'tutor' ? 'Matched Students' : 'Matched Tutors';
  matchPageDescription.textContent = role === 'tutor' 
    ? 'Students who want to learn topics you teach.' 
    : 'Tutors who teach topics you want to learn.';

  const allTargetProfiles = await loadProfiles(targetStorageKey);
  const matches = allTargetProfiles.filter(target => 
    !target.disabled && target.topics.some(topic => myProfile.topics.includes(topic))
  );

  if (matches.length === 0) {
    matchList.innerHTML = `<div class="empty-state"><strong>No matches found yet.</strong><p>Try adding more topics to your profile to find more ${targetRole}s.</p></div>`;
    return;
  }

  matchList.innerHTML = '';
  matches.forEach(match => {
    matchList.appendChild(createProfileCard(match, targetRole));
  });
}

initMatchesPage();
