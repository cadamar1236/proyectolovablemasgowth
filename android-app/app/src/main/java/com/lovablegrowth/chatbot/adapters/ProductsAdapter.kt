package com.lovablegrowth.chatbot.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.lovablegrowth.chatbot.databinding.ItemProductBinding
import com.lovablegrowth.chatbot.models.Product
import java.util.*

class ProductsAdapter(
    private val products: List<Product>,
    private val onProductClick: (Product) -> Unit,
    private val onVoteClick: (Product) -> Unit
) : RecyclerView.Adapter<ProductsAdapter.ProductViewHolder>() {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ProductViewHolder {
        val binding = ItemProductBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ProductViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: ProductViewHolder, position: Int) {
        holder.bind(products[position])
    }
    
    override fun getItemCount() = products.size
    
    inner class ProductViewHolder(
        private val binding: ItemProductBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(product: Product) {
            binding.tvName.text = product.title ?: "Unknown"
            binding.tvDescription.text = product.description ?: "No description"
            binding.tvVotes.text = "${product.votesCount} votes"
            binding.tvUserType.text = product.displayType.uppercase(Locale.getDefault())
            
            if (product.ratingAverage != null) {
                binding.tvRating.text = "⭐ ${String.format(Locale.getDefault(), "%.1f", product.ratingAverage)}"
            } else {
                binding.tvRating.text = "⭐ N/A"
            }
            
            binding.btnVote.isEnabled = !product.hasVoted
            binding.btnVote.text = if (product.hasVoted) "✓ Voted" else "Vote"
            
            binding.root.setOnClickListener {
                onProductClick(product)
            }
            
            binding.btnVote.setOnClickListener {
                onVoteClick(product)
            }
        }
    }
}
