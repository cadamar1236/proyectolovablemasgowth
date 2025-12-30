package com.lovablegrowth.chatbot

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.work.*
import com.google.android.material.tabs.TabLayout
import com.lovablegrowth.chatbot.databinding.ActivityMainBinding
import com.lovablegrowth.chatbot.utils.PreferencesManager
import com.lovablegrowth.chatbot.workers.GoalReminderWorker
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var preferencesManager: PreferencesManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setSupportActionBar(binding.toolbar)
        preferencesManager = PreferencesManager(this)
        
        setupTabs()
        loadUserInfo()
        scheduleGoalReminders()
    }
    
    private fun setupTabs() {
        binding.tabs.addTab(binding.tabs.newTab().setText("Agent").setIcon(R.drawable.ic_chat))
        binding.tabs.addTab(binding.tabs.newTab().setText("Goals").setIcon(R.drawable.ic_goals))
        binding.tabs.addTab(binding.tabs.newTab().setText("Market").setIcon(R.drawable.ic_marketplace))
        
        binding.tabs.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                when (tab?.position) {
                    0 -> { /* Already in Agent mode or show fragment */ }
                    1 -> startActivity(Intent(this@MainActivity, GoalsActivity::class.java))
                    2 -> startActivity(Intent(this@MainActivity, MarketplaceActivity::class.java))
                }
            }
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {
                when (tab?.position) {
                    1 -> startActivity(Intent(this@MainActivity, GoalsActivity::class.java))
                    2 -> startActivity(Intent(this@MainActivity, MarketplaceActivity::class.java))
                }
            }
        })
    }

    private fun scheduleGoalReminders() {
        val reminderRequest = PeriodicWorkRequestBuilder<GoalReminderWorker>(
            24, TimeUnit.HOURS // Remind once a day
        )
        .setConstraints(Constraints.Builder()
            .setRequiredNetworkType(NetworkType.NOT_REQUIRED)
            .build())
        .build()

        WorkManager.getInstance(applicationContext).enqueueUniquePeriodicWork(
            "GoalReminder",
            ExistingPeriodicWorkPolicy.KEEP,
            reminderRequest
        )
    }
    
    private fun loadUserInfo() {
        lifecycleScope.launch {
            val userName = preferencesManager.getUserName().first() ?: "User"
            supportActionBar?.subtitle = "Welcome, $userName"
        }
    }
    
    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_logout -> {
                logout()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun logout() {
        lifecycleScope.launch {
            preferencesManager.clearAll()
            val intent = Intent(this@MainActivity, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
        }
    }
}
