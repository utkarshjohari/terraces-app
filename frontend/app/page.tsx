"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [filterMonth, setFilterMonth] = useState("All");
  
  const [myProfile, setMyProfile] = useState<any>(null);
  const [bgIndex, setBgIndex] = useState(0);
  const bgImages = ["/bg1.jpg", "/bg2.jpg", "/bg3.jpg"];

  const [formData, setFormData] = useState({
    name: "", email: "", social_link: "", floorplan: "2 Bed / 2 Bath", is_group: false,
    budget: "", strict_budget: false, move_in: "", 
    cleanliness: "Spotless", sleep_schedule: "9-to-5", work_setup: "Hybrid",
    pets: false, smoking: false, bio: "", bot_check: ""
  });

  useEffect(() => {
    const interval = setInterval(() => setBgIndex((prev) => (prev + 1) % bgImages.length), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchProfiles();
    const savedProfile = localStorage.getItem("terraces_my_profile");
    if (savedProfile) setMyProfile(JSON.parse(savedProfile));
  }, []);

  const fetchProfiles = () => {
    fetch(`${API_URL}/profiles`)
      .then((res) => res.json())
      .then((data) => { setProfiles(data); setLoading(false); })
      .catch(err => console.error("API failed:", err));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formStep < 3) { setFormStep(formStep + 1); return; }

    const submittedData = { ...formData, budget: parseInt(formData.budget) || 0 };
    const response = await fetch(`${API_URL}/profiles`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(submittedData)
    });
    const dbProfile = await response.json();

    if (!formData.bot_check) {
      localStorage.setItem("terraces_my_profile", JSON.stringify(dbProfile));
      setMyProfile(dbProfile);
    }

    setFormData({ name: "", email: "", social_link: "", floorplan: "2 Bed / 2 Bath", is_group: false, budget: "", strict_budget: false, move_in: "", cleanliness: "Spotless", sleep_schedule: "9-to-5", work_setup: "Hybrid", pets: false, smoking: false, bio: "", bot_check: "" });
    setShowForm(false); setFormStep(1); fetchProfiles();
  };

  const handleDeleteMyProfile = async () => {
    if (!myProfile || !myProfile.id) return;
    if (!window.confirm("Remove your profile from the pool?")) return;
    await fetch(`${API_URL}/profiles/${myProfile.id}`, { method: "DELETE" });
    localStorage.removeItem("terraces_my_profile");
    setMyProfile(null); fetchProfiles();
  };

  const calculateMatchScore = (me: any, them: any) => {
    if (!me) return null;
    let score = 0;
    
    // Floorplan match
    if (me.floorplan === them.floorplan || me.floorplan === "Open to Any" || them.floorplan === "Open to Any") score += 20;
    
    // Strict Dealbreaker: Budget
    const budgetDiff = Math.abs(me.budget - them.budget);
    if (me.strict_budget && them.budget > me.budget + 50) return 10; // Instantly kill score if strictly over budget
    if (them.strict_budget && me.budget > them.budget + 50) return 10;
    if (budgetDiff <= 100) score += 20; else if (budgetDiff <= 300) score += 10;

    // Lifestyle
    if (me.cleanliness === them.cleanliness) score += 20; else if (me.cleanliness !== "Messy" && them.cleanliness !== "Messy") score += 10;
    if (me.sleep_schedule === them.sleep_schedule) score += 20; else if (me.sleep_schedule === "9-to-5" || them.sleep_schedule === "9-to-5") score += 10;
    if (me.work_setup === them.work_setup) score += 20; else score += 10;
    
    // Strict Dealbreakers: Pets & Smoking
    if (me.pets === false && them.pets === true) score -= 30;
    if (me.smoking === false && them.smoking === true) score -= 40;
    
    return Math.max(0, score);
  };

  const renderVibeTags = (p: any) => (
    <div className="flex flex-wrap gap-2 text-xs font-bold text-gray-700 mt-3">
      {p.is_group && <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full border border-purple-200">👥 Looking for 1 More</span>}
      <span className="bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">🗓 {p.move_in}</span>
      <span className="bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">{p.work_setup === 'Remote' ? '💻 Remote' : p.work_setup === 'Hybrid' ? '☕ Hybrid' : '🏢 In-Office'}</span>
      <span className="bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">{p.cleanliness === 'Spotless' ? '✨ Spotless' : p.cleanliness === 'Lived-in' ? '🛋️ Lived-in' : '🌪️ Messy'}</span>
      <span className="bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">{p.sleep_schedule === 'Early Bird' ? '🌅 Early Bird' : p.sleep_schedule === 'Night Owl' ? '🌙 Night Owl' : '☀️ 9-to-5'}</span>
      {p.pets && <span className="bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">🐾 Dog/Cat Friendly</span>}
      {p.smoking && <span className="bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">🚬 Smoker</span>}
    </div>
  );

  const availableMonths = Array.from(new Set(profiles.map((p: any) => p.move_in.substring(0, 7)))).sort();
  let processedProfiles = filterMonth === "All" ? profiles : profiles.filter((p: any) => p.move_in.startsWith(filterMonth));

  if (myProfile) {
    processedProfiles = processedProfiles
      .filter((p: any) => p.email !== myProfile.email)
      .map((p: any) => ({ ...p, matchScore: calculateMatchScore(myProfile, p) }))
      .sort((a: any, b: any) => b.matchScore - a.matchScore);
  }

  return (
    <>
      <div className="fixed inset-0 z-[-1] bg-black">
        {bgImages.map((src, idx) => (
          <div key={idx} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${bgIndex === idx ? "opacity-30" : "opacity-0"}`} style={{ backgroundImage: `url(${src})` }} />
        ))}
      </div>

      <main className="min-h-screen text-gray-900 p-4 md:p-12 font-sans relative">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div className="bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] border border-white/40 flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden">
            <div className="max-w-2xl relative z-10 space-y-4">
              <span className="bg-blue-100 text-blue-800 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Pilot Program</span>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                Find your roommate at <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Terraces on Brompton.</span>
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Smarter matches based on unit availability, budget overlap, and <strong>actual lifestyle dealbreakers.</strong>
              </p>
            </div>
            <div className="relative z-10 shrink-0 w-full md:w-auto">
              {!myProfile ? (
                <button onClick={() => { setShowForm(!showForm); setFormStep(1); }} className="w-full md:w-auto bg-gray-900 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-black transition-all shadow-xl hover:-translate-y-1 hover:shadow-2xl">
                  {showForm ? "✕ Cancel" : "Join the Pool ➔"}
                </button>
              ) : (
                <div className="bg-white border-2 border-green-400 p-6 rounded-3xl text-center shadow-xl">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="text-green-800 font-extrabold text-lg">You're in the pool!</p>
                  <button onClick={handleDeleteMyProfile} className="mt-4 w-full bg-red-50 text-red-600 hover:bg-red-100 py-2.5 rounded-xl text-sm font-bold transition-colors">
                    Remove My Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* THE GODLY 3-STEP WIZARD */}
          {showForm && !myProfile && (
            <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white/40 space-y-8 animate-in slide-in-from-bottom-8 duration-500">
              
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-2xl">
                {[1, 2, 3].map((step) => (
                  <div key={step} className={`flex-1 h-3 rounded-xl mx-1 transition-all duration-500 ${formStep >= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                ))}
              </div>

              <div className="absolute opacity-0 -z-10"><input type="text" name="bot_check" tabIndex={-1} value={formData.bot_check} onChange={(e) => setFormData({...formData, bot_check: e.target.value})} /></div>

              {/* STEP 1: LOGISTICS */}
              {formStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                  <div>
                    <h3 className="text-3xl font-extrabold text-gray-900">Let's start with the basics.</h3>
                    <p className="text-gray-500 font-medium">Who are you and what are you looking for?</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                      <input required type="text" className="w-full rounded-2xl p-4 bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-lg" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Private Email (Used for connection requests)</label>
                      <input required type="email" className="w-full rounded-2xl p-4 bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-lg" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Target Floorplan</label>
                      <select className="w-full rounded-2xl p-4 bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-lg cursor-pointer" value={formData.floorplan} onChange={(e) => setFormData({...formData, floorplan: e.target.value})}>
                        <option>2 Bed / 2 Bath</option><option>3 Bed / 2 Bath</option><option>3 Bed / 3 Bath</option><option>Open to Any</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">LinkedIn or Instagram URL</label>
                      <input required type="text" placeholder="linkedin.com/in/you" className="w-full rounded-2xl p-4 bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-lg" value={formData.social_link} onChange={(e) => setFormData({...formData, social_link: e.target.value})} />
                    </div>
                    <div className="md:col-span-2 bg-purple-50 p-5 rounded-2xl border border-purple-100">
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" className="w-6 h-6 text-purple-600 rounded-lg border-purple-300 focus:ring-purple-500" checked={formData.is_group} onChange={(e) => setFormData({...formData, is_group: e.target.checked})} />
                        <span className="ml-3 font-bold text-purple-900">We are already a group looking for 1 more person to fill our unit.</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: DEALBREAKERS WITH GODLY VISUAL UI */}
              {formStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                  <div>
                    <h3 className="text-3xl font-extrabold text-gray-900">Define your dealbreakers.</h3>
                    <p className="text-gray-500 font-medium">This drives our matching algorithm.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Budget Section */}
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700">Max Budget ($/mo)</label>
                      <input required type="number" className="w-full rounded-2xl p-4 bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-blue-500 outline-none text-xl font-bold" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} placeholder="e.g. 1200" />
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500" checked={formData.strict_budget} onChange={(e) => setFormData({...formData, strict_budget: e.target.checked})} />
                        <span className="ml-2 text-sm font-bold text-red-600">Strict Dealbreaker (Do not show me budgets over this)</span>
                      </label>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700">Exact Move-in Date</label>
                      <input required type="date" className="w-full rounded-2xl p-4 bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-blue-500 outline-none text-xl font-bold cursor-pointer" value={formData.move_in} onChange={(e) => setFormData({...formData, move_in: e.target.value})} />
                    </div>
                  </div>

                  {/* Visual Radio Cards */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700">Cleanliness Level</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['Spotless', 'Lived-in', 'Messy'].map(option => (
                        <label key={option} className="cursor-pointer">
                          <input type="radio" name="cleanliness" className="hidden peer" value={option} checked={formData.cleanliness === option} onChange={(e) => setFormData({...formData, cleanliness: e.target.value})} />
                          <div className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all text-center hover:bg-gray-100">
                            <span className="text-3xl block mb-2">{option === 'Spotless' ? '✨' : option === 'Lived-in' ? '🛋️' : '🌪️'}</span>
                            <span className="font-bold text-sm text-gray-800">{option}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700">Sleep Schedule</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['Early Bird', '9-to-5', 'Night Owl'].map(option => (
                        <label key={option} className="cursor-pointer">
                          <input type="radio" name="sleep" className="hidden peer" value={option} checked={formData.sleep_schedule === option} onChange={(e) => setFormData({...formData, sleep_schedule: e.target.value})} />
                          <div className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl peer-checked:border-indigo-500 peer-checked:bg-indigo-50 transition-all text-center hover:bg-gray-100">
                            <span className="text-3xl block mb-2">{option === 'Early Bird' ? '🌅' : option === '9-to-5' ? '☀️' : '🌙'}</span>
                            <span className="font-bold text-sm text-gray-800">{option}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700">Work Setup</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['In-Office', 'Hybrid', 'Remote'].map(option => (
                        <label key={option} className="cursor-pointer">
                          <input type="radio" name="work" className="hidden peer" value={option} checked={formData.work_setup === option} onChange={(e) => setFormData({...formData, work_setup: e.target.value})} />
                          <div className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl peer-checked:border-green-500 peer-checked:bg-green-50 transition-all text-center hover:bg-gray-100">
                            <span className="text-3xl block mb-2">{option === 'In-Office' ? '🏢' : option === 'Hybrid' ? '☕' : '💻'}</span>
                            <span className="font-bold text-sm text-gray-800">{option}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-8 pt-4 border-t border-gray-100">
                    <label className="flex items-center cursor-pointer bg-gray-50 px-6 py-4 rounded-2xl border-2 border-gray-100 hover:bg-gray-100 transition-all">
                      <input type="checkbox" className="w-6 h-6 text-blue-600 rounded-lg border-gray-300" checked={formData.pets} onChange={(e) => setFormData({...formData, pets: e.target.checked})} />
                      <span className="ml-3 font-bold text-gray-800">I have Pet(s) 🐾</span>
                    </label>
                    <label className="flex items-center cursor-pointer bg-gray-50 px-6 py-4 rounded-2xl border-2 border-gray-100 hover:bg-gray-100 transition-all">
                      <input type="checkbox" className="w-6 h-6 text-blue-600 rounded-lg border-gray-300" checked={formData.smoking} onChange={(e) => setFormData({...formData, smoking: e.target.checked})} />
                      <span className="ml-3 font-bold text-gray-800">I Smoke 🚬</span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 3: BIO */}
              {formStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                  <div>
                    <h3 className="text-3xl font-extrabold text-gray-900">The Final Pitch.</h3>
                    <p className="text-gray-500 font-medium">Introduce yourself to your future matches.</p>
                  </div>
                  <div>
                    <textarea required rows={5} className="w-full rounded-3xl p-6 bg-gray-50 border-2 border-gray-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-lg font-medium resize-none" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} placeholder="I'm moving to Houston for... My absolute dealbreakers are..." />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100">
                {formStep > 1 && (
                  <button type="button" onClick={() => setFormStep(formStep - 1)} className="px-8 py-5 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 transition-all text-lg">
                    Back
                  </button>
                )}
                {formStep < 3 ? (
                  <button type="button" onClick={() => setFormStep(formStep + 1)} className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-bold text-xl hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                    Continue
                  </button>
                ) : (
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1">
                    Publish to Match Pool
                  </button>
                )}
              </div>
            </form>
          )}

          {/* THE FEED */}
          <div className="pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h2 className="text-3xl font-extrabold text-white drop-shadow-md">
                {myProfile ? "Your Algorithm Matches" : "Available Matches"}
              </h2>
              
              <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl">
                <span className="text-sm font-bold text-gray-500">Filter Move-in:</span>
                <select className="bg-transparent text-base font-extrabold text-gray-900 outline-none cursor-pointer" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                  <option value="All">All Dates</option>
                  {availableMonths.map(month => <option key={month} value={month}>{month}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center text-white py-20 text-xl font-bold animate-pulse">Running Match Engine...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {processedProfiles.map((profile: any) => (
                  <div key={profile.id} className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 p-8 space-y-6 transition-all hover:scale-[1.02] hover:shadow-3xl flex flex-col">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                          {profile.name}
                        </h2>
                        <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-wider">Target: {profile.floorplan}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-2xl font-black text-green-600">
                          ${profile.budget}
                        </span>
                        {profile.strict_budget && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Strict Cap</span>}
                      </div>
                    </div>

                    {/* ALGORITHM BANNER */}
                    {myProfile && profile.matchScore !== undefined && (
                      <div className={`p-4 rounded-2xl flex justify-between items-center shadow-inner ${
                        profile.matchScore >= 80 ? 'bg-gradient-to-r from-green-100 to-emerald-50 border border-green-200' : 
                        profile.matchScore >= 50 ? 'bg-gradient-to-r from-yellow-100 to-amber-50 border border-yellow-200' : 
                        'bg-gradient-to-r from-red-100 to-rose-50 border border-red-200'
                      }`}>
                        <div className="font-black text-lg flex items-center gap-2 text-gray-800">
                          {profile.matchScore >= 80 ? '🔥' : profile.matchScore >= 50 ? '👍' : '⚠️'} 
                          {profile.matchScore}% Match
                        </div>
                        {profile.matchScore >= 70 && (
                          <div className="text-xs font-bold text-white bg-gray-900 px-3 py-1.5 rounded-lg shadow-md">
                            Combined: ${(myProfile.budget + profile.budget).toLocaleString()}/mo
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* GODLY VIBE TAGS */}
                    {renderVibeTags(profile)}
                    
                    <p className="text-gray-700 text-base leading-relaxed font-medium bg-gray-50 p-5 rounded-2xl border border-gray-100 flex-grow">
                      "{profile.bio}"
                    </p>

                    <div className="flex gap-3 pt-2">
                      {/* EMAIL HIDDEN BEHIND BUTTON TO STOP SCRAPERS */}
                      <a href={`mailto:${profile.email}?subject=Terraces on Brompton - Roommate Match&body=Hi ${profile.name},%0D%0A%0D%0AI saw we are a strong match on the portal. Want to connect?`} 
                         className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all text-center block">
                        Send Connection Request
                      </a>
                      <a href={`https://${profile.social_link.replace('https://', '')}`} target="_blank" rel="noopener noreferrer" 
                         className="bg-gray-100 text-gray-700 px-6 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all flex items-center justify-center border border-gray-200" title="View Social Profile">
                        🔗 Profile
                      </a>
                    </div>
                  </div>
                ))}
                
                {processedProfiles.length === 0 && (
                  <div className="col-span-full text-center py-20 bg-white/80 backdrop-blur-md rounded-[2rem] border border-white/50 shadow-xl">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-gray-900 font-extrabold text-xl">No active matches found.</p>
                    <p className="text-gray-500 font-medium mt-2">Adjust your move-in filter to see more results.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
