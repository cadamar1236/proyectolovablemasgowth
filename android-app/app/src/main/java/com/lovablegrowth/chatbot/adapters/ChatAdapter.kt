package com.lovablegrowth.chatbot.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.lovablegrowth.chatbot.databinding.ItemMessageBinding
import com.lovablegrowth.chatbot.models.Message

class ChatAdapter(
    private val messages: List<Message>,
    var currentUserId: Int
) : RecyclerView.Adapter<ChatAdapter.MessageViewHolder>() {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MessageViewHolder {
        val binding = ItemMessageBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return MessageViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: MessageViewHolder, position: Int) {
        holder.bind(messages[position])
    }
    
    override fun getItemCount() = messages.size
    
    inner class MessageViewHolder(
        private val binding: ItemMessageBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(message: Message) {
            val isCurrentUser = message.senderId == currentUserId
            
            if (isCurrentUser) {
                binding.tvMessageReceived.visibility = android.view.View.GONE
                binding.tvTimeReceived.visibility = android.view.View.GONE
                binding.tvMessageSent.visibility = android.view.View.VISIBLE
                binding.tvTimeSent.visibility = android.view.View.VISIBLE
                binding.tvMessageSent.text = message.content
                binding.tvTimeSent.text = formatTime(message.createdAt)
            } else {
                binding.tvMessageSent.visibility = android.view.View.GONE
                binding.tvTimeSent.visibility = android.view.View.GONE
                binding.tvMessageReceived.visibility = android.view.View.VISIBLE
                binding.tvTimeReceived.visibility = android.view.View.VISIBLE
                binding.tvMessageReceived.text = message.content
                binding.tvTimeReceived.text = formatTime(message.createdAt)
            }
        }
        
        private fun formatTime(timestamp: String): String {
            return try {
                val parts = timestamp.split(" ")
                if (parts.size >= 2) parts[1].substring(0, 5) else timestamp
            } catch (e: Exception) {
                timestamp
            }
        }
    }
}
