const STORAGE_TUTORS = 'tutor';
const STORAGE_STUDENTS = 'student';
const API_BASE = '/api';
const detailHeading = document.getElementById('detailHeading');
const detailDescription = document.getElementById('detailDescription');
const detailContent = document.getElementById('detailContent');
const detailMessage = document.getElementById('detailMessage');
const matchSection = document.getElementById('matchSection');
const matchHeading = document.getElementById('matchHeading');
const matchDescription = document.getElementById('matchDescription');
const matchList = document.getElementById('matchList');

function parseQuery() {
  return new URLSearchParams(window.location.search);
}

async function loadProfiles(key) {
  const route = key === STORAGE_TUTORS ? 'tutors' : 'students';
  try {
    const response = await fetch(`${API_BASE}/${route}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`Failed to load ${route}:`, err);
    return [];
  }
}

async function loadProfileById(key, id) {
  const route = key === STORAGE_TUTORS ? 'tutors' : 'students';
  try {
    const response = await fetch(`${API_BASE}/${route}/${encodeURIComponent(id)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error(`Failed to load ${route}/${id}:`, err);
    return null;
  }
}

function formatLastLogin(isoString) {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Never';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

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

  card.appendChild(details);
  return card;
}

function showError(message) {
  detailContent.innerHTML = `<div class="empty-state"><strong>${message}</strong><p>Return to the directory and select a profile.</p></div>`;
  matchSection.style.display = 'none';
}

function renderDetail(profile, type) {
  detailContent.innerHTML = '';
  detailHeading.textContent = type === 'tutor' ? 'Tutor profile' : 'Student profile';
  detailDescription.textContent = type === 'tutor' ? 'See the full tutor details. Student matches are private.' : 'See the full student profile and recommended tutors.';

  const card = document.createElement('div');
  card.className = 'profile-card detail-card';

  if (type === 'tutor') {
    const avatar = document.createElement('img');
    avatar.src = profile.photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23e2e8f0"/%3E%3Ccircle cx="50" cy="35" r="20" fill="%23c7d2fe"/%3E%3Crect x="25" y="60" width="50" height="22" rx="10" fill="%23c7d2fe"/%3E%3C/svg%3E';
    avatar.alt = `${profile.name} profile photo`;
    card.appendChild(avatar);
  }

  const details = document.createElement('div');
  details.className = 'profile-details';

  const title = document.createElement('h2');
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

  if (type === 'tutor' && profile.schedule) {
    const scheduleHeading = document.createElement('p');
    scheduleHeading.textContent = 'Schedule:';
    scheduleHeading.style.fontWeight = '700';
    details.appendChild(scheduleHeading);

    const scheduleText = document.createElement('p');
    scheduleText.textContent = profile.schedule;
    details.appendChild(scheduleText);
  }

  if (type === 'tutor' && profile.lastLoginAt) {
    const lastLoginHeading = document.createElement('p');
    lastLoginHeading.textContent = 'Last Login:';
    lastLoginHeading.style.fontWeight = '700';
    details.appendChild(lastLoginHeading);

    const lastLoginText = document.createElement('p');
    lastLoginText.textContent = formatLastLogin(profile.lastLoginAt);
    details.appendChild(lastLoginText);
  }

  const topicsHeading = document.createElement('p');
  topicsHeading.textContent = type === 'tutor' ? 'This tutor teaches:' : 'This student wants to learn:';
  topicsHeading.style.fontWeight = '700';
  details.appendChild(topicsHeading);

  const list = document.createElement('ul');
  list.className = 'topics-list';
  list.innerHTML = profile.topics.map(topic => `<li>${topic}</li>`).join('');
  details.appendChild(list);

  if (profile.bio) {
    const bio = document.createElement('p');
    bio.textContent = profile.bio;
    details.appendChild(bio);
  }

  card.appendChild(details);
  detailContent.appendChild(card);
}

async function renderMatches(profile, type) {
  const [tutors, students] = await Promise.all([
    loadProfiles(STORAGE_TUTORS),
    loadProfiles(STORAGE_STUDENTS),
  ]);

  if (type === 'student') {
    const matches = tutors.filter(tutor => tutor.topics.some(topic => profile.topics.includes(topic)));
    matchHeading.textContent = 'Matched tutors';
    matchDescription.textContent = 'Tutors who teach one or more topics this student wants to learn.';

    if (!matches.length) {
      matchList.innerHTML = '<div class="empty-state"><strong>No matching tutors found.</strong><p>Add tutor profiles with the same learning topics to see matches here.</p></div>';
      matchSection.style.display = 'block';
      return;
    }

    matchList.innerHTML = '';
    matches.forEach(match => matchList.appendChild(createProfileCard(match, 'tutor')));
    matchSection.style.display = 'block';
    return;
  }

  // If type is tutor, show matching students
  const matches = students.filter(student => student.topics.some(topic => profile.topics.includes(topic)));
  matchHeading.textContent = 'Matched students';
  matchDescription.textContent = 'Students who want to learn one or more topics this tutor teaches.';

  if (!matches.length) {
    matchList.innerHTML = '<div class="empty-state"><strong>No matching students found.</strong><p>Add student profiles with related learning topics to see matches here.</p></div>';
    matchSection.style.display = 'block';
    return;
  }

  matchList.innerHTML = '';
  matches.forEach(match => matchList.appendChild(createProfileCard(match, 'student')));
  matchSection.style.display = 'block';
}

async function initPage() {
  const params = parseQuery();
  const type = params.get('type');
  const id = params.get('id');

  if (!type || !id || !['tutor', 'student'].includes(type)) {
    showError('Invalid profile link.');
    return;
  }

  const key = type === 'tutor' ? STORAGE_TUTORS : STORAGE_STUDENTS;
  const profile = await loadProfileById(key, id);

  if (!profile) {
    showError('Profile not found.');
    return;
  }

  const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (profile.disabled && (!user || user.id !== profile.ownerId)) {
    showError('This profile is currently private or disabled by the owner.');
    return;
  }

  renderDetail(profile, type);
  await renderMatches(profile, type);
}

initPage();
