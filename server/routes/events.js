const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// Get all events
router.get('/', authenticateToken, (req, res) => {
  try {
    const events = db.prepare(`
      SELECT e.*,
        (SELECT COUNT(*) FROM participants WHERE event_id = e.id) as participant_count,
        (SELECT COUNT(*) FROM participants WHERE event_id = e.id AND award_type != 'Participation' AND participation_status = 'Winner') as winner_count,
        (SELECT COUNT(*) FROM certificates WHERE event_id = e.id) as certificates_generated
      FROM events e
      ORDER BY e.event_date DESC
    `).all();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event by ID with participants
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const participants = db.prepare('SELECT * FROM participants WHERE event_id = ? ORDER BY id ASC').all(id);
    const certificates = db.prepare('SELECT * FROM certificates WHERE event_id = ? ORDER BY id ASC').all(id);

    res.json({
      ...event,
      participants,
      certificates
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// Create event
router.post('/', authenticateToken, (req, res) => {
  const { title, category, event_date, department, description, organization, coordinator_name, coordinator_title } = req.body;

  if (!title || !category || !event_date || !organization) {
    return res.status(400).json({ error: 'Title, Category, Event Date, and Organization are required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO events (title, category, event_date, department, description, organization, coordinator_name, coordinator_title)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title.trim(),
      category.trim(),
      event_date,
      department || 'General',
      description || '',
      organization.trim(),
      coordinator_name || req.user.name,
      coordinator_title || (req.user.designation || 'Event Coordinator')
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Event created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, category, event_date, department, description, organization, coordinator_name, coordinator_title } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE events
      SET title = COALESCE(?, title),
          category = COALESCE(?, category),
          event_date = COALESCE(?, event_date),
          department = COALESCE(?, department),
          description = COALESCE(?, description),
          organization = COALESCE(?, organization),
          coordinator_name = COALESCE(?, coordinator_name),
          coordinator_title = COALESCE(?, coordinator_title)
      WHERE id = ?
    `);

    stmt.run(title, category, event_date, department, description, organization, coordinator_name, coordinator_title, id);
    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM events WHERE id = ?').run(id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Delete all events
router.delete('/', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM events').run();
    res.json({ message: 'All events deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete all events' });
  }
});

// Add participant to an event (individual or team)
router.post('/:id/participants', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    name,
    roll_number,
    email,
    department,
    participant_type,
    team_name,
    team_members,
    participation_status,
    award_type,
    student_id,
    players // Optional array of team players [{ name, roll_number, email, department }]
  } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO participants (
        event_id, student_id, name, roll_number, email, department,
        participant_type, team_name, team_members, participation_status, award_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Case 1: Multi-player team submission
    if (participant_type === 'team' && Array.isArray(players) && players.length > 0) {
      const validPlayers = players.filter(p => p.name && p.name.trim());
      if (validPlayers.length === 0) {
        return res.status(400).json({ error: 'At least one team player name is required' });
      }

      const allMemberNames = validPlayers.map(p => p.name.trim()).join(', ');
      const cleanTeamName = (team_name && team_name.trim()) || 'Team';

      const insertMany = db.transaction((playerList) => {
        let firstId = null;
        for (const player of playerList) {
          const r = stmt.run(
            id,
            player.student_id || null,
            player.name.trim(),
            player.roll_number ? player.roll_number.trim().toUpperCase() : '',
            player.email ? player.email.trim() : '',
            player.department || department || '',
            'team',
            cleanTeamName,
            allMemberNames,
            participation_status || 'Participant',
            award_type || 'Participation'
          );
          if (!firstId) firstId = r.lastInsertRowid;
        }
        return firstId;
      });

      const firstId = insertMany(validPlayers);
      return res.status(201).json({
        id: firstId,
        message: `Added team "${cleanTeamName}" with ${validPlayers.length} players successfully`
      });
    }

    // Case 2: Individual participant or team with single name
    if (!name) {
      return res.status(400).json({ error: 'Participant name is required' });
    }

    const result = stmt.run(
      id,
      student_id || null,
      name.trim(),
      roll_number ? roll_number.trim().toUpperCase() : '',
      email ? email.trim() : '',
      department || '',
      participant_type || 'individual',
      team_name ? team_name.trim() : null,
      team_members ? team_members.trim() : null,
      participation_status || 'Participant',
      award_type || 'Participation'
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Participant added successfully' });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({ error: 'Failed to add participant: ' + error.message });
  }
});

// Update participant
router.put('/participants/:participantId', authenticateToken, (req, res) => {
  const { participantId } = req.params;
  const { name, roll_number, email, department, participant_type, team_name, team_members, participation_status, award_type } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE participants
      SET name = COALESCE(?, name),
          roll_number = COALESCE(?, roll_number),
          email = COALESCE(?, email),
          department = COALESCE(?, department),
          participant_type = COALESCE(?, participant_type),
          team_name = COALESCE(?, team_name),
          team_members = COALESCE(?, team_members),
          participation_status = COALESCE(?, participation_status),
          award_type = COALESCE(?, award_type)
      WHERE id = ?
    `);

    stmt.run(name, roll_number ? roll_number.toUpperCase() : null, email, department, participant_type, team_name, team_members, participation_status, award_type, participantId);
    res.json({ message: 'Participant updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update participant' });
  }
});

// Batch delete participants
router.post('/participants/batch-delete', authenticateToken, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Array of participant IDs required' });
  }

  try {
    const deleteBatch = db.transaction((idList) => {
      const stmt = db.prepare('DELETE FROM participants WHERE id = ?');
      let count = 0;
      for (const id of idList) {
        stmt.run(id);
        count++;
      }
      return count;
    });

    const deletedCount = deleteBatch(ids);
    res.json({ message: `Successfully deleted ${deletedCount} participants`, count: deletedCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete participants batch' });
  }
});

// Delete participant
router.delete('/participants/:participantId', authenticateToken, (req, res) => {
  const { participantId } = req.params;
  try {
    db.prepare('DELETE FROM participants WHERE id = ?').run(participantId);
    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete participant' });
  }
});

// Delete all participants for an event
router.delete('/:id/participants', authenticateToken, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM participants WHERE event_id = ?').run(id);
    res.json({ message: 'All participants for this event removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete all participants' });
  }
});

// Bulk import participants to an event from CSV / Excel
router.post('/:id/import-participants', authenticateToken, upload.single('file'), (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'No CSV or Excel file uploaded' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'The uploaded file has no rows' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO participants (
        event_id, name, roll_number, email, department, participant_type,
        team_name, team_members, participation_status, award_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    const batchTransaction = db.transaction((rowsList) => {
      for (const row of rowsList) {
        const name = row['Name'] || row['Participant Name'] || row['name'] || row['Student Name'];
        const roll = row['Roll Number'] || row['RollNo'] || row['roll_number'] || row['Roll'] || '';
        const email = row['Email'] || row['email'] || '';
        const department = row['Department'] || row['department'] || row['Branch'] || '';
        const participantType = (row['Type'] || row['participant_type'] || 'individual').toLowerCase() === 'team' ? 'team' : 'individual';
        const teamName = row['Team Name'] || row['Team'] || row['team_name'] || null;
        const teamMembers = row['Team Members'] || row['team_members'] || null;
        const status = row['Status'] || row['participation_status'] || 'Participant';
        const award = row['Award'] || row['award_type'] || row['Rank'] || 'Participation';

        if (name) {
          // If team entry with multiple players in Team Members
          if (participantType === 'team' && teamMembers && String(teamMembers).includes(',')) {
            const memberNames = String(teamMembers).split(',').map(m => m.trim()).filter(Boolean);
            for (const member of memberNames) {
              insertStmt.run(
                id,
                member,
                String(roll).trim().toUpperCase(),
                String(email).trim(),
                String(department).trim(),
                'team',
                teamName || 'Team',
                teamMembers,
                status,
                award
              );
              count++;
            }
          } else {
            insertStmt.run(id, String(name).trim(), String(roll).trim().toUpperCase(), String(email).trim(), String(department).trim(), participantType, teamName, teamMembers, status, award);
            count++;
          }
        }
      }
    });

    batchTransaction(rows);
    res.json({ message: `Imported ${count} participants successfully`, count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to import participants: ' + error.message });
  }
});

module.exports = router;
