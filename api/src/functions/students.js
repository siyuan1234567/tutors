'use strict';

const { app } = require('@azure/functions');
const {
  STUDENTS_TABLE,
  listEntities,
  getEntity,
  upsertEntity,
  jsonResponse,
} = require('../shared/tables');

const PARTITION = 'student';

app.http('listStudents', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'students',
  handler: async () => {
    const students = await listEntities(STUDENTS_TABLE, PARTITION);
    students.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return jsonResponse(200, students);
  },
});

app.http('getStudent', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'students/{id}',
  handler: async (request) => {
    const id = request.params.id;
    const student = await getEntity(STUDENTS_TABLE, PARTITION, id);
    if (!student) return jsonResponse(404, { error: 'Student not found' });
    return jsonResponse(200, student);
  },
});

app.http('upsertStudent', {
  methods: ['POST', 'PUT'],
  authLevel: 'anonymous',
  route: 'students',
  handler: async (request) => {
    const body = await request.json();
    if (!body || !body.id) return jsonResponse(400, { error: 'Missing id' });
    const saved = await upsertEntity(STUDENTS_TABLE, PARTITION, body.id, body);
    return jsonResponse(200, saved);
  },
});

app.http('deleteStudent', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'students/{id}',
  handler: async (request) => {
    const id = request.params.id;
    const success = await deleteEntity(STUDENTS_TABLE, PARTITION, id);
    if (!success) return jsonResponse(404, { error: 'Student not found' });
    return jsonResponse(204, null);
  },
});
