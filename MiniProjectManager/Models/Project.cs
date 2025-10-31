using System;
using System.Collections.Generic;

namespace MiniProjectManager.Models
{
    public class Project
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ❌ Remove foreign key references
        // public int UserId { get; set; }
        // public User? User { get; set; }

        // ✅ Keep this for linking to user via email
        public string OwnerEmail { get; set; } = string.Empty;

        public List<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    }
}


