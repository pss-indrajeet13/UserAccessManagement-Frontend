import React from 'react';

const mockJournals = [
  { id: 1, date: "2023-10-01", title: "Reflecting on my week", tags: ["Stress", "Work", "Gratitude"], entry: "I felt a lot of stress at work this week, but finding small moments of gratitude helped me stay centered." },
  { id: 2, date: "2023-09-28", title: "A productive day", tags: ["Productivity", "Happy"], entry: "Completed my tasks for the day and felt a great sense of accomplishment. My mood is very good." },
  { id: 3, date: "2023-09-25", title: "Meditation practice", tags: ["Mindfulness", "Meditation"], entry: "I spent 15 minutes meditating this morning. It helped clear my head and start the day with intention." },
];

const JournalsContent = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 mt-6">
      <h2 className="font-semibold mb-2 text-xl" style={{ color: '#125566' }}>Journal Entries</h2>
      <p className="text-gray-500 mb-4">A log of personal reflections and notes.</p>
      
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-gray-700 border-b">
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Title</th>
            <th className="px-3 py-2 text-left">Tags</th>
            <th className="px-3 py-2 text-left">Entry</th>
          </tr>
        </thead>
        <tbody>
          {mockJournals.map((journal) => (
            <tr key={journal.id} className="border-t">
              <td className="px-3 py-2">{journal.date}</td>
              <td className="px-3 py-2">{journal.title}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  {journal.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </td>
              <td className="px-3 py-2">{journal.entry}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JournalsContent;
