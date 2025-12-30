package com.lovablegrowth.chatbot

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task
import com.lovablegrowth.chatbot.api.RetrofitClient
import com.lovablegrowth.chatbot.databinding.ActivityLoginBinding
import com.lovablegrowth.chatbot.models.GoogleAuthRequest
import com.lovablegrowth.chatbot.utils.PreferencesManager
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLoginBinding
    private lateinit var preferencesManager: PreferencesManager
    private lateinit var googleSignInClient: GoogleSignInClient
    
    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        handleSignInResult(task)
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        preferencesManager = PreferencesManager(this)
        
        setupGoogleSignIn()
        setupListeners()
    }
    
    private fun setupGoogleSignIn() {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestServerAuthCode(getString(R.string.google_client_id))
            .requestEmail()
            .build()
        
        googleSignInClient = GoogleSignIn.getClient(this, gso)
    }
    
    private fun setupListeners() {
        binding.btnGoogleLogin.setOnClickListener {
            signInWithGoogle()
        }
        
        binding.btnLogin.setOnClickListener {
            Toast.makeText(
                this,
                "Please use Google Sign-In for authentication",
                Toast.LENGTH_SHORT
            ).show()
        }
        
        binding.tvForgotPassword.setOnClickListener {
            Toast.makeText(this, "Feature coming soon", Toast.LENGTH_SHORT).show()
        }
        
        binding.tvSignUp.setOnClickListener {
            Toast.makeText(this, "Please sign up using Google Sign-In", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun signInWithGoogle() {
        binding.progressBar.visibility = View.VISIBLE
        val signInIntent = googleSignInClient.signInIntent
        googleSignInLauncher.launch(signInIntent)
    }
    
    private fun handleSignInResult(completedTask: Task<GoogleSignInAccount>) {
        try {
            val account = completedTask.getResult(ApiException::class.java)
            Log.d("LoginActivity", "Google sign in successful: ${account.email}")
            
            // Get server auth code
            val authCode = account.serverAuthCode
            if (authCode != null) {
                authenticateWithBackend(authCode)
            } else {
                binding.progressBar.visibility = View.GONE
                Toast.makeText(this, "Failed to get auth code", Toast.LENGTH_SHORT).show()
            }
        } catch (e: ApiException) {
            Log.w("LoginActivity", "Google sign in failed", e)
            binding.progressBar.visibility = View.GONE
            Toast.makeText(this, "Google sign in failed: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun authenticateWithBackend(authCode: String) {
        lifecycleScope.launch {
            try {
                // Default role is founder, you can add a role selector if needed
                val request = GoogleAuthRequest(authCode, "founder")
                val response = RetrofitClient.apiService.loginWithGoogle(request)
                
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    
                    // Save auth data
                    preferencesManager.saveAuthToken(authResponse.token)
                    preferencesManager.saveUserData(
                        authResponse.user.id,
                        authResponse.user.name,
                        authResponse.user.email,
                        authResponse.user.role
                    )
                    
                    Toast.makeText(
                        this@LoginActivity,
                        "Welcome ${authResponse.user.name}!",
                        Toast.LENGTH_SHORT
                    ).show()
                    
                    // Navigate to main activity
                    val intent = Intent(this@LoginActivity, MainActivity::class.java)
                    startActivity(intent)
                    finish()
                } else {
                    Toast.makeText(
                        this@LoginActivity,
                        "Authentication failed: ${response.message()}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (e: Exception) {
                Log.e("LoginActivity", "Backend auth error", e)
                Toast.makeText(
                    this@LoginActivity,
                    "Error: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}
