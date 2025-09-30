// src/pages/participants.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import Header from "@/components/layout/header";

import PurpleIcon from '../Assets/Participants/purple.png';
import GreenIcon from '../Assets/Participants/green.png';
import RedIcon from '../Assets/Participants/red.png';
import OrangeIcon from '../Assets/Participants/orange.png';

const stats = [
    {
        label: "All Participants",
        value: 0,
        icon: PurpleIcon,
        color: "bg-white",
        text: "text-purple-300",
    },
    {
        label: "Active Participants",
        value: 0,
        icon: GreenIcon,
        color: "bg-white",
        text: "text-green-300",
    },
    {
        label: "Pending Activation",
        value: 0,
        icon: OrangeIcon,
        color: "bg-white",
        text: "text-orange-300",
    }
    ,
    {
        label: "Inactive Participants",
        value: 0,
        icon: RedIcon,
        color: "bg-white",
        text: "text-red-400",
    },
];

const participantStatusColors: Record<string, string> = {
    Pending: "bg-orange-100 text-orange-700",
    Active: "bg-green-100 text-green-700",
    Inactive: "bg-red-100 text-red-700",
};

const statusOptions = [
    "All Status",
    "Active Status",
    "Inactive Status",
    "Pending Activation",
];

interface SectionProfile {
    age?: string;
    participantId?: string;
    name?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
}

interface UserType {
    uid: string;
    email: string | null;
    createdAt: string | undefined;
    lastSignIn: string | undefined;
    profile?: SectionProfile;
    fullName?: string;
    displayName?: string;
    streak: number;
    chapterNo: number;
    progress: number;
    IsSeg0Approved?: boolean;
    IsSeg1Approved?: boolean;
    IsSeg2Approved?: boolean;
    IsSeg3Approved?: boolean;
    // ASSUMPTION: Including role field for filtering admins
    role?: string;
}

const Participants: React.FC = () => {
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [search, setSearch] = useState("");
    const [cards, setCards] = useState(stats);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50; // Max participants per page

    useEffect(() => {
        fetch(`/api/list-users?t=${Date.now()}`, { cache: 'no-store' })
            .then((res) => res.json())
            .then((data: UserType[]) => {

                // 1. FILTER: Exclude users with the 'admin' role
                const participantData = data.filter(u => u.role !== 'admin');

                // 2. SORT: Sort the remaining participants by lastSignIn in descending order (newest first)
                const sortedData = participantData.sort((a: UserType, b: UserType) => {
                    const dateA = a.lastSignIn ? new Date(a.lastSignIn).getTime() : 0;
                    const dateB = b.lastSignIn ? new Date(b.lastSignIn).getTime() : 0;
                    return dateB - dateA; // Sorts from newest to oldest
                });

                setUsers(sortedData);
                setLoading(false);

                // Update cards based on filtered and sorted data
                const all = sortedData.length;
                const active = sortedData.filter((u: UserType) => getStatus(u) === "Active").length;
                const inactive = sortedData.filter((u: UserType) => getStatus(u) === "Inactive").length;
                const pending = sortedData.filter((u: UserType) => getStatus(u) === "Pending").length;

                setCards([
                    { ...stats[0], value: all },
                    { ...stats[1], value: active },
                    { ...stats[2], value: pending },
                    { ...stats[3], value: inactive },
                ]);

                // Reset to page 1 whenever new data is loaded
                setCurrentPage(1);
            });
    }, []);

    // Helper function to format the last sign-in date
    function formatLastSignIn(dateString: string | undefined): string {
        if (!dateString) {
            return "Never";
        }

        const lastSignInDate = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const isToday = lastSignInDate.toDateString() === today.toDateString();
        const isYesterday = lastSignInDate.toDateString() === yesterday.toDateString();

        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        } as const;

        if (isToday) {
            return `Today, ${lastSignInDate.toLocaleTimeString('en-IN', timeOptions).replace('am', 'AM').replace('pm', 'PM')}`;
        } else if (isYesterday) {
            return `Yesterday, ${lastSignInDate.toLocaleTimeString('en-IN', timeOptions).replace('am', 'AM').replace('pm', 'PM')}`;
        } else {
            return lastSignInDate.toLocaleString('en-IN', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
                ...timeOptions,
            }).replace('am', 'AM').replace('pm', 'PM');
        }
    }


    function getStatus(user: UserType) {
        if (!user.lastSignIn) return "Pending";
        const last = new Date(user.lastSignIn);
        const now = new Date();
        const diff = (now.getTime() - last.getTime()) / (1000 * 3600 * 24);
        if (diff < 7) return "Active";
        return "Inactive";
    }

    function getName(u: UserType) {
        return (
            u.profile?.name ||
            u.profile?.fullName ||
            (u.profile?.firstName && u.profile?.lastName
                ? `${u.profile.firstName} ${u.profile.lastName}`
                : u.profile?.firstName || u.profile?.lastName) ||
            u.fullName ||
            u.displayName ||
            u.profile?.participantId ||
            u.email ||
            ""
        );
    }

    // 1. Apply Search and Status Filtering
    const filtered = users.filter((u) => {
        const name = getName(u);
        const matchName = name.toLowerCase().includes(search.toLowerCase());

        const status = getStatus(u);
        const matchStatus =
            statusFilter === "All Status" ||
            (statusFilter === "Active Status" && status === "Active") ||
            (statusFilter === "Inactive Status" && status === "Inactive") ||
            (statusFilter === "Pending Activation" && status === "Pending");

        return matchName && matchStatus;
    });

    // 2. Apply Pagination Slicing
    const totalParticipants = filtered.length;
    const totalPages = Math.ceil(totalParticipants / pageSize);
    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, totalParticipants);
    const paginatedUsers = filtered.slice(start, end);

    // Pagination Handlers
    const goToPreviousPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };

    const goToNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
    };

    return (
        <div className="font-poppins bg-gray-100 min-h-screen">
            {/* Header section with search, bell icon, and profile image */}
            <Header title="Participants" subtitle="Manage participants and access individual insights" />

            <main className="p-6 mx-auto max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[#125566]">Participants</h1>
                    <p className="text-base text-black mt-1">
                        Manage participants and access individual insights
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {cards.map((stat) => (
                        <div
                            key={stat.label}
                            className={`relative flex flex-col ${stat.color} rounded-xl shadow-md p-4`} // Added 'relative' to the card
                        >
                            {/* Text Content */}
                            <div className="flex flex-col mb-10"> {/* Added mb-10 for space above the icon */}
                                <h3 className="text-lg font-semibold text-gray-800 leading-tight"> {/* leading-tight for closer line height */}
                                    {stat.label.split(' ')[0]}<br />{stat.label.split(' ')[1]}
                                </h3>
                                <p className={`text-3xl font-bold ${stat.text} mt-1`}>
                                    {stat.value}
                                </p>
                            </div>
                            
                            {/* Icon Container - positioned absolutely at the bottom right */}
                            <div className="absolute bottom-4 right-4"> {/* Adjusted position for better visual balance */}
                                <img
                                    src={stat.icon}
                                    alt={stat.label}
                                    className="w-16 h-16" // Larger size for the icon
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                    <input
                        type="text"
                        placeholder="Search participant..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg shadow-sm border focus:outline-none"
                    />
                    <select
                        className="md:w-48 px-3 py-2 rounded-lg shadow-sm border"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {statusOptions.map((o) => (
                            <option key={o} value={o}>
                                {o}
                            </option>
                        ))}
                    </select>
                    <button className="ml-auto bg-teal-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-teal-700 transition">
                        Export
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-x-auto">
                    {/* MODIFICATION START: Combined title and pagination controls */}
                    <div className="flex justify-between items-center px-6 py-4 border-b">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-semibold" style={{ color: '#125566' }}>Participants List</h2>
                            <p className="text-gray-500 text-sm">
                                Overview of all Participants.
                                {/* ({totalParticipants} found) */}
                            </p>
                        </div>

                        {/* Pagination Status and Arrows moved to the right side of the header */}
                        {!loading && totalParticipants > 0 && (
                            <div className="flex items-center space-x-2">
                                {/* Page Status (e.g., 1-50 of 1426) */}
                                <div className="text-sm font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-lg shadow-sm">
                                    {start + 1}–{end} of {totalParticipants}
                                </div>

                                {/* Navigation Arrows */}
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-full transition ${currentPage === 1
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-700 hover:bg-gray-200'
                                        }`}
                                    aria-label="Previous Page"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-full transition ${currentPage === totalPages || totalPages === 0
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-700 hover:bg-gray-200'
                                        }`}
                                    aria-label="Next Page"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                    {/* MODIFICATION END: Combined title and pagination controls */}

                    <table className="min-w-full">
                        <thead>
                            <tr style={{ backgroundColor: '#125566', color: 'white' }}>
                                <th className="py-3 px-6 text-left">Participant Name</th>
                                <th className="py-3 px-6 text-left">Chapter No.</th>
                                <th className="py-3 px-6 text-left">Progress</th>
                                <th className="py-3 px-6 text-left">Last Active</th>
                                <th className="py-3 px-6 text-left">Status</th>
                                <th className="py-3 px-6 text-left">Profile</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            )}

                            {!loading && paginatedUsers.length > 0 &&
                                paginatedUsers.map((u) => {
                                    const status = getStatus(u);
                                    const day0Status = u.IsSeg0Approved ? "Active" : "Inactive";
                                    const day0StatusColor = u.IsSeg0Approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
                                    const chapterIndex = typeof u.chapterNo === "number" ? Math.max(0, u.chapterNo - 1) : 0;

                                    return (
                                        <tr key={u.uid} className="border-t hover:bg-gray-50 transition">
                                            <td className="py-2 px-6">{getName(u) || "Unknown"}</td>
                                            <td className="py-2 px-6">
                                                <div className="flex flex-col items-start">
                                                    <span>{chapterIndex}</span>
                                                </div>
                                            </td>
                                            <td className="py-2 px-6">{u.progress}%</td>
                                            <td className="py-2 px-6">
                                                {formatLastSignIn(u.lastSignIn)}
                                            </td>
                                            <td className="py-2 px-6">
                                                <span className={`px-3 py-1 rounded-lg font-semibold text-xs ${day0StatusColor}`}>
                                                    {day0Status}
                                                </span>
                                            </td>
                                            <td className="py-2 px-6">
                                                <Link href={`/participants/${u.uid}`}>
                                                    <button className="text-blue-600 hover:underline">
                                                        View Profile
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}

                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500">
                                        No participants found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default Participants;