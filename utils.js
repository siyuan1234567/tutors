const STORAGE_TUTORS = 'tutor';
const STORAGE_STUDENTS = 'student';
const CURRENT_USER_KEY = 'currentUser';
const API_BASE = '/api';

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body && body.error) message = body.error;
    } catch {}
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  if (response.status === 204) return null;
  return response.json();
}

async function loadProfiles(key) {
  const route = key === STORAGE_TUTORS ? 'tutors' : 'students';
  try {
    const profiles = await apiFetch(`/${route}`);
    return Array.isArray(profiles) ? profiles : [];
  } catch (err) {
    console.error(`Failed to load ${route}:`, err);
    return [];
  }
}

async function upsertProfile(key, profile) {
  const route = key === STORAGE_TUTORS ? 'tutors' : 'students';
  return apiFetch(`/${route}`, {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

async function deleteProfile(key, id) {
  const route = key === STORAGE_TUTORS ? 'tutors' : 'students';
  return apiFetch(`/${route}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

async function deleteUser(role, email) {
  return apiFetch(`/auth/users/${encodeURIComponent(role)}/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  });
}

function getCurrentUser() {
  const raw = sessionStorage.getItem(CURRENT_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
  sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
  sessionStorage.removeItem(CURRENT_USER_KEY);
}

async function registerUser({name, email, password, role}) {
  try {
    return await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  } catch (err) {
    return { error: err.message };
  }
}

async function authenticateUser({email, password, role}) {
  try {
    return await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  } catch (err) {
    return null;
  }
}

async function getProfileByOwnerId(role, ownerId) {
  const key = role === 'tutor' ? STORAGE_TUTORS : STORAGE_STUDENTS;
  const profiles = await loadProfiles(key);
  return profiles.find(profile => profile.ownerId === ownerId) || null;
}

function getCheckedTopics(form, name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map(input => input.value);
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return resolve('');
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Use a slightly lower quality to stay safe under 64KB
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
