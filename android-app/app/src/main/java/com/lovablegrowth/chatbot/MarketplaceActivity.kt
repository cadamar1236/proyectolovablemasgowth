package com.lovablegrowth.chatbot

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import com.lovablegrowth.chatbot.adapters.ProductsAdapter
import com.lovablegrowth.chatbot.api.RetrofitClient
import com.lovablegrowth.chatbot.databinding.ActivityMarketplaceBinding
import com.lovablegrowth.chatbot.models.Product
import com.lovablegrowth.chatbot.utils.PreferencesManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MarketplaceActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMarketplaceBinding
    private lateinit var preferencesManager: PreferencesManager
    private lateinit var productsAdapter: ProductsAdapter
    private val products = mutableListOf<Product>()
    private var currentType: String? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMarketplaceBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        preferencesManager = PreferencesManager(this)
        
        setupToolbar()
        setupRecyclerView()
        setupListeners()
        loadProducts()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            title = "Marketplace"
        }
    }
    
    private fun setupRecyclerView() {
        productsAdapter = ProductsAdapter(
            products,
            onProductClick = { product -> openProductDetail(product) },
            onVoteClick = { product -> voteProduct(product) }
        )
        
        binding.recyclerView.apply {
            layoutManager = GridLayoutManager(this@MarketplaceActivity, 2)
            adapter = productsAdapter
        }
    }
    
    private fun setupListeners() {
        binding.swipeRefresh.setOnRefreshListener {
            loadProducts(currentType)
        }
        
        binding.chipAll.setOnClickListener { 
            currentType = null
            loadProducts(null) 
        }
        binding.chipProducts.setOnClickListener { 
            currentType = "product"
            loadProducts("product") 
        }
        binding.chipFounders.setOnClickListener { 
            currentType = "founder"
            loadProducts("founder") 
        }
        binding.chipInvestors.setOnClickListener { 
            currentType = "investor"
            loadProducts("investor") 
        }
        binding.chipValidators.setOnClickListener { 
            currentType = "validator"
            loadProducts("validator") 
        }
    }
    
    private fun loadProducts(type: String? = null) {
        binding.progressBar.visibility = View.VISIBLE
        
        lifecycleScope.launch {
            try {
                val token = preferencesManager.getAuthToken().first() ?: ""
                val authHeader = "Bearer $token"
                
                // Mapeo de tipos para que coincidan exactamente con lo que el backend espera
                val response = RetrofitClient.apiService.getProducts(authHeader, type)
                
                if (response.isSuccessful && response.body() != null) {
                    products.clear()
                    products.addAll(response.body()!!.products)
                    productsAdapter.notifyDataSetChanged()
                    
                    binding.emptyView.visibility = if (products.isEmpty()) View.VISIBLE else View.GONE
                } else {
                    Toast.makeText(this@MarketplaceActivity, "Failed to load: ${response.message()}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@MarketplaceActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }
    
    private fun openProductDetail(product: Product) {
        val intent = Intent(this, ProductDetailActivity::class.java)
        intent.putExtra("product", product)
        startActivity(intent)
    }
    
    private fun voteProduct(product: Product) {
        lifecycleScope.launch {
            try {
                val token = preferencesManager.getAuthToken().first() ?: ""
                val authHeader = "Bearer $token"
                
                val response = RetrofitClient.apiService.voteProduct(authHeader, product.id)
                
                if (response.isSuccessful && response.body() != null) {
                    Toast.makeText(this@MarketplaceActivity, "Vote registered!", Toast.LENGTH_SHORT).show()
                    loadProducts(currentType)
                } else {
                    Toast.makeText(this@MarketplaceActivity, "Already voted or error", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@MarketplaceActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
