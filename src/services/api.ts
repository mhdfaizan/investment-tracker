import type { DashboardData, BusinessData } from '../types';

const API_BASE = '/api';

export async function getDashboard(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export async function getBusinesses(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/businesses`);
  if (!res.ok) throw new Error('Failed to fetch businesses');
  const data = await res.json();
  return data.businesses;
}

export async function getBusiness(name: string): Promise<BusinessData> {
  const res = await fetch(`${API_BASE}/business/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`Failed to fetch ${name}`);
  return res.json();
}

export async function addEntry(name: string, row: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/business/${encodeURIComponent(name)}/entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ row }),
  });
  if (!res.ok) throw new Error('Failed to add entry');
}
