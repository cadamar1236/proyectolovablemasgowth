package com.lovablegrowth.chatbot.workers

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.lovablegrowth.chatbot.utils.NotificationHelper

class GoalReminderWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val notificationHelper = NotificationHelper(applicationContext)
        notificationHelper.showGoalReminder(
            "Time to grow!",
            "Don't forget to update your goals and track your progress today."
        )
        return Result.success()
    }
}
