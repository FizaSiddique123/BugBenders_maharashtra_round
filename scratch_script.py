import sys

month_view = """
          {view === "month" && (
            <div className="bg-[#0F0F0F] border border-[#242424] rounded-xl p-4 min-h-[600px] text-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-[#242424] rounded"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentDate(new Date())} className="text-xs font-semibold px-2 hover:text-gray-300">Today</button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-[#242424] rounded"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-px bg-[#242424] border border-[#242424] rounded overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-[#050505] p-2 text-center text-xs font-bold text-[#6F6F6F] uppercase tracking-wider">{day}</div>
                ))}
                
                {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-[#0F0F0F] min-h-[120px] p-2"></div>
                ))}

                {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                  const date = i + 1;
                  const fullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
                  const isToday = new Date().toDateString() === fullDate.toDateString();
                  const dayContents = filteredContents.filter(c => c.scheduled_at && new Date(c.scheduled_at).toDateString() === fullDate.toDateString());

                  return (
                    <div key={date} className={`bg-[#050505] min-h-[120px] p-2 border-t border-[#242424] transition hover:bg-[#0A0A0A]`}>
                      <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-white text-black' : 'text-[#6F6F6F]'}`}>
                        {date}
                      </div>
                      <div className="space-y-1">
                        {dayContents.map(c => (
                          <div key={c.id} onClick={() => openDetails(c)} className="text-[10px] bg-[#151515] border border-[#303030] px-1.5 py-1 rounded truncate cursor-pointer hover:bg-[#242424] transition text-white">
                            {c.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
"""

week_view = """
          {view === "week" && (
            <div className="bg-[#0F0F0F] border border-[#242424] rounded-xl p-4 min-h-[600px] text-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  Week of {(() => {
                    const first = currentDate.getDate() - currentDate.getDay();
                    const start = new Date(currentDate.setDate(first));
                    return start.toLocaleString('default', { month: 'short', day: 'numeric' });
                  })()}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))} className="p-1.5 hover:bg-[#242424] rounded"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentDate(new Date())} className="text-xs font-semibold px-2 hover:text-gray-300">This Week</button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))} className="p-1.5 hover:bg-[#242424] rounded"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = new Date(currentDate);
                  const first = date.getDate() - date.getDay();
                  const targetDate = new Date(date.setDate(first + i));
                  const isToday = new Date().toDateString() === targetDate.toDateString();
                  const dayContents = filteredContents.filter(c => c.scheduled_at && new Date(c.scheduled_at).toDateString() === targetDate.toDateString());

                  return (
                    <div key={i} className="flex flex-col border border-[#242424] rounded-lg bg-[#050505] overflow-hidden min-h-[400px]">
                      <div className={`p-2 text-center border-b border-[#242424] ${isToday ? 'bg-[#151515]' : 'bg-[#0A0A0A]'}`}>
                        <div className="text-[10px] uppercase font-bold text-[#6F6F6F] tracking-wider">{targetDate.toLocaleString('default', { weekday: 'short' })}</div>
                        <div className={`text-sm font-bold mt-1 ${isToday ? 'text-white' : 'text-[#A1A1A1]'}`}>{targetDate.getDate()}</div>
                      </div>
                      <div className="p-2 flex-1 space-y-2">
                        {dayContents.map(c => (
                          <div key={c.id} onClick={() => openDetails(c)} className="bg-[#151515] border border-[#303030] p-2 rounded cursor-pointer hover:border-[#404040] transition space-y-1">
                            <div className="text-[10px] font-bold text-white leading-tight">{c.title}</div>
                            <div className="text-[9px] text-[#A1A1A1]">{new Date(c.scheduled_at!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
"""

day_view = """
          {view === "day" && (
            <div className="bg-[#0F0F0F] border border-[#242424] rounded-xl p-4 min-h-[600px] text-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  {currentDate.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000))} className="p-1.5 hover:bg-[#242424] rounded"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentDate(new Date())} className="text-xs font-semibold px-2 hover:text-gray-300">Today</button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000))} className="p-1.5 hover:bg-[#242424] rounded"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="bg-[#050505] border border-[#242424] rounded-lg divide-y divide-[#242424]">
                {filteredContents
                  .filter(c => c.scheduled_at && new Date(c.scheduled_at).toDateString() === currentDate.toDateString())
                  .sort((a,b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
                  .map(c => (
                    <div key={c.id} onClick={() => openDetails(c)} className="flex items-center gap-4 p-4 hover:bg-[#151515] transition cursor-pointer">
                      <div className="w-20 text-right flex-shrink-0">
                        <div className="text-sm font-bold text-white">{new Date(c.scheduled_at!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{c.title}</div>
                        <div className="text-xs text-[#A1A1A1] mt-1">{c.platforms?.join(", ")} • {c.status}</div>
                      </div>
                    </div>
                ))}
                {filteredContents.filter(c => c.scheduled_at && new Date(c.scheduled_at).toDateString() === currentDate.toDateString()).length === 0 && (
                  <div className="p-8 text-center text-sm text-[#6F6F6F]">
                    No content scheduled for this day.
                  </div>
                )}
              </div>
            </div>
          )}
"""

print(month_view + week_view + day_view)
