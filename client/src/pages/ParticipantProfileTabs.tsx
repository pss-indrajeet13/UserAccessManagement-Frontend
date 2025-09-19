// C:\PSS\UserAccessManager\client\src\pages\ParticipantProfileTabs.tsx
import { FaUser, FaBook, FaRegFileAlt, FaChartBar, FaCalendarAlt } from "react-icons/fa";
import { useRoute } from "wouter";

// Define the structure for each navigation item
const navItems = [
  {
    label: "Overview",
    icon: <FaChartBar />,
    path: "/participants/:uid",
  },
  {
    label: "Journals",
    icon: <FaRegFileAlt />,
    path: "/participants/:uid/journals",
  },
  {
    label: "Personal Details",
    icon: <FaUser />,
    path: "/participants/:uid/PersonalDetailsContent",
  },
  {
    label: "Day (0) Demographics",
    icon: <FaCalendarAlt />,
    path: "/participants/:uid/demographics/day-6",
  },
  {
    label: "Day (13) Demographics",
    icon: <FaCalendarAlt />,
    path: "/participants/:uid/demographics/day-13",
  },
  {
    label: "Day (28) Demographics",
    icon: <FaCalendarAlt />,
    path: "/participants/:uid/demographics/day-28",
  },
];

function ParticipantProfileTabs() {
  // Correctly destructure useRoute to get the match object
  const [isMatch, matchParams] = useRoute("/participants/:uid");
  const [isJournalMatch, journalParams] = useRoute("/participants/:uid/journals");
  const [isPersonalMatch, personalParams] = useRoute("/participants/:uid/personal");
  const [isDay6Match, day6Params] = useRoute("/participants/:uid/demographics/day-6");
  const [isDay13Match, day13Params] = useRoute("/participants/:uid/demographics/day-13");
  const [isDay28Match, day28Params] = useRoute("/participants/:uid/demographics/day-28");

  // Get the UID from any of the matching routes
  const uid = matchParams?.uid || journalParams?.uid || personalParams?.uid || day6Params?.uid || day13Params?.uid || day28Params?.uid;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 overflow-x-auto">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path.replace(":uid", uid || "")}
              className={`
                flex items-center gap-2 py-4 px-1 text-sm font-medium
                ${
                // Check for a match with a specific boolean
                (item.path === "/participants/:uid" && isMatch) ||
                  (item.path === "/participants/:uid/journals" && isJournalMatch) ||
                  (item.path === "/participants/:uid/personal" && isPersonalMatch) ||
                  (item.path === "/participants/:uid/demographics/day-0" && isDay6Match) ||
                  (item.path === "/participants/:uid/demographics/day-13" && isDay13Match) ||
                  (item.path === "/participants/:uid/demographics/day-28" && isDay28Match)
                  ? "border-b-2 border-teal-500 text-teal-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ParticipantProfileTabs;