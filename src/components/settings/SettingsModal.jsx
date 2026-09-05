import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { saveSupabaseConfig, clearSupabaseConfig } from '../../services/supabaseClient';

export default function SettingsModal({ isOpen, onClose }) {
  const { supabaseConfig, refreshConfig, resetData } = useProject();

  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [key, setKey] = useState(supabaseConfig.key || '');
  const [copied, setCopied] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (url && key) {
      saveSupabaseConfig(url, key);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
      refreshConfig();
    }
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setKey('');
    refreshConfig();
  };

  const copySchema = () => {
    const schemaSql = `-- Run this in Supabase SQL Editor:
-- Create tables: profiles, projects, sprints, tasks, activity_logs
-- See database/schema.sql in the repo for full schema with foreign keys and RLS policies!`;
    navigator.clipboard.writeText(schemaSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Supabase & Database Configuration</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          {/* Status banner */}
          <div className={`status-banner ${supabaseConfig.isConfigured ? 'active' : 'info'}`}>
            <div className="banner-icon">
              {supabaseConfig.isConfigured ? '✓' : 'ℹ'}
            </div>
            <div>
              <strong>
                {supabaseConfig.isConfigured 
                  ? 'Connected to Supabase PostgreSQL Database' 
                  : 'Running in Zero-Setup Offline / Demo Mode'}
              </strong>
              <p>
                {supabaseConfig.isConfigured 
                  ? 'All tasks, sprints, and metrics are actively synchronizing with your Supabase cloud backend.'
                  : 'The system uses persistent browser storage. To connect your live Supabase cloud project, paste your URL & Anon Key below.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="modal-form">
            <div className="form-group">
              <label className="form-label">Supabase Project URL</label>
              <input
                type="url"
                placeholder="https://your-project.supabase.co"
                className="form-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Anon Public API Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="form-input"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </div>

            <div className="form-actions-row">
              <button type="submit" className="btn btn-primary">
                {savedMsg ? 'Saved!' : 'Save & Connect'}
              </button>
              {supabaseConfig.isConfigured && (
                <button type="button" className="btn btn-danger" onClick={handleDisconnect}>
                  Disconnect Supabase
                </button>
              )}
            </div>
          </form>

          <hr className="divider" />

          {/* Database Setup Helper */}
          <div className="sql-helper-box">
            <div className="helper-header">
              <div>
                <h4>Supabase SQL Schema Helper</h4>
                <p>Run the SQL commands from <code>database/schema.sql</code> in your Supabase SQL Editor</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={copySchema}>
                {copied ? 'Copied!' : 'Copy Quick SQL'}
              </button>
            </div>
          </div>

          <hr className="divider" />

          {/* Demo Reset */}
          <div className="danger-zone-box">
            <div>
              <h4>Reset Demo Data</h4>
              <p>Re-populate the board with original Team 11 mock tasks and sprints</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (window.confirm('Reset all tasks and sprint boards to default?')) {
                  resetData();
                  onClose();
                }
              }}
            >
              Reset Seed Data
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
