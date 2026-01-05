// ✅ FILE: app/duo/steps/Step1UserType.js
export default function Step1UserType({ userType, setUserType }) {
    return (
      <div className="mt-6 rounded-xl border border-zinc-800 bg-black/30 p-4">
        <label className="text-sm text-zinc-300 font-medium">Email Address *</label>
  
        <div className="mt-3 space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={userType === "new"} onChange={() => setUserType("new")} />
            New Email
          </label>
  
          <label className="flex items-center gap-2">
            <input type="radio" checked={userType === "registered"} onChange={() => setUserType("registered")} />
            Registered Email
          </label>
        </div>
      </div>
    );
  }
  