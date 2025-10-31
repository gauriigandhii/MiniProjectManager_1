// File: MiniProjectManager/Controllers/ScheduleController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniProjectManager.Data;
using MiniProjectManager.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MiniProjectManager.Controllers
{
  [ApiController]
  [Route("api/v1/projects/{projectId}/schedule")]
  public class ScheduleController : ControllerBase
  {
    private readonly AppDbContext _context;

    public ScheduleController(AppDbContext context)
    {
      _context = context;
    }

    /// <summary>
    /// Generates a dependency-aware, priority-based project schedule.
    /// Priority: 1. Dependencies Met, 2. Earliest DueDate, 3. Shortest Duration.
    /// </summary>
    /// <param name="projectId">The ID of the project.</param>
    /// <param name="request">The task details and dependencies.</param>
    [HttpPost]
    public async Task<IActionResult> GenerateSchedule(
        int projectId,
        [FromBody] ScheduleRequest request)
    {
      Console.WriteLine($"📥 Received schedule request for Project ID: {projectId}");

      try
      {
        // 1. Validate Project
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project == null)
          return NotFound(new { message = "Project not found" });

        var tasksFromClient = request.Tasks;

        if (tasksFromClient == null || !tasksFromClient.Any())
          return BadRequest(new { message = "No tasks provided" });

        // --- 🛠️ SCHEDULING LOGIC SETUP ---
        var schedule = new List<object>();
        // Dictionary to track the Earliest Finish Time (EFT) for each scheduled task
        var scheduledEFTs = new Dictionary<int, DateTime>();

        // Convert list to dictionary for efficient lookup and removal
        var unscheduledTasks = tasksFromClient.ToDictionary(t => t.Id, t => t);

        // Schedule starts now
        var currentTime = DateTime.Now;

        Console.WriteLine("\n📅 Starting enhanced scheduling...");

        while (unscheduledTasks.Any())
        {
          // Find all tasks whose dependencies are met (or have no dependencies)
          var availableTasks = unscheduledTasks.Values
              .Where(t => t.Dependencies == null || t.Dependencies.All(depId => scheduledEFTs.ContainsKey(depId)))
              .ToList();

          if (!availableTasks.Any())
          {
            Console.WriteLine("⚠️ Deadlock detected: dependencies could not be resolved.");
            // Scheduling failed due to circular dependencies
            return StatusCode(422, new { message = "Scheduling failed due to unresolvable task dependencies." });
          }

          // --- CRITICAL PATH SELECTION LOGIC ---
          var nextTaskToSchedule = availableTasks
              .Select(t =>
              {
                // 1. Find the latest finish time of all its dependencies
                var dependencyFinishTimes = t.Dependencies
                              .Where(depId => scheduledEFTs.ContainsKey(depId))
                              .Select(depId => scheduledEFTs[depId])
                              .DefaultIfEmpty(currentTime) // If no dependencies, use currentTime
                              .Max();

                // 2. EST is the maximum of the current schedule time OR the latest dependency finish time
                // (Since currentTime is constantly updated to the last task's end, this forces sequential flow)
                var earliestStart = new List<DateTime> { currentTime, dependencyFinishTimes }.Max();

                return new { Task = t, EarliestStart = earliestStart };
              })
              // 3. Priority Sort: Earliest DueDate first, then Shortest EstimatedHours first
              .OrderBy(x => x.Task.DueDate)
              .ThenBy(x => x.Task.EstimatedHours)
              .First(); // Select the highest priority task

          var task = nextTaskToSchedule.Task;
          var start = nextTaskToSchedule.EarliestStart;

          var hours = task.EstimatedHours > 0 ? task.EstimatedHours : 1; // Min 1 hour
          var end = start.AddHours(hours);

          // --- Update Schedule State ---

          // 1. Add to the final output schedule
          schedule.Add(new
          {
            task.Id,
            task.Title,
            StartTime = start.ToString("yyyy-MM-dd HH:mm"), // Format for clean output
            EndTime = end.ToString("yyyy-MM-dd HH:mm"),
            task.EstimatedHours,
            task.DueDate,
            task.Dependencies
          });

          // 2. Track the Earliest Finish Time (EFT) for the next dependency check
          scheduledEFTs.Add(task.Id, end);

          // 3. Advance the global schedule time to the END of this task (Sequential Model)
          currentTime = end;

          // 4. Remove the task from the unscheduled list
          unscheduledTasks.Remove(task.Id);

          Console.WriteLine($"✅ Scheduled: {task.Title} ({task.Id}) | Start: {start:HH:mm}, End: {end:HH:mm}");
        }

        Console.WriteLine("\n🏁 Smart schedule completed successfully!\n");

        // --- Generate Recommended Order from the Schedule ---
        var recommendedOrder = schedule
            .Select(s => s.GetType().GetProperty("Title")?.GetValue(s, null) as string)
            .Where(title => title != null)
            .ToList();

        return Ok(new
        {
          ProjectId = projectId,
          ProjectTitle = project.Title,
          TaskCount = schedule.Count,
          recommendedOrder = recommendedOrder, // Matches the example output format
          ScheduleDetails = schedule // Provides full details including start/end times
        });
      }
      catch (Exception ex)
      {
        Console.WriteLine($"❌ Error generating schedule: {ex.Message}");
        return StatusCode(500, new { message = "Internal server error", error = ex.Message });
      }
    }
  }
}