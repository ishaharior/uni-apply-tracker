'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppData, University, Department, Professor, FilterOptions, OutreachRecord, MastersCourse } from '@/types';
import { isOverdueFollowup, getCountryFlag } from '@/lib/utils';
import Header from '@/components/Header';
import StatsDashboard from '@/components/StatsDashboard';
import FilterBar from '@/components/FilterBar';
import UniversityCard from '@/components/UniversityCard';
import StatusModal from '@/components/StatusModal';
import MastersCoursesSection from '@/components/MastersCoursesSection';
import {
  UniversityModal,
  DepartmentModal,
  ProfessorModal,
} from '@/components/EntityModals';
import EmailTemplatesModal from '@/components/EmailTemplatesModal';
import ActivityModal from '@/components/ActivityModal';
import DetailModal from '@/components/DetailModal';
import { Plus, Building2, RefreshCw, List, Globe2, GraduationCap, ChevronsDown } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'my-list' | 'public' | 'masters'>('my-list');
  const [collapseToken, setCollapseToken] = useState(0);

  // Filter State
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    country: 'all',
    statusFilter: 'all',
    needsFollowUp: false,
    degreeLevel: 'all',
    visibility: 'all',
  });

  // Modal States
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    professor: Professor | null;
  }>({
    isOpen: false,
    professor: null,
  });

  const [uniModal, setUniModal] = useState<{
    isOpen: boolean;
    editingUniversity: University | null;
  }>({
    isOpen: false,
    editingUniversity: null,
  });

  const [deptModal, setDeptModal] = useState<{
    isOpen: boolean;
    universityId: string;
    universityName: string;
    editingDepartment: Department | null;
  }>({
    isOpen: false,
    universityId: '',
    universityName: '',
    editingDepartment: null,
  });

  const [profModal, setProfModal] = useState<{
    isOpen: boolean;
    universityId: string;
    departmentId: string;
    departmentName: string;
    editingProfessor: Professor | null;
  }>({
    isOpen: false,
    universityId: '',
    departmentId: '',
    departmentName: '',
    editingProfessor: null,
  });

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<{
    professor: Professor | null;
    course: MastersCourse | null;
  }>({ professor: null, course: null });

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }, [router]);

  // Fetch my private data from server API
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute unique countries
  const countries = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.universities.forEach((u) => {
      if (u.country) set.add(u.country);
    });
    return Array.from(set).sort();
  }, [data]);

  // Filter Engine — only my outreach is ever considered
  const filteredUniversities = useMemo(() => {
    if (!data) return [];
    const q = filters.searchQuery.trim().toLowerCase();

    return data.universities
      .map((uni) => {
        if (filters.country !== 'all' && uni.country !== filters.country) {
          return null;
        }

        const uniMatchesQuery =
          q === '' ||
          uni.name.toLowerCase().includes(q) ||
          uni.city.toLowerCase().includes(q) ||
          uni.country.toLowerCase().includes(q);

        const matchingDepartments = uni.departments
          .map((dept) => {
            const deptMatchesQuery = q === '' || dept.name.toLowerCase().includes(q);

            const matchingProfessors = dept.professors.filter((prof) => {
              // Tab scope: My List = private + own + added; Public = all public
              if (viewTab === 'my-list' && !(prof.onMyList || prof.ownerId === data.me.id)) {
                return false;
              }
              if (viewTab === 'public' && prof.visibility !== 'public') {
                return false;
              }

              const profMatchesQuery =
                q === '' ||
                uniMatchesQuery ||
                deptMatchesQuery ||
                prof.name.toLowerCase().includes(q) ||
                prof.title.toLowerCase().includes(q) ||
                prof.email.toLowerCase().includes(q) ||
                prof.researchAreas.some((area) => area.toLowerCase().includes(q));

              if (!profMatchesQuery) return false;

              // Visibility filter (server already hides others' private profs)
              if (filters.visibility === 'public' && prof.visibility !== 'public') {
                return false;
              }
              if (filters.visibility === 'private' && prof.visibility !== 'private') {
                return false;
              }

              // Status filter — my status only
              const myStatus = prof.myOutreach?.status || 'not_contacted';
              if (filters.statusFilter !== 'all' && myStatus !== filters.statusFilter) {
                return false;
              }

              // Overdue Follow-up Filter — my outreach only
              if (filters.needsFollowUp) {
                if (!isOverdueFollowup(prof.myOutreach?.dateEmailed, prof.myOutreach?.status)) {
                  return false;
                }
              }

              return true;
            });

            if (matchingProfessors.length === 0 && !deptMatchesQuery && !uniMatchesQuery) {
              return null;
            }

            return {
              ...dept,
              professors: matchingProfessors,
            };
          })
          .filter(Boolean) as Department[];

        if (matchingDepartments.length === 0 && !uniMatchesQuery) {
          return null;
        }

        return {
          ...uni,
          departments: matchingDepartments,
        };
      })
      .filter(Boolean) as University[];
  }, [data, filters, viewTab]);

  // Personal stats always reflect My List only
  const myListUniversities = useMemo(() => {
    if (!data) return [];
    return data.universities
      .map((uni) => ({
        ...uni,
        departments: uni.departments.map((dept) => ({
          ...dept,
          professors: dept.professors.filter((p) => p.onMyList || p.ownerId === data.me.id),
        })),
      }))
      .filter((uni) => uni.departments.some((d) => d.professors.length > 0));
  }, [data]);

  // Topology: group filtered universities under Country sections
  const groupedByCountry = useMemo(() => {
    const map = new Map<string, University[]>();
    filteredUniversities.forEach((uni) => {
      const key = uni.country || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(uni);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredUniversities]);

  const countryProgress = useCallback((unis: University[]) => {
    let total = 0;
    let contacted = 0;
    unis.forEach((u) =>
      u.departments.forEach((d) =>
        d.professors.forEach((p) => {
          total += 1;
          if (p.myOutreach && p.myOutreach.status !== 'not_contacted') contacted += 1;
        })
      )
    );
    return { total, contacted, percent: total > 0 ? Math.round((contacted / total) * 100) : 0 };
  }, []);

  // Compute total filtered professors
  const totalFilteredProfessors = useMemo(() => {
    let count = 0;
    filteredUniversities.forEach((u) => {
      u.departments.forEach((d) => {
        count += d.professors.length;
      });
    });
    return count;
  }, [filteredUniversities]);

  /* -------------------------------------------------------------
   * DISPATCH ACTIONS (identity comes from session, never client)
   * ----------------------------------------------------------- */
  const dispatchAction = useCallback(
    async (action: string, payload: unknown): Promise<boolean> => {
      try {
        const res = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });
        if (res.status === 401) {
          router.replace('/login');
          return false;
        }
        const resJson = await res.json();
        if (resJson.success && resJson.data) {
          setData(resJson.data);
          return true;
        }
        return false;
      } catch (err) {
        console.error(`Failed executing ${action}:`, err);
        return false;
      }
    },
    [router]
  );

  const handleSaveStatus = async (
    professorId: string,
    record: Partial<OutreachRecord>
  ) => {
    await dispatchAction('UPDATE_OUTREACH', { professorId, record });
  };

  const handleSaveUniversity = async (uniData: Partial<University>) => {
    if (uniModal.editingUniversity) {
      await dispatchAction('UPDATE_UNIVERSITY', {
        id: uniModal.editingUniversity.id,
        updates: uniData,
      });
    } else {
      await dispatchAction('ADD_UNIVERSITY', uniData);
    }
  };

  const handleDeleteUniversity = async (id: string) => {
    if (confirm('Are you sure you want to delete this university and all its departments?')) {
      await dispatchAction('DELETE_UNIVERSITY', { id });
    }
  };

  const handleSaveDepartment = async (universityId: string, deptData: Partial<Department>) => {
    if (deptModal.editingDepartment) {
      await dispatchAction('UPDATE_DEPARTMENT', {
        universityId,
        departmentId: deptModal.editingDepartment.id,
        updates: deptData,
      });
    } else {
      await dispatchAction('ADD_DEPARTMENT', {
        universityId,
        department: deptData,
      });
    }
  };

  const handleDeleteDepartment = async (universityId: string, departmentId: string) => {
    if (confirm('Delete this department and all professors under it?')) {
      await dispatchAction('DELETE_DEPARTMENT', { universityId, departmentId });
    }
  };

  const handleSaveProfessor = async (
    universityId: string,
    departmentId: string,
    profData: Partial<Professor>
  ) => {
    if (profModal.editingProfessor) {
      await dispatchAction('UPDATE_PROFESSOR', {
        universityId,
        departmentId,
        professorId: profModal.editingProfessor.id,
        updates: profData,
      });
    } else {
      await dispatchAction('ADD_PROFESSOR', {
        universityId,
        departmentId,
        professor: profData,
      });
    }
  };

  const handleDeleteProfessor = async (
    universityId: string,
    departmentId: string,
    professorId: string
  ) => {
    if (confirm('Delete this professor from tracking?')) {
      await dispatchAction('DELETE_PROFESSOR', { universityId, departmentId, professorId });
    }
  };

  const handleToggleProfessorVisibility = async (professor: Professor) => {
    const makingPrivate = professor.visibility !== 'private';
    const message = makingPrivate
      ? `Make "${professor.name}" private? Other users will no longer see this professor.`
      : `Make "${professor.name}" public? All users will be able to see this professor.`;
    if (!confirm(message)) return;

    const dept = data?.universities
      .flatMap((u) => u.departments)
      .find((d) => d.id === professor.departmentId);
    if (!dept) return;

    await dispatchAction('UPDATE_PROFESSOR', {
      universityId: dept.universityId,
      departmentId: professor.departmentId,
      professorId: professor.id,
      updates: { visibility: makingPrivate ? 'private' : 'public' },
    });
  };

  const handleToggleList = async (professor: Professor) => {
    if (!data) return;
    if (professor.ownerId === data.me.id) return;

    if (professor.onMyList) {
      if (confirm(`Remove "${professor.name}" from your list?`)) {
        await dispatchAction('REMOVE_FROM_LIST', { professorId: professor.id });
      }
    } else {
      await dispatchAction('ADD_TO_LIST', { professorId: professor.id });
    }
  };

  const handleSaveMastersCourse = async (courseData: Partial<MastersCourse>, editingId?: string) => {
    if (editingId) {
      await dispatchAction('UPDATE_MASTERS_COURSE', { id: editingId, updates: courseData });
    } else {
      await dispatchAction('ADD_MASTERS_COURSE', courseData);
    }
  };

  const handleDeleteMastersCourse = async (id: string) => {
    if (confirm('Delete this Master’s course?')) {
      await dispatchAction('DELETE_MASTERS_COURSE', { id });
    }
  };

  const handleToggleMastersVisibility = async (course: MastersCourse) => {
    const makingPublic = course.visibility !== 'public';
    const msg = makingPublic
      ? `Share "${course.universityName} — ${course.departmentName}" publicly? All users will see it under Public Professors.`
      : `Make "${course.universityName} — ${course.departmentName}" private? Other users will no longer see it.`;
    if (!confirm(msg)) return;
    await dispatchAction('TOGGLE_MASTERS_COURSE_VISIBILITY', { id: course.id });
  };

  const handleExportData = () => {
    if (!data) return;
    const legacy = {
      version: data.version,
      friends: {
        [data.me.username]: {
          id: data.me.username,
          name: data.me.name,
          role: data.me.role,
          avatar: data.me.avatar,
          color: data.me.color,
          glowColor: data.me.glowColor,
          accentBg: data.me.accentBg,
        },
      },
      universities: data.universities.map((uni) => ({
        ...uni,
        departments: uni.departments.map((dept) => ({
          ...dept,
          professors: dept.professors.map((prof) => ({
            id: prof.id,
            departmentId: prof.departmentId,
            name: prof.name,
            title: prof.title,
            email: prof.email,
            websiteUrl: prof.websiteUrl,
            scholarUrl: prof.scholarUrl,
            researchAreas: prof.researchAreas,
            acceptingStudents: prof.acceptingStudents,
            notes: prof.notes,
            createdAt: prof.createdAt,
            outreach: prof.myOutreach
              ? {
                  [data.me.username]: {
                    friendId: data.me.username,
                    status: prof.myOutreach.status,
                    dateEmailed: prof.myOutreach.dateEmailed,
                    responseDate: prof.myOutreach.responseDate,
                    followUpDate: prof.myOutreach.followUpDate,
                    notes: prof.myOutreach.notes,
                    emailSubject: prof.myOutreach.emailSubject,
                    lastUpdated: prof.myOutreach.lastUpdated,
                  },
                }
              : {},
          })),
        })),
      })),
      activityLogs: data.activityLogs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        friendId: data.me.username,
        action: log.action,
        description: log.description,
        metadata: log.metadata,
      })),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(legacy, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `uni-apply-backup-${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetDemoData = async () => {
    if (confirm('Reset tracker data to initial demo state? (This replaces the shared catalog.)')) {
      await dispatchAction('RESET_DATA', {});
    }
  };

  if (loading || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', padding: '120px 0' }}>
          <RefreshCw size={32} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '14px', color: 'var(--text-secondary)' }}>
            Loading your private tracker...
          </p>
        </div>
      </div>
    );
  }

  const me = data.me;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Header
        me={me}
        onLogout={handleLogout}
        onOpenAddUniversity={() => setUniModal({ isOpen: true, editingUniversity: null })}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onOpenActivity={() => setActivityOpen(true)}
        onExportData={handleExportData}
        onResetDemoData={handleResetDemoData}
        activityCount={data.activityLogs?.length || 0}
      />

      {/* Main Container */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '14px 16px 48px', width: '100%', flex: 1 }}>
        {/* Personal Progress Dashboard — private to me (My List only) */}
        <StatsDashboard universities={myListUniversities} me={me} />

        {/* View tabs: My List / Public catalog */}
        <div
          className="glass-panel"
          style={{
            display: 'flex',
            gap: '6px',
            padding: '6px 8px',
            marginBottom: '10px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setViewTab('my-list')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '30px',
              padding: '0 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: viewTab === 'my-list' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${viewTab === 'my-list' ? '#818cf8' : 'var(--border-subtle)'}`,
              color: viewTab === 'my-list' ? '#c7d2fe' : 'var(--text-secondary)',
            }}
          >
            <List size={14} />
            <span>My List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('public')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '30px',
              padding: '0 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: viewTab === 'public' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${viewTab === 'public' ? '#38bdf8' : 'var(--border-subtle)'}`,
              color: viewTab === 'public' ? '#bae6fd' : 'var(--text-secondary)',
            }}
          >
            <Globe2 size={14} />
            <span>Public Professors</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('masters')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '30px',
              padding: '0 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: viewTab === 'masters' ? 'rgba(251, 191, 36, 0.18)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${viewTab === 'masters' ? '#fbbf24' : 'var(--border-subtle)'}`,
              color: viewTab === 'masters' ? '#fde68a' : 'var(--text-secondary)',
            }}
          >
            <GraduationCap size={14} />
            <span>Master&apos;s Courses</span>
          </button>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
            {viewTab === 'my-list'
              ? 'Private + your professors + ones you added'
              : viewTab === 'public'
                ? 'Public professors + shared Master’s courses'
                : 'Your Regular Master’s courses — share with Public button'}
          </span>
        </div>

        {/* Master's Courses — personal management */}
        {viewTab === 'masters' && (
          <MastersCoursesSection
            courses={data.mastersCourses || []}
            me={me}
            mode="manage"
            onSave={handleSaveMastersCourse}
            onDelete={handleDeleteMastersCourse}
            onToggleVisibility={handleToggleMastersVisibility}
            onOpenDetail={(course) => setDetailModal({ professor: null, course })}
          />
        )}

        {/* Filter & Search Bar — professor views only */}
        {viewTab !== 'masters' && (
          <FilterBar
            filters={filters}
            onChangeFilters={setFilters}
            countries={countries}
            totalFilteredProfessors={totalFilteredProfessors}
          />
        )}

        {/* Public Master's courses section (on Public tab) */}
        {viewTab === 'public' && (
          <MastersCoursesSection
            courses={data.mastersCourses || []}
            me={me}
            mode="public"
            onSave={handleSaveMastersCourse}
            onDelete={handleDeleteMastersCourse}
            onToggleVisibility={handleToggleMastersVisibility}
            onOpenDetail={(course) => setDetailModal({ professor: null, course })}
          />
        )}

        {/* Topology: Country → Universities (hidden on masters tab) */}
        {viewTab !== 'masters' && (groupedByCountry.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Collapse all universities + departments */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ height: '28px', padding: '0 10px', fontSize: '0.72rem' }}
                onClick={() => setCollapseToken((token) => token + 1)}
                title="Collapse every university and department"
              >
                <ChevronsDown size={13} />
                <span>Collapse all</span>
              </button>
            </div>
            {groupedByCountry.map(([country, unis]) => {
              const progress = countryProgress(unis);
              return (
                <section key={country} style={{ marginBottom: '4px' }}>
                  {/* Country section header — compact spreadsheet group bar */}
                  <div
                    style={{
                      padding: '7px 12px',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexWrap: 'wrap',
                      background: '#0e0e12',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{getCountryFlag(country)}</span>
                    <h2
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: 0,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {country}
                    </h2>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {unis.length} university{unis.length === 1 ? '' : 'ies'} ·{' '}
                      {progress.total} professor{progress.total === 1 ? '' : 's'}
                    </span>

                    {/* My per-country progress — compact inline bar */}
                    <div
                      style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: '160px',
                      }}
                      title={`${progress.contacted} of ${progress.total} professors contacted by you`}
                    >
                      <div
                        style={{
                          width: '100px',
                          height: '5px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(255, 255, 255, 0.06)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${progress.percent}%`,
                            height: '100%',
                            background: me.color,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: me.color,
                          minWidth: '56px',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {progress.contacted}/{progress.total}
                      </span>
                    </div>
                  </div>

                  {/* Universities in this country */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {unis.map((uni) => (
                      <UniversityCard
                        key={uni.id}
                        university={uni}
                        me={me}
                        defaultExpanded={groupedByCountry.length === 1}
                        collapseToken={collapseToken}
                        onOpenAddDepartment={(uniId) =>
                          setDeptModal({
                            isOpen: true,
                            universityId: uniId,
                            universityName: uni.name,
                            editingDepartment: null,
                          })
                        }
                        onOpenAddProfessor={(uniId, deptId) => {
                          const dept = uni.departments.find((d) => d.id === deptId);
                          setProfModal({
                            isOpen: true,
                            universityId: uniId,
                            departmentId: deptId,
                            departmentName: dept?.name || 'Department',
                            editingProfessor: null,
                          });
                        }}
                        onOpenStatusModal={(professor) =>
                          setStatusModal({
                            isOpen: true,
                            professor,
                          })
                        }
                        onOpenDetail={(professor) => setDetailModal({ professor, course: null })}
                        onEditUniversity={(targetUni) =>
                          setUniModal({ isOpen: true, editingUniversity: targetUni })
                        }
                        onDeleteUniversity={handleDeleteUniversity}
                        onEditDepartment={(targetDept) =>
                          setDeptModal({
                            isOpen: true,
                            universityId: uni.id,
                            universityName: uni.name,
                            editingDepartment: targetDept,
                          })
                        }
                        onDeleteDepartment={handleDeleteDepartment}
                        onEditProfessor={(targetProf) => {
                          const dept = uni.departments.find((d) => d.id === targetProf.departmentId);
                          setProfModal({
                            isOpen: true,
                            universityId: uni.id,
                            departmentId: targetProf.departmentId,
                            departmentName: dept?.name || '',
                            editingProfessor: targetProf,
                          });
                        }}
                        onDeleteProfessor={handleDeleteProfessor}
                        onToggleProfessorVisibility={handleToggleProfessorVisibility}
                        onToggleProfessorList={handleToggleList}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div
            className="glass-panel"
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Building2 size={44} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {viewTab === 'my-list'
                ? 'No professors on your list yet'
                : 'No matching public professors found'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px' }}>
              {viewTab === 'my-list'
                ? 'Open the Public Professors tab to browse the shared catalog and add professors to your list.'
                : 'Try clearing your search criteria, or add a new university to start tracking.'}
            </p>
            {viewTab === 'my-list' ? (
              <button className="btn btn-primary" onClick={() => setViewTab('public')}>
                <Globe2 size={16} />
                <span>Browse Public Professors</span>
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setUniModal({ isOpen: true, editingUniversity: null })}
              >
                <Plus size={16} />
                <span>Add First University</span>
              </button>
            )}
          </div>
        ))}
      </main>

      {/* MODALS */}
      {/* 1. Status Update Modal (my status only) */}
      <StatusModal
        isOpen={statusModal.isOpen}
        professor={statusModal.professor}
        me={me}
        onClose={() => setStatusModal({ isOpen: false, professor: null })}
        onSaveStatus={handleSaveStatus}
      />

      {/* 2. University Modal */}
      <UniversityModal
        isOpen={uniModal.isOpen}
        editingUniversity={uniModal.editingUniversity}
        onClose={() => setUniModal({ isOpen: false, editingUniversity: null })}
        onSave={handleSaveUniversity}
      />

      {/* 3. Department Modal */}
      <DepartmentModal
        isOpen={deptModal.isOpen}
        universityId={deptModal.universityId}
        universityName={deptModal.universityName}
        editingDepartment={deptModal.editingDepartment}
        onClose={() =>
          setDeptModal({
            isOpen: false,
            universityId: '',
            universityName: '',
            editingDepartment: null,
          })
        }
        onSave={handleSaveDepartment}
      />

      {/* 4. Professor Modal */}
      <ProfessorModal
        isOpen={profModal.isOpen}
        universityId={profModal.universityId}
        departmentId={profModal.departmentId}
        departmentName={profModal.departmentName}
        editingProfessor={profModal.editingProfessor}
        onClose={() =>
          setProfModal({
            isOpen: false,
            universityId: '',
            departmentId: '',
            departmentName: '',
            editingProfessor: null,
          })
        }
        onSave={handleSaveProfessor}
      />

      {/* 5. Cold Email Templates Modal */}
      <EmailTemplatesModal
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
      />

      {/* 6. My Activity Timeline Modal */}
      <ActivityModal
        isOpen={activityOpen}
        onClose={() => setActivityOpen(false)}
        logs={data.activityLogs || []}
        me={me}
      />

      {/* 7. Detail Modal (professor / masters course description) */}
      <DetailModal
        professor={detailModal.professor}
        course={detailModal.course}
        onClose={() => setDetailModal({ professor: null, course: null })}
      />
    </div>
  );
}
