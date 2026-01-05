// ✅ FILE: app/duo/steps/Step6Additional.js
export default function Step6Additional({
    cleaningInstructions,
    setCleaningInstructions,
    favoriteDuo,
    setFavoriteDuo,
    serviceType,
    setServiceType,
    serviceTypeOptions,
  }) {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
          <div className="text-sm font-semibold">ADDITIONAL INSTRUCTIONS</div>
  
          <p className="mt-2 text-sm text-zinc-400">
            Tell us any details that are important for the Duo0 who will be performing the cleaning.
          </p>
  
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-zinc-300">Cleaning instructions *</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                rows={3}
                value={cleaningInstructions}
                onChange={(e) => setCleaningInstructions(e.target.value)}
                placeholder="Write any important notes…"
              />
            </div>
  
            <div>
              <label className="text-sm text-zinc-300">Favorite Duo0</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={favoriteDuo}
                onChange={(e) => setFavoriteDuo(e.target.value)}
                placeholder="Optional"
              />
            </div>
  
            <div>
              <label className="text-sm text-zinc-300">Type of service to be performed *</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                <option value="">Choose</option>
                {serviceTypeOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }
  