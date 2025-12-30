package com.lovablegrowth.chatbot

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import com.lovablegrowth.chatbot.adapters.GoalsAdapter
import com.lovablegrowth.chatbot.api.RetrofitClient
import com.lovablegrowth.chatbot.databinding.ActivityGoalsBinding
import com.lovablegrowth.chatbot.models.CreateGoalRequest
import com.lovablegrowth.chatbot.models.Goal
import com.lovablegrowth.chatbot.models.UpdateGoalRequest
import com.lovablegrowth.chatbot.utils.PreferencesManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class GoalsActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityGoalsBinding
    private lateinit var preferencesManager: PreferencesManager
    private lateinit var goalsAdapter: GoalsAdapter
    private val goals = mutableListOf<Goal>()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityGoalsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        preferencesManager = PreferencesManager(this)
        
        setupToolbar()
        setupRecyclerView()
        setupListeners()
        loadGoals()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            title = "My Goals"
        }
    }
    
    private fun setupRecyclerView() {
        goalsAdapter = GoalsAdapter(
            goals,
            onGoalClick = { goal -> editGoal(goal) },
            onGoalDelete = { goal -> deleteGoal(goal) },
            onGoalUpdate = { goal, current -> updateGoalProgress(goal, current) }
        )
        
        binding.recyclerView.apply {
            layoutManager = LinearLayoutManager(this@GoalsActivity)
            adapter = goalsAdapter
        }
    }
    
    private fun setupListeners() {
        binding.fabAddGoal.setOnClickListener {
            showCreateGoalDialog()
        }
        
        binding.swipeRefresh.setOnRefreshListener {
            loadGoals()
        }
    }
    
    private fun loadGoals() {
        binding.progressBar.visibility = View.VISIBLE
        
        lifecycleScope.launch {
            try {
                val token = preferencesManager.getAuthToken().first() ?: ""
                val authHeader = "Bearer $token"
                
                val response = RetrofitClient.apiService.getGoals(authHeader)
                
                if (response.isSuccessful && response.body() != null) {
                    goals.clear()
                    goals.addAll(response.body()!!.goals)
                    goalsAdapter.notifyDataSetChanged()
                    
                    binding.emptyView.visibility = if (goals.isEmpty()) View.VISIBLE else View.GONE
                } else {
                    Toast.makeText(this@GoalsActivity, "Failed to load goals", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@GoalsActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }
    
    private fun showCreateGoalDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_create_goal, null)
        val etTitle = dialogView.findViewById<TextInputEditText>(R.id.etTitle)
        val etDescription = dialogView.findViewById<TextInputEditText>(R.id.etDescription)
        val etTarget = dialogView.findViewById<TextInputEditText>(R.id.etTarget)
        
        MaterialAlertDialogBuilder(this)
            .setTitle("Create New Goal")
            .setView(dialogView)
            .setPositiveButton("Create") { _, _ ->
                val titleStr = etTitle.text.toString().trim()
                val descriptionStr = etDescription.text.toString().trim()
                val targetVal = etTarget.text.toString().toIntOrNull()
                
                if (titleStr.isNotEmpty()) {
                    createGoal(titleStr, descriptionStr, targetVal)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun createGoal(title: String, description: String?, target: Int?) {
        lifecycleScope.launch {
            try {
                val token = preferencesManager.getAuthToken().first() ?: ""
                val authHeader = "Bearer $token"
                
                val request = CreateGoalRequest(
                    title = title,
                    notes = description,
                    targetValue = target
                )
                
                val response = RetrofitClient.apiService.createGoal(authHeader, request)
                
                if (response.isSuccessful && response.body() != null) {
                    Toast.makeText(this@GoalsActivity, "Goal created!", Toast.LENGTH_SHORT).show()
                    loadGoals()
                } else {
                    Toast.makeText(this@GoalsActivity, "Failed to create goal", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@GoalsActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun editGoal(goal: Goal) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_create_goal, null)
        val etTitle = dialogView.findViewById<TextInputEditText>(R.id.etTitle)
        val etDescription = dialogView.findViewById<TextInputEditText>(R.id.etDescription)
        val etTarget = dialogView.findViewById<TextInputEditText>(R.id.etTarget)
        
        etTitle.setText(goal.title)
        etDescription.setText(goal.notes)
        etTarget.setText(goal.target?.toString() ?: "")
        
        MaterialAlertDialogBuilder(this)
            .setTitle("Edit Goal")
            .setView(dialogView)
            .setPositiveButton("Update") { _, _ ->
                val titleStr = etTitle.text.toString().trim()
                val descriptionStr = etDescription.text.toString().trim()
                val targetVal = etTarget.text.toString().toIntOrNull()
                
                updateGoal(goal.id, titleStr, descriptionStr, targetVal)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun updateGoal(goalId: Int, title: String, description: String?, target: Int?) {
        lifecycleScope.launch {
            try {
                val token = preferencesManager.getAuthToken().first() ?: ""
                val authHeader = "Bearer $token"
                
                val request = UpdateGoalRequest(
                    title = title,
                    notes = description,
                    targetValue = target
                )
                
                val response = RetrofitClient.apiService.updateGoal(authHeader, goalId, request)
                
                if (response.isSuccessful) {
                    Toast.makeText(this@GoalsActivity, "Goal updated!", Toast.LENGTH_SHORT).show()
                    loadGoals()
                }
            } catch (e: Exception) {
                Toast.makeText(this@GoalsActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun updateGoalProgress(goal: Goal, current: Int) {
        lifecycleScope.launch {
            try {
                val token = preferencesManager.getAuthToken().first() ?: ""
                val authHeader = "Bearer $token"
                
                val request = UpdateGoalRequest(currentValue = current)
                val response = RetrofitClient.apiService.updateGoal(authHeader, goal.id, request)
                
                if (response.isSuccessful) {
                    loadGoals()
                }
            } catch (e: Exception) {
                Toast.makeText(this@GoalsActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun deleteGoal(goal: Goal) {
        MaterialAlertDialogBuilder(this)
            .setTitle("Delete Goal")
            .setMessage("Are you sure you want to delete this goal?")
            .setPositiveButton("Delete") { _, _ ->
                lifecycleScope.launch {
                    try {
                        val token = preferencesManager.getAuthToken().first() ?: ""
                        val authHeader = "Bearer $token"
                        
                        val response = RetrofitClient.apiService.deleteGoal(authHeader, goal.id)
                        
                        if (response.isSuccessful) {
                            Toast.makeText(this@GoalsActivity, "Goal deleted", Toast.LENGTH_SHORT).show()
                            loadGoals()
                        }
                    } catch (e: Exception) {
                        Toast.makeText(this@GoalsActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
