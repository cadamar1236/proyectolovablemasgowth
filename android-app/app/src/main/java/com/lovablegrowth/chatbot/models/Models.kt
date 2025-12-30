package com.lovablegrowth.chatbot.models

import android.os.Parcelable
import com.google.gson.annotations.SerializedName
import kotlinx.parcelize.Parcelize

// ==================== AUTH MODELS ====================
data class GoogleAuthRequest(
    val code: String,
    val role: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class GoogleLoginRequest(
    val idToken: String
)

data class AuthResponse(
    val token: String,
    val user: User
)

@Parcelize
data class User(
    val id: Int,
    val email: String,
    val name: String,
    val role: String,
    val avatar: String? = null,
    @SerializedName("created_at") val createdAt: String? = null
) : Parcelable

// ==================== CHAT MODELS ====================
data class ConversationsResponse(
    val conversations: List<Conversation>
)

@Parcelize
data class Conversation(
    val id: Int,
    @SerializedName("other_user_id") val otherUserId: Int,
    @SerializedName("other_user_name") val otherUserName: String,
    @SerializedName("other_user_email") val otherUserEmail: String? = null,
    @SerializedName("other_user_role") val otherUserRole: String? = null,
    @SerializedName("last_message") val lastMessage: String? = null,
    @SerializedName("last_message_at") val lastMessageAt: String? = null,
    @SerializedName("unread_count") val unreadCount: Int = 0,
    @SerializedName("created_at") val createdAt: String
) : Parcelable

data class CreateConversationRequest(
    @SerializedName("other_user_id") val otherUserId: Int
)

data class MessagesResponse(
    val messages: List<Message>
)

@Parcelize
data class Message(
    val id: Int,
    @SerializedName("conversation_id") val conversationId: Int,
    @SerializedName("sender_id") val senderId: Int,
    @SerializedName("sender_name") val senderName: String? = null,
    val content: String,
    @SerializedName("is_read") val isRead: Boolean = false,
    @SerializedName("created_at") val createdAt: String
) : Parcelable

data class SendMessageRequest(
    val content: String
)

// ==================== AGENT CHAT MODELS ====================
data class AgentMessageRequest(
    val message: String,
    @SerializedName("project_id") val projectId: Int? = null
)

data class AgentMessageResponse(
    @SerializedName("message") val response: String,
    val timestamp: String? = null
)

// ==================== GOALS MODELS ====================
data class GoalsResponse(
    val goals: List<Goal>
)

@Parcelize
data class Goal(
    val id: Int,
    @SerializedName("user_id") val userId: Int,
    @SerializedName("description") val title: String,
    val notes: String? = null,
    @SerializedName("target_value") val target: Int? = null,
    @SerializedName("current_value") val current: Int = 0,
    val status: String = "active",
    val priority: String = "medium",
    @SerializedName("deadline") val dueDate: String? = null,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String? = null
) : Parcelable

data class CreateGoalRequest(
    @SerializedName("description") val title: String,
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("target_value") val targetValue: Int? = null,
    val priority: String = "medium",
    @SerializedName("deadline") val dueDate: String? = null
)

data class UpdateGoalRequest(
    @SerializedName("description") val title: String? = null,
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("target_value") val targetValue: Int? = null,
    @SerializedName("current_value") val currentValue: Int? = null,
    val status: String? = null,
    val priority: String? = null,
    @SerializedName("deadline") val dueDate: String? = null
)

data class DashboardStats(
    @SerializedName("total_goals") val totalGoals: Int,
    @SerializedName("completed_goals") val completedGoals: Int,
    @SerializedName("active_goals") val activeGoals: Int,
    @SerializedName("completion_rate") val completionRate: Float
)

// ==================== MARKETPLACE MODELS ====================
data class ProductsResponse(
    val products: List<Product>
)

@Parcelize
data class Product(
    val id: Int,
    @SerializedName("title") val title: String?,
    val description: String?,
    val category: String? = null,
    @SerializedName("pricing_model") val pricingModel: String? = null,
    @SerializedName("url") val url: String? = null,
    @SerializedName("company_avatar") val companyAvatar: String? = null,
    @SerializedName("stage") val stage: String? = null,
    @SerializedName("user_role") val userRole: String? = null,
    @SerializedName("company_user_id") val companyUserId: Int,
    @SerializedName("company_name") val companyName: String? = null,
    @SerializedName("contact_email") val contactEmail: String? = null,
    @SerializedName("looking_for") val lookingFor: String? = null,
    val linkedin: String? = null,
    val twitter: String? = null,
    @SerializedName("votes_count") val votesCount: Int = 0,
    @SerializedName("rating_average") val ratingAverage: Float? = null,
    @SerializedName("has_voted") val hasVoted: Boolean = false,
    @SerializedName("created_at") val createdAt: String
) : Parcelable {
    val displayType: String
        get() = userRole ?: stage ?: "Product"
}

data class CreateProductRequest(
    val name: String,
    val description: String,
    val category: String? = null,
    val price: String? = null,
    val website: String? = null,
    @SerializedName("user_type") val userType: String,
    @SerializedName("company_name") val companyName: String? = null,
    val linkedin: String? = null,
    val twitter: String? = null
)

data class VoteResponse(
    val success: Boolean,
    val votes: Int,
    val message: String? = null
)

// ==================== PROJECT MODELS ====================
@Parcelize
data class Project(
    val id: Int,
    val title: String,
    val description: String,
    val status: String,
    @SerializedName("user_id") val userId: Int,
    val votes: Int = 0,
    val rating: Float? = null,
    @SerializedName("has_voted") val hasVoted: Boolean = false,
    @SerializedName("beta_product") val betaProduct: Product? = null,
    @SerializedName("created_at") val createdAt: String
) : Parcelable

// ==================== NOTIFICATIONS MODELS ====================
data class NotificationsResponse(
    val notifications: List<Notification>
)

@Parcelize
data class Notification(
    val id: Int,
    @SerializedName("user_id") val userId: Int,
    val type: String,
    val title: String,
    val message: String,
    @SerializedName("is_read") val isRead: Boolean = false,
    @SerializedName("related_id") val relatedId: Int? = null,
    @SerializedName("created_at") val createdAt: String
) : Parcelable

// ==================== MARKETING AI MODELS ====================
data class MarketingAiChatRequest(
    val message: String,
    val context: String? = null
)

data class MarketingAiChatResponse(
    val success: Boolean,
    val response: String,
    val timestamp: String
)

data class AnalyzeBusinessRequest(
    @SerializedName("business_description") val businessDescription: String,
    val goals: String? = null
)

data class AnalyzeBusinessResponse(
    val success: Boolean,
    val analysis: String
)

data class MarketingAiHistoryResponse(
    val history: List<MarketingAiMessage>
)

data class MarketingAiMessage(
    val id: Int,
    val message: String,
    val response: String,
    @SerializedName("created_at") val createdAt: String
)
