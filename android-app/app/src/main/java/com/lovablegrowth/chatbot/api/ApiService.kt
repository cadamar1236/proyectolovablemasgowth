package com.lovablegrowth.chatbot.api

import com.lovablegrowth.chatbot.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // ==================== AUTH ====================
    @POST("api/auth/google")
    suspend fun loginWithGoogle(@Body request: GoogleAuthRequest): Response<AuthResponse>
    
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
    
    @GET("api/auth/me")
    suspend fun getCurrentUser(@Header("Authorization") token: String): Response<User>
    
    // ==================== CHAT ====================
    @GET("api/chat/conversations")
    suspend fun getConversations(@Header("Authorization") token: String): Response<ConversationsResponse>
    
    @POST("api/chat/conversations")
    suspend fun createConversation(
        @Header("Authorization") token: String,
        @Body request: CreateConversationRequest
    ): Response<Conversation>
    
    @GET("api/chat/conversations/{id}/messages")
    suspend fun getMessages(
        @Header("Authorization") token: String,
        @Path("id") conversationId: Int
    ): Response<MessagesResponse>
    
    @POST("api/chat/conversations/{id}/messages")
    suspend fun sendMessage(
        @Header("Authorization") token: String,
        @Path("id") conversationId: Int,
        @Body request: SendMessageRequest
    ): Response<Message>
    
    @PUT("api/chat/conversations/{id}/read")
    suspend fun markAsRead(
        @Header("Authorization") token: String,
        @Path("id") conversationId: Int
    ): Response<Unit>
    
    // ==================== CHAT AGENT ====================
    @POST("api/chat-agent/message")
    suspend fun sendAgentMessage(
        @Header("Authorization") token: String,
        @Body request: AgentMessageRequest
    ): Response<AgentMessageResponse>
    
    // ==================== DASHBOARD / GOALS ====================
    @GET("api/dashboard/goals")
    suspend fun getGoals(@Header("Authorization") token: String): Response<GoalsResponse>
    
    @POST("api/dashboard/goals")
    suspend fun createGoal(
        @Header("Authorization") token: String,
        @Body request: CreateGoalRequest
    ): Response<Goal>
    
    @PUT("api/dashboard/goals/{id}")
    suspend fun updateGoal(
        @Header("Authorization") token: String,
        @Path("id") goalId: Int,
        @Body request: UpdateGoalRequest
    ): Response<Goal>
    
    @DELETE("api/dashboard/goals/{id}")
    suspend fun deleteGoal(
        @Header("Authorization") token: String,
        @Path("id") goalId: Int
    ): Response<Unit>
    
    @GET("api/dashboard/stats")
    suspend fun getDashboardStats(@Header("Authorization") token: String): Response<DashboardStats>
    
    // ==================== MARKETPLACE ====================
    @GET("api/marketplace/products")
    suspend fun getProducts(
        @Header("Authorization") token: String,
        @Query("type") type: String? = null
    ): Response<ProductsResponse>
    
    @GET("api/marketplace/products/{id}")
    suspend fun getProduct(
        @Header("Authorization") token: String,
        @Path("id") productId: Int
    ): Response<Product>
    
    @POST("api/marketplace/products")
    suspend fun createProduct(
        @Header("Authorization") token: String,
        @Body request: CreateProductRequest
    ): Response<Product>
    
    @POST("api/marketplace/products/{id}/vote")
    suspend fun voteProduct(
        @Header("Authorization") token: String,
        @Path("id") productId: Int
    ): Response<VoteResponse>
    
    // ==================== PROJECTS ====================
    @GET("api/projects/{id}")
    suspend fun getProject(
        @Header("Authorization") token: String,
        @Path("id") projectId: Int
    ): Response<Project>
    
    @POST("api/projects/{id}/vote")
    suspend fun voteProject(
        @Header("Authorization") token: String,
        @Path("id") projectId: Int
    ): Response<VoteResponse>
    
    // ==================== NOTIFICATIONS ====================
    @GET("api/notifications")
    suspend fun getNotifications(@Header("Authorization") token: String): Response<NotificationsResponse>
    
    @PUT("api/notifications/{id}/read")
    suspend fun markNotificationAsRead(
        @Header("Authorization") token: String,
        @Path("id") notificationId: Int
    ): Response<Unit>
    
    // ==================== MARKETING AI ====================
    @POST("api/marketing-ai/chat")
    suspend fun marketingAiChat(
        @Header("Authorization") token: String,
        @Body request: MarketingAiChatRequest
    ): Response<MarketingAiChatResponse>
    
    @POST("api/marketing-ai/analyze-business")
    suspend fun analyzeBusinessWithAI(
        @Header("Authorization") token: String,
        @Body request: AnalyzeBusinessRequest
    ): Response<AnalyzeBusinessResponse>
    
    @GET("api/marketing-ai/history")
    suspend fun getMarketingAiHistory(
        @Header("Authorization") token: String,
        @Query("limit") limit: Int = 50
    ): Response<MarketingAiHistoryResponse>
}
