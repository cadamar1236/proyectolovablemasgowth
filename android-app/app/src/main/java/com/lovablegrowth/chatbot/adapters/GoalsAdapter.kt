package com.lovablegrowth.chatbot.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.lovablegrowth.chatbot.databinding.ItemGoalBinding
import com.lovablegrowth.chatbot.models.Goal
import java.util.*

class GoalsAdapter(
    private val goals: List<Goal>,
    private val onGoalClick: (Goal) -> Unit,
    private val onGoalDelete: (Goal) -> Unit,
    private val onGoalUpdate: (Goal, Int) -> Unit
) : RecyclerView.Adapter<GoalsAdapter.GoalViewHolder>() {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): GoalViewHolder {
        val binding = ItemGoalBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return GoalViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: GoalViewHolder, position: Int) {
        holder.bind(goals[position])
    }
    
    override fun getItemCount() = goals.size
    
    inner class GoalViewHolder(
        private val binding: ItemGoalBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(goal: Goal) {
            binding.tvTitle.text = goal.title ?: "Untitled Goal"
            binding.tvDescription.text = goal.notes ?: "No description"
            
            val target = goal.target ?: 100 // Fallback to 100 if target is null
            binding.progressBar.max = target
            binding.progressBar.progress = goal.current
            binding.tvProgress.text = "${goal.current} / $target"
            
            binding.tvStatus.text = (goal.status ?: "active").uppercase(Locale.getDefault())
            binding.tvPriority.text = (goal.priority ?: "medium").uppercase(Locale.getDefault())
            
            binding.root.setOnClickListener {
                onGoalClick(goal)
            }
            
            binding.btnDelete.setOnClickListener {
                onGoalDelete(goal)
            }
            
            binding.btnIncrement.setOnClickListener {
                onGoalUpdate(goal, goal.current + 1)
            }
        }
    }
}
