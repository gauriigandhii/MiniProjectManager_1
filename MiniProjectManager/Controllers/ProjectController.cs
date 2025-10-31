using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MiniProjectManager.Data;
using MiniProjectManager.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MiniProjectManager.Controllers
{
  [ApiController]
  [Route("api/projects")]
  [Authorize] // ✅ Only logged-in users can access
  public class ProjectController : ControllerBase
  {
    private readonly AppDbContext _db;

    public ProjectController(AppDbContext db)
    {
      _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetProjects()
    {
      var email = User.FindFirstValue(ClaimTypes.Email);
      var projects = await _db.Projects
          .Where(p => p.OwnerEmail == email)
          .ToListAsync();

      return Ok(projects);
    }

    [HttpPost]

    public async Task<IActionResult> AddProject([FromBody] Project project)
    {
      try
      {
        var email = User.FindFirstValue(ClaimTypes.Email);
        project.OwnerEmail = email;

        _db.Projects.Add(project);
        await _db.SaveChangesAsync();

        return Ok(project);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"❌ Error adding project: {ex.Message}");
        return StatusCode(500, ex.Message);
      }
    }
    [HttpDelete("{id}")]

    public async Task<IActionResult> DeleteProject(int id)
    {
      var email = User.FindFirstValue(ClaimTypes.Email);
      Console.WriteLine($"🧩 Delete request for project {id} by {email}");

      var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == id && p.OwnerEmail == email);

      if (project == null)
      {
        Console.WriteLine($"❌ Project {id} not found or not owned by {email}");
        return NotFound("Project not found or not authorized");
      }

      _db.Projects.Remove(project);
      await _db.SaveChangesAsync();
      Console.WriteLine($"✅ Project {id} deleted successfully");
      return Ok();
    }



  }
}
