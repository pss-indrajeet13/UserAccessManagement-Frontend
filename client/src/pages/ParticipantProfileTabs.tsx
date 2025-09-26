// C:\PSS\UserAccessManager\client\src\pages\ParticipantProfileTabs.tsx
import { FaUser, FaBook, FaRegFileAlt, FaChartBar, FaCalendarAlt } from "react-icons/fa";
import { useLocation } from "wouter";

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
    path: "/participants/:uid/demographics/day-0",
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

// Helper function to extract UID from the current URL
const getUidFromPath = (path: string) => {
  const parts = path.split('/');
  return parts.length > 2 && parts[2] !== '' ? parts[2] : null;
};

function ParticipantProfileTabs() {
  const [location] = useLocation();
  const uid = getUidFromPath(location);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 overflow-x-auto">
          {navItems.map((item) => {
            // Determine the href based on if a UID exists
            const href = uid ? item.path.replace(":uid", uid) : "#";
            
            // Generate the full path for comparison
            const fullPath = item.path.replace(":uid", uid || "");

            // This is the key fix: check for exact match or sub-path and handle the 'Overview' case
            const isActive = location === fullPath || (fullPath !== `/participants/${uid}` && location.startsWith(fullPath));

            return (
              <a
                key={item.path}
                href={href}
                className={`
                  flex items-center gap-2 py-4 px-1 text-sm font-medium
                  ${
                    isActive
                      ? "border-b-2 border-teal-500 text-teal-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ParticipantProfileTabs;