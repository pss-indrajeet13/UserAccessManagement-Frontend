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
        icon: (
            <img
                src={PurpleIcon}
                alt="All Participants"
                className="w-6 h-6"
            />
        ),
        color: "bg-white",
        text: "text-purple-300",
    },
    {
        label: "Active Participants",
        value: 0,
        icon: (
            <img
                src={GreenIcon}
                alt="Active Participants"
                className="w-6 h-6"
            />
        ),
        color: "bg-white",
        text: "text-green-300",
    },
    {
        label: "Pending Activation",
        value: 0,
        icon: (
            <img
                src={OrangeIcon}
                alt="Pending Activation"
                className="w-6 h-6"
            />
        ),
        color: "bg-white",
        text: "text-orange-300",
    }
    ,
    {
        label: "Inactive Participants",
        value: 0,
        icon: (
            <img
                src={RedIcon}
                alt="Inactive Participants"
                className="w-6 h-6"
            />
        ),
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
}

const Participants: React.FC = () => {
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [search, setSearch] = useState("");
    const [cards, setCards] = useState(stats);

    useEffect(() => {
        fetch(`/api/list-users?t=${Date.now()}`, { cache: 'no-store' })
            .then((res) => res.json())
            .then((data) => {
                setUsers(data);
                setLoading(false);

                const all = data.length;
                const active = data.filter((u: UserType) => getStatus(u) === "Active").length;
                const inactive = data.filter((u: UserType) => getStatus(u) === "Inactive").length;
                const pending = data.filter((u: UserType) => getStatus(u) === "Pending").length;

                setCards([
                    { ...stats[0], value: all },
                    { ...stats[1], value: active },
                    { ...stats[2], value: pending },
                    { ...stats[3], value: inactive },
                ]);
            });
    }, []);

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
                            className={`flex flex-col ${stat.color} rounded-xl shadow-md px-5 py-4`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="font-semibold text-lg">{stat.label}</div>
                                {stat.icon}
                            </div>
                            <div className={`mt-2 text-2xl font-bold ${stat.text}`}>
                                {stat.value}
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
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-lg font-semibold" style={{ color: '#125566' }}>Participants List</h2>
                        <p className="text-gray-500 text-sm">
                            Overview of all Participants
                        </p>
                    </div>

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

                            {!loading &&
                                filtered.map((u) => {
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
                                            <td className="py-2 px-6">{u.lastSignIn || "Never"}</td>
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
                                        No participants found.
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