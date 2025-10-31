using Microsoft.AspNetCore.Mvc;
using MiniProjectManager.Data;
using MiniProjectManager.Models;
using MiniProjectManager.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization; // ✅ import this
using BCrypt.Net;

namespace MiniProjectManager.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly AuthService _authService;

        public AuthController(AppDbContext db, AuthService authService)
        {
            _db = db;
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(UserRegisterDto request)
        {
            if (await _db.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest("User already exists");

            var user = new User
            {
                Email = request.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return Ok("User registered successfully!");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(UserLoginDto request)
        {
            var user = await _db.Users.SingleOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
                return Unauthorized("Invalid credentials");

            var token = _authService.GenerateToken(user.Email);

            return Ok(new { Token = token });
        }

        // ✅ Protected endpoint
        [Authorize]
        [HttpGet("secure")]
        public IActionResult SecureData()
        {
            return Ok("This is protected data ✅ — You are authorized!");
        }
    }

    public class UserRegisterDto
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }

    public class UserLoginDto
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }
}
