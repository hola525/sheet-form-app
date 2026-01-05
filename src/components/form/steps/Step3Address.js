// ✅ FILE: app/duo/steps/Step3Address.js
export default function Step3Address({
    province,
    setProvince,
    city,
    setCity,
    street,
    setStreet,
    details,
    setDetails,
    propertyType,
    setPropertyType,
    provinceOptions,
    cityOptions,
    propertyTypeOptions,
  }) {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
          <div className="text-sm font-semibold">NEW ADDRESS</div>
  
          <div className="mt-3 space-y-4">
            <div>
              <label className="text-sm text-zinc-300">Province *</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={province}
                onChange={(e) => {
                  // ✅ if province changes, reset city
                  setProvince(e.target.value);
                  setCity("");
                }}
              >
                <option value="">Select</option>
                {provinceOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
  
            <div>
              <label className="text-sm text-zinc-300">City/Town *</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!province}
              >
                <option value="">{province ? "Select" : "Select province first"}</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
  
            <div>
              <label className="text-sm text-zinc-300">Street/Number *</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. Main St 123"
              />
            </div>
  
            <div>
              <label className="text-sm text-zinc-300">Property details *</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Lot/Block/Floor/Apartment/Other"
              />
            </div>
  
            <div>
              <label className="text-sm text-zinc-300">Property Type *</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option value="">Select</option>
                {propertyTypeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }
  