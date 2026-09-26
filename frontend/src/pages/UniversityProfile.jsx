import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Edit3, 
  ExternalLink, 
  RefreshCw, 
  Tag,
  ShieldCheck,
  Building2
} from 'lucide-react';
import api from '../services/api';
import BottomSheet from '../components/common/BottomSheet';

const UniversityProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [deptTags, setDeptTags] = useState([]);

  const loadProfile = () => {
    setLoading(true);
    api.get('/university/profile')
      .then(res => setProfile(res.data))
      .catch(err => console.error("Error loading university profile", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleTriggerImport = async () => {
    setImporting(true);
    try {
      const res = await api.post('/university/profile/import');
      alert(`Success: ${res.data.message}`);
      loadProfile();
    } catch (err) {
      alert("Import error: " + (err.response?.data?.detail || err.message));
    } finally {
      setImporting(false);
    }
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setDeptTags([...dept.discipline_tags]);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !deptTags.includes(newTag.trim())) {
      setDeptTags([...deptTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setDeptTags(deptTags.filter(t => t !== tagToRemove));
  };

  const handleSaveDepartment = async () => {
    if (!editingDept) return;
    try {
      await api.patch(`/university/departments/${editingDept.id}`, {
        discipline_tags: deptTags,
        faculty_profiles: editingDept.faculty_profiles.map(f => ({
          name: f.name,
          expertise_tags: f.expertise_tags,
          public_profile_url: f.public_profile_url,
          verified: true
        }))
      });
      setEditingDept(null);
      loadProfile();
    } catch (err) {
      alert("Error saving department: " + (err.response?.data?.detail || err.message));
    }
  };

  const getSourceBadge = (source) => {
    switch (source) {
      case 'shodhganga_import':
        return <span className="bg-amber/15 text-amber border border-amber-border text-[10px] font-bold px-2 py-0.5 rounded uppercase">Shodhganga Theses Import</span>;
      case 'scholar_import':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-400/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Google Scholar Scan</span>;
      case 'aishe_import':
        return <span className="bg-purple-500/15 text-purple-400 border border-purple-400/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">AISHE Catalog</span>;
      case 'manual_review':
        return (
          <span className="bg-green/15 text-green border border-green-border text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center space-x-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-green" />
            <span>HEI Verified</span>
          </span>
        );
      default:
        return <span className="bg-white/[0.06] text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{source}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Profile Completeness */}
      {profile && (
        <div className="panel-glass p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-teal uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Research Graph & Faculty Expertise Provenance</span>
            </div>
            <h1 className="text-2xl font-heading font-extrabold text-white">
              {profile.name} — Expertise Graph
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Automated institutional knowledge ingestion from Shodhganga electronic theses, Google Scholar, and AISHE. Verify or correct tags to maximize challenge matching accuracy.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Completeness Meter */}
            <div className="stat-glass p-3.5 rounded-xl min-w-[170px]">
              <div className="flex justify-between items-center text-xs font-bold text-white mb-1.5">
                <span>Completeness</span>
                <span>{Math.round(profile.profile_completeness_score)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal h-full rounded-full transition-all duration-500" 
                  style={{ width: `${profile.profile_completeness_score}%` }}
                ></div>
              </div>
            </div>

            {/* Re-import Button */}
            <button
              onClick={handleTriggerImport}
              disabled={importing}
              className="px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs transition-colors shadow-float flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal ${importing ? 'animate-spin' : ''}`} />
              <span>{importing ? 'Ingesting...' : 'Re-sync Shodhganga'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Departments & Faculty Graph Cards */}
      <div className="space-y-6">
        <h2 className="text-lg font-heading font-extrabold text-white">
          Academic Departments & Verified Faculty Profiles
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading institutional expertise graph...</div>
        ) : profile?.departments?.length === 0 ? (
          <div className="empty-glass text-center space-y-3">
            <Layers className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">No departments cataloged yet</h3>
            <p className="text-xs text-slate-500">Run the automated Shodhganga import to bootstrap your university's departments.</p>
            <button
              onClick={handleTriggerImport}
              className="px-4 py-2 rounded-xl bg-teal text-navy font-bold text-xs hover:bg-teal-hover transition-colors"
            >
              Trigger Initial Ingestion
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {profile?.departments?.map(dept => (
              <div 
                key={dept.id}
                className="card-glass space-y-6"
              >
                {/* Department Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-heading font-bold text-base text-white">
                        {dept.name}
                      </h3>
                      {getSourceBadge(dept.source)}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Last synchronized: {new Date(dept.last_updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <button
                    onClick={() => openEditModal(dept)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] text-slate-200 font-semibold text-xs border border-white/10 flex items-center space-x-1.5 self-start sm:self-auto transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-teal" />
                    <span>Edit Tags & Verify</span>
                  </button>
                </div>

                {/* Discipline Tags */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Research Discipline Tags (Used by Matching Engine)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {dept.discipline_tags?.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="bg-teal/15 text-teal font-semibold text-xs px-2.5 py-1 rounded-lg border border-teal/30 flex items-center space-x-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-teal" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Faculty Profiles Grid */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                    Faculty Researchers ({dept.faculty_profiles?.length || 0})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {dept.faculty_profiles?.map(fac => (
                      <div 
                        key={fac.id}
                        className="p-3.5 rounded-xl stat-glass space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-xs text-white">{fac.name}</div>
                          {fac.verified ? (
                            <span className="text-green text-[10px] font-bold flex items-center space-x-0.5">
                              <CheckCircle2 className="w-3 h-3 text-green" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="text-amber text-[10px] font-bold">Unverified</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {fac.expertise_tags?.map((et, i) => (
                            <span key={i} className="text-[10px] bg-white/[0.06] border border-white/10 px-1.5 py-0.5 rounded text-slate-300">
                              {et}
                            </span>
                          ))}
                        </div>

                        {fac.public_profile_url && (
                          <a
                            href={fac.public_profile_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-teal font-semibold hover:underline flex items-center space-x-1 pt-1"
                          >
                            <span>Scholar Profile</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Department Modal */}
      {editingDept && (
        <BottomSheet
          isOpen={Boolean(editingDept)}
          onClose={() => setEditingDept(null)}
          title={`Edit Tags: ${editingDept.name}`}
          subtitle="Correct expertise keywords to raise matching precision"
          badge="Faculty Graph Curation"
          icon={Edit3}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Discipline Expertise Tags
              </label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {deptTags.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="bg-white/[0.06] border border-white/15 text-xs px-2.5 py-1 rounded-md text-white flex items-center space-x-1.5"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-red font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="Add research topic (e.g. Arsenic Mitigation)"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-white/15 text-xs focus:outline-none focus:ring-2 focus:ring-teal"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-1.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-light"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-green/15 border border-green-border text-green text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green" />
              <span>Saving will mark this department and its faculty profiles as HEI Verified (source: manual_review).</span>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] text-slate-300 text-xs font-semibold hover:bg-white/[0.12]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDepartment}
                className="px-5 py-2 rounded-xl bg-teal text-navy font-bold text-xs hover:bg-teal-hover transition-all shadow-float"
              >
                Confirm & Verify Graph
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default UniversityProfile;
