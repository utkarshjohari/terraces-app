"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/profiles`)
      .then((res) => res.json())
      .then((data) => {
        setProfiles(data);
        setLoading(false);
      });
  }, []);

  // Compute Metrics for the Leasing Office
  const totalProspects = profiles.length;
  const avgBudget = totalProspects > 0 ? Math.round(profiles.reduce((sum, p: any) => sum + p.budget, 0) / totalProspects) : 0;
  const petsCount = profiles.filter((p: any) => p.pets).length;

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leasing Office Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Terraces on Brompton - Roommate Matching Analytics</p>
          </div>
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
            Export Report (PDF)
          </button>
        </header>

        {/* Top Level Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Active Prospects in Pool</h3>
            <p className="text-4xl font-bold mt-2">{loading ? "-" : totalProspects}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Average Max Budget</h3>
            <p className="text-4xl font-bold mt-2 text-green-600">${loading ? "-" : avgBudget}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Prospects with Pets</h3>
            <p className="text-4xl font-bold mt-2 text-blue-600">{loading ? "-" : petsCount}</p>
          </div>
        </div>

        {/* Lead Generation Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Live Applicant Data</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Target Move-in</th>
                  <th className="p-4 font-semibold">Budget</th>
                  <th className="p-4 font-semibold">Work Setup</th>
                  <th className="p-4 font-semibold">Social Verification</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">Loading leads...</td></tr>
                ) : profiles.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">No active applicants.</td></tr>
                ) : (
                  profiles.map((profile: any) => (
                    <tr key={profile.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{profile.name}</td>
                      <td className="p-4 text-blue-600"><a href={`mailto:${profile.email}`}>{profile.email}</a></td>
                      <td className="p-4">{profile.move_in}</td>
                      <td className="p-4 font-semibold text-green-700">${profile.budget}</td>
                      <td className="p-4">{profile.work_setup}</td>
                      <td className="p-4">
                        <a href={`https://${profile.social_link.replace('https://', '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Link
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}