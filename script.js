const studentSummary = document.getElementById('studentSummary');
const studentFeed = document.getElementById('studentFeed');
const tutorTableWrapper = document.getElementById('tutorTableWrapper');
const tutorTableBody = document.getElementById('tutorTableBody');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const profileButton = document.getElementById('profileButton');
const matchesButton = document.getElementById('matchesButton');
const logoutButton = document.getElementById('logoutButton');
const loginStatus = document.getElementById('loginStatus');

function renderLoginState() {
  const user = getCurrentUser();

  if (!user) {
    loginStatus.textContent = '';
    logoutButton.classList.add('hidden');
    profileButton.classList.add('hidden');
    matchesButton.classList.add('hidden');
    loginButton.classList.remove('hidden');
    signupButton.classList.remove('hidden');
    return;
  }

  loginStatus.textContent = `Logged in as ${user.role} • ${user.name}`;
  logoutButton.classList.remove('hidden');
  profileButton.classList.remove('hidden');
  matchesButton.classList.remove('hidden');
  loginButton.classList.add('hidden');
  signupButton.classList.add('hidden');
}

function handleLogout() {
  clearCurrentUser();
  renderLoginState();
  renderTutorTable();
}

async function renderTutorTable() {
  const tutors = (await loadProfiles(STORAGE_TUTORS)).filter(p => !p.disabled);
  tutorTableBody.innerHTML = '';

  if (!tutors.length) {
    tutorTableBody.innerHTML = '<tr><td colspan="8" class="empty-state">No tutor profiles saved yet. Any registered tutor can add a profile by logging in and saving their information.</td></tr>';
    return;
  }

  tutors.forEach(profile => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${profile.photo ? `<img src="${profile.photo}" alt="${profile.name} photo" class="table-avatar" />` : ''}</td>
      <td>${profile.name || ''}</td>
      <td>${profile.ownerEmail || ''}</td>
      <td>${profile.pronouns || ''}</td>
      <td>${profile.grade || ''}</td>
      <td>${profile.school || ''}</td>
      <td>${Array.isArray(profile.topics) ? profile.topics.join(', ') : ''}</td>
      <td>${profile.wage || ''}</td>
    `;
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      window.location.href = `detail.html?type=tutor&id=${encodeURIComponent(profile.id)}`;
    });
    tutorTableBody.appendChild(row);
  });
}

logoutButton.addEventListener('click', handleLogout);

// Initial load
renderLoginState();
renderTutorTable();
