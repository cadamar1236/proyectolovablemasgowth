package com.lovablegrowth.chatbot

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.lovablegrowth.chatbot.api.RetrofitClient
import com.lovablegrowth.chatbot.databinding.ActivityProductDetailBinding
import com.lovablegrowth.chatbot.models.Product
import com.lovablegrowth.chatbot.utils.PreferencesManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.*

class ProductDetailActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityProductDetailBinding
    private lateinit var preferencesManager: PreferencesManager
    private lateinit var product: Product
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProductDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        preferencesManager = PreferencesManager(this)
        
        product = intent.getParcelableExtra("product") ?: run {
            finish()
            return
        }
        
        setupToolbar()
        displayProductDetails()
        setupListeners()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            title = product.title ?: "Product Detail"
        }
    }
    
    private fun displayProductDetails() {
        binding.tvName.text = product.title ?: "Unknown Product"
        binding.tvDescription.text = product.description ?: "No description available"
        binding.tvUserType.text = "Type: ${product.displayType.uppercase(Locale.getDefault())}"
        binding.tvVotes.text = "${product.votesCount} Votes"
        
        if (product.ratingAverage != null) {
            binding.tvRating.text = "Rating: ⭐ ${String.format(Locale.getDefault(), "%.1f", product.ratingAverage)}"
        } else {
            binding.tvRating.text = "Rating: Not rated yet"
        }
        
        if (!product.companyName.isNullOrEmpty()) {
            binding.tvCompany.text = "Company: ${product.companyName}"
            binding.tvCompany.visibility = View.VISIBLE
        } else {
            binding.tvCompany.visibility = View.GONE
        }
        
        if (!product.category.isNullOrEmpty()) {
            binding.tvCategory.text = "Category: ${product.category}"
            binding.tvCategory.visibility = View.VISIBLE
        } else {
            binding.tvCategory.visibility = View.GONE
        }
        
        if (!product.pricingModel.isNullOrEmpty()) {
            binding.tvPrice.text = "Price: ${product.pricingModel}"
            binding.tvPrice.visibility = View.VISIBLE
        } else {
            binding.tvPrice.visibility = View.GONE
        }
        
        if (!product.contactEmail.isNullOrEmpty()) {
            binding.tvEmail.text = "Email: ${product.contactEmail}"
            binding.tvEmail.visibility = View.VISIBLE
        } else {
            binding.tvEmail.visibility = View.GONE
        }
        
        binding.btnVote.isEnabled = !product.hasVoted
        binding.btnVote.text = if (product.hasVoted) "✓ Already Voted" else "Vote for this"
    }
    
    private fun setupListeners() {
        binding.btnVote.setOnClickListener {
            voteProduct()
        }
        
        binding.btnWebsite.setOnClickListener {
            product.url?.let { url ->
                openUrl(url)
            }
        }
        
        binding.btnLinkedIn.setOnClickListener {
            product.linkedin?.let { url ->
                openUrl(url)
            }
        }
        
        binding.btnTwitter.setOnClickListener {
            product.twitter?.let { url ->
                openUrl(url)
            }
        }
        
        if (product.url == null) binding.btnWebsite.visibility = View.GONE
        if (product.linkedin == null) binding.btnLinkedIn.visibility = View.GONE
        if (product.twitter == null) binding.btnTwitter.visibility = View.GONE
    }
    
    private fun voteProduct() {
        binding.progressBar.visibility = View.VISIBLE
        
        lifecycleScope.launch {
            try {
                val token = preferencesManager.getAuthToken().first() ?: ""
                val authHeader = "Bearer $token"
                
                val response = RetrofitClient.apiService.voteProduct(authHeader, product.id)
                
                if (response.isSuccessful && response.body() != null) {
                    val voteResponse = response.body()!!
                    Toast.makeText(this@ProductDetailActivity, "Vote registered!", Toast.LENGTH_SHORT).show()
                    
                    product = product.copy(
                        votesCount = voteResponse.votes,
                        hasVoted = true
                    )
                    displayProductDetails()
                } else {
                    Toast.makeText(this@ProductDetailActivity, "Already voted or error", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ProductDetailActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
    
    private fun openUrl(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "Cannot open URL", Toast.LENGTH_SHORT).show()
        }
    }
    
    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
