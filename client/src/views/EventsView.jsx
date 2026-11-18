import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Trophy,
  Users,
  Award,
  Upload,
  Trash2,
  Edit,
  Sparkles,
  Download,
  CheckCircle,
  FileSpreadsheet,
  UserPlus,
  X,
  ShieldCheck
} from 'lucide-react';
import {
  getEventsList,
  getEventDetails,
  createEvent,
  deleteEvent,
  deleteAllEvents,
  addEventParticipant,
  updateParticipant,
  deleteParticipant,
  batchDeleteParticipants,
  deleteAllEventParticipants,
  importEventParticipants
} from '../services/api';
import { COLLEGE_DEPARTMENTS } from '../constants/departments';

export default function EventsView({
  onGenerateCertificatesForEvent
}) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterWinner, setFilterWinner] = useState('all'); // 'all', 'winners', 'teams'
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDecideWinnersModal, setShowDecideWinnersModal] = useState(false);

  // Winner selection state for Decide Winners modal
  const [winnerSelection, setWinnerSelection] = useState({
    firstPlaceId: '',
    secondPlaceId: '',
    thirdPlaceId: '',
    runnerUpId: '',
    specialMentionId: ''
  });

  // New Event Form
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: 'Hackathon',
    event_date: new Date().toISOString().split('T')[0],
    department: 'Computer Science and Engineering',
    organization: 'Dronacharya College of Engineering',
    description: '',
    coordinator_name: '',
    coordinator_title: 'Event Coordinator'
  });

  // New Participant Form
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    roll_number: '',
    email: '',
    department: 'Computer Science and Engineering',
    participant_type: 'individual',
    team_name: '',
    team_members: '',
    participation_status: 'Participant',
    award_type: 'Participation'
  });

  // Dedicated multi-player team members state
  const [teamPlayers, setTeamPlayers] = useState([
    { name: '', roll_number: '', email: '' },
    { name: '', roll_number: '', email: '' }
  ]);
  const [quickPasteText, setQuickPasteText] = useState('');

  // Import file
  const [importFile, setImportFile] = useState(null);

  const handleQuickFillSampleEvent = () => {
    const titles = [
      'National Hackathon 2026: QuantumAI',
      'Inter-College Robotics Championship',
      'Annual Technical Paper Symposium',
      'Full-Stack Cloud Summit 2026'
    ];
    const categories = ['Hackathon', 'Tech Fest', 'Workshop', 'Conference'];
    const idx = Math.floor(Math.random() * titles.length);
    setNewEvent({
      title: titles[idx],
      category: categories[idx],
      event_date: new Date().toISOString().split('T')[0],
      department: 'Computer Science and Engineering',
      organization: 'Dronacharya College of Engineering',
      description: 'Competitive technical innovation summit bringing together student teams nationwide.',
      coordinator_name: '',
      coordinator_title: 'Event Coordinator'
    });
  };

  const handleQuickFillSampleParticipant = () => {
    const isTeam = Math.random() > 0.4;
    const sampleTeams = ['NeuralKnights', 'QuantumCoders', 'CyberVanguards', 'ByteCrafters'];
    const sampleTeamGroups = [
      ['Aarav Sharma', 'Diya Verma', 'Kabir Singhal'],
      ['Vikrant Roy', 'Shruti Pai'],
      ['Pooja Reddy', 'Tanya Bansal', 'Ravi Shankar']
    ];

    if (isTeam) {
      const chosenTeam = sampleTeams[Math.floor(Math.random() * sampleTeams.length)];
      const chosenGroup = sampleTeamGroups[Math.floor(Math.random() * sampleTeamGroups.length)];
      const baseRoll = Math.floor(100 + Math.random() * 800);

      const generatedPlayers = chosenGroup.map((pName, idx) => ({
        name: pName,
        roll_number: `23BCS${baseRoll + idx}`,
        email: `${pName.toLowerCase().replace(' ', '.')}@student.college.edu`
      }));

      setNewParticipant({
        name: chosenGroup[0],
        roll_number: `23BCS${baseRoll}`,
        email: `${chosenGroup[0].toLowerCase().replace(' ', '.')}@student.college.edu`,
        department: selectedEvent?.department || 'Computer Science and Engineering',
        participant_type: 'team',
        team_name: chosenTeam,
        team_members: chosenGroup.join(', '),
        participation_status: 'Participant',
        award_type: 'Participation'
      });
      setTeamPlayers(generatedPlayers);
    } else {
      const names = ['Kunal Singhal', 'Pooja Reddy', 'Tanya Bansal', 'Ravi Shankar', 'Ishaan Sen'];
      const chosenName = names[Math.floor(Math.random() * names.length)];
      const roll = `23BCS${Math.floor(100 + Math.random() * 900)}`;

      setNewParticipant({
        name: chosenName,
        roll_number: roll,
        email: `${chosenName.toLowerCase().replace(' ', '.')}@student.college.edu`,
        department: selectedEvent?.department || 'Computer Science and Engineering',
        participant_type: 'individual',
        team_name: '',
        team_members: '',
        participation_status: 'Participant',
        award_type: 'Participation'
      });
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await getEventsList();
      setEvents(res.data || []);
      if (res.data && res.data.length > 0) {
        loadEventDetails(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEventDetails = async (id) => {
    try {
      const res = await getEventDetails(id);
      setSelectedEvent(res.data);
    } catch (err) {
      console.error('Failed to load event details:', err);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await createEvent(newEvent);
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        category: 'Hackathon',
        event_date: new Date().toISOString().split('T')[0],
        department: 'Computer Science and Engineering',
        organization: 'Dronacharya College of Engineering',
        description: '',
        coordinator_name: '',
        coordinator_title: 'Event Coordinator'
      });
      loadEvents();
    } catch (err) {
      alert('Failed to create event: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event and its participant records?')) return;
    try {
      await deleteEvent(id);
      loadEvents();
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const handleDeleteAllEvents = async () => {
    if (!window.confirm('Are you sure you want to delete ALL events? This action cannot be undone.')) return;
    try {
      await deleteAllEvents();
      loadEvents();
      setSelectedEvent(null);
    } catch (err) {
      alert('Failed to delete all events');
    }
  };

  const handlePlayerChange = (index, field, value) => {
    setTeamPlayers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddPlayerRow = () => {
    setTeamPlayers(prev => [...prev, { name: '', roll_number: '', email: '' }]);
  };

  const handleRemovePlayerRow = (index) => {
    if (teamPlayers.length <= 1) return;
    setTeamPlayers(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickAddPlayers = () => {
    if (!quickPasteText.trim()) return;
    const names = quickPasteText.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
    if (names.length === 0) return;

    setTeamPlayers(prev => {
      const existing = prev.filter(p => p.name.trim());
      const newRows = names.map(n => ({ name: n, roll_number: '', email: '' }));
      return [...existing, ...newRows];
    });
    setQuickPasteText('');
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      if (newParticipant.participant_type === 'team') {
        const cleanTeamName = newParticipant.team_name.trim();
        if (!cleanTeamName) {
          alert('Please enter a Team Name');
          return;
        }

        const validPlayers = teamPlayers.filter(p => p.name && p.name.trim());
        if (validPlayers.length === 0) {
          alert('Please enter at least one player name in the team.');
          return;
        }

        await addEventParticipant(selectedEvent.id, {
          ...newParticipant,
          name: validPlayers[0].name.trim(),
          team_name: cleanTeamName,
          players: validPlayers,
          participation_status: 'Participant',
          award_type: 'Participation'
        });
      } else {
        if (!newParticipant.name.trim()) {
          alert('Please enter student name');
          return;
        }

        await addEventParticipant(selectedEvent.id, {
          ...newParticipant,
          participation_status: 'Participant',
          award_type: 'Participation'
        });
      }

      setShowAddParticipantModal(false);
      setNewParticipant({
        name: '',
        roll_number: '',
        email: '',
        department: selectedEvent.department || 'Computer Science and Engineering',
        participant_type: 'individual',
        team_name: '',
        team_members: '',
        participation_status: 'Participant',
        award_type: 'Participation'
      });
      setTeamPlayers([
        { name: '', roll_number: '', email: '' },
        { name: '', roll_number: '', email: '' }
      ]);
      setQuickPasteText('');
      loadEventDetails(selectedEvent.id);
      loadEvents();
    } catch (err) {
      alert('Failed to add to event: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleOpenDecideWinners = () => {
    if (!selectedEvent || !selectedEvent.participants || selectedEvent.participants.length === 0) {
      alert('Please enter or import students first before deciding winners.');
      return;
    }
    const first = selectedEvent.participants.find(p => p.award_type === '1st Place');
    const second = selectedEvent.participants.find(p => p.award_type === '2nd Place');
    const third = selectedEvent.participants.find(p => p.award_type === '3rd Place');
    const runner = selectedEvent.participants.find(p => p.award_type === 'Runner-up');
    const special = selectedEvent.participants.find(p => p.award_type === 'Special Mention');

    setWinnerSelection({
      firstPlaceId: first ? String(first.id) : '',
      secondPlaceId: second ? String(second.id) : '',
      thirdPlaceId: third ? String(third.id) : '',
      runnerUpId: runner ? String(runner.id) : '',
      specialMentionId: special ? String(special.id) : ''
    });
    setShowDecideWinnersModal(true);
  };

  const handleSaveDecideWinners = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      const promises = [];
      const parts = selectedEvent.participants || [];

      // Detect team winners so all players in that team get the same award!
      const teamWinners = {};
      const registerTeamAward = (partId, rank) => {
        if (!partId) return;
        const target = parts.find(p => String(p.id) === String(partId));
        if (target && target.participant_type === 'team' && target.team_name) {
          teamWinners[target.team_name.trim().toLowerCase()] = rank;
        }
      };

      registerTeamAward(winnerSelection.firstPlaceId, '1st Place');
      registerTeamAward(winnerSelection.secondPlaceId, '2nd Place');
      registerTeamAward(winnerSelection.thirdPlaceId, '3rd Place');
      registerTeamAward(winnerSelection.runnerUpId, 'Runner-up');
      registerTeamAward(winnerSelection.specialMentionId, 'Special Mention');

      for (const p of parts) {
        let newRank = 'Participation';
        let newStatus = 'Participant';

        if (String(p.id) === String(winnerSelection.firstPlaceId)) {
          newRank = '1st Place';
          newStatus = 'Winner';
        } else if (String(p.id) === String(winnerSelection.secondPlaceId)) {
          newRank = '2nd Place';
          newStatus = 'Winner';
        } else if (String(p.id) === String(winnerSelection.thirdPlaceId)) {
          newRank = '3rd Place';
          newStatus = 'Winner';
        } else if (String(p.id) === String(winnerSelection.runnerUpId)) {
          newRank = 'Runner-up';
          newStatus = 'Winner';
        } else if (String(p.id) === String(winnerSelection.specialMentionId)) {
          newRank = 'Special Mention';
          newStatus = 'Winner';
        } else if (p.participant_type === 'team' && p.team_name && teamWinners[p.team_name.trim().toLowerCase()]) {
          // Entire team gets awarded the winning rank!
          newRank = teamWinners[p.team_name.trim().toLowerCase()];
          newStatus = 'Winner';
        }

        if (p.award_type !== newRank || p.participation_status !== newStatus) {
          promises.push(updateParticipant(p.id, { participation_status: newStatus, award_type: newRank }));
        }
      }

      await Promise.all(promises);
      setShowDecideWinnersModal(false);
      loadEventDetails(selectedEvent.id);
      loadEvents();
    } catch (err) {
      alert('Failed to update winners: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleParticipantRankChange = async (pId, newRank) => {
    const newStatus = (newRank === 'Participation' || newRank === 'Participant') ? 'Participant' : 'Winner';
    const resolvedAward = newRank === 'Participant' ? 'Participation' : newRank;
    try {
      const part = (selectedEvent?.participants || []).find(p => p.id === pId);
      if (part && part.participant_type === 'team' && part.team_name) {
        // Update all teammates in this team so everyone on the team shares the award!
        const teammates = (selectedEvent?.participants || []).filter(
          p => p.participant_type === 'team' && p.team_name && p.team_name.trim().toLowerCase() === part.team_name.trim().toLowerCase()
        );
        await Promise.all(teammates.map(tm => updateParticipant(tm.id, { participation_status: newStatus, award_type: resolvedAward })));
      } else {
        await updateParticipant(pId, { participation_status: newStatus, award_type: resolvedAward });
      }
      loadEventDetails(selectedEvent.id);
      loadEvents();
    } catch (err) {
      alert('Failed to update rank: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteParticipant = async (pId) => {
    if (!window.confirm('Remove this participant?')) return;
    try {
      await deleteParticipant(pId);
      setSelectedParticipantIds(prev => prev.filter(id => id !== pId));
      loadEventDetails(selectedEvent.id);
    } catch (err) {
      alert('Failed to remove participant');
    }
  };

  const handleBatchDeleteParticipants = async () => {
    if (selectedParticipantIds.length === 0 || !selectedEvent) return;
    if (!window.confirm(`Delete ${selectedParticipantIds.length} selected participants?`)) return;
    try {
      await batchDeleteParticipants(selectedParticipantIds);
      setSelectedParticipantIds([]);
      loadEventDetails(selectedEvent.id);
    } catch (err) {
      alert('Failed to delete selected participants: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteAllParticipants = async () => {
    if (!selectedEvent) return;
    if (!window.confirm('Are you sure you want to delete ALL participants for this event? This action cannot be undone.')) return;
    try {
      await deleteAllEventParticipants(selectedEvent.id);
      setSelectedParticipantIds([]);
      loadEventDetails(selectedEvent.id);
    } catch (err) {
      alert('Failed to delete all participants');
    }
  };

  const handleImportParticipants = async (e) => {
    e.preventDefault();
    if (!importFile || !selectedEvent) return;

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      await importEventParticipants(selectedEvent.id, formData);
      setShowImportModal(false);
      setImportFile(null);
      loadEventDetails(selectedEvent.id);
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // Filter participants
  const participants = selectedEvent?.participants || [];
  const filteredParticipants = participants.filter((p) => {
    if (filterWinner === 'winners') {
      return p.participation_status === 'Winner' || (p.award_type && p.award_type !== 'Participation');
    }
    if (filterWinner === 'teams') {
      return p.participant_type === 'team';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Events, Hackathons & Winners</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Competition Portal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage college hackathons, technical symposia, teams, and assign 1st, 2nd & 3rd place winners for certificate generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteAllEvents}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs sm:text-sm shadow-md transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column: Event Selector List (4 cols) & Event Detail / Participants (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Event Cards List */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold uppercase text-slate-700 tracking-wider px-1">
            All College Events ({events.length})
          </h2>

          <div className="space-y-3 max-h-[78vh] overflow-y-auto">
            {events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => loadEventDetails(ev.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  selectedEvent?.id === ev.id
                    ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    ev.category === 'Hackathon'
                      ? 'bg-purple-100 text-purple-800'
                      : ev.category === 'Workshop'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ev.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{ev.event_date}</span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-2 leading-snug">
                  {ev.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{ev.description || ev.organization}</p>

                <div className="flex items-center justify-between text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{ev.participant_count || 0}</strong> participants
                  </span>
                  <span className="flex items-center gap-1 text-amber-700 font-semibold">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    {ev.winner_count || 0} winners
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Selected Event Details & Participants List */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          {selectedEvent ? (
            <>
              {/* Event Header Banner */}
              <div className="border-b border-slate-100 pb-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-900 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                        {selectedEvent.category}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">Date: {selectedEvent.event_date}</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">{selectedEvent.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedEvent.organization} • Dept: {selectedEvent.department}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onGenerateCertificatesForEvent(selectedEvent)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Issue Certificates</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-800">Event Coordinator:</span> {selectedEvent.coordinator_name} ({selectedEvent.coordinator_title})
                  {selectedEvent.description && (
                    <p className="mt-1 text-slate-500">{selectedEvent.description}</p>
                  )}
                </div>
              </div>

              {/* Participants Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Participants & Winners ({filteredParticipants.length})
                  </h3>
                  {/* Filter Pills */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-lg text-[11px] font-semibold text-slate-600">
                    <button
                      onClick={() => setFilterWinner('all')}
                      className={`px-2 py-0.5 rounded ${filterWinner === 'all' ? 'bg-white text-slate-900 shadow-sm' : ''}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterWinner('winners')}
                      className={`px-2 py-0.5 rounded ${filterWinner === 'winners' ? 'bg-amber-500 text-slate-950 shadow-sm font-bold' : ''}`}
                    >
                      🏆 Winners
                    </button>
                    <button
                      onClick={() => setFilterWinner('teams')}
                      className={`px-2 py-0.5 rounded ${filterWinner === 'teams' ? 'bg-white text-slate-900 shadow-sm' : ''}`}
                    >
                      Teams
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedParticipantIds.length > 0 && (
                    <button
                      onClick={handleBatchDeleteParticipants}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Selected ({selectedParticipantIds.length})</span>
                    </button>
                  )}
                  <button
                    onClick={handleDeleteAllParticipants}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All</span>
                  </button>
                  <button
                    onClick={handleOpenDecideWinners}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer"
                    title="Decide Winners & Assign Ranks for this event"
                  >
                    <Trophy className="w-3.5 h-3.5 text-slate-950" />
                    <span>Decide Winners & Ranks</span>
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Import Excel/CSV</span>
                  </button>
                  <button
                    onClick={() => setShowAddParticipantModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Student</span>
                  </button>
                </div>
              </div>

              {/* Participants Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={filteredParticipants.length > 0 && selectedParticipantIds.length === filteredParticipants.length}
                          onChange={() => {
                            if (selectedParticipantIds.length === filteredParticipants.length) {
                              setSelectedParticipantIds([]);
                            } else {
                              setSelectedParticipantIds(filteredParticipants.map(p => p.id));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400"
                        />
                      </th>
                      <th className="py-2.5 px-3">Participant / Team</th>
                      <th className="py-2.5 px-3">Roll No</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Award / Rank</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredParticipants.length > 0 ? (
                      filteredParticipants.map((p) => {
                        const isWinner = p.participation_status === 'Winner' || (p.award_type && p.award_type !== 'Participation');
                        const isSelected = selectedParticipantIds.includes(p.id);
                        return (
                          <tr key={p.id} className={isSelected ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedParticipantIds(prev =>
                                    prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                                  );
                                }}
                                className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-400"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{p.name}</div>
                              {p.team_name && (
                                <div className="text-[10px] text-indigo-600 font-semibold">
                                  Team: {p.team_name} {p.team_members && `(${p.team_members})`}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400">{p.email}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {p.roll_number || '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                {p.participant_type}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={p.award_type || (p.participation_status === 'Winner' ? 'Winner' : 'Participation')}
                                onChange={(e) => handleParticipantRankChange(p.id, e.target.value)}
                                className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none transition cursor-pointer ${
                                  isWinner
                                    ? 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold shadow-sm'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                                }`}
                              >
                                <option value="Participation">🎖️ Participant</option>
                                <option value="1st Place">🥇 1st Place Winner</option>
                                <option value="2nd Place">🥈 2nd Place Winner</option>
                                <option value="3rd Place">🥉 3rd Place Winner</option>
                                <option value="Runner-up">🏅 Runner-Up</option>
                                <option value="Best Innovation">💡 Best Innovation</option>
                                <option value="Special Mention">⭐ Special Mention</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleDeleteParticipant(p.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                                title="Remove participant"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No participants found matching filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              Select an event to view details and participants
            </div>
          )}
        </div>
      </div>

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Create New College Event / Hackathon</h3>
              <button
                type="button"
                onClick={handleQuickFillSampleEvent}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Fill Sample</span>
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. National Hackathon 2026: CodeCrafters"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 bg-white"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Tech Fest">Tech Fest</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Conference">Conference</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Event Date</label>
                  <input
                    type="date"
                    required
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Department</label>
                <select
                  value={newEvent.department}
                  onChange={(e) => setNewEvent({ ...newEvent, department: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">Select Department...</option>
                  {newEvent.department && !COLLEGE_DEPARTMENTS.includes(newEvent.department) && (
                    <option value={newEvent.department}>{newEvent.department}</option>
                  )}
                  {COLLEGE_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Organization / College</label>
                <input
                  type="text"
                  required
                  value={newEvent.organization}
                  onChange={(e) => setNewEvent({ ...newEvent, organization: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Coordinator Name</label>
                  <input
                    type="text"
                    value={newEvent.coordinator_name}
                    onChange={(e) => setNewEvent({ ...newEvent, coordinator_name: e.target.value })}
                    placeholder="(Blank / Optional)"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Coordinator Title</label>
                  <input
                    type="text"
                    value={newEvent.coordinator_title}
                    onChange={(e) => setNewEvent({ ...newEvent, coordinator_title: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PARTICIPANT / STUDENT / TEAM MODAL */}
      {showAddParticipantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-500" />
                  <span>Add Participant / Team to Event</span>
                </h3>
                <p className="text-xs text-slate-500">Every player entered receives their own personalized certificate</p>
              </div>
              <button
                type="button"
                onClick={handleQuickFillSampleParticipant}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Sample</span>
              </button>
            </div>

            {/* Type Switcher: Individual Student vs Team Entry */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setNewParticipant(prev => ({ ...prev, participant_type: 'individual' }))}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  newParticipant.participant_type === 'individual'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Individual Student</span>
              </button>
              <button
                type="button"
                onClick={() => setNewParticipant(prev => ({ ...prev, participant_type: 'team' }))}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  newParticipant.participant_type === 'team'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Team Entry (Multi-Player)</span>
              </button>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-4 overflow-y-auto flex-1 pr-1">
              {newParticipant.participant_type === 'individual' ? (
                /* INDIVIDUAL STUDENT FORM */
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Student Name *</label>
                    <input
                      type="text"
                      required
                      value={newParticipant.name}
                      onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. Diya Verma"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Roll Number</label>
                      <input
                        type="text"
                        value={newParticipant.roll_number}
                        onChange={(e) => setNewParticipant({ ...newParticipant, roll_number: e.target.value })}
                        className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl mt-1 uppercase"
                        placeholder="22BCS102"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Email Address</label>
                      <input
                        type="email"
                        value={newParticipant.email}
                        onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1"
                        placeholder="diya.v@student.college.edu"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Department</label>
                    <select
                      value={newParticipant.department}
                      onChange={(e) => setNewParticipant({ ...newParticipant, department: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 bg-white text-slate-800"
                    >
                      <option value="">Select Department...</option>
                      {COLLEGE_DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                /* MULTI-PLAYER TEAM FORM */
                <>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Different Certificate for Each Player:</strong> Every player entered in this team will receive their own personalized certificate with their individual name and Team attribution (<em>Team: {newParticipant.team_name || '...'}</em>).
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Team Name *</label>
                      <input
                        type="text"
                        required
                        value={newParticipant.team_name}
                        onChange={(e) => setNewParticipant({ ...newParticipant, team_name: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="e.g. NeuralKnights"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Department</label>
                      <select
                        value={newParticipant.department}
                        onChange={(e) => setNewParticipant({ ...newParticipant, department: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl mt-1 bg-white text-slate-800"
                      >
                        <option value="">Select Department...</option>
                        {COLLEGE_DEPARTMENTS.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Team Players Section */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        <span>Team Players / Members ({teamPlayers.length})</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddPlayerRow}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Player</span>
                      </button>
                    </div>

                    {/* Quick paste bar */}
                    <div className="flex gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        value={quickPasteText}
                        onChange={(e) => setQuickPasteText(e.target.value)}
                        placeholder="Quick paste names: e.g. Aarav Sharma, Diya Verma, Kabir Verma"
                        className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickAddPlayers();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddPlayers}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shrink-0"
                      >
                        Add to Team
                      </button>
                    </div>

                    {/* Players List */}
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {teamPlayers.map((player, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">
                              Player {idx + 1} {idx === 0 ? '(Team Leader)' : ''}
                            </span>
                            {teamPlayers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePlayerRow(idx)}
                                className="text-slate-400 hover:text-rose-500 p-1 text-xs cursor-pointer"
                                title="Remove player"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <input
                                type="text"
                                required={idx === 0}
                                value={player.name}
                                onChange={(e) => handlePlayerChange(idx, 'name', e.target.value)}
                                placeholder="Player Full Name *"
                                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={player.roll_number}
                                onChange={(e) => handlePlayerChange(idx, 'roll_number', e.target.value)}
                                placeholder="Roll No (e.g. 23BCS101)"
                                className="w-full text-xs font-mono uppercase px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <div>
                              <input
                                type="email"
                                value={player.email}
                                onChange={(e) => handlePlayerChange(idx, 'email', e.target.value)}
                                placeholder="Email (optional)"
                                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 shrink-0">
                <span className="text-[11px] text-slate-500">
                  {newParticipant.participant_type === 'team'
                    ? `${teamPlayers.filter(p => p.name.trim()).length} players will get separate certificates`
                    : '1 individual certificate'
                  }
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddParticipantModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer"
                  >
                    {newParticipant.participant_type === 'team'
                      ? `Save Team (${teamPlayers.filter(p => p.name.trim()).length} Players)`
                      : 'Save Student'
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECIDE WINNERS & RANKS MODAL */}
      {showDecideWinnersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>Decide Event Winners & Ranks</span>
                </h3>
                <p className="text-xs text-slate-500">Step 2: Assign ranks from the entered student participants</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDecideWinnersModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveDecideWinners} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-1">
                  <span>🥇 1st Place Winner</span>
                </label>
                <select
                  value={winnerSelection.firstPlaceId}
                  onChange={(e) => setWinnerSelection({ ...winnerSelection, firstPlaceId: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 border border-amber-300 rounded-xl bg-amber-50/50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- None Selected --</option>
                  {(selectedEvent?.participants || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.roll_number ? `(${p.roll_number})` : ''} {p.team_name ? `[Team: ${p.team_name}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                  <span>🥈 2nd Place Winner</span>
                </label>
                <select
                  value={winnerSelection.secondPlaceId}
                  onChange={(e) => setWinnerSelection({ ...winnerSelection, secondPlaceId: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                >
                  <option value="">-- None Selected --</option>
                  {(selectedEvent?.participants || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.roll_number ? `(${p.roll_number})` : ''} {p.team_name ? `[Team: ${p.team_name}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-1">
                  <span>🥉 3rd Place Winner</span>
                </label>
                <select
                  value={winnerSelection.thirdPlaceId}
                  onChange={(e) => setWinnerSelection({ ...winnerSelection, thirdPlaceId: e.target.value })}
                  className="w-full text-xs font-medium px-3 py-2 border border-amber-200 rounded-xl bg-amber-50/30 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- None Selected --</option>
                  {(selectedEvent?.participants || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.roll_number ? `(${p.roll_number})` : ''} {p.team_name ? `[Team: ${p.team_name}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">🏅 Runner-Up</label>
                  <select
                    value={winnerSelection.runnerUpId}
                    onChange={(e) => setWinnerSelection({ ...winnerSelection, runnerUpId: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="">-- None Selected --</option>
                    {(selectedEvent?.participants || []).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.roll_number ? `(${p.roll_number})` : ''} {p.team_name ? `[Team: ${p.team_name}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">⭐ Special Mention</label>
                  <select
                    value={winnerSelection.specialMentionId}
                    onChange={(e) => setWinnerSelection({ ...winnerSelection, specialMentionId: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="">-- None Selected --</option>
                    {(selectedEvent?.participants || []).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.roll_number ? `(${p.roll_number})` : ''} {p.team_name ? `[Team: ${p.team_name}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Team Event Automatic Sync:</span>
                </div>
                <p>When any team player is selected for an award, all teammates in that team automatically win together so every player gets their individual certificate!</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDecideWinnersModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Save Winners & Ranks</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT PARTICIPANTS MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Import Participants from File</h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload CSV or Excel file containing participant columns: Name, Roll Number, Email, Team Name, Award.
            </p>

            <form onSubmit={handleImportParticipants} className="space-y-4">
              <input
                type="file"
                required
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!importFile}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md disabled:opacity-50"
                >
                  Import File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
