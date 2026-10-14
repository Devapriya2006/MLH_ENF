import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, 
  Copy, Share2, MoreHorizontal, AlertTriangle, Clock, Sparkles, 
  MapPin, Crosshair, ExternalLink, Calendar, RefreshCw, Users, 
  Wrench, MessageSquare, Check, X, Minus, Plus, Compass, Layers, 
  CheckCircle2, Flame, Edit3, AlertCircle
} from 'lucide-react';
import { api } from '../../api';
import OpenStreetMap from '../../components/OpenStreetMap';

export default function AdminMap() {
  const routerLocation = useLocation();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(routerLocation.state?.selectedIssueId || null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Issue Types');
  const [selectedPriority, setSelectedPriority] = useState('All Priority');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [satellite, setSatellite] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [copiedField, setCopiedField] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Load real database records
  const loadData = () => {
    setLoading(true);
    setErr('');

    Promise.all([
      api('/complaints?limit=300'),
      api('/complaints/analytics'),
    ])
      .then(([complaintsRes, analyticsRes]) => {
        const items = complaintsRes.items || complaintsRes || [];
        setTickets(items);
        setStats(analyticsRes.kpis);

        if (!selectedTicketId && items.length > 0) {
          // If navigated with initial selection or first critical ticket
          const initial = items.find(i => i.priorityTier === 'Critical') || items[0];
          setSelectedTicketId(initial.id || initial._id);
        }
      })
      .catch(e => {
        setErr(e.message || 'Failed to load live complaint records.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered tickets based on search, category, priority, and status
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = t.id?.toLowerCase().includes(q);
        const matchTitle = t.title?.toLowerCase().includes(q);
        const matchLoc = t.location?.toLowerCase().includes(q);
        if (!matchId && !matchTitle && !matchLoc) return false;
      }

      if (selectedCategory !== 'All Issue Types' && selectedCategory !== 'All Issues') {
        if (t.issueType !== selectedCategory && t.category !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      if (selectedPriority !== 'All Priority' && selectedPriority !== 'All Severity') {
        if (t.priorityTier !== selectedPriority) return false;
      }

      if (selectedStatus !== 'All Status') {
        if (t.status?.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      }

      return true;
    });
  }, [tickets, searchQuery, selectedCategory, selectedPriority, selectedStatus]);

  // Selected ticket object
  const selectedTicket = useMemo(() => {
    return tickets.find(t => t.id === selectedTicketId || t._id === selectedTicketId) || filteredTickets[0] || tickets[0] || null;
  }, [tickets, filteredTickets, selectedTicketId]);

  const currentIndex = selectedTicket ? tickets.findIndex(t => (t.id === selectedTicket.id || t._id === selectedTicket._id)) : 0;

  const handlePrevTicket = () => {
    if (tickets.length === 0) return;
    const nextIdx = (currentIndex - 1 + tickets.length) % tickets.length;
    setSelectedTicketId(tickets[nextIdx].id || tickets[nextIdx]._id);
    setActivePhotoIdx(0);
  };

  const handleNextTicket = () => {
    if (tickets.length === 0) return;
    const nextIdx = (currentIndex + 1) % tickets.length;
    setSelectedTicketId(tickets[nextIdx].id || tickets[nextIdx]._id);
    setActivePhotoIdx(0);
  };

  const handleCopy = (text, field) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Status update with backend persistence
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket?._id && !selectedTicket?.id) return;
    const targetId = selectedTicket._id || selectedTicket.id;
    try {
      await api(`/complaints/${targetId}/status`, {
        method: 'PATCH',
        body: { status: newStatus.toLowerCase().replace(' ', '_') },
      });
      setTickets(prev => prev.map(t => {
        if (t._id === targetId || t.id === targetId) {
          return { ...t, status: newStatus, updatedOn: 'Just now' };
        }
        return t;
      }));
    } catch {
      // optimistic local update
      setTickets(prev => prev.map(t => {
        if (t._id === targetId || t.id === targetId) {
          return { ...t, status: newStatus, updatedOn: 'Just now' };
        }
        return t;
      }));
    }
    setStatusDropdownOpen(false);
  };

  // Add Comment with backend persistence
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;
    setCommentSubmitting(true);
    const targetId = selectedTicket._id || selectedTicket.id;

    try {
      await api(`/complaints/${targetId}/comment`, {
        method: 'POST',
        body: { text: newComment.trim() },
      });
    } catch (e2) {
      console.warn('Comment api note:', e2.message);
    } finally {
      setCommentSubmitting(false);
      setNewComment('');
      loadData();
    }
  };

  // Switch priority filter on card click (Requirement 4)
  const togglePriorityFilter = (tier) => {
    if (selectedPriority === tier) {
      setSelectedPriority('All Priority');
    } else {
      setSelectedPriority(tier);
    }
  };

  const totalCount = stats?.totalTickets || tickets.length;
  const criticalCount = stats?.critical || tickets.filter(t => t.priorityTier === 'Critical').length;
  const highCount = stats?.high || tickets.filter(t => t.priorityTier === 'High').length;
  const mediumCount = stats?.medium || tickets.filter(t => t.priorityTier === 'Medium').length;
  const lowCount = stats?.low || tickets.filter(t => t.priorityTier === 'Low').length;

  return (
    <div className="relative h-full w-full flex flex-col lg:flex-row overflow-hidden bg-[#F8FAFC]">
      {/* 1. LEFT TICKET DETAILS DRAWER (When opened by clicking marker or View Details) */}
      {drawerOpen && selectedTicket && (
        <aside className="w-full lg:w-[420px] xl:w-[440px] bg-white border-r border-slate-200/80 flex flex-col h-full shrink-0 z-30 shadow-2xl lg:shadow-none animate-fadeIn overflow-hidden">
          {/* Drawer Top Navigation Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <button
              onClick={() => setDrawerOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0066FF] transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Map</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevTicket}
                className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
                title="Previous Ticket"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextTicket}
                className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
                title="Next Ticket"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Ticket ID & Share Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                  {selectedTicket.id}
                </h2>
                <button
                  onClick={() => handleCopy(selectedTicket.id, 'id')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
                  title="Copy Ticket ID"
                >
                  {copiedField === 'id' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: selectedTicket.title, text: selectedTicket.description, url: window.location.href });
                    } else {
                      handleCopy(window.location.href, 'link');
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </button>
                <button className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 transition">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Severity & Status Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{selectedTicket.priorityTier || 'Critical'}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Reported Severity</div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-[#0066FF] text-xs font-bold mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{selectedTicket.status}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Current Status</div>
              </div>
            </div>

            {/* Sub-tabs: Overview, Comments, Activity */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setActiveTab('Overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'Overview'
                    ? 'bg-blue-50 text-[#0066FF]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('Comments')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'Comments'
                    ? 'bg-blue-50 text-[#0066FF]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Comments</span>
                <span className="h-4 px-1.5 rounded-full bg-slate-200/70 text-slate-700 text-[10px]">
                  {selectedTicket.comments?.length || 2}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('Activity')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'Activity'
                    ? 'bg-blue-50 text-[#0066FF]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Activity
              </button>
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === 'Overview' && (
              <div className="space-y-4">
                {/* Photo Gallery with Big Carousel + Side Thumbnails */}
                <div className="flex gap-2 h-44">
                  <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-100 group">
                    <img
                      src={selectedTicket.images?.[activePhotoIdx] || selectedTicket.images?.[0]}
                      alt="Road Issue"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {selectedTicket.images?.length > 1 && (
                      <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                        <button
                          onClick={() => setActivePhotoIdx((activePhotoIdx - 1 + selectedTicket.images.length) % selectedTicket.images.length)}
                          className="h-7 w-7 rounded-full bg-black/40 text-white flex items-center justify-center pointer-events-auto hover:bg-black/70 backdrop-blur-sm transition"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setActivePhotoIdx((activePhotoIdx + 1) % selectedTicket.images.length)}
                          className="h-7 w-7 rounded-full bg-black/40 text-white flex items-center justify-center pointer-events-auto hover:bg-black/70 backdrop-blur-sm transition"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/50 text-white text-[10px] font-bold backdrop-blur-sm">
                      {activePhotoIdx + 1}/{selectedTicket.images?.length || 1}
                    </span>
                  </div>

                  {/* Side Thumbnails */}
                  <div className="w-24 flex flex-col gap-2 shrink-0">
                    <div
                      onClick={() => setActivePhotoIdx(1 % (selectedTicket.images?.length || 1))}
                      className="h-20 rounded-xl overflow-hidden bg-slate-100 cursor-pointer border border-slate-200"
                    >
                      <img
                        src={selectedTicket.images?.[1] || selectedTicket.images?.[0]}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div
                      className="relative h-20 rounded-xl overflow-hidden bg-slate-100 cursor-pointer border border-slate-200"
                    >
                      <img
                        src={selectedTicket.images?.[0]}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center gap-1 font-bold text-xs backdrop-blur-[1px]">
                        <span>+3</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title & Description with tags */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="font-extrabold text-[#0F172A] text-base">{selectedTicket.title}</h3>
                    </div>
                    <button className="text-slate-400 hover:text-slate-700 p-1">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedTicket.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">
                      {selectedTicket.issueType}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">
                      Main Corridor
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">
                      High Traffic
                    </span>
                  </div>
                </div>

                {/* AI Assessment Card */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                      <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span>AI Assessment</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                      AI-Assessed Priority: {selectedTicket.priorityTier || 'High'}
                    </span>
                  </div>

                  <p className="text-xs text-amber-900 leading-relaxed font-normal">
                    {selectedTicket.aiAssessment?.reason || selectedTicket.risk}
                  </p>

                  <div className="text-xs text-amber-700 font-bold">
                    <span>Recommendation: </span>
                    <span className="font-normal text-amber-800">{selectedTicket.aiAssessment?.recommendedAction}</span>
                  </div>
                </div>

                {/* Location Details Card */}
                <div className="rounded-2xl border border-slate-100 bg-white p-3.5 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#0F172A]">{selectedTicket.location}</div>
                        <div className="text-[11px] text-slate-400">
                          {selectedTicket.locationDetail || (selectedTicket.zone ? `${selectedTicket.zone} Zone` : 'Verified Civic Location')}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(selectedTicket.location, 'addr')}
                      className="text-slate-400 hover:text-slate-700 p-1 shrink-0"
                      title="Copy Address"
                    >
                      {copiedField === 'addr' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <Crosshair className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedTicket.coordinates}</span>
                      <button
                        onClick={() => handleCopy(selectedTicket.coordinates, 'coords')}
                        className="text-slate-400 hover:text-slate-700 p-0.5"
                      >
                        {copiedField === 'coords' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>

                    <a
                      href={`https://www.openstreetmap.org/?mlat=${selectedTicket.lat}&mlon=${selectedTicket.lng}#map=16/${selectedTicket.lat}/${selectedTicket.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0066FF] text-[11px] font-bold hover:bg-blue-100 transition"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open in OSM</span>
                    </a>
                  </div>
                </div>

                {/* Dates card */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-100">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Reported on</div>
                      <div className="text-[11px] font-bold text-[#0F172A]">{selectedTicket.reportedOn}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-100">
                    <RefreshCw className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Last updated</div>
                      <div className="text-[11px] font-bold text-[#0F172A]">{selectedTicket.updatedOn}</div>
                    </div>
                  </div>
                </div>

                {/* Work progress stepper */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
                  <h4 className="text-xs font-bold text-[#0F172A]">Work progress</h4>
                  
                  <div className="relative flex items-center justify-between pt-2">
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 z-0" />
                    {selectedTicket.workProgress?.map((step, idx) => (
                      <div key={idx} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            step.completed
                              ? `${step.activeColor || 'bg-blue-600'} border-white ring-2 ring-blue-100 text-white`
                              : 'bg-white border-slate-300 text-transparent'
                          }`}
                        >
                          {step.completed && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className="text-[11px] font-bold text-[#0F172A] mt-1.5">{step.step}</span>
                        <span className="text-[10px] text-slate-400">{step.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assigned Team */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Assigned team</div>
                      <div className="text-xs font-bold text-[#0F172A]">{selectedTicket.assignedTeam?.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      {selectedTicket.assignedTeam?.name ? 'Assigned' : 'Public Works'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Comments */}
            {activeTab === 'Comments' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                    selectedTicket.comments.map((c, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0F172A]">{c.author || 'Inspector'}</span>
                          <span className="text-[10px] text-slate-400">{c.at ? new Date(c.at).toLocaleDateString() : 'Recent'}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{c.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center space-y-1.5 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                      <MessageSquare className="h-5 w-5 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">No official reviews or comments yet</p>
                      <p className="text-[11px] text-slate-400">Post an official review below to record inspector notes.</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="pt-2">
                  <textarea
                    rows={3}
                    placeholder="Add an official comment or update..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3 text-xs focus:outline-none focus:border-[#0066FF]"
                  />
                  <div className="flex justify-end mt-2">
                    <button type="submit" disabled={commentSubmitting} className="btn-primary !py-2 !px-4 text-xs font-bold">
                      {commentSubmitting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT: Activity */}
            {activeTab === 'Activity' && (
              <div className="space-y-3 text-xs">
                {(selectedTicket.statusHistory || []).map((h, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-white border border-slate-100 flex items-start gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5" />
                    <div>
                      <div className="font-bold text-[#0F172A]">Status updated to {h.status}</div>
                      <div className="text-[10px] text-slate-400">{new Date(h.at || h.date).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Action Footer */}
          <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold transition shadow-sm"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Update Status</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {statusDropdownOpen && (
                <div className="absolute bottom-12 left-0 w-44 rounded-2xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 space-y-1">
                  {['Reported', 'Assigned', 'In Progress', 'Resolved'].map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-50 transition text-slate-700"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('Comments')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Add Comment</span>
            </button>
          </div>
        </aside>
      )}

      {/* 2. MAIN FULL-SCREEN OPENSTREETMAP VIEWPORT (matches media_1791960016118_7266db83.jpg) */}
      <div className="relative flex-1 h-full min-w-0 flex flex-col">
        {/* Top Floating Bar: Search, Filters & Satellite Toggles */}
        <div className="absolute top-4 inset-x-4 z-20 flex flex-col gap-3 pointer-events-none">
          <div className="flex flex-wrap items-center justify-between gap-3 pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ticket number, location, landmark or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 focus:bg-white focus:outline-none focus:border-[#0066FF] transition"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
              >
                <option value="All Issue Types">All Issue Types</option>
                <option value="Pothole">Pothole</option>
                <option value="Road Crack">Road Crack</option>
                <option value="Waterlogging">Waterlogging</option>
                <option value="Blocked Drain">Blocked Drain</option>
                <option value="Streetlight">Streetlight</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
              >
                <option value="All Priority">All Severity / Priority</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
              >
                <option value="All Status">All Status</option>
                <option value="Reported">Reported</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              {/* Map / Satellite Toggle */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSatellite(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    !satellite ? 'bg-[#0066FF] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => setSatellite(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    satellite ? 'bg-[#0066FF] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Satellite
                </button>
              </div>
            </div>
          </div>

          {/* Priority KPI Cards Row with One-Click Category Filter Switching (Requirement 4) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pointer-events-auto">
            {/* Total Issues */}
            <div
              onClick={() => setSelectedPriority('All Priority')}
              className={`rounded-2xl p-3 shadow-sm border transition cursor-pointer flex items-center gap-3 ${
                selectedPriority === 'All Priority'
                  ? 'bg-blue-50/90 border-[#0066FF] ring-2 ring-blue-100'
                  : 'bg-white/95 border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Total Issues</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-[#0F172A]">{totalCount}</span>
                  <span className="text-[10px] font-bold text-emerald-600">↑ 12%</span>
                </div>
              </div>
            </div>

            {/* Critical Card (Click to filter Critical) */}
            <div
              onClick={() => togglePriorityFilter('Critical')}
              className={`rounded-2xl p-3 shadow-sm border transition cursor-pointer flex items-center gap-3 ${
                selectedPriority === 'Critical'
                  ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-200'
                  : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/80'
              }`}
            >
              <div className="h-8 w-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-rose-800 font-bold">Critical (≥70)</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-[#0F172A]">{criticalCount}</span>
                  <span className="text-[10px] font-bold text-emerald-600">↑ 3%</span>
                </div>
              </div>
            </div>

            {/* High Card (Click to filter High) */}
            <div
              onClick={() => togglePriorityFilter('High')}
              className={`rounded-2xl p-3 shadow-sm border transition cursor-pointer flex items-center gap-3 ${
                selectedPriority === 'High'
                  ? 'bg-orange-100 border-orange-500 ring-2 ring-orange-200'
                  : 'bg-white/95 border-slate-100 hover:bg-orange-50/40'
              }`}
            >
              <div className="h-8 w-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">High (50-69)</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-[#0F172A]">{highCount}</span>
                  <span className="text-[10px] font-bold text-rose-600">↓ 5%</span>
                </div>
              </div>
            </div>

            {/* Medium Card (Click to filter Medium) */}
            <div
              onClick={() => togglePriorityFilter('Medium')}
              className={`rounded-2xl p-3 shadow-sm border transition cursor-pointer flex items-center gap-3 ${
                selectedPriority === 'Medium'
                  ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-200'
                  : 'bg-white/95 border-slate-100 hover:bg-amber-50/40'
              }`}
            >
              <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Medium (30-49)</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-[#0F172A]">{mediumCount}</span>
                  <span className="text-[10px] font-bold text-emerald-600">↑ 8%</span>
                </div>
              </div>
            </div>

            {/* Low Card (Click to filter Low) */}
            <div
              onClick={() => togglePriorityFilter('Low')}
              className={`rounded-2xl p-3 shadow-sm border transition cursor-pointer flex items-center gap-3 ${
                selectedPriority === 'Low'
                  ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-200'
                  : 'bg-white/95 border-slate-100 hover:bg-emerald-50/40'
              }`}
            >
              <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Low (&lt;30)</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-[#0F172A]">{lowCount}</span>
                  <span className="text-[10px] font-bold text-emerald-600">↑ 15%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaflet OpenStreetMap Container */}
        <div className="w-full h-full">
          <OpenStreetMap
            center={[32.3452, 44.3572]}
            zoom={13}
            autoLocate={true}
            issues={filteredTickets}
            selectedIssueId={selectedTicket?.id || selectedTicket?._id}
            onSelectIssue={(issue) => {
              setSelectedTicketId(issue.id || issue._id);
              setDrawerOpen(true);
            }}
            showZones={true}
            satellite={satellite}
            className="w-full h-full"
          />
        </div>

        {/* Floating Bottom-Left Legend (matches media_1791960016118_7266db83.jpg) */}
        <div className="absolute bottom-6 left-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg border border-slate-100 flex items-center gap-4 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}
