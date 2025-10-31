import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import axios from "axios";

interface Task {
  id: number;
  title: string;
  isCompleted: boolean;
  projectId: number;
  estimatedHours: number;
  dueDate: string;
  dependencies: number[];
}


interface Project {
  id: number;
  title: string;
  description: string;
}
interface NewTaskInput {
  title: string;
  estimatedHours: number;
  dueDate: string;
  dependencies: string;
}



function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Record<number, Task[]>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);
  
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState("");
  const [newTask, setNewTask] = useState<Record<number, Partial<NewTaskInput>>>({});
  const [smartSchedule, setSmartSchedule] = useState<any[]>([]); 
const [showSchedule, setShowSchedule] = useState(false);



  const token = localStorage.getItem("token");

  // 🔹 Update Task
  const handleUpdateTask = async (projectId: number, taskId: number) => {
    if (!editedTaskTitle.trim()) return;

    try {
      const res = await api.put(
        `/api/projects/${projectId}/tasks/${taskId}`,
        { title: editedTaskTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("🟢 Task updated:", res.data);

      setTasks((prev) => ({
        ...prev,
        [projectId]: prev[projectId].map((task) =>
          task.id === taskId ? { ...task, title: editedTaskTitle } : task
        ),
      }));

      setEditingTaskId(null);
      setEditedTaskTitle("");
    } catch (err) {
      console.error("❌ Error updating task:", err);
    }
  };

  // 🔹 Toggle expand/collapse project
  const toggleExpand = (id: number) => {
    if (expandedProjectId === id) {
      setExpandedProjectId(null);
    } else {
      setExpandedProjectId(id);
      fetchTasks(id);
    }
  };
  const updateNewTaskField = (
  projectId: number,
  field: keyof NewTaskInput,
  value: string | number
) => {
  setNewTask((prev) => ({
    ...prev,
    [projectId]: {
      ...(prev[projectId] ?? {}),
      [field]: value,
    },
  }));
};


  // 🔹 Fetch projects
  useEffect(() => {
    api
      .get("/api/projects", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        console.log("📦 Projects:", res.data);
        setProjects(res.data);
      })
      .catch((err) => console.error("❌ Failed to load projects", err));
  }, []);

  // 🔹 Fetch tasks for a project
  const fetchTasks = async (projectId: number) => {
    try {
      const res = await api.get(`/api/projects/${projectId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => ({ ...prev, [projectId]: res.data }));
      console.log(`📋 Tasks for project ${projectId}:`, res.data);
    } catch (err) {
      console.error("❌ Failed to load tasks:", err);
    }
  };

  // 🔹 Add Project
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await api.post(
        "/api/projects",
        { title, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects((prev) => [...prev, res.data]);
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error("❌ Error adding project:", err);
    }
  };
 const handleSmartSchedule = async (projectId: number) => {
  console.log("🧠 Smart schedule triggered for project:", projectId);
  
  // FIX: Access the array of tasks from the object keyed by projectId
  const currentProjectTasks = tasks[projectId]; 
  
  // FIX: Wrap the extracted array in the expected 'tasks' object for the backend model
  const payload = { tasks: currentProjectTasks };
  console.log("🔍 Payload being sent:", payload);

  try {
    const response = await axios.post(
      `http://localhost:5236/api/v1/projects/${projectId}/schedule`,
      payload
    );

    console.log("✅ Smart schedule generated:", response.data.scheduleDetails
);
    
    // FIX: Set the state to the specific array returned by the backend: 'ScheduleDetails'
    setSmartSchedule(response.data.scheduleDetails); 
    
    setShowSchedule(true);
  } catch (err) {
    console.error("❌ Error generating schedule:", err);
    // Optional: Hide schedule if the generation fails
    setShowSchedule(false);
  }
};





  // 🔹 Delete Project
  const handleDeleteProject = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5236/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      alert("Project deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    }
  };

  // 🔹 Add Task
  const handleAddTask = async (projectId: number) => {
  const taskData = newTask[projectId];
  if (!taskData?.title?.trim()) return;

  const formattedTask = {
    title: taskData.title.trim(),
    estimatedHours: Number(taskData.estimatedHours) || 1,
    dueDate: taskData.dueDate || new Date().toISOString(),
    dependencies:
      typeof taskData.dependencies === "string" && taskData.dependencies.trim()
        ? taskData.dependencies.split(",").map((id) => Number(id.trim()))
        : [],
  };

  try {
    const res = await api.post(
      `/api/projects/${projectId}/tasks`,
      formattedTask,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setTasks((prev) => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), res.data],
    }));

    // ✅ Reset input for this project properly
    setNewTask((prev) => ({
      ...prev,
      [projectId]: {}, // not ""
    }));
  } catch (err) {
    console.error("❌ Error adding task:", err);
  }
};


  // 🔹 Toggle Task Completion
  const handleToggleTask = async (projectId: number, taskId: number) => {
    console.log("✅ Toggle clicked:", projectId, taskId);

    try {
      await api.put(
        `/api/projects/${projectId}/tasks/${taskId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks((prev) => ({
        ...prev,
        [projectId]: prev[projectId].map((task) =>
          task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
        ),
      }));
    } catch (err) {
      console.error("❌ Error toggling task:", err);
    }
  };

  // 🔹 Delete Task
  const handleDeleteTask = async (projectId: number, taskId: number) => {
    try {
      await api.delete(`/api/projects/${projectId}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => ({
        ...prev,
        [projectId]: prev[projectId].filter((t) => t.id !== taskId),
      }));
    } catch (err) {
      console.error("❌ Error deleting task:", err);
    }
  };

  // ────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📋 My Projects</h2>

      {/* Add Project */}
      <form onSubmit={handleAddProject} className="mb-4 flex flex-wrap gap-2">
        <input
          className="border p-2 rounded"
          placeholder="Project title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="border p-2 rounded"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
        >
          Add
        </button>
      </form>

      {/* Project List */}
      <ul>
        {projects.map((project) => (
          <li
            key={project.id}
            className="mb-3 p-3 border rounded-lg bg-gray-50 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <button
                onClick={() => toggleExpand(project.id)}
                className="flex-1 text-left font-semibold text-lg"
              >
                {project.title || "(Untitled Project)"}
              </button>
              <button
                onClick={() => handleDeleteProject(project.id)}
                className="bg-red-500 text-white rounded px-2 py-1"
              >
                Delete
              </button>
            </div>

            {expandedProjectId === project.id && (
              <div className="mt-3">
                <p className="text-gray-600 mb-2">
                  {project.description || "No description provided."}
                </p>

                {/* Add Task */}
      <div className="flex flex-col gap-2 mb-3 border p-3 rounded bg-white shadow-sm">
  <h4 className="font-semibold">➕ Add Task</h4>

  <input
    className="border p-2 rounded"
    placeholder="Task title"
    value={newTask[project.id]?.title ?? ""}
    onChange={(e) => updateNewTaskField(project.id, "title", e.target.value)}
  />

  <input
    type="number"
    className="border p-2 rounded"
    placeholder="Estimated hours"
    value={newTask[project.id]?.estimatedHours ?? ""}
    onChange={(e) =>
      updateNewTaskField(project.id, "estimatedHours", Number(e.target.value))
    }
  />

  <input
    type="date"
    className="border p-2 rounded"
    value={newTask[project.id]?.dueDate ?? ""}
    onChange={(e) => updateNewTaskField(project.id, "dueDate", e.target.value)}
  />

  <input
    className="border p-2 rounded"
    placeholder="Dependencies (comma-separated task IDs)"
    value={newTask[project.id]?.dependencies ?? ""}
    onChange={(e) =>
      updateNewTaskField(project.id, "dependencies", e.target.value)
    }
  />

  <button
    onClick={() => handleAddTask(project.id)}
    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
  >
    Add Task
  </button>
</div>

 <button
  onClick={() => handleSmartSchedule(project.id)}
  className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 mb-2"
>
  Smart Schedule
</button>

{/* FIX: The conditional rendering block is now safe because smartSchedule is an array */}
{showSchedule && smartSchedule.length > 0 && (
  <div className="mt-4 bg-white border rounded-lg shadow p-3">
    <h3 className="text-lg font-semibold mb-2">🧭 Smart Schedule</h3>

    <table className="min-w-full border-collapse text-sm">
      <thead>
        <tr className="border-b bg-gray-100">
          <th className="p-2 text-left">Task</th>
          <th className="p-2 text-left">Start Time</th>
          <th className="p-2 text-left">End Time</th>
          <th className="p-2 text-left">Est. Hours</th>
          <th className="p-2 text-left">Due Date</th>
        </tr>
      </thead>
      <tbody>
        {smartSchedule.map((item, index) => (
          <tr key={index} className="border-b hover:bg-gray-50">
            {/* FIX: Use PascalCase properties from C# JSON response */}
            <td className="p-2">{item.title}</td>
            
            {/* C# returns formatted strings (e.g., 'yyyy-MM-dd HH:mm') for StartTime/EndTime */}
            {/* We can still convert them to Date objects for better display formatting */}
            <td className="p-2"> {new Date(item.startTime.replace(" ", "T")).toLocaleString()}</td>
            <td className="p-2"> {new Date(item.startTime.replace(" ", "T")).toLocaleString()}</td>
            
            <td className="p-2">{item.EstimatedHours}</td>
            <td className="p-2">
              {item.DueDate
                ? new Date(item.DueDate).toLocaleDateString()
                : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <button
      onClick={() => setShowSchedule(false)}
      className="mt-3 bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
    >
      Hide Schedule
    </button>
  </div>
)}


                {/* Task List */}
                <ul>
                  {(tasks[project.id] || []).map((task) => (
                    <li
                      key={task.id}
                      className="flex justify-between items-center border-b py-1"
                    >
                      {editingTaskId === task.id ? (
                        <input
                          type="text"
                          className="border rounded px-2 py-1 flex-1 mr-2"
                          value={editedTaskTitle}
                          onChange={(e) => setEditedTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateTask(project.id, task.id);
                            }
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => handleToggleTask(project.id, task.id)}
                          className={`cursor-pointer text-left flex-1 ${
                            task.isCompleted ? "line-through text-gray-500" : ""
                          }`}
                        >
                          {task.title}
                        </button>
                      )}

                      <div className="flex gap-2">
                        {editingTaskId === task.id ? (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateTask(project.id, task.id)
                              }
                              className="text-green-600 text-sm"
                            >
                              💾 Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingTaskId(null);
                                setEditedTaskTitle("");
                              }}
                              className="text-gray-500 text-sm"
                            >
                              ❌ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                         
                            <button
                              onClick={() => {
                                setEditingTaskId(task.id);
                                setEditedTaskTitle(task.title);
                              }}
                              className="text-blue-500 text-sm"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteTask(project.id, task.id)
                              }
                              className="text-red-500 text-sm"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
