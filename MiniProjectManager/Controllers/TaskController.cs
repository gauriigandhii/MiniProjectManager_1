using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniProjectManager.Data;
using MiniProjectManager.Models;
using System.Security.Claims;

namespace MiniProjectManager.Controllers
{
  [ApiController]
  [Route("api/projects/{projectId}/tasks")]
  [Authorize]
  public class TaskController : ControllerBase
  {
    private readonly AppDbContext _db;
    public TaskController(AppDbContext db)
    {
      _db = db;
    }

    // ✅ Get all tasks for a project
    [HttpGet]
    public async Task<IActionResult> GetTasks(int projectId)
    {
      var email = User.FindFirstValue(ClaimTypes.Email);
      var project = await _db.Projects
          .Include(p => p.Tasks)
          .FirstOrDefaultAsync(p => p.Id == projectId && p.OwnerEmail == email);

      if (project == null)
        return NotFound("Project not found or unauthorized");

      return Ok(project.Tasks);
    }

    // ✅ Add a new task
    [HttpPost]
    public async Task<IActionResult> AddTask(int projectId, [FromBody] TaskItem task)
    {
      var email = User.FindFirstValue(ClaimTypes.Email);
      var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == projectId && p.OwnerEmail == email);
      if (project == null)
        return NotFound("Project not found or unauthorized");

      task.ProjectId = projectId;
      _db.Tasks.Add(task);
      await _db.SaveChangesAsync();
      return Ok(task);
    }

    // ✅ Update a task
    // ✅ Update a task (supports EstimatedHours, DueDate, Dependencies)
    [HttpPut("{taskId}")]
    public async Task<IActionResult> UpdateTask(int projectId, int taskId, [FromBody] TaskItem updatedTask)
    {
      var email = User.FindFirstValue(ClaimTypes.Email);
      var task = await _db.Tasks
          .Include(t => t.Project)
          .FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId && t.Project.OwnerEmail == email);

      if (task == null)
        return NotFound("Task not found or unauthorized");

      // Update all editable fields
      task.Title = updatedTask.Title ?? task.Title;
      task.IsCompleted = updatedTask.IsCompleted;
      task.EstimatedHours = updatedTask.EstimatedHours;
      task.DueDate = updatedTask.DueDate;
      task.Dependencies = updatedTask.Dependencies ?? new List<int>();

      await _db.SaveChangesAsync();
      return Ok(task);
    }

    // ✅ Toggle completion
    [HttpPut("{taskId}/toggle")]
    public async Task<IActionResult> ToggleTask(int projectId, int taskId)
    {
      var email = User.FindFirstValue(ClaimTypes.Email);
      var task = await _db.Tasks
          .Include(t => t.Project)
          .FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId && t.Project.OwnerEmail == email);

      if (task == null)
        return NotFound("Task not found or unauthorized");

      task.IsCompleted = !task.IsCompleted;
      await _db.SaveChangesAsync();
      return Ok(task);
    }

    // ✅ Delete a task
    [HttpDelete("{taskId}")]
    public async Task<IActionResult> DeleteTask(int projectId, int taskId)
    {
      var email = User.FindFirstValue(ClaimTypes.Email);
      var task = await _db.Tasks
          .Include(t => t.Project)
          .FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId && t.Project.OwnerEmail == email);

      if (task == null)
        return NotFound("Task not found or unauthorized");

      _db.Tasks.Remove(task);
      await _db.SaveChangesAsync();
      return Ok();
    }



  }
}