package com.lovablegrowth.chatbot

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.lovablegrowth.chatbot.adapters.ChatAdapter
import com.lovablegrowth.chatbot.api.RetrofitClient
import com.lovablegrowth.chatbot.databinding.ActivityChatBinding
import com.lovablegrowth.chatbot.models.AgentMessageRequest
import com.lovablegrowth.chatbot.models.Message
import com.lovablegrowth.chatbot.utils.PreferencesManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class ChatActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityChatBinding
    private lateinit var preferencesManager: PreferencesManager
    private lateinit var chatAdapter: ChatAdapter
    private val messages = mutableListOf<Message>()
    private var isAgent = false
    private var userId = 0
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChatBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        preferencesManager = PreferencesManager(this)
        isAgent = intent.getBooleanExtra("isAgent", false)
        
        setupToolbar()
        setupRecyclerView()
        setupListeners()
        loadUserId()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            title = if (isAgent) "Astar Labs Agent" else "Chat"
        }
    }
    
    private fun setupRecyclerView() {
        chatAdapter = ChatAdapter(messages, userId)
        binding.recyclerView.apply {
            layoutManager = LinearLayoutManager(this@ChatActivity)
            adapter = chatAdapter
        }
    }
    
    private fun setupListeners() {
        binding.btnSend.setOnClickListener {
            val message = binding.etMessage.text.toString().trim()
            if (message.isNotEmpty()) {
                sendMessage(message)
            }
        }
    }
    
    private fun loadUserId() {
        lifecycleScope.launch {
            userId = preferencesManager.getUserId().first() ?: 0
            chatAdapter.currentUserId = userId
        }
    }
    
    private fun sendMessage(content: String) {
        binding.progressBar.visibility = View.VISIBLE
        binding.btnSend.isEnabled = false
        binding.etMessage.text?.clear()
        
        lifecycleScope.launch {
            try {
                val token = preferencesManager.getAuthToken().first() ?: ""
                val authHeader = "Bearer $token"
                
                if (isAgent) {
                    // Send to AI agent
                    val request = AgentMessageRequest(content)
                    val response = RetrofitClient.apiService.sendAgentMessage(authHeader, request)
                    
                    if (response.isSuccessful && response.body() != null) {
                        // Add user message
                        val userMessage = Message(
                            id = messages.size + 1,
                            conversationId = 0,
                            senderId = userId,
                            senderName = "You",
                            content = content,
                            isRead = true,
                            createdAt = getCurrentTime()
                        )
                        messages.add(userMessage)
                        
                        // Add agent response
                        val agentMessage = Message(
                            id = messages.size + 1,
                            conversationId = 0,
                            senderId = 0,
                            senderName = "Astar Labs Agent",
                            content = response.body()!!.response,
                            isRead = true,
                            createdAt = getCurrentTime()
                        )
                        messages.add(agentMessage)
                        
                        chatAdapter.notifyDataSetChanged()
                        binding.recyclerView.scrollToPosition(messages.size - 1)
                    }
                } else {
                    // Send to user conversation
                    Toast.makeText(this@ChatActivity, "User chat not implemented", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ChatActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
                binding.btnSend.isEnabled = true
            }
        }
    }
    
    private fun getCurrentTime(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        return sdf.format(Date())
    }
    
    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
