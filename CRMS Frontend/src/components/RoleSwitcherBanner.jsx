import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, ShieldCheck, UserCheck, MapPin, 
  ChevronDown, User, Sparkles, Check
} from 'lucide-react';

export default function RoleSwitcherBanner() {
  const { user, role, switchRole, demoUsers, loading } = useAuth();

  const [locationOpen, setLocationOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);

  const locationRef = useRef(null);
  const roleRef = useRef(null);
  const staffRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setRoleOpen(false);
      }
      if (staffRef.current && !staffRef.current.contains(e.target)) {
        setStaffOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Preset Locations
  const locations = [
    { id: 'HQ', name: 'Headquarters (Treasury)', city: 'Central Treasury', code: 'HQ-01', isHQ: true },
    { id: 'BLR', name: 'Bangalore South Branch', city: 'Bangalore', code: 'BR-BLR-01' },
    { id: 'BOM', name: 'Mumbai Central Branch', city: 'Mumbai', code: 'BR-BOM-01' },
    { id: 'DEL', name: 'Delhi NCR Branch', city: 'Gurugram', code: 'BR-DEL-01' },
    { id: 'HYD', name: 'Hyderabad Cyberabad', city: 'Hyderabad', code: 'BR-HYD-01' },
    { id: 'MAA', name: 'Chennai Marina Branch', city: 'Chennai', code: 'BR-MAA-01' },
    { id: 'PNQ', name: 'Pune Hinjewadi Branch', city: 'Pune', code: 'BR-PNQ-01' },
    { id: 'CCU', name: 'Kolkata Salt Lake', city: 'Kolkata', code: 'BR-CCU-01' },
  ];

  const rolesList = [
    { id: 'COLLECTION_AGENT', name: 'Field Agent', icon: UserCheck, desc: 'Territory Cash Collection' },
    { id: 'BRANCH_MANAGER', name: 'Branch Manager', icon: Building2, desc: 'Vault & Physical Handover' },
    { id: 'FINANCE_ADMIN', name: 'Finance HQ', icon: ShieldCheck, desc: 'Central Treasury & Settlement' },
  ];

  // Determine current active location
  const currentLocation = useMemo(() => {
    if (!user) return locations[1]; // default BLR
    if (user.role === 'FINANCE_ADMIN' || !user.branch) {
      return locations[0]; // HQ
    }
    const found = locations.find(l => 
      l.city?.toLowerCase() === user.branch_city?.toLowerCase() ||
      l.code?.toLowerCase() === user.branch_code?.toLowerCase() ||
      user.branch_name?.toLowerCase().includes(l.city?.toLowerCase())
    );
    return found || locations[1];
  }, [user]);

  // Current staff members in this location
  const staffInCurrentLocation = useMemo(() => {
    if (!demoUsers || demoUsers.length === 0) return [];
    if (currentLocation.isHQ) {
      return demoUsers.filter(u => u.role === 'FINANCE_ADMIN');
    }
    return demoUsers.filter(u => 
      u.branch_city?.toLowerCase() === currentLocation.city?.toLowerCase() ||
      u.branch_code?.toLowerCase() === currentLocation.code?.toLowerCase()
    );
  }, [demoUsers, currentLocation]);

  // Handler: Change location
  const handleSelectLocation = (loc) => {
    setLocationOpen(false);
    if (loc.isHQ) {
      switchRole('FINANCE_ADMIN');
      return;
    }

    // Try finding matching user with current role in target city
    const targetRole = role === 'FINANCE_ADMIN' ? 'COLLECTION_AGENT' : role;
    const match = (demoUsers || []).find(u => 
      (u.branch_city?.toLowerCase() === loc.city?.toLowerCase() || u.branch_code?.toLowerCase() === loc.code?.toLowerCase()) &&
      u.role === targetRole
    );

    if (match) {
      switchRole(match.username);
    } else {
      const anyInLoc = (demoUsers || []).find(u => 
        u.branch_city?.toLowerCase() === loc.city?.toLowerCase() || u.branch_code?.toLowerCase() === loc.code?.toLowerCase()
      );
      if (anyInLoc) {
        switchRole(anyInLoc.username);
      }
    }
  };

  // Handler: Change role
  const handleSelectRole = (newRole) => {
    setRoleOpen(false);
    if (newRole === 'FINANCE_ADMIN') {
      switchRole('FINANCE_ADMIN');
      return;
    }

    const searchCity = currentLocation.isHQ ? 'Bangalore' : currentLocation.city;
    const match = (demoUsers || []).find(u => 
      u.branch_city?.toLowerCase() === searchCity?.toLowerCase() &&
      u.role === newRole
    );

    if (match) {
      switchRole(match.username);
    } else {
      switchRole(newRole);
    }
  };

  // Handler: Change specific staff
  const handleSelectStaff = (username) => {
    setStaffOpen(false);
    switchRole(username);
  };

  const CurrentRoleIcon = role === 'BRANCH_MANAGER' ? Building2 : role === 'FINANCE_ADMIN' ? ShieldCheck : UserCheck;

  return (
    <div className="role-banner">
      <div className="role-banner-inner">
        {/* Left Section: 3 Connected Dropdowns */}
        <div className="role-dropdowns-group">
          <div className="banner-badge-title">
            <Sparkles size={13} className="sparkle-icon" />
            <span>SWITCH PERSONA</span>
          </div>

          {/* 1. Location / City / HQ Dropdown */}
          <div className="custom-dropdown-container" ref={locationRef}>
            <button
              type="button"
              className={`dropdown-trigger-btn ${locationOpen ? 'is-open' : ''}`}
              onClick={() => {
                setLocationOpen(!locationOpen);
                setRoleOpen(false);
                setStaffOpen(false);
              }}
              disabled={loading}
              title="Select City or Headquarters"
            >
              <div className="dropdown-trigger-icon loc-icon">
                {currentLocation.isHQ ? <Building2 size={14} /> : <MapPin size={14} />}
              </div>
              <div className="dropdown-trigger-content">
                <span className="dropdown-trigger-label">LOCATION</span>
                <span className="dropdown-trigger-value">{currentLocation.name}</span>
              </div>
              <ChevronDown size={13} className={`chevron-arrow ${locationOpen ? 'rotate-180' : ''}`} />
            </button>

            {locationOpen && (
              <div className="dropdown-popover-menu location-menu">
                <div className="dropdown-popover-header">Select Operating Location</div>
                <div className="dropdown-options-list">
                  {locations.map((loc) => {
                    const isSelected = loc.id === currentLocation.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        className={`dropdown-option-row ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectLocation(loc)}
                      >
                        <div className="dropdown-option-icon">
                          {loc.isHQ ? <Building2 size={13} /> : <MapPin size={13} />}
                        </div>
                        <div className="dropdown-option-text">
                          <span className="dropdown-option-main">{loc.name}</span>
                          <span className="dropdown-option-sub">{loc.code} • {loc.city}</span>
                        </div>
                        {isSelected && <Check size={14} className="dropdown-option-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Role Dropdown */}
          <div className="custom-dropdown-container" ref={roleRef}>
            <button
              type="button"
              className={`dropdown-trigger-btn ${roleOpen ? 'is-open' : ''}`}
              onClick={() => {
                setRoleOpen(!roleOpen);
                setLocationOpen(false);
                setStaffOpen(false);
              }}
              disabled={loading}
              title="Select Role Portal"
            >
              <div className="dropdown-trigger-icon role-icon">
                <CurrentRoleIcon size={14} />
              </div>
              <div className="dropdown-trigger-content">
                <span className="dropdown-trigger-label">PORTAL ROLE</span>
                <span className="dropdown-trigger-value">
                  {role === 'COLLECTION_AGENT' ? 'Field Agent' : role === 'BRANCH_MANAGER' ? 'Branch Manager' : 'Finance HQ'}
                </span>
              </div>
              <ChevronDown size={13} className={`chevron-arrow ${roleOpen ? 'rotate-180' : ''}`} />
            </button>

            {roleOpen && (
              <div className="dropdown-popover-menu role-menu">
                <div className="dropdown-popover-header">Select Operational Role</div>
                <div className="dropdown-options-list">
                  {rolesList.map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        className={`dropdown-option-row ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectRole(r.id)}
                      >
                        <div className="dropdown-option-icon">
                          <Icon size={14} />
                        </div>
                        <div className="dropdown-option-text">
                          <span className="dropdown-option-main">{r.name}</span>
                          <span className="dropdown-option-sub">{r.desc}</span>
                        </div>
                        {isSelected && <Check size={14} className="dropdown-option-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Specific Staff Member Dropdown */}
          <div className="custom-dropdown-container" ref={staffRef}>
            <button
              type="button"
              className={`dropdown-trigger-btn ${staffOpen ? 'is-open' : ''}`}
              onClick={() => {
                setStaffOpen(!staffOpen);
                setLocationOpen(false);
                setRoleOpen(false);
              }}
              disabled={loading}
              title="Select Specific Agent or Manager"
            >
              <div className="dropdown-trigger-icon staff-icon">
                <User size={14} />
              </div>
              <div className="dropdown-trigger-content">
                <span className="dropdown-trigger-label">LOGGED IN AS</span>
                <span className="dropdown-trigger-value">
                  {user?.first_name ? `${user.first_name} ${user.last_name}` : 'Select Staff'}
                </span>
              </div>
              <ChevronDown size={13} className={`chevron-arrow ${staffOpen ? 'rotate-180' : ''}`} />
            </button>

            {staffOpen && (
              <div className="dropdown-popover-menu staff-menu">
                <div className="dropdown-popover-header">
                  <span>Staff in {currentLocation.city}</span>
                  <span className="badge-count">{staffInCurrentLocation.length}</span>
                </div>
                <div className="dropdown-options-list">
                  {staffInCurrentLocation.length === 0 ? (
                    <div className="dropdown-empty-msg">No staff found in this location</div>
                  ) : (
                    staffInCurrentLocation.map((s) => {
                      const isSelected = user?.username === s.username;
                      return (
                        <button
                          key={s.username}
                          type="button"
                          className={`dropdown-option-row ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelectStaff(s.username)}
                        >
                          <div className="staff-avatar-mini">
                            {s.name?.[0] || 'U'}
                          </div>
                          <div className="dropdown-option-text">
                            <span className="dropdown-option-main">{s.name}</span>
                            <span className="dropdown-option-sub">
                              {s.role === 'COLLECTION_AGENT' ? 'Field Agent' : s.role === 'BRANCH_MANAGER' ? 'Manager' : 'HQ Officer'} • {s.employee_id}
                            </span>
                          </div>
                          {isSelected && <Check size={14} className="dropdown-option-check" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Active User Card */}
        <div className="role-switcher-right">
          {user && (
            <div className="active-user-session-card">
              <div className="user-avatar-circle">
                {(user.first_name?.[0] || 'U')}{(user.last_name?.[0] || '')}
              </div>
              <div className="user-session-meta">
                <div className="user-session-top">
                  <span className="session-name">{user.first_name} {user.last_name}</span>
                  <span className={`session-role-pill role-pill-${user.role?.toLowerCase()}`}>
                    <span className="pulse-dot"></span>
                    {user.role === 'COLLECTION_AGENT' ? 'Agent' : user.role === 'BRANCH_MANAGER' ? 'Manager' : 'HQ Admin'}
                  </span>
                </div>
                <span className="session-branch">
                  {user.branch_name || 'Central Corporate Treasury'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
