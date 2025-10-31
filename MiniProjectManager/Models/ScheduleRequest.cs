using System.Collections.Generic;

namespace MiniProjectManager.Models
{
  public class ScheduleRequest
  {
    public List<TaskItem> Tasks { get; set; } = new();
  }
}
