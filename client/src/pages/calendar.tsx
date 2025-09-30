import React, { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import { format, getDaysInMonth, startOfMonth, addDays, isBefore, isSameDay } from "date-fns";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";

interface Task {
  id: string;
  text: string;
  date: string;
  time: string;
  isCompleted: boolean;
}

const Calendar: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const tasksCollectionRef = collection(db, "Admin_calender");

  useEffect(() => {
    const getAllTasks = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(tasksCollectionRef);
        const fetchedTasks = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Task[];
        setAllTasks(fetchedTasks);
      } catch (error) {
        console.error("Error fetching all tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    getAllTasks();
  }, []);

  useEffect(() => {
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const filtered = allTasks
      .filter(task => task.date === formattedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
    setTasks(filtered);
  }, [selectedDate, allTasks]);

  const handleAddTask = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (isBefore(selected, today)) {
      alert("Cannot add or edit tasks for previous dates.");
      return;
    }

    if (newTaskText.trim() === "" || newTaskTime.trim() === "") return;

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    let taskToUpdate: Task | null = null;

    try {
      if (editingTaskId !== null) {
        const taskDoc = doc(db, "Admin_calender", editingTaskId);
        await updateDoc(taskDoc, {
          text: newTaskText,
          time: newTaskTime,
        });
        taskToUpdate = { id: editingTaskId, text: newTaskText, time: newTaskTime, date: formattedDate, isCompleted: false };
      } else {
        const docRef = await addDoc(tasksCollectionRef, {
          text: newTaskText,
          date: formattedDate,
          time: newTaskTime,
          isCompleted: false,
        });
        taskToUpdate = { id: docRef.id, text: newTaskText, time: newTaskTime, date: formattedDate, isCompleted: false };
      }

      if (taskToUpdate) {
        if (editingTaskId) {
          setAllTasks(prev => prev.map(task => task.id === taskToUpdate!.id ? taskToUpdate! : task));
        } else {
          setAllTasks(prev => [...prev, taskToUpdate! as Task]);
        }
      }

      setNewTaskText("");
      setNewTaskTime("");
      setEditingTaskId(null);
    } catch (error) {
      console.error("Error adding/updating task:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const taskDoc = doc(db, "Admin_calender", id);
      await deleteDoc(taskDoc);
      setAllTasks(prev => prev.filter(task => task.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleEditTask = (task: Task) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);

    if (isBefore(taskDate, today)) {
      alert("Cannot edit tasks for previous dates.");
      return;
    }

    setNewTaskText(task.text);
    setNewTaskTime(task.time);
    setEditingTaskId(task.id);
  };

  const handleCompleteTask = async (task: Task) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.date);
    taskDate.setHours(0, 0, 0, 0);

    if (isBefore(taskDate, today)) {
      alert("Cannot mark tasks as complete for previous dates.");
      return;
    }

    try {
      const taskDoc = doc(db, "Admin_calender", task.id);
      await updateDoc(taskDoc, {
        isCompleted: !task.isCompleted,
      });
      setAllTasks(prev => prev.map(t => t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t));
    } catch (error) {
      console.error("Error updating task completion status:", error);
    }
  };

  const hasTask = (day: number): boolean => {
    const formattedDate = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day), 'yyyy-MM-dd');
    return allTasks.some(task => task.date === formattedDate);
  };

  const daysInMonth = getDaysInMonth(selectedDate);
  const firstDayOfMonth = startOfMonth(selectedDate);
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const isPastSelectedDate = isBefore(selectedDate, new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

  return (
    <div className="font-poppins bg-gray-100 min-h-screen">
      <Header title="Calendar" subtitle="Manage your schedule and events" />

      <main className="p-6 mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#125566]">Calendar</h1>
          <p className="text-base text-gray-600 mt-1">
            Manage your schedule and events
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">

          {/* Left Column: Calendar View Card */}
          <div className="md:w-2/3 bg-white rounded-2xl shadow-lg">
            <div
              className="px-6 py-4 border-b"
              style={{ borderColor: "#125566" }}
            >
              <h2 className="text-xl font-semibold mb-1 text-[#125566]">
                Calendar View
              </h2>
              <p className="text-sm text-gray-500">
                Click on a day to see and add tasks.
              </p>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                  className="p-3 text-gray-600 hover:bg-gray-200 rounded-full transition duration-200"
                >
                  &lt;
                </button>
                <span className="text-xl font-bold text-gray-800">{format(selectedDate, 'MMMM yyyy')}</span>
                <button
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                  className="p-3 text-gray-600 hover:bg-gray-200 rounded-full transition duration-200"
                >
                  &gt;
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center font-medium">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-gray-700 py-2">{day}</div>
                ))}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`blank-${i}`}></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                  const isSelected = format(selectedDate, 'd') === day.toString();
                  const today = new Date();
                  const isToday = isSameDay(currentDate, today);
                  const hasTaskOnThisDay = hasTask(day);
                  const isPastDate = isBefore(currentDate, today);

                  return (
                    <div key={i} className={`relative flex justify-center items-center h-16 ${isPastDate && !isToday ? 'opacity-50' : ''}`}>
                      <button
                        onClick={() => setSelectedDate(currentDate)}
                        className={`
                          w-10 h-10 rounded-full cursor-pointer transition duration-200 flex items-center justify-center
                          ${isSelected ? 'bg-teal-600 text-white' : 'hover:bg-gray-200'}
                          ${isToday && !isSelected ? 'border-2 border-teal-500 text-teal-500' : ''}
                        `}
                      >
                        {day}
                      </button>
                      {hasTaskOnThisDay && (
                        <span className={`
                            absolute bottom-3 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full
                            ${isSelected ? 'bg-white' : 'bg-teal-500'}
                        `}></span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>


          {/* Right Column: To-Do List Card */}
          <div className="md:w-1/3 bg-white rounded-2xl shadow-lg h-fit">
            <div
              className="px-6 py-4 border-b"
              style={{ borderColor: "#125566" }}
            >
              <h2 className="text-xl font-semibold mb-1 text-[#125566]">
                To-Do List
              </h2>
              <p className="text-sm text-gray-500">
                {format(selectedDate, 'PPP')}
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="New task..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200 ${isPastSelectedDate ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                  disabled={isPastSelectedDate}
                />
                <input
                  type="time"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200 ${isPastSelectedDate ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                  disabled={isPastSelectedDate}
                />
                <button
                  onClick={handleAddTask}
                  className={`w-full text-white p-3 rounded-lg font-semibold transition duration-200 ${isPastSelectedDate ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
                  disabled={isPastSelectedDate}
                >
                  {editingTaskId !== null ? "Update Task" : "Add Task"}
                </button>
              </div>

              {loading ? (
                <p className="text-gray-500 text-center mt-8">Loading tasks...</p>
              ) : (
                <div className="mt-8">
                  {tasks.length > 0 ? (
                    <ul className="space-y-3">
                      {tasks.map(task => (
                        <li
                          key={task.id}
                          className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm"
                        >
                          <div className="flex-1">
                            <p className={`font-medium text-gray-800 ${task.isCompleted ? 'line-through text-gray-400' : ''}`}>{task.text}</p>
                            <p className={`text-sm text-gray-500 ${task.isCompleted ? 'line-through text-gray-400' : ''}`}>{task.time}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => handleCompleteTask(task)}
                              className={`p-2 rounded-lg text-sm font-medium transition duration-200 ${task.isCompleted ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                            >
                              {task.isCompleted ? "Completed" : "Complete"}
                            </button>
                            <button
                              onClick={() => handleEditTask(task)}
                              className="p-2 text-blue-500 hover:text-blue-700 transition duration-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-2 text-red-500 hover:text-red-700 transition duration-200"
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-center">No tasks for this day.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calendar;