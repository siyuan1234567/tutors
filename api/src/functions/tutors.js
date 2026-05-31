'use strict';

const { app } = require('@azure/functions');
const {
  TUTORS_TABLE,
  listEntities,
  getEntity,
  upsertEntity,
  jsonResponse,
} = require('../shared/tables');

const PARTITION = 'tutor';

app.http('listTutors', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'tutors',
  handler: async (_request, _context) => {
    const tutors = await listEntities(TUTORS_TABLE, PARTITION);
    tutors.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return jsonResponse(200, tutors);
  },
});

app.http('getTutor', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'tutors/{id}',
  handler: async (request) => {
    const id = request.params.id;
    const tutor = await getEntity(TUTORS_TABLE, PARTITION, id);
    if (!tutor) return jsonResponse(404, { error: 'Tutor not found' });
    return jsonResponse(200, tutor);
  },
});

app.http('upsertTutor', {
  methods: ['POST', 'PUT'],
  authLevel: 'anonymous',
  route: 'tutors',
  handler: async (request) => {
    const body = await request.json();
    if (!body || !body.id) return jsonResponse(400, { error: 'Missing id' });
    const saved = await upsertEntity(TUTORS_TABLE, PARTITION, body.id, body);
    return jsonResponse(200, saved);
  },
});

app.http('deleteTutor', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'tutors/{id}',
  handler: async (request) => {
    const id = request.params.id;
    const success = await deleteEntity(TUTORS_TABLE, PARTITION, id);
    if (!success) return jsonResponse(404, { error: 'Tutor not found' });
    return jsonResponse(204, null);
  },
});
