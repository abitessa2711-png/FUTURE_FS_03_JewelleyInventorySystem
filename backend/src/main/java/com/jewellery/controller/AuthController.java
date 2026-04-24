package com.jewellery.controller;

import com.jewellery.config.JwtUtil;
import com.jewellery.dto.ApiResponse;
import com.jewellery.entity.User;
import com.jewellery.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "https://super-puppy-af95da.netlify.app"})
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @GetMapping("/test")
    public String test() {
        return "Backend Working";
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<User>> signup(@RequestBody User user) {
        return ResponseEntity.ok(ApiResponse.success(userService.signup(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Object>> login(@RequestBody Map<String, String> credentials) {
        String loginId = credentials.get("loginId"); // email or phone
        String password = credentials.get("password");
        
        Optional<User> userOpt = userService.login(loginId, password);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
            return ResponseEntity.ok(ApiResponse.success(Map.of("user", user, "token", token)));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("தவறான மின்னஞ்சல்/செல்பேசி எண் அல்லது கடவுச்சொல்"));
    }
}
