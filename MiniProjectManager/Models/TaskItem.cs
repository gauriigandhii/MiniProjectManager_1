using System.Text.Json.Serialization;

namespace MiniProjectManager.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool IsCompleted { get; set; } = false;
        public double EstimatedHours { get; set; } = 0; // e.g. 4.5 hours

        public DateTime? DueDate { get; set; } // optional due date

        // List of task IDs that this task depends on
        public List<int> Dependencies { get; set; } = new List<int>();

        public int ProjectId { get; set; }


        [JsonIgnore] // 🧠 Prevent circular reference
        public Project? Project { get; set; }
    }
}


